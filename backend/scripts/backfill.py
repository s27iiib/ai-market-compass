"""One-off historical backfill — roadmap Phase 4, Steps 4.2/4.3.

Not exposed over HTTP: there's no auth system yet (that's Phase 17), and an
unauthenticated endpoint that triggers OANDA API calls on demand is attack
surface this project doesn't need. Run manually:

    uv run python scripts/backfill.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.db.session import session_scope
from app.models.asset import Asset
from app.services.ingestion import ingest_candles
from app.services.oanda_client import OandaError

# Roadmap Step 0.2 — the timeframes this platform starts with.
TIMEFRAMES = ["5m", "15m", "1H", "4H", "1D"]


async def main() -> None:
    async with session_scope() as session:
        symbols = [row[0] for row in (await session.execute(select(Asset.symbol).order_by(Asset.symbol)))]

    if not symbols:
        print("No assets in the database yet — start the API once to seed them, then retry.")
        return

    print(f"Backfilling {len(symbols)} instruments x {len(TIMEFRAMES)} timeframes...\n")

    ok, failed = 0, 0
    for symbol in symbols:
        for timeframe in TIMEFRAMES:
            try:
                async with session_scope() as session:
                    report = await ingest_candles(session, symbol, timeframe, count=500)
                gap_note = f", {len(report['gaps'])} gaps" if report["gaps"] else ""
                spike_note = f", {report['spikes']} spikes" if report["spikes"] else ""
                print(
                    f"  {symbol:8} {timeframe:4}  fetched={report['fetched']:4}  "
                    f"stored={report['stored']:4}  rejected={report['rejected']}{gap_note}{spike_note}"
                )
                ok += 1
            except OandaError as e:
                print(f"  {symbol:8} {timeframe:4}  FAILED: {e}")
                failed += 1
            await asyncio.sleep(0.2)  # polite pacing, not a rate-limit necessity at this volume

    print(f"\nDone. {ok} succeeded, {failed} failed.")


if __name__ == "__main__":
    asyncio.run(main())
