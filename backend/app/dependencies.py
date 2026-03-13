from typing import Optional
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
import httpx
import json

from app.database import get_db
from app.config import get_settings
from app.models.user import User

settings = get_settings()
security = HTTPBearer()

# Cache for JWKS keys
_jwks_cache: dict | None = None


async def get_jwks() -> dict:
    """Fetch and cache the JWKS public keys from Supabase."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        print(f"[AUTH] Loaded JWKS from {jwks_url}")
        return _jwks_cache


def find_signing_key(jwks: dict, token: str) -> dict:
    """Find the correct signing key from JWKS that matches the token's kid."""
    import jose.jwt as jose_jwt
    unverified_header = jose_jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key

    # If no kid match, return first key
    if jwks.get("keys"):
        return jwks["keys"][0]

    raise HTTPException(status_code=401, detail="No signing key found in JWKS")


async def decode_supabase_token(token: str) -> dict:
    """Decode and verify a Supabase JWT token using JWKS."""
    try:
        # First, check the algorithm from the token header
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")

        if alg == "ES256":
            # Use JWKS public key for ES256
            jwks = await get_jwks()
            signing_key = find_signing_key(jwks, token)
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            # Fallback to HS256 with secret
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )

        return payload
    except JWTError as e:
        print(f"[AUTH ERROR] JWT decode failed: {e}")
        print(f"[AUTH ERROR] Algorithm: {unverified_header.get('alg')}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Verify Supabase JWT and return the user profile from our DB."""
    token = credentials.credentials
    payload = await decode_supabase_token(token)

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token: no sub claim")

    # Get user profile from our profiles table
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        # Auto-create profile on first API call
        email = payload.get("email", "")
        user_metadata = payload.get("user_metadata", {})
        user = User(
            id=user_id,
            email=email,
            full_name=user_metadata.get("full_name"),
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Return user if valid token provided, None otherwise."""
    if credentials is None:
        return None
    try:
        token = credentials.credentials
        payload = await decode_supabase_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            return None

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            email = payload.get("email", "")
            user_metadata = payload.get("user_metadata", {})
            user = User(id=user_id, email=email, full_name=user_metadata.get("full_name"))
            db.add(user)
            await db.flush()
            await db.refresh(user)
        return user
    except (JWTError, HTTPException):
        return None


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Require admin or moderator role."""
    if user.role not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
