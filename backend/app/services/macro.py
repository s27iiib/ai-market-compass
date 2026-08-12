"""Macro inputs — roadmap Phase 7, Steps 7.1 and 7.3.

Every series here comes from OANDA instruments we already have access to, so
this phase added no new provider, credential or cost. Treasury bond CFDs
stand in for yields, equity indices for risk sentiment, oil for the
inflation channel, and DXY is computed from its actual constituents.

Deliberately absent: **real yields**. The roadmap names them as gold's
dominant driver, and they are — but real yields are nominal minus inflation
expectations, and breakevens/TIPS are not in OANDA's instrument set.
Deriving them from what we have would mean inventing an inflation
expectation, so nominal yields are stored honestly under their own name
and the gap is left visible rather than papered over with a fabricated
number. FRED publishes real yields free if this becomes a priority.
"""

import math

from app.services.types import RawCandle

# name -> OANDA instrument. Names are the keys the rest of the platform uses.
#
# The bond entries are T-Note *price* CFDs, not yields — OANDA quotes
# USB10Y_USD around 108, not 4.1%. They are named "_TNOTE" rather than
# "US10Y" precisely so nobody (including a later phase) mistakes a price for
# a yield: the two move in opposite directions, so treating one as the other
# inverts every downstream signal.
MACRO_INSTRUMENTS: dict[str, str] = {
    "US02Y_TNOTE": "USB02Y_USD",
    "US05Y_TNOTE": "USB05Y_USD",
    "US10Y_TNOTE": "USB10Y_USD",
    "US30Y_TNOTE": "USB30Y_USD",
    "SPX500": "SPX500_USD",
    "NAS100": "NAS100_USD",
    "WTI": "WTICO_USD",
    "BRENT": "BCO_USD",
    "SILVER": "XAG_USD",
}

# Human-readable labels for the UI.
MACRO_DISPLAY_NAMES: dict[str, str] = {
    "US02Y_TNOTE": "US 2Y T-Note",
    "US05Y_TNOTE": "US 5Y T-Note",
    "US10Y_TNOTE": "US 10Y T-Note",
    "US30Y_TNOTE": "US 30Y T-Note",
    "SPX500": "S&P 500",
    "NAS100": "Nasdaq 100",
    "WTI": "WTI Crude",
    "BRENT": "Brent Crude",
    "SILVER": "Silver",
    "DXY": "US Dollar Index",
}

# ICE US Dollar Index: a geometric mean of six pairs with fixed weights,
# unchanged since the euro replaced the legacy European currencies in 1999.
# Exponent sign follows the quote convention — negative where USD is the
# quote currency (EUR/USD, GBP/USD), positive where it's the base.
DXY_CONSTANT = 50.14348112
DXY_WEIGHTS: dict[str, float] = {
    "EUR_USD": -0.576,
    "USD_JPY": 0.136,
    "GBP_USD": -0.119,
    "USD_CAD": 0.091,
    "USD_SEK": 0.042,
    "USD_CHF": 0.036,
}


def compute_dxy(prices: dict[str, float]) -> float:
    """DXY from its six constituents. Raises if any is missing — a partial
    basket would produce a confidently wrong index rather than an error."""
    missing = [k for k in DXY_WEIGHTS if k not in prices]
    if missing:
        raise ValueError(f"DXY needs all six constituents, missing: {missing}")

    value = DXY_CONSTANT
    for pair, exponent in DXY_WEIGHTS.items():
        price = prices[pair]
        if price <= 0:
            raise ValueError(f"Invalid price for {pair}: {price}")
        value *= price**exponent
    return value


def dxy_series(candles_by_pair: dict[str, list[RawCandle]]) -> list[RawCandle]:
    """Build a DXY candle series from aligned constituent candles.

    Only timestamps present in *every* constituent are used — interpolating a
    missing leg would fabricate index values at exactly the moments (market
    closes, gaps) where they're least trustworthy.
    """
    by_pair_ts = {
        pair: {c["timestamp"]: c for c in candles} for pair, candles in candles_by_pair.items()
    }
    if not by_pair_ts:
        return []

    common = set.intersection(*(set(d.keys()) for d in by_pair_ts.values()))

    out: list[RawCandle] = []
    for ts in sorted(common):
        try:
            close = compute_dxy({p: by_pair_ts[p][ts]["close"] for p in DXY_WEIGHTS})
            open_ = compute_dxy({p: by_pair_ts[p][ts]["open"] for p in DXY_WEIGHTS})
        except (ValueError, KeyError):
            continue
        # The index high does not correspond to any single constituent's high —
        # a stronger dollar means EUR/USD falling and USD/JPY rising at once.
        # Bracketing open/close is honest; deriving from constituent extremes
        # would overstate the range.
        out.append(
            RawCandle(
                timestamp=ts,
                open=round(open_, 4),
                high=round(max(open_, close), 4),
                low=round(min(open_, close), 4),
                close=round(close, 4),
                volume=0.0,
            )
        )
    return out


def pct_change(series: list[float], periods: int = 1) -> float | None:
    if len(series) <= periods:
        return None
    prev = series[-1 - periods]
    if prev == 0 or math.isnan(prev):
        return None
    return (series[-1] - prev) / prev * 100


# How each macro input maps to gold, with the weight it carries in the score.
# Weights follow the roadmap's emphasis: dollar and rates dominate, risk
# sentiment and commodities are secondary.
GOLD_MACRO_WEIGHTS: dict[str, tuple[float, int]] = {
    # name: (direction multiplier, weight)
    # -1 means "this series rising is bearish for gold", +1 means bullish.
    "DXY": (-1.0, 25),  # stronger dollar, weaker gold
    # T-Note PRICES, so the sign is +1: a rising bond price means falling
    # yields, and falling yields reduce the opportunity cost of holding a
    # non-yielding asset — bullish gold. This is the inverse of what the
    # sign would be if these were yields.
    "US10Y_TNOTE": (1.0, 20),
    "US02Y_TNOTE": (1.0, 15),
    "US30Y_TNOTE": (1.0, 5),
    "SPX500": (-1.0, 10),  # risk-on competes with gold's haven bid
    "SILVER": (1.0, 15),  # precious metals move together
    "WTI": (1.0, 10),  # inflation channel
}


def gold_impact(name: str, change_pct: float | None) -> str:
    """Directional read of one macro input on gold."""
    if change_pct is None or name not in GOLD_MACRO_WEIGHTS:
        return "NEUTRAL"
    direction, _ = GOLD_MACRO_WEIGHTS[name]
    signed = change_pct * direction
    if signed > 0.05:
        return "BULLISH"
    if signed < -0.05:
        return "BEARISH"
    return "NEUTRAL"


def macro_score(changes: dict[str, float | None]) -> int:
    """Weighted 0-100 macro score for gold.

    50 is neutral. Each input pushes away from 50 in proportion to both its
    weight and how far it moved, with the per-input contribution capped so a
    single violent move in one series can't dominate the whole score.
    """
    total_weight = 0
    accumulated = 0.0

    for name, (direction, weight) in GOLD_MACRO_WEIGHTS.items():
        change = changes.get(name)
        if change is None:
            continue
        total_weight += weight
        # ±1% move saturates the contribution; beyond that adds nothing.
        contribution = max(-1.0, min(1.0, change * direction))
        accumulated += contribution * weight

    if total_weight == 0:
        return 50
    return int(round(50 + (accumulated / total_weight) * 50))
