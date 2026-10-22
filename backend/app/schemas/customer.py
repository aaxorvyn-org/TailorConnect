from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CustomerNoteBase(BaseModel):
    note: str = Field(..., min_length=1, max_length=5000, description="Atelier notes text")
    category: Optional[str] = Field("GENERAL", max_length=50, description="Category: GENERAL, FITTING, PREFERENCE, FABRIC, URGENT")

    @field_validator("note")
    @classmethod
    def validate_note(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Note content cannot be empty.")
        return trimmed


class CustomerNoteCreate(CustomerNoteBase):
    pass


class CustomerNoteResponse(CustomerNoteBase):
    id: int
    customer_id: int
    tailor_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


from app.utils.international import validate_international_phone


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Customer full name")
    email: Optional[EmailStr] = Field(None, description="Valid email address")
    phone: Optional[str] = Field(None, max_length=50, description="Contact phone number with international format")
    gender: Optional[str] = Field(None, max_length=50, description="Gender identity")
    address: Optional[str] = Field(None, max_length=255, description="Street address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State or province")
    pincode: Optional[str] = Field(None, max_length=50, description="Postal code or pincode")
    postal_code: Optional[str] = Field(None, max_length=50, description="Postal code / PIN code")
    country: Optional[str] = Field("India", max_length=100, description="Country of residence")
    country_code: Optional[str] = Field("IN", max_length=10, description="Country ISO code (IN, US, GB, etc.)")
    currency: Optional[str] = Field("INR", max_length=10, description="Preferred billing currency (INR, USD, GBP, etc.)")
    preferred_contact_method: Optional[str] = Field("EMAIL", max_length=50, description="EMAIL, PHONE, WHATSAPP")
    status: Optional[str] = Field("ACTIVE", max_length=50, description="ACTIVE, INACTIVE")

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Customer name cannot be empty.")
        return trimmed

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v and v.strip():
            return validate_international_phone(v)
        return v


class CustomerCreate(CustomerBase):
    initial_note: Optional[str] = Field(None, max_length=5000, description="Optional initial note for this patron")
    note_category: Optional[str] = Field("GENERAL", max_length=50, description="Category for initial note")


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    gender: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=50)
    country: Optional[str] = Field(None, max_length=100)
    country_code: Optional[str] = Field(None, max_length=10)
    currency: Optional[str] = Field(None, max_length=10)
    preferred_contact_method: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Customer name cannot be empty.")
            return trimmed
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v and v.strip():
            return validate_international_phone(v)
        return v


class CustomerResponse(BaseModel):
    id: int
    tailor_id: int
    shop_id: Optional[int] = None
    shop_name: Optional[str] = None
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "India"
    country_code: Optional[str] = "IN"
    currency: str = "INR"
    preferred_contact_method: Optional[str] = None
    status: str
    total_orders: int = 0
    total_spend: float = 0.0
    notes_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerDetailResponse(CustomerResponse):
    notes: List[CustomerNoteResponse] = []
    order_history: List[Dict[str, Any]] = []


class CustomerListResponse(BaseModel):
    items: List[CustomerResponse]
    total: int
    page: int
    limit: int
    total_pages: int
