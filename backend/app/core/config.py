from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"

    # Supabase Postgres connection string (session pooler URI). Optional so
    # the app can boot and serve /health before this is configured.
    database_url: str | None = None

    # Origins allowed to call this API from the browser.
    cors_origins: list[str] = ["http://localhost:8080"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
