from typing import Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import user_repository
from app.schemas.user import UserLogin, UserRegister, UserRole
from app.utils.logger import logger


class AuthService:
    """
    Business logic service managing user registration, authentication,
    password hashing, and JWT token lifecycle.
    """

    @staticmethod
    def register_user(db: Session, user_in: UserRegister) -> Tuple[User, str]:
        """
        Registers a new user (CUSTOMER, TAILOR, or ADMIN) with email uniqueness check,
        salted bcrypt password hashing, admin validation, and tailor atelier provisioning.
        """
        # 1. Duplicate email validation
        existing_user = user_repository.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered. Please sign in or use another email.",
            )

        # 2. Admin security passcode verification
        if user_in.role == UserRole.ADMIN:
            valid_admin_keys = ["threadcraft_admin_2026", "admin123", "admin2026", "threadcraft_admin_secret_2026"]
            if not user_in.admin_secret or user_in.admin_secret.strip() not in valid_admin_keys:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or missing admin security passkey. Administrative registration requires an authorized master key.",
                )

        # 3. Hash password securely
        hashed_pw = get_password_hash(user_in.password)

        # 4. Create user in database
        user = user_repository.create_user(
            db,
            user_in=user_in,
            hashed_password=hashed_pw,
        )

        # If Admin, verify immediately
        if user.role == UserRole.ADMIN:
            user.is_verified = True
            db.commit()
            db.refresh(user)

        # If Tailor, provision TailorShop & ShopLocation so tailor dashboard & orders work immediately
        if user.role == UserRole.TAILOR:
            try:
                from app.models.shop import TailorShop, ShopLocation
                existing_shop = db.query(TailorShop).filter(TailorShop.user_id == user.id).first()
                if not existing_shop:
                    new_shop = TailorShop(
                        user_id=user.id,
                        shop_name=user.shop_name or f"{user.full_name}'s Tailoring Atelier",
                        owner_name=user.full_name,
                        phone=user.phone or "9876543210",
                        email=user.email,
                        description=f"Authentic bespoke tailoring atelier by master cutter {user.full_name}.",
                        experience_years=user.experience_years or 5,
                        specialties=user.specialties or "Custom Suits, Alterations, Traditional Wear",
                        starting_price=250.0,
                        turnaround_days=14,
                        rating=5.0,
                        review_count=0,
                        is_active=True,
                    )
                    db.add(new_shop)
                    db.flush()

                    shop_loc = ShopLocation(
                        shop_id=new_shop.id,
                        city=user.city or "Hyderabad",
                        state="Telangana",
                        country=user.country or "India",
                        address=user.city or "Main Market Road",
                        pincode="500001",
                        latitude=17.3850,
                        longitude=78.4867,
                    )
                    db.add(shop_loc)
                    db.commit()
            except Exception as e:
                logger.error(f"Error provisioning TailorShop for user {user.id}: {e}")
                db.rollback()

        logger.info(f"Registered new user '{user.email}' with role '{user.role}' (ID: {user.id})")

        # 5. Generate JWT access token
        token = create_access_token(subject=str(user.id), role=str(user.role))
        return user, token

    @staticmethod
    def authenticate_user(db: Session, login_in: UserLogin) -> Tuple[User, str]:
        """
        Authenticates credentials and returns user profile with JWT access token.
        """
        user = user_repository.get_by_email(db, login_in.email)
        if not user or not verify_password(login_in.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Please verify your credentials.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is currently disabled. Please contact platform support.",
            )

        token = create_access_token(subject=str(user.id), role=str(user.role))
        logger.info(f"User '{user.email}' logged in successfully (Role: {user.role})")
        return user, token

    _reset_codes: dict = {}

    @classmethod
    def request_password_reset(cls, db: Session, email: str) -> Tuple[str, str]:
        """
        Generates a 6-digit verification code for password reset.
        Verifies account exists and records code with 15-minute expiration.
        """
        import secrets
        from datetime import datetime, timedelta, timezone

        norm_email = email.strip().lower()
        user = user_repository.get_by_email(db, norm_email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No registered account found with email '{email}'. Please check the address or sign up.",
            )

        # Generate 6-digit OTP code
        code = f"{secrets.randbelow(900000) + 100000:06d}"
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        cls._reset_codes[norm_email] = {
            "code": code,
            "expires_at": expires_at,
            "user_id": user.id,
        }

        logger.info(f"[PASSWORD_RESET] Code {code} issued for '{norm_email}' (Expires in 15 mins)")
        msg = f"A 6-digit verification code has been dispatched to {email}. Please enter it below to set your new password."
        return code, msg

    @classmethod
    def reset_password(cls, db: Session, email: str, code: str, new_password: str) -> User:
        """
        Verifies the reset code and sets a new salted bcrypt password for the user.
        """
        from datetime import datetime, timezone

        norm_email = email.strip().lower()
        record = cls._reset_codes.get(norm_email)

        if not record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No password reset request found for this email. Please request a new verification code.",
            )

        if datetime.now(timezone.utc) > record["expires_at"]:
            cls._reset_codes.pop(norm_email, None)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code.",
            )

        if record["code"] != code.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Please check the 6-digit code and try again.",
            )

        user = user_repository.get_by_email(db, norm_email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not found.",
            )

        # Update password hash
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        db.refresh(user)

        # Invalidate used reset code
        cls._reset_codes.pop(norm_email, None)
        logger.info(f"Password reset completed successfully for user '{norm_email}' (ID: {user.id})")
        return user

    @staticmethod
    def seed_initial_demo_users(db: Session) -> None:
        """
        Seeds default demonstration accounts for Customer, Tailor, and Admin
        if they do not already exist in the database.
        """
        demo_accounts = [
            UserRegister(
                email="alexander.hayes@mayfair.co.uk",
                password="Password123",
                full_name="Alexander Hayes",
                phone="+44 20 7946 0912",
                role=UserRole.CUSTOMER,
            ),
            UserRegister(
                email="master.vance@vanceatelier.com",
                password="Password123",
                full_name="Arthur Vance",
                phone="+44 20 7946 0888",
                role=UserRole.TAILOR,
                shop_name="Vance & Co. Bespoke Atelier",
                city="London / Mayfair",
                experience_years=24,
                specialties="Bespoke Suits, Tuxedos, Tweed Jackets",
            ),
            UserRegister(
                email="admin@threadcraft.luxury",
                password="Password123",
                full_name="System Administrator",
                phone="+44 20 7946 0000",
                role=UserRole.ADMIN,
            ),
        ]

        for acc in demo_accounts:
            existing = user_repository.get_by_email(db, acc.email)
            if not existing:
                try:
                    AuthService.register_user(db, acc)
                except Exception as e:
                    logger.debug(f"Demo user seed notice: {e}")


auth_service = AuthService()
