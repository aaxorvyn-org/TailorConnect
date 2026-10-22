from typing import Generator, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.user import User
from app.repositories.user_repository import user_repository
from app.schemas.user import UserRole
from app.services.health_service import HealthService

# Bearer token extractor
security_scheme = HTTPBearer(auto_error=False)


def get_health_service() -> HealthService:
    """
    Dependency returning HealthService instance.
    """
    return HealthService()


def get_current_user(
    db: Session = Depends(get_db),
    auth_credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> User:
    """
    Validates JWT Bearer token and returns authenticated User entity.
    Raises 401 UNAUTHORIZED if token is missing, expired, revoked, or user not found.
    """
    if not auth_credentials or not auth_credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or token is invalid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload["sub"]
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_repository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists in system records.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deactivated.",
        )

    return user


def get_optional_current_user(
    db: Session = Depends(get_db),
    auth_credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> Optional[User]:
    """
    Safely retrieves the authenticated user if a valid bearer token is present,
    returning None otherwise without raising an exception.
    """
    if not auth_credentials or not auth_credentials.credentials:
        return None
    try:
        payload = decode_access_token(auth_credentials.credentials)
        if not payload or "sub" not in payload:
            return None
        return user_repository.get_by_id(db, int(payload["sub"]))
    except Exception:
        return None


class RoleChecker:
    """
    Role verification dependency factory.
    """

    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = [str(r.value if hasattr(r, "value") else r) for r in allowed_roles]

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if str(current_user.role) not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: This route requires one of the following roles: {', '.join(self.allowed_roles)} (Your role is: {current_user.role})",
            )
        return current_user


# Role dependency shortcuts
require_customer = RoleChecker([UserRole.CUSTOMER])
require_tailor = RoleChecker([UserRole.TAILOR])
require_admin = RoleChecker([UserRole.ADMIN])
