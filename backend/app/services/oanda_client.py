import json
from collections.abc import AsyncIterator
from datetime import UTC, datetime

import httpx

from app.core.config import get_settings
from app.services.types import RawCandle, TickEvent

# Our Timeframe values (src/lib/types.ts) -> OANDA's granularity codes.
GRANULARITY: dict[str, str] = {
    "1m": "M1",
    "5m": "M5",
    "15m": "M15",
    "30m": "M30",
    "1H": "H1",
    "4H": "H4",
    "1D": "D",
    "1W": "W",
}


def to_instrument(symbol: str) -> str:
    """"XAU/USD" -> "XAU_USD" — OANDA's instrument naming."""
    return symbol.replace("/", "_")


def from_instrument(instrument: str) -> str:
    """"XAU_USD" -> "XAU/USD" — the reverse, for parsing stream events."""
    return instrument.replace("_", "/")


def _parse_oanda_time(raw: str) -> int:
    """OANDA timestamps are nanosecond-precision ISO8601 ("...123456789Z");
    Python's datetime only handles microseconds, so truncate the fraction."""
    raw = raw.removesuffix("Z")
    if "." in raw:
        date_part, frac = raw.split(".")
        raw = f"{date_part}.{frac[:6].ljust(6, '0')}"
    return int(datetime.fromisoformat(raw).replace(tzinfo=UTC).timestamp() * 1000)


STREAM_READ_TIMEOUT_S = 20.0


class OandaError(RuntimeError):
    pass


class OandaClient:
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.oanda_api_token:
            raise OandaError("OANDA_API_TOKEN is not configured. Set it in backend/.env.")
        self._base_url = settings.oanda_base_url
        self._token = settings.oanda_api_token

    async def fetch_candles(self, symbol: str, timeframe: str, count: int = 500) -> list[RawCandle]:
        if timeframe not in GRANULARITY:
            raise OandaError(f"Unsupported timeframe: {timeframe}")

        instrument = to_instrument(symbol)
        async with httpx.AsyncClient(
            base_url=self._base_url,
            headers={"Authorization": f"Bearer {self._token}"},
            timeout=30.0,
        ) as client:
            resp = await client.get(
                f"/v3/instruments/{instrument}/candles",
                params={"granularity": GRANULARITY[timeframe], "count": count, "price": "M"},
            )
            if resp.status_code != 200:
                raise OandaError(f"OANDA {resp.status_code} for {instrument}: {resp.text}")
            data = resp.json()

        out: list[RawCandle] = []
        for c in data["candles"]:
            if not c["complete"]:
                continue  # the in-progress forming candle at the tail
            mid = c["mid"]
            out.append(
                RawCandle(
                    timestamp=_parse_oanda_time(c["time"]),
                    open=float(mid["o"]),
                    high=float(mid["h"]),
                    low=float(mid["l"]),
                    close=float(mid["c"]),
                    volume=float(c["volume"]),
                )
            )
        return out


async def stream_prices(symbols: list[str]) -> AsyncIterator[TickEvent]:
    """Long-lived connection to OANDA's pricing stream — roadmap Step 5.1.

    Yields one TickEvent per PRICE message; HEARTBEATs (sent every 5s to
    keep the connection alive) are consumed silently. The caller is
    responsible for reconnecting if this generator ends (network drop,
    OANDA-side disconnect) — it does not retry internally.
    """
    settings = get_settings()
    if not settings.oanda_api_token:
        raise OandaError("OANDA_API_TOKEN is not configured. Set it in backend/.env.")
    if not settings.oanda_account_id:
        raise OandaError("OANDA_ACCOUNT_ID is not configured. Set it in backend/.env.")

    instruments = ",".join(to_instrument(s) for s in symbols)
    async with httpx.AsyncClient(
        base_url=settings.oanda_stream_url,
        headers={"Authorization": f"Bearer {settings.oanda_api_token}"},
        # OANDA sends a HEARTBEAT every 5s, so a read timeout comfortably
        # above that detects a silently-dead connection. An infinite read
        # timeout would hang forever instead of letting the caller reconnect.
        timeout=httpx.Timeout(connect=30.0, read=STREAM_READ_TIMEOUT_S, write=30.0, pool=30.0),
    ) as client, client.stream(
        "GET",
        f"/v3/accounts/{settings.oanda_account_id}/pricing/stream",
        params={"instruments": instruments},
    ) as response:
        if response.status_code != 200:
            body = await response.aread()
            # Upstream errors (Cloudflare 5xx) return full HTML pages — log a
            # snippet, not kilobytes of markup.
            detail = body.decode(errors="replace")[:200].replace("\n", " ")
            raise OandaError(f"OANDA stream {response.status_code}: {detail}")

        async for line in response.aiter_lines():
            if not line:
                continue
            data = json.loads(line)
            if data.get("type") != "PRICE":
                continue  # HEARTBEAT
            bid = float(data["bids"][0]["price"])
            ask = float(data["asks"][0]["price"])
            yield TickEvent(
                symbol=from_instrument(data["instrument"]),
                timestamp=_parse_oanda_time(data["time"]),
                bid=bid,
                ask=ask,
                mid=round((bid + ask) / 2, 6),
            )
