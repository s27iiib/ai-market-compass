"""Compute indicators from stored candles and persist them — Phase 6 storage.

Indicators are precomputed rather than derived per-request so that Phase 10's
ML work has a ready feature table, and so signal generation doesn't pay the
compute cost on every read.
"""

import math
from typing import Any

import pandas as pd
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candle import Candle
from app.models.indicator import INDICATOR_COLUMNS, Indicator
from app.services.indicators import compute_all


async def load_candles(session: AsyncSession, symbol: str, timeframe: str) -> pd.DataFrame:
    rows = (
        await session.execute(
            select(Candle)
            .where(Candle.symbol == symbol, Candle.timeframe == timeframe)
            .order_by(Candle.timestamp)
        )
    ).scalars().all()
    return pd.DataFrame(
        [
            {
                "timestamp": r.timestamp,
                "open": r.open,
                "high": r.high,
                "low": r.low,
                "close": r.close,
                "volume": r.volume,
            }
            for r in rows
        ]
    )


def _clean(value: Any) -> float | None:
    """NaN/inf -> None so Postgres stores NULL rather than a poisoned float.

    Leading indicator values are NaN until their window fills, and asyncpg
    would otherwise reject them or store NaN into a float column where it
    silently contaminates later arithmetic.
    """
    if value is None:
        return None
    f = float(value)
    return None if (math.isnan(f) or math.isinf(f)) else f


async def compute_and_store(session: AsyncSession, symbol: str, timeframe: str) -> int:
    """Returns the number of indicator rows written."""
    df = await load_candles(session, symbol, timeframe)
    if df.empty:
        return 0

    values = compute_all(df)
    payload = [
        {
            "symbol": symbol,
            "timeframe": timeframe,
            "timestamp": int(df["timestamp"].iloc[i]),
            **{col: _clean(values[col].iloc[i]) for col in INDICATOR_COLUMNS},
        }
        for i in range(len(df))
    ]

    stmt = pg_insert(Indicator).values(payload)
    stmt = stmt.on_conflict_do_update(
        index_elements=["symbol", "timeframe", "timestamp"],
        set_={col: getattr(stmt.excluded, col) for col in INDICATOR_COLUMNS},
    )
    await session.execute(stmt)
    await session.commit()
    return len(payload)
