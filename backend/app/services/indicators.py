"""Technical indicators — roadmap Phase 6, Step 6.1.

Hand-written rather than pulled from a library, deliberately: signal scores
in Phase 8 are built on these numbers, and when a score needs explaining
(Phase 11's whole premise) an opaque dependency is a liability. Every
formula here is inspectable.

Pure functions over a DataFrame — no I/O, no database. Callers pass a frame
with open/high/low/close/volume columns indexed in ascending time order.

Conventions:
- Wilder's smoothing (RSI, ATR, ADX) uses alpha = 1/period, which is what
  Wilder defined and what charting platforms show. It is NOT the same as a
  standard EMA of the same period (alpha = 2/(period+1)) — mixing them up
  produces values that look plausible but disagree with every chart.
- Leading values are NaN until a window fills. Callers must handle that
  rather than seeing a fabricated 0.
"""

import numpy as np
import pandas as pd

OHLCV = ["open", "high", "low", "close", "volume"]


def sma(series: pd.Series, period: int) -> pd.Series:
    return series.rolling(window=period).mean()


def ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()


def _wilder(series: pd.Series, period: int) -> pd.Series:
    """Wilder's smoothing — alpha = 1/period, not the 2/(period+1) of a
    standard EMA. Used by RSI, ATR and ADX."""
    return series.ewm(alpha=1 / period, adjust=False).mean()


def vwap(df: pd.DataFrame) -> pd.Series:
    """Volume-weighted average price, cumulative over the supplied frame.

    Note this is a running VWAP across the whole series, not session-anchored
    — intraday desks usually reset at the session open. Anchoring needs
    session boundaries, which arrive with the macro/session work in Phase 7.
    """
    typical = (df["high"] + df["low"] + df["close"]) / 3
    cum_vol = df["volume"].cumsum()
    return (typical * df["volume"]).cumsum() / cum_vol.replace(0, np.nan)


def rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = _wilder(gain, period)
    avg_loss = _wilder(loss, period)
    rs = avg_gain / avg_loss.replace(0, np.nan)
    out = 100 - (100 / (1 + rs))
    # avg_loss == 0 means an unbroken run of gains: RSI is 100 by definition,
    # but the division above yields NaN.
    return out.where(avg_loss != 0, 100.0)


def macd(
    close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Returns (macd_line, signal_line, histogram)."""
    macd_line = ema(close, fast) - ema(close, slow)
    signal_line = ema(macd_line, signal)
    return macd_line, signal_line, macd_line - signal_line


def stochastic(
    df: pd.DataFrame, period: int = 14, smooth_k: int = 3, smooth_d: int = 3
) -> tuple[pd.Series, pd.Series]:
    """Returns (%K, %D). %K is the smoothed 'slow' variant."""
    lowest = df["low"].rolling(period).min()
    highest = df["high"].rolling(period).max()
    span = (highest - lowest).replace(0, np.nan)
    raw_k = 100 * (df["close"] - lowest) / span
    k = raw_k.rolling(smooth_k).mean()
    return k, k.rolling(smooth_d).mean()


def true_range(df: pd.DataFrame) -> pd.Series:
    prev_close = df["close"].shift(1)
    return pd.concat(
        [df["high"] - df["low"], (df["high"] - prev_close).abs(), (df["low"] - prev_close).abs()],
        axis=1,
    ).max(axis=1)


def atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    return _wilder(true_range(df), period)


def bollinger(
    close: pd.Series, period: int = 20, std_dev: float = 2.0
) -> tuple[pd.Series, pd.Series, pd.Series, pd.Series]:
    """Returns (upper, middle, lower, width). Width is expressed as a
    percentage of the middle band so it's comparable across instruments —
    gold at ~4,400 and EUR/USD at ~1.15 would otherwise be incomparable."""
    middle = sma(close, period)
    # ddof=0: population std, which is what Bollinger's original formulation
    # and charting platforms use. pandas defaults to ddof=1.
    sd = close.rolling(period).std(ddof=0)
    upper = middle + std_dev * sd
    lower = middle - std_dev * sd
    width = (upper - lower) / middle.replace(0, np.nan) * 100
    return upper, middle, lower, width


def obv(df: pd.DataFrame) -> pd.Series:
    direction = np.sign(df["close"].diff()).fillna(0)
    return (direction * df["volume"]).cumsum()


def adx(df: pd.DataFrame, period: int = 14) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Average Directional Index. Returns (adx, +DI, -DI)."""
    up_move = df["high"].diff()
    down_move = -df["low"].diff()

    # A directional move counts only when it exceeds the opposite direction's
    # move — otherwise it's noise within the prior bar's range.
    plus_dm = pd.Series(np.where((up_move > down_move) & (up_move > 0), up_move, 0.0), index=df.index)
    minus_dm = pd.Series(
        np.where((down_move > up_move) & (down_move > 0), down_move, 0.0), index=df.index
    )

    atr_ = _wilder(true_range(df), period).replace(0, np.nan)
    plus_di = 100 * _wilder(plus_dm, period) / atr_
    minus_di = 100 * _wilder(minus_dm, period) / atr_

    di_sum = (plus_di + minus_di).replace(0, np.nan)
    dx = 100 * (plus_di - minus_di).abs() / di_sum
    return _wilder(dx, period), plus_di, minus_di


def compute_all(df: pd.DataFrame) -> pd.DataFrame:
    """Every indicator, aligned to the input frame's index."""
    missing = [c for c in OHLCV if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    close = df["close"]
    macd_line, macd_signal, macd_hist = macd(close)
    stoch_k, stoch_d = stochastic(df)
    bb_upper, bb_middle, bb_lower, bb_width = bollinger(close)
    adx_, plus_di, minus_di = adx(df)

    return pd.DataFrame(
        {
            "sma20": sma(close, 20),
            "sma50": sma(close, 50),
            "sma200": sma(close, 200),
            "ema20": ema(close, 20),
            "ema50": ema(close, 50),
            "ema200": ema(close, 200),
            "vwap": vwap(df),
            "rsi14": rsi(close),
            "macd": macd_line,
            "macd_signal": macd_signal,
            "macd_hist": macd_hist,
            "stoch_k": stoch_k,
            "stoch_d": stoch_d,
            "atr14": atr(df),
            "bb_upper": bb_upper,
            "bb_middle": bb_middle,
            "bb_lower": bb_lower,
            "bb_width": bb_width,
            "obv": obv(df),
            "adx14": adx_,
            "plus_di": plus_di,
            "minus_di": minus_di,
        },
        index=df.index,
    )
