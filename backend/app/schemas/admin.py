from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class AdminDashboardStats(BaseModel):
    """
    Summary metrics displayed on the Admin Dashboard.
    """
    total_customers: int
    total_tailors: int
    total_shops: int
    total_orders: int
    pending_shop_approvals: int
    completed_orders: int
    total_revenue: float
    currency: str = "USD"
    recent_orders: List[Dict[str, Any]] = Field(default_factory=list)
    recent_tailors: List[Dict[str, Any]] = Field(default_factory=list)


class AdminTailorItem(BaseModel):
    """
    Tailor profile overview for Admin management.
    """
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    shop_id: Optional[int] = None
    shop_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminCustomerItem(BaseModel):
    """
    Customer client overview for Admin management.
    """
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    country: Optional[str] = None
    orders_count: int
    total_spent: float
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminShopItem(BaseModel):
    """
    Tailor atelier shop details for Admin management.
    """
    id: int
    shop_name: str
    owner_name: str
    owner_email: str
    phone: str
    city: Optional[str] = None
    rating: Optional[float] = 4.9
    review_count: Optional[int] = 0
    starting_price: Optional[float] = None
    is_active: bool
    orders_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminOrderItem(BaseModel):
    """
    Order record view for Admin oversight across ateliers.
    """
    id: int
    order_number: str
    customer_id: int
    customer_name: str
    customer_email: str
    tailor_shop_id: int
    tailor_shop_name: str
    status: str
    payment_status: Optional[str] = "UNPAID"
    total_amount: float
    currency: str
    item_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminReviewItem(BaseModel):
    """
    Shop review overview for Admin moderation.
    """
    id: int
    customer_id: int
    customer_name: str
    tailor_shop_id: int
    tailor_shop_name: str
    order_id: int
    order_number: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserStatusUpdate(BaseModel):
    is_active: bool
    is_verified: Optional[bool] = None


class ShopStatusUpdate(BaseModel):
    is_active: bool


class AdminOrderStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
