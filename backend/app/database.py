from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import URL
from urllib.parse import urlparse, unquote, parse_qs
from app.config import get_settings

settings = get_settings()


def build_async_url(database_url: str) -> URL:
    """Build an asyncpg-compatible SQLAlchemy URL from a Supabase connection string.
    Handles special characters in passwords (like @) that break URL parsing.
    """
    parsed = urlparse(database_url)

    # Decode any percent-encoded characters in the password
    password = unquote(parsed.password) if parsed.password else ""

    return URL.create(
        drivername="postgresql+asyncpg",
        username=parsed.username,
        password=password,
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path.lstrip("/") or "postgres",
    )


def build_connect_args(database_url: str) -> dict:
    """Build asyncpg connection args.
    Supabase direct DB hosts require TLS, and pooler works with statement cache disabled.
    """
    parsed = urlparse(database_url)
    query = parse_qs(parsed.query)

    connect_args = {"statement_cache_size": 0}

    sslmode = (query.get("sslmode", [""])[0] or "").lower()
    if sslmode in {"require", "verify-ca", "verify-full"}:
        connect_args["ssl"] = "require"
    elif (parsed.hostname or "").endswith("supabase.co"):
        connect_args["ssl"] = "require"

    return connect_args


db_url = build_async_url(settings.DATABASE_URL)
connect_args = build_connect_args(settings.DATABASE_URL)
print(f"[DB] Connecting to {db_url.host}:{db_url.port} as {db_url.username}")

engine = create_async_engine(
    db_url,
    echo=False,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args,
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
