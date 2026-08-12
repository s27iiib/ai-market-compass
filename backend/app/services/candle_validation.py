"""Candle data validation — roadmap Phase 4, Step 4.5.

Two tiers, deliberately different in strictness:

- `find_defects` catches structurally impossible candles (OHLC relationships
  that violate basic price geometry, non-positive prices, bad timestamps).
  These indicate corrupt data and the candle must be rejected outright.
- `find_gaps` / `find_spikes` flag things that are *usually* fine (forex
  markets close over the weekend; real news events cause real spikes) but
  are worth surfacing in an ingestion report rather than silently ignoring.

Duplicate candles aren't handled here — the (symbol, timeframe, timestamp)
primary key on the candles table makes duplicates a storage-layer concern
(upsert), not a validation-layer one.
"""

from app.services.types import RawCandle

TIMEFRAME_MS: dict[str, int] = {
    "1m": 60_000,
    "5m": 5 * 60_000,
    "15m": 15 * 60_000,
    "30m": 30 * 60_000,
    "1H": 60 * 60_000,
    "4H": 4 * 60 * 60_000,
    "1D": 24 * 60 * 60_000,
    "1W": 7 * 24 * 60 * 60_000,
}


def find_defects(candle: RawCandle) -> list[str]:
    """Structural OHLC checks. Non-empty result means: reject this candle."""
    issues: list[str] = []
    o, h, l, c = candle["open"], candle["high"], candle["low"], candle["close"]

    if o <= 0 or h <= 0 or l <= 0 or c <= 0:
        issues.append("non-positive price")
    if h < o:
        issues.append("high < open")
    if h < c:
        issues.append("high < close")
    if l > o:
        issues.append("low > open")
    if l > c:
        issues.append("low > close")
    if candle["timestamp"] <= 0:
        issues.append("invalid timestamp")

    return issues


def find_gaps(candles: list[RawCandle], timeframe: str) -> list[dict[str, int]]:
    """Report timestamp gaps larger than one expected interval, sorted ascending.

    Weekend closures in forex produce large, expected gaps — this reports
    them for visibility, it does not treat them as errors.
    """
    step = TIMEFRAME_MS[timeframe]
    ordered = sorted(candles, key=lambda c: c["timestamp"])
    gaps = []
    for prev, curr in zip(ordered, ordered[1:]):
        delta = curr["timestamp"] - prev["timestamp"]
        if delta > step:
            gaps.append({"after": prev["timestamp"], "before": curr["timestamp"], "missed_intervals": delta // step - 1})
    return gaps


def find_spikes(candles: list[RawCandle], threshold_pct: float = 8.0) -> list[RawCandle]:
    """Report candles whose high/low range is an outsized fraction of price —
    a data-quality flag, not a rejection: real volatility events happen."""
    flagged = []
    for c in candles:
        if c["close"] <= 0:
            continue
        range_pct = (c["high"] - c["low"]) / c["close"] * 100
        if range_pct > threshold_pct:
            flagged.append(c)
    return flagged
