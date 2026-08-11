from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Asset(Base):
    __tablename__ = "assets"

    # e.g. "XAU/USD" — matches the frontend's Asset.symbol exactly, so no
    # translation is needed between the API response and the UI's domain type.
    symbol: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    kind: Mapped[str] = mapped_column(String(16))  # "metal" | "forex"
    pip_decimals: Mapped[int] = mapped_column(Integer)
