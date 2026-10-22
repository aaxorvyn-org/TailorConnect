from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRole(str, Enum):
    CUSTOMER = "CUSTOMER"
    TAILOR = "TAILOR"
    ADMIN = "ADMIN"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    country: Optional[str] = Field("India", max_length=100)
    currency: Optional[str] = Field("INR", max_length=10)
    role: UserRole = UserRole.CUSTOMER


class UserRegister(UserBase):
    password: str = Field(..., min_length=8, max_length=128, description="Password must be at least 8 characters")

    # Optional foundation fields for tailor registration
    shop_name: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    experience_years: Optional[int] = Field(None, ge=0, le=70)
    specialties: Optional[str] = Field(None, max_length=500)

    # Optional security field for admin registration
    admin_secret: Optional[str] = Field(None, max_length=255, description="Secret master key required for ADMIN registration")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must contain at least 8 characters.")
        if not any(c.isupper() or c.islower() for c in v):
            raise ValueError("Password must contain at least one letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number.")
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    country: Optional[str] = Field(None, max_length=100)
    currency: Optional[str] = Field(None, max_length=10)
    city: Optional[str] = Field(None, max_length=100)
    shop_name: Optional[str] = Field(None, max_length=255)
    experience_years: Optional[int] = Field(None, ge=0, le=70)
    specialties: Optional[str] = Field(None, max_length=500)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    shop_name: Optional[str] = None
    shop_id: Optional[int] = None
    city: Optional[str] = None
    experience_years: Optional[int] = None
    specialties: Optional[str] = None
    country: Optional[str] = "India"
    currency: Optional[str] = "INR"
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: str
    role: UserRole
    exp: Optional[int] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class ForgotPasswordResponse(BaseModel):
    status: str = "ok"
    message: str
    code: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=4, max_length=10)
    new_password: str = Field(..., min_length=6)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class ResetPasswordResponse(BaseModel):
    status: str = "ok"
    message: str

