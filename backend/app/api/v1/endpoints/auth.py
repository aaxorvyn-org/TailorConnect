from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_user,
    get_db,
    require_admin,
    require_customer,
    require_tailor,
    security_scheme,
)
from app.core.rate_limiter import auth_rate_limiter
from app.core.security import revoke_token
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
)
from app.services.auth_service import auth_service

router = APIRouter()


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a password reset verification code",
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    """
    Initiates password recovery. Dispatches a 6-digit OTP code to the provided email.
    """
    code, msg = auth_service.request_password_reset(db, email=payload.email)
    return ForgotPasswordResponse(
        status="ok",
        message=msg,
        code=code,
    )


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset account password using verification code",
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> ResetPasswordResponse:
    """
    Validates the 6-digit OTP code and updates account password with salted bcrypt hash.
    """
    auth_service.reset_password(
        db,
        email=payload.email,
        code=payload.code,
        new_password=payload.new_password,
    )
    return ResetPasswordResponse(
        status="ok",
        message="Your password has been successfully reset. Please sign in with your new credentials.",
    )


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer or tailor",
    dependencies=[Depends(auth_rate_limiter)],
)
def register(
    user_in: UserRegister,
    db: Session = Depends(get_db),
) -> Token:
    """
    Registers a new user (CUSTOMER, TAILOR, or ADMIN) with email normalization,
    strict password criteria, duplicate prevention, and salted bcrypt password hashing.
    Returns access token and user profile.
    """
    user, access_token = auth_service.register_user(db, user_in=user_in)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="User login with JWT authentication",
    dependencies=[Depends(auth_rate_limiter)],
)
def login(
    login_in: UserLogin,
    db: Session = Depends(get_db),
) -> Token:
    """
    Authenticates email and password credentials, validates account active state,
    and returns a signed JWT access token.
    """
    user, access_token = auth_service.authenticate_user(db, login_in=login_in)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Returns the authenticated user's profile details.
    Protected by Bearer token validation.
    """
    return UserResponse.model_validate(current_user)


@router.put(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current authenticated user profile",
)
def update_current_user_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """
    Updates the authenticated user's profile details and persists changes.
    """
    if user_in.full_name is not None and user_in.full_name.strip():
        current_user.full_name = user_in.full_name.strip()
    if user_in.phone is not None:
        current_user.phone = user_in.phone.strip()
    if user_in.country is not None and user_in.country.strip():
        current_user.country = user_in.country.strip()
    if user_in.currency is not None and user_in.currency.strip():
        current_user.currency = user_in.currency.strip()
    if user_in.city is not None:
        current_user.city = user_in.city.strip()
    if user_in.shop_name is not None:
        current_user.shop_name = user_in.shop_name.strip()
    if user_in.experience_years is not None:
        current_user.experience_years = user_in.experience_years
    if user_in.specialties is not None:
        current_user.specialties = user_in.specialties.strip()
    if user_in.email is not None and user_in.email.strip().lower() != current_user.email:
        new_email = user_in.email.strip().lower()
        existing = db.query(User).filter(User.email == new_email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already in use by another account."
            )
        current_user.email = new_email

    if current_user.shop:
        if user_in.shop_name is not None:
            current_user.shop.shop_name = user_in.shop_name.strip()
        if user_in.full_name is not None:
            current_user.shop.owner_name = user_in.full_name.strip()
        if user_in.phone is not None:
            current_user.shop.phone = user_in.phone.strip()
        if user_in.experience_years is not None:
            current_user.shop.experience_years = user_in.experience_years
        if user_in.specialties is not None:
            current_user.shop.specialties = user_in.specialties.strip()

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User logout and session token invalidation",
)
def logout(
    auth_credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> Dict[str, str]:
    """
    Revokes the current JWT access token, adding it to the blacklist
    so it cannot be reused.
    """
    if auth_credentials and auth_credentials.credentials:
        revoke_token(auth_credentials.credentials)

    return {
        "status": "ok",
        "message": "Successfully logged out. Session token has been invalidated.",
    }


# Role-protected API verification routes
@router.get(
    "/protected/customer",
    summary="Customer-only protected verification route",
)
def customer_only_route(current_user: User = Depends(require_customer)) -> Dict[str, Any]:
    return {
        "status": "ok",
        "message": f"Welcome Customer {current_user.full_name}. Route access authorized.",
        "role": current_user.role,
    }


@router.get(
    "/protected/tailor",
    summary="Tailor-only protected verification route",
)
def tailor_only_route(current_user: User = Depends(require_tailor)) -> Dict[str, Any]:
    return {
        "status": "ok",
        "message": f"Welcome Master Tailor {current_user.full_name} ({current_user.shop_name}). Atelier route authorized.",
        "role": current_user.role,
    }


@router.get(
    "/protected/admin",
    summary="Admin-only protected verification route",
)
def admin_only_route(current_user: User = Depends(require_admin)) -> Dict[str, Any]:
    return {
        "status": "ok",
        "message": f"Administrator privilege confirmed for {current_user.full_name}.",
        "role": current_user.role,
    }
