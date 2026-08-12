from typing import TypedDict


class RawCandle(TypedDict):
    timestamp: int  # epoch ms
    open: float
    high: float
    low: float
    close: float
    volume: float


class TickEvent(TypedDict):
    symbol: str
    timestamp: int  # epoch ms
    bid: float
    ask: float
    mid: float
