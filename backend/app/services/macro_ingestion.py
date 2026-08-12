"""Fetch and store macro series and the economic calendar."""

import hashlib
import logging
from datetime import datetime

import httpx
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.macro import EconomicEvent, MacroSeries
from app.services.macro import DXY_WEIGHTS, MACRO_INSTRUMENTS, dxy_series
from app.services.oanda_client import OandaClient
from app.services.types import RawCandle

logger = logging.getLogger("aurum.macro")

# ForexFactory's published JSON feed. Note this is the sanctioned feed, not
# the website — forexfactory.com itself sits behind Cloudflare bot protection
# and must not be scraped.
# Only the current week is published — nextweek/lastweek variants 404. Run
# this on a schedule to accumulate history rather than expecting one fetch
# to backfill a range.
CALENDAR_FEEDS = {
    "thisweek": "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
}

IMPORTANCE_MAP = {
    "high": "CRITICAL",
    "medium": "HIGH",
    "low": "MEDIUM",
    "holiday": "LOW",
}


async def _store_series(
    session: AsyncSession, name: str, candles: list[RawCandle], source: str
) -> int:
    if not candles:
        return 0
    stmt = pg_insert(MacroSeries).values(
        [
            {"name": name, "timestamp": c["timestamp"], "value": c["close"], "source": source}
            for c in candles
        ]
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["name", "timestamp"],
        set_={"value": stmt.excluded.value, "source": stmt.excluded.source},
    )
    await session.execute(stmt)
    await session.commit()
    return len(candles)


async def ingest_macro(session: AsyncSession, timeframe: str = "1H", count: int = 500) -> dict[str, int]:
    """Pull every macro instrument plus the computed DXY."""
    client = OandaClient()
    written: dict[str, int] = {}

    for name, instrument in MACRO_INSTRUMENTS.items():
        try:
            candles = await client.fetch_candles(instrument, timeframe, count)
            written[name] = await _store_series(session, name, candles, "oanda")
        except Exception as e:  # one bad instrument shouldn't abort the rest
            logger.warning(f"macro {name} ({instrument}) failed: {e}")
            written[name] = 0

    try:
        constituents = {
            pair: await client.fetch_candles(pair, timeframe, count) for pair in DXY_WEIGHTS
        }
        written["DXY"] = await _store_series(session, "DXY", dxy_series(constituents), "computed")
    except Exception as e:
        logger.warning(f"DXY computation failed: {e}")
        written["DXY"] = 0

    return written


def _event_id(timestamp: int, country: str, title: str) -> str:
    """Deterministic id — the feed carries no stable identifier, so re-fetching
    the same week must update rather than duplicate."""
    return hashlib.sha1(f"{timestamp}|{country}|{title}".encode()).hexdigest()[:40]


def _parse_event_time(raw: str) -> int | None:
    try:
        return int(datetime.fromisoformat(raw).timestamp() * 1000)
    except ValueError:
        return None


async def ingest_calendar(session: AsyncSession) -> int:
    """Roadmap Step 7.2 — scheduled releases with forecast/previous/actual."""
    rows: list[dict[str, object]] = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        for label, url in CALENDAR_FEEDS.items():
            try:
                resp = await client.get(url)
                if resp.status_code == 429:
                    # The feed rate-limits repeated pulls. Existing rows stay
                    # untouched, so a throttled run is a no-op rather than a
                    # failure — don't retry in a loop.
                    logger.info(f"calendar feed {label} rate-limited; keeping stored events")
                    continue
                resp.raise_for_status()
                events = resp.json()
            except Exception as e:
                logger.warning(f"calendar feed {label} failed: {e}")
                continue

            for e in events:
                ts = _parse_event_time(e.get("date", ""))
                if ts is None:
                    continue
                impact = str(e.get("impact", "")).lower()
                country = e.get("country", "")
                title = e.get("title", "")
                rows.append(
                    {
                        "event_id": _event_id(ts, country, title),
                        "timestamp": ts,
                        "country": country,
                        "title": title[:160],
                        "importance": IMPORTANCE_MAP.get(impact, "MEDIUM"),
                        "previous": (e.get("previous") or None),
                        "forecast": (e.get("forecast") or None),
                        "actual": (e.get("actual") or None),
                        "is_holiday": impact == "holiday",
                    }
                )

    if not rows:
        return 0

    # The same event can appear in both weekly feeds around the boundary;
    # de-dupe before insert so the statement has unique conflict targets.
    unique = {r["event_id"]: r for r in rows}

    stmt = pg_insert(EconomicEvent).values(list(unique.values()))
    stmt = stmt.on_conflict_do_update(
        index_elements=["event_id"],
        set_={
            "previous": stmt.excluded.previous,
            "forecast": stmt.excluded.forecast,
            "actual": stmt.excluded.actual,
            "importance": stmt.excluded.importance,
        },
    )
    await session.execute(stmt)
    await session.commit()
    return len(unique)
