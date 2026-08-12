"""Hot state cache + pub/sub for live market data — roadmap Phase 5, Step 5.4.

Keeps the WebSocket layer decoupled from the ingestion worker: the worker
writes latest price/candle state and publishes updates here; the WebSocket
endpoint only ever reads from Redis, never talks to OANDA directly.

Degrades gracefully without REDIS_URL configured — callers get None/no-ops
rather than exceptions, matching the DB and OANDA client pattern.
"""

import json
from collections.abc import AsyncIterator
from typing import Any

from redis.asyncio import Redis

from app.core.config import get_settings

PRICE_UPDATES_CHANNEL = "price_updates"

_client: Redis | None = None


def get_redis() -> Redis | None:
    global _client
    settings = get_settings()
    if not settings.redis_url:
        return None
    if _client is None:
        _client = Redis.from_url(settings.redis_url, decode_responses=True)
    return _client


async def set_latest_price(symbol: str, price: dict[str, Any]) -> None:
    client = get_redis()
    if client is None:
        return
    await client.set(f"price:{symbol}", json.dumps(price))


async def get_latest_price(symbol: str) -> dict[str, Any] | None:
    client = get_redis()
    if client is None:
        return None
    raw = await client.get(f"price:{symbol}")
    return json.loads(raw) if raw else None


async def set_forming_candle(symbol: str, timeframe: str, candle: dict[str, Any]) -> None:
    client = get_redis()
    if client is None:
        return
    await client.set(f"candle:{symbol}:{timeframe}", json.dumps(candle))


async def get_forming_candle(symbol: str, timeframe: str) -> dict[str, Any] | None:
    client = get_redis()
    if client is None:
        return None
    raw = await client.get(f"candle:{symbol}:{timeframe}")
    return json.loads(raw) if raw else None


async def publish_update(message: dict[str, Any]) -> None:
    client = get_redis()
    if client is None:
        return
    await client.publish(PRICE_UPDATES_CHANNEL, json.dumps(message))


async def subscribe_updates() -> AsyncIterator[dict[str, Any]]:
    """Each subscriber gets its own connection, deliberately — a Redis
    connection in subscriber mode can't also serve normal commands, so
    sharing the module-level client would starve the worker's set/publish
    calls (and vice versa)."""
    settings = get_settings()
    if not settings.redis_url:
        return
    client = Redis.from_url(settings.redis_url, decode_responses=True)
    try:
        pubsub = client.pubsub()
        async with pubsub:
            await pubsub.subscribe(PRICE_UPDATES_CHANNEL)
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield json.loads(message["data"])
    finally:
        await client.aclose()
