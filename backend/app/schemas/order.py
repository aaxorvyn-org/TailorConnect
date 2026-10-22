from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.order import OrderStatus
from app.schemas.delivery import DeliveryResponse


class DeliveryAddressCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=5, max_length=50)
    address_line_1: str = Field(..., min_length=3, max_length=255)
    address_line_2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    country: str = Field("India", max_length=100)
    country_code: Optional[str] = Field(None, max_length=10)
    pincode: str = Field(..., min_length=2, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=50)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DeliveryAddressResponse(BaseModel):
    id: int
    customer_id: int
    full_name: str
    phone: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    country: str
    country_code: Optional[str] = "IN"
    pincode: str
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    design_id: int = Field(..., description="ID of the selected design from the tailor shop")
    quantity: int = Field(default=1, ge=1, le=50, description="Quantity to commission")
    customization_notes: Optional[str] = Field(None, max_length=1500)
    measurement_id: int = Field(..., description="ID of the customer's saved bespoke measurement profile")


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    design_id: Optional[int] = None
    item_title: str
    quantity: int
    unit_price: float
    customization_notes: Optional[str] = None
    measurement_id: Optional[int] = None
    measurement_name: Optional[str] = None
    design_thumbnail: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderReferenceImageResponse(BaseModel):
    id: int
    order_id: int
    image_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderStatusHistoryResponse(BaseModel):
    id: int
    order_id: int
    status: str
    changed_by: Optional[int] = None
    changed_by_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    tailor_shop_id: int = Field(..., description="Target tailor atelier shop ID")
    customer_notes: Optional[str] = Field(None, max_length=2000)
    currency: Optional[str] = Field("USD", max_length=10, description="Order currency (INR, USD, GBP, EUR, AED, etc.)")
    delivery_address: DeliveryAddressCreate
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order items")
    reference_image_urls: Optional[List[str]] = Field(default_factory=list, description="Optional image URLs")


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="New order status")
    notes: Optional[str] = Field(None, max_length=1000, description="Reason or atelier production update note")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        clean = v.strip().upper()
        valid_statuses = {s.value for s in OrderStatus}
        if clean not in valid_statuses:
            raise ValueError(f"Invalid status '{clean}'. Must be one of: {', '.join(sorted(valid_statuses))}")
        return clean


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    tailor_shop_id: int
    tailor_shop_name: Optional[str] = None
    status: str
    payment_status: Optional[str] = "UNPAID"
    subtotal: float
    delivery_charge: float
    total_amount: float
    currency: str
    customer_notes: Optional[str] = None
    delivery_address: Optional[DeliveryAddressResponse] = None
    delivery: Optional[DeliveryResponse] = None
    items: List[OrderItemResponse] = []
    reference_images: List[OrderReferenceImageResponse] = []
    status_history: List[OrderStatusHistoryResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
