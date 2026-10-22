from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class DesignCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DesignImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool
    display_order: int

    model_config = ConfigDict(from_attributes=True)


class DesignResponse(BaseModel):
    id: int
    shop_id: int
    shop_name: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    price_from: float
    price_to: Optional[float] = None
    fabric: Optional[str] = None
    customization_available: bool = True
    is_active: bool = True
    image_url: Optional[str] = None
    tags: Optional[str] = None
    images: List[DesignImageResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DesignCreate(BaseModel):
    title: str
    shop_id: Optional[int] = None
    category_id: Optional[int] = None
    category: Optional[str] = None
    price_from: float = 120.0
    price_to: Optional[float] = None
    fabric: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[str] = None
    customization_available: bool = True

