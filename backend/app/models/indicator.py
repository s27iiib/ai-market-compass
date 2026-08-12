from sqlalchemy import BigInteger, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Indicator(Base):
    """One row per candle, one column per indicator.

    Wide rather than key/value: the indicator set is fixed and known, reads
    stay a single row lookup, and this doubles as the feature table the ML
    work in Phase 10 needs — a long/EAV shape would have to be pivoted first.

    Nullable throughout because leading values are undefined until a window
    fills (sma200 needs 200 bars). Storing NULL rather than 0 keeps "no value
    yet" distinguishable from "the value is zero".
    """

    __tablename__ = "indicators"

    symbol: Mapped[str] = mapped_column(String(16), primary_key=True)
    timeframe: Mapped[str] = mapped_column(String(4), primary_key=True)
    timestamp: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    sma20: Mapped[float | None] = mapped_column(Float, nullable=True)
    sma50: Mapped[float | None] = mapped_column(Float, nullable=True)
    sma200: Mapped[float | None] = mapped_column(Float, nullable=True)
    ema20: Mapped[float | None] = mapped_column(Float, nullable=True)
    ema50: Mapped[float | None] = mapped_column(Float, nullable=True)
    ema200: Mapped[float | None] = mapped_column(Float, nullable=True)
    vwap: Mapped[float | None] = mapped_column(Float, nullable=True)
    rsi14: Mapped[float | None] = mapped_column(Float, nullable=True)
    macd: Mapped[float | None] = mapped_column(Float, nullable=True)
    macd_signal: Mapped[float | None] = mapped_column(Float, nullable=True)
    macd_hist: Mapped[float | None] = mapped_column(Float, nullable=True)
    stoch_k: Mapped[float | None] = mapped_column(Float, nullable=True)
    stoch_d: Mapped[float | None] = mapped_column(Float, nullable=True)
    atr14: Mapped[float | None] = mapped_column(Float, nullable=True)
    bb_upper: Mapped[float | None] = mapped_column(Float, nullable=True)
    bb_middle: Mapped[float | None] = mapped_column(Float, nullable=True)
    bb_lower: Mapped[float | None] = mapped_column(Float, nullable=True)
    bb_width: Mapped[float | None] = mapped_column(Float, nullable=True)
    obv: Mapped[float | None] = mapped_column(Float, nullable=True)
    adx14: Mapped[float | None] = mapped_column(Float, nullable=True)
    plus_di: Mapped[float | None] = mapped_column(Float, nullable=True)
    minus_di: Mapped[float | None] = mapped_column(Float, nullable=True)


INDICATOR_COLUMNS = [
    "sma20", "sma50", "sma200",
    "ema20", "ema50", "ema200",
    "vwap", "rsi14",
    "macd", "macd_signal", "macd_hist",
    "stoch_k", "stoch_d",
    "atr14",
    "bb_upper", "bb_middle", "bb_lower", "bb_width",
    "obv", "adx14", "plus_di", "minus_di",
]
