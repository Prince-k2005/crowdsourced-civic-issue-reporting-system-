from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = ""              # e.g. https://xxxxx.supabase.co
    SUPABASE_ANON_KEY: str = ""         # Public anon key
    SUPABASE_SERVICE_KEY: str = ""      # Service role key (for admin ops)
    SUPABASE_JWT_SECRET: str = ""       # JWT secret (Settings → API → JWT Secret)

    # Database (Supabase PostgreSQL connection string)
    DATABASE_URL: str = ""              # postgresql://postgres.xxx:pw@...pooler.supabase.com:6543/postgres

    # App
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000"
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

    # AI (optional)
    GOOGLE_AI_API_KEY: str = ""

    class Config:
        env_file = (
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
            ".env",
        )
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
