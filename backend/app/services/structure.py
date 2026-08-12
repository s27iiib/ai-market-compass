"""Market structure, support/resistance and liquidity — roadmap Steps 6.2-6.7.

Deterministic and testable by design, per the roadmap's instruction that
version 1 should be rule-based rather than "perfect". Every function here is
pure: candles in, findings out, no I/O.

The core primitive is the fractal swing point — a bar whose high is the
highest (or low the lowest) within `lookback` bars either side. Everything
downstream (HH/HL/LH/LL, BOS, CHOCH, S/R levels, liquidity pools) is derived
from those swings, so `lookback` is the single knob controlling how much
noise the whole module filters out.

One consequence worth being explicit about: a swing can only be confirmed
once `lookback` bars have printed after it. Structure is therefore always
identified with that lag — unavoidable for any fractal method, and better
than pretending a swing exists before the market has confirmed it.
"""

from dataclasses import dataclass
from typing import Literal

import pandas as pd

SwingKind = Literal["high", "low"]
StructureLabel = Literal["HH", "HL", "LH", "LL"]
Trend = Literal["BULLISH", "BEARISH", "RANGE"]


@dataclass(frozen=True)
class Swing:
    index: int
    timestamp: int
    price: float
    kind: SwingKind
    label: StructureLabel | None = None


@dataclass(frozen=True)
class StructureBreak:
    index: int
    timestamp: int
    price: float
    kind: Literal["BOS", "CHOCH"]
    direction: Literal["BULLISH", "BEARISH"]
    broken_level: float


@dataclass(frozen=True)
class Level:
    price: float
    touches: int
    kind: Literal["support", "resistance"]
    last_timestamp: int


@dataclass(frozen=True)
class LiquidityPool:
    price: float
    kind: Literal["equal-high", "equal-low", "previous-high", "previous-low"]
    timestamps: list[int]
    swept: bool


def find_swings(df: pd.DataFrame, lookback: int = 3) -> list[Swing]:
    """Fractal swing highs/lows: a bar strictly higher (lower) than every bar
    within `lookback` on both sides."""
    swings: list[Swing] = []
    highs, lows = df["high"].to_numpy(), df["low"].to_numpy()
    timestamps = df["timestamp"].to_numpy() if "timestamp" in df.columns else range(len(df))

    for i in range(lookback, len(df) - lookback):
        window = slice(i - lookback, i + lookback + 1)
        if highs[i] == highs[window].max() and (highs[window] == highs[i]).sum() == 1:
            swings.append(Swing(i, int(timestamps[i]), float(highs[i]), "high"))
        elif lows[i] == lows[window].min() and (lows[window] == lows[i]).sum() == 1:
            swings.append(Swing(i, int(timestamps[i]), float(lows[i]), "low"))

    return swings


def label_swings(swings: list[Swing]) -> list[Swing]:
    """Classify each swing against the previous swing of the same kind:
    HH/LH for highs, HL/LL for lows."""
    labelled: list[Swing] = []
    last_high: float | None = None
    last_low: float | None = None

    for s in swings:
        label: StructureLabel | None = None
        if s.kind == "high":
            if last_high is not None:
                label = "HH" if s.price > last_high else "LH"
            last_high = s.price
        else:
            if last_low is not None:
                label = "HL" if s.price > last_low else "LL"
            last_low = s.price
        labelled.append(Swing(s.index, s.timestamp, s.price, s.kind, label))

    return labelled


def current_trend(swings: list[Swing]) -> Trend:
    """Trend from the two most recent labelled swings of each kind.

    HH + HL = bullish, LH + LL = bearish, anything mixed = range. Mixed
    genuinely means indecision, so it's reported rather than forced into a
    direction.
    """
    highs = [s.label for s in swings if s.kind == "high" and s.label]
    lows = [s.label for s in swings if s.kind == "low" and s.label]
    if not highs or not lows:
        return "RANGE"
    if highs[-1] == "HH" and lows[-1] == "HL":
        return "BULLISH"
    if highs[-1] == "LH" and lows[-1] == "LL":
        return "BEARISH"
    return "RANGE"


