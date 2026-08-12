from typing import TypedDict

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candle import Candle
from app.services.candle_validation import find_defects, find_gaps, find_spikes
from app.services.oanda_client import OandaClient
from app.services.types import RawCandle


class IngestionReport(TypedDict):
    symbol: str
    timeframe: str
    fetched: int
    stored: int
    rejected: int
    gaps: list[dict[str, int]]
    spikes: int


async def store_candles(
    session: AsyncSession, symbol: str, timeframe: str, candles: list[RawCandle], source: str
) -> None:
    """Upsert candles keyed on (symbol, timeframe, timestamp) — shared by the
    REST backfill path and the live tick-aggregation worker, so both write
    through the exact same conflict-resolution logic."""
    if not candles:
        return
    stmt = pg_insert(Candle).values(
        [
            {
                "symbol": symbol,
                "timeframe": timeframe,
                "timestamp": c["timestamp"],
                "open": c["open"],
                "high": c["high"],
                "low": c["low"],
                "close": c["close"],
                "volume": c["volume"],
                "source": source,
            }
            for c in candles
        ]
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["symbol", "timeframe", "timestamp"],
        set_={
            "open": stmt.excluded.open,
            "high": stmt.excluded.high,
            "low": stmt.excluded.low,
            "close": stmt.excluded.close,
            "volume": stmt.excluded.volume,
            "source": stmt.excluded.source,
        },
    )
    await session.execute(stmt)
    await session.commit()


async def ingest_candles(
    session: AsyncSession, symbol: str, timeframe: str, count: int = 500
) -> IngestionReport:
    """Fetch from OANDA, reject structurally invalid candles, upsert the
    rest. Re-running this for the same range is safe — it's an upsert keyed
    on (symbol, timeframe, timestamp), not an append."""
    client = OandaClient()
    raw = await client.fetch_candles(symbol, timeframe, count)

    valid: list[RawCandle] = []
    rejected = 0
    for candle in raw:
        if find_defects(candle):
            rejected += 1
            continue
        valid.append(candle)

    await store_candles(session, symbol, timeframe, valid, source="oanda")

    return IngestionReport(
        symbol=symbol,
        timeframe=timeframe,
        fetched=len(raw),
        stored=len(valid),
        rejected=rejected,
        gaps=find_gaps(valid, timeframe),
        spikes=len(find_spikes(valid)),
    )
