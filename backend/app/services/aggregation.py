"""Tick -> candle aggregation — roadmap Phase 5, Step 5.3.

Ticks are aggregated directly into each of the platform's five chosen
timeframes (5m/15m/1H/4H/1D) rather than cascading up from 1-minute bars —
we don't store 1m data at all (Step 0.2), so there's no intermediate stage
to cascade from. The cost of computing five bucket boundaries per tick is
negligible.

Pure in-memory state, one process. If this ever needs to survive a restart
or run across multiple worker processes, the forming-candle state already
mirrors what's written to Redis (see redis_client.py) — that's the layer
to promote to source-of-truth first, not this one.
"""

from app.services.candle_validation import TIMEFRAME_MS
from app.services.types import RawCandle, TickEvent

ClosedCandle = tuple[str, str, RawCandle]  # (symbol, timeframe, candle)


class CandleAggregator:
    def __init__(self, timeframes: list[str]) -> None:
        self._timeframes = timeframes
        self._forming: dict[tuple[str, str], RawCandle] = {}

    def on_tick(self, tick: TickEvent) -> list[ClosedCandle]:
        """Feed one tick. Returns any candles that just closed because this
        tick's bucket differs from the one currently forming."""
        closed: list[ClosedCandle] = []

        for timeframe in self._timeframes:
            step = TIMEFRAME_MS[timeframe]
            bucket_start = (tick["timestamp"] // step) * step
            key = (tick["symbol"], timeframe)
            current = self._forming.get(key)

            if current is None or current["timestamp"] != bucket_start:
                if current is not None:
                    closed.append((tick["symbol"], timeframe, current))
                self._forming[key] = RawCandle(
                    timestamp=bucket_start,
                    open=tick["mid"],
                    high=tick["mid"],
                    low=tick["mid"],
                    close=tick["mid"],
                    volume=1.0,
                )
            else:
                current["high"] = max(current["high"], tick["mid"])
                current["low"] = min(current["low"], tick["mid"])
                current["close"] = tick["mid"]
                current["volume"] += 1.0

        return closed

    def get_forming(self, symbol: str, timeframe: str) -> RawCandle | None:
        return self._forming.get((symbol, timeframe))
