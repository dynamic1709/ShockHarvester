"""
Application configuration using Pydantic Settings.
Reads from environment variables and .env file.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = "sqlite+aiosqlite:///./shockharvester.db"

    # JWT
    jwt_secret: str = "shockharvester_jwt_secret_key_for_demo_32chars"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # External APIs
    anthropic_api_key: str = ""

    # App
    environment: str = "development"
    app_version: str = "1.0.0"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
