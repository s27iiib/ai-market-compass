"""Fetch macro series and the economic calendar — Phase 7 backfill.

    uv run python scripts/ingest_macro.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import session_scope
from app.services.macro_ingestion import ingest_calendar, ingest_macro


async def main() -> None:
    print("Macro series (OANDA instruments + computed DXY)...")
    async with session_scope() as session:
        written = await ingest_macro(session)
    for name, count in written.items():
        status = f"{count:5} points" if count else "   -- failed"
        print(f"  {name:8} {status}")

    print("\nEconomic calendar...")
    async with session_scope() as session:
        events = await ingest_calendar(session)
    print(f"  {events} events stored")


if __name__ == "__main__":
    asyncio.run(main())
