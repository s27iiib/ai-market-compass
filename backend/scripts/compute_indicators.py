"""Compute and store indicators for every stored candle — Phase 6 backfill.

    uv run python scripts/compute_indicators.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.db.session import session_scope
from app.models.asset import Asset
from app.services.indicator_store import compute_and_store

TIMEFRAMES = ["5m", "15m", "1H", "4H", "1D"]


async def main() -> None:
    async with session_scope() as session:
        symbols = [row[0] for row in await session.execute(select(Asset.symbol).order_by(Asset.symbol))]

    if not symbols:
        print("No assets found — start the API once to seed them.")
        return

    print(f"Computing indicators for {len(symbols)} instruments x {len(TIMEFRAMES)} timeframes...\n")
    total = 0
    for symbol in symbols:
        for timeframe in TIMEFRAMES:
            async with session_scope() as session:
                written = await compute_and_store(session, symbol, timeframe)
            total += written
            print(f"  {symbol:8} {timeframe:4}  {written:5} rows")

    print(f"\nDone. {total} indicator rows written.")


if __name__ == "__main__":
    asyncio.run(main())
