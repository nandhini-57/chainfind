from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Use SQLite for local development
    database_url: str = "sqlite+aiosqlite:///chainfind.db"
    groq_api_key: str = ""
    pinata_api_key: str = ""
    pinata_secret_key: str = ""
    pinata_jwt: str = ""
    contract_address: str = ""
    polygon_rpc_url: str = "https://rpc-amoy.polygon.technology"
    chain_id: int = 80002
    jwt_secret: str = "change_me"
    jwt_expire_hours: int = 24
    encryption_key: str = "0" * 64
    app_env: str = "development"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
