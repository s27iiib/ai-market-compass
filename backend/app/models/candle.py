from sqlalchemy import BigInteger, Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Candle(Base):
    __tablename__ = "candles"

    symbol: Mapped[str] = mapped_column(String(16), primary_key=True)
    timeframe: Mapped[str] = mapped_column(String(4), primary_key=True)
    # Epoch milliseconds — matches the frontend's Candle.t exactly.
    timestamp: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    open: Mapped[float] = mapped_column(Float)
    high: Mapped[float] = mapped_column(Float)
    low: Mapped[float] = mapped_column(Float)
    close: Mapped[float] = mapped_column(Float)
    volume: Mapped[float] = mapped_column(Float)

    source: Mapped[str] = mapped_column(String(16))