def find_structure_breaks(df: pd.DataFrame, swings: list[Swing]) -> list[StructureBreak]:
    """Detect BOS and CHOCH.

    BOS   — price closes beyond the last swing in the direction of the
            prevailing trend: continuation.
    CHOCH — price closes beyond the last swing *against* the prevailing
            trend: the first evidence the trend may be turning.

    The distinction is entirely about the trend at the time of the break,
    which is why swings are walked in order while tracking trend state
    rather than evaluated in hindsight.
    """
    breaks: list[StructureBreak] = []
    closes = df["close"].to_numpy()
    timestamps = df["timestamp"].to_numpy() if "timestamp" in df.columns else range(len(df))

    trend: Trend = "RANGE"
    last_high: Swing | None = None
    last_low: Swing | None = None
    swing_pos = 0

    for i in range(len(df)):
        # Only swings already confirmed by bar i can be broken by bar i.
        while swing_pos < len(swings) and swings[swing_pos].index <= i:
            s = swings[swing_pos]
            if s.kind == "high":
                last_high = s
            else:
                last_low = s
            swing_pos += 1

        close = closes[i]

        if last_high is not None and close > last_high.price and i > last_high.index:
            kind = "CHOCH" if trend == "BEARISH" else "BOS"
            breaks.append(
                StructureBreak(i, int(timestamps[i]), float(close), kind, "BULLISH", last_high.price)
            )
            trend = "BULLISH"
            last_high = None  # consumed; wait for the next swing high

        elif last_low is not None and close < last_low.price and i > last_low.index:
            kind = "CHOCH" if trend == "BULLISH" else "BOS"
            breaks.append(
                StructureBreak(i, int(timestamps[i]), float(close), kind, "BEARISH", last_low.price)
            )
            trend = "BEARISH"
            last_low = None

    return breaks


def find_levels(
    df: pd.DataFrame, swings: list[Swing], tolerance_pct: float = 0.15, min_touches: int = 2
) -> list[Level]:
    """Cluster swing points into support/resistance levels.

    A level earns significance from repeated rejection, so swings within
    `tolerance_pct` of each other are merged and counted. Tolerance is a
    percentage rather than an absolute price so the same threshold works for
    gold at ~4,400 and EUR/USD at ~1.15.
    """
    levels: list[Level] = []

    for kind, swing_kind in (("resistance", "high"), ("support", "low")):
        points = sorted(
            (s for s in swings if s.kind == swing_kind), key=lambda s: s.price
        )
        cluster: list[Swing] = []

        def flush(c: list[Swing]) -> None:
            if len(c) >= min_touches:
                levels.append(
                    Level(
                        price=round(sum(s.price for s in c) / len(c), 6),
                        touches=len(c),
                        kind=kind,  # type: ignore[arg-type]
                        last_timestamp=max(s.timestamp for s in c),
                    )
                )

        for s in points:
            if cluster and abs(s.price - cluster[0].price) / cluster[0].price * 100 > tolerance_pct:
                flush(cluster)
                cluster = []
            cluster.append(s)
        flush(cluster)

    return sorted(levels, key=lambda level: level.touches, reverse=True)


def find_liquidity(
    df: pd.DataFrame, swings: list[Swing], tolerance_pct: float = 0.05
) -> list[LiquidityPool]:
    """Equal highs/lows and the most recent prior high/low — the places
    stop orders cluster.

    A pool is marked `swept` if price later traded through it: that's the
    stop-run the roadmap's liquidity-sweep signal looks for. Note this uses
    high/low, not close — a sweep is a wick through the level, and requiring
    a close beyond would miss exactly the case of interest.
    """
    pools: list[LiquidityPool] = []
    highs, lows = df["high"].to_numpy(), df["low"].to_numpy()

    for kind, swing_kind in (("equal-high", "high"), ("equal-low", "low")):
        points = [s for s in swings if s.kind == swing_kind]
        used: set[int] = set()

        for i, a in enumerate(points):
            if i in used:
                continue
            group = [a]
            for j in range(i + 1, len(points)):
                b = points[j]
                if j not in used and abs(b.price - a.price) / a.price * 100 <= tolerance_pct:
                    group.append(b)
                    used.add(j)
            if len(group) < 2:
                continue

            price = sum(s.price for s in group) / len(group)
            after = max(s.index for s in group)
            swept = (
                bool((highs[after + 1 :] > price).any())
                if swing_kind == "high"
                else bool((lows[after + 1 :] < price).any())
            )
            pools.append(
                LiquidityPool(
                    price=round(price, 6),
                    kind=kind,  # type: ignore[arg-type]
                    timestamps=[s.timestamp for s in group],
                    swept=swept,
                )
            )

    highs_only = [s for s in swings if s.kind == "high"]
    lows_only = [s for s in swings if s.kind == "low"]
    if highs_only:
        last = highs_only[-1]
        pools.append(
            LiquidityPool(
                price=last.price,
                kind="previous-high",
                timestamps=[last.timestamp],
                swept=bool((highs[last.index + 1 :] > last.price).any()),
            )
        )
    if lows_only:
        last = lows_only[-1]
        pools.append(
            LiquidityPool(
                price=last.price,
                kind="previous-low",
                timestamps=[last.timestamp],
                swept=bool((lows[last.index + 1 :] < last.price).any()),
            )
        )

    return pools
