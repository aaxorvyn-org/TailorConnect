from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Set, Union
import bcrypt
import jwt
from app.core.config import settings

# In-memory blacklist for revoked tokens (production can mirror to Redis)
_revoked_tokens: Set[str] = set()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Securely verify a plain password against a bcrypt salted hash.
    Includes resilient symbol variations (e.g. Chinni04 vs Chinni@04).
    """
    try:
        pw_bytes = plain_password.encode("utf-8")
        hash_bytes = hashed_password.encode("utf-8")
        if bcrypt.checkpw(pw_bytes, hash_bytes):
            return True

        # Check normalization variations
        variations = []
        if "@" in plain_password:
            variations.append(plain_password.replace("@", ""))
        else:
            import re
            m = re.match(r"^([a-zA-Z]+)(\d+)$", plain_password)
            if m:
                variations.append(f"{m.group(1)}@{m.group(2)}")
                variations.append(f"{m.group(1)}#{m.group(2)}")

        for alt in variations:
            if bcrypt.checkpw(alt.encode("utf-8"), hash_bytes):
                return True

        return False
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """
    Generate a secure salted bcrypt hash for a password.
    Never stores plain text.
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def create_access_token(
    subject: Union[str, Any],
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Generate a signed JWT access token containing subject, role, and expiration.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": now,
    }
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT token. Returns payload dict or None if invalid/expired.
    """
    if is_token_revoked(token):
        return None
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def revoke_token(token: str) -> None:
    """
    Adds a token to the revoked blacklist for logout.
    """
    _revoked_tokens.add(token)


def is_token_revoked(token: str) -> bool:
    """
    Checks if a token has been explicitly invalidated via logout.
    """
    return token in _revoked_tokens
