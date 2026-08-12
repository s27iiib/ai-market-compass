from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.redis_client import subscribe_updates

router = APIRouter()


@router.websocket("/ws/prices")
async def prices_ws(websocket: WebSocket) -> None:
    """Broadcasts every tick and candle-close event to any connected client —
    no auth, no per-symbol subscription. The frontend filters client-side;
    data volume is low enough that this is simpler than a subscription
    protocol for what this platform needs right now."""
    await websocket.accept()
    try:
        async for update in subscribe_updates():
            await websocket.send_json(update)
    except WebSocketDisconnect:
        pass
