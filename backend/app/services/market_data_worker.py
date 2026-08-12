"""Live market-data worker — roadmap Phase 5, Step 5.2.

Owns the OANDA price stream for the life of the process: consumes ticks,
updates Redis hot state, persists candles as they close, and publishes
updates for the WebSocket layer to relay. Reconnects with a fixed delay if
the stream drops — OANDA's free practice stream disconnects periodically
under normal operation, so this is expected, not exceptional.
"""

import asyncio
import logging

import httpx

from app.db.session import session_scope
from app.services.aggregation import CandleAggregator
from app.services.ingestion import store_candles
from app.services.oanda_client import OandaError, stream_prices
from app.services.redis_client import publish_update, set_forming_candle, set_latest_price
from app.services.types import RawCandle

logger = logging.getLogger("aurum.market_data_worker")

TIMEFRAMES = ["5m", "15m", "1H", "4H", "1D"]
RECONNECT_DELAY_S = 5


def _to_wire_candle(candle: RawCandle) -> dict[str, float | int]:
    """Same short field names the REST endpoint emits via CandleOut, so the
    frontend's Candle type covers both transports."""
    return {
        "t": candle["timestamp"],
        "o": candle["open"],
        "h": candle["high"],
        "l": candle["low"],
        "c": candle["close"],
        "v": candle["volume"],
    }


async def run_market_data_worker(symbols: list[str]) -> None:
    aggregator = CandleAggregator(TIMEFRAMES)

    while True:
        try:
            async for tick in stream_prices(symbols):
                await set_latest_price(tick["symbol"], dict(tick))

                for symbol, timeframe, candle in aggregator.on_tick(tick):
                    async with session_scope() as session:
                        await store_candles(session, symbol, timeframe, [candle], source="oanda-stream")
                    await publish_update(
                        {
                            "type": "candle_closed",
                            "symbol": symbol,
                            "timeframe": timeframe,
                            "candle": _to_wire_candle(candle),
                        }
                    )

                # One publish per tick carries the forming candle for every
                # timeframe, not just one — the frontend picks out whichever
                # timeframe is currently on screen. Cheaper than either
                # publishing per-timeframe or re-deriving buckets client-side.
                forming_by_timeframe = {}
                for timeframe in TIMEFRAMES:
                    forming = aggregator.get_forming(tick["symbol"], timeframe)
                    if forming:
                        forming_by_timeframe[timeframe] = _to_wire_candle(forming)
                        await set_forming_candle(tick["symbol"], timeframe, dict(forming))

                await publish_update({"type": "tick", "candles": forming_by_timeframe, **tick})

        except asyncio.CancelledError:
            logger.info("Market data worker stopping.")
            raise
        except (OandaError, httpx.TimeoutException, httpx.TransportError) as e:
            logger.warning(
                f"OANDA stream error ({type(e).__name__}), reconnecting in {RECONNECT_DELAY_S}s: {e}"
            )
        except Exception:
            logger.exception(f"Market data worker error, reconnecting in {RECONNECT_DELAY_S}s.")

        await asyncio.sleep(RECONNECT_DELAY_S)
