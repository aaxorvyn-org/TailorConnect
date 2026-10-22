from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ReviewCreate(BaseModel):
    """
    Request to submit a review for a completed order.
    """
    order_id: int = Field(..., description="ID of the completed order being reviewed")
    rating: int = Field(..., ge=1, le=5, description="Star rating from 1 to 5")
    comment: Optional[str] = Field(None, max_length=2000, description="Customer review commentary and fitting feedback")

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("Rating must be between 1 and 5 stars.")
        return v


class ReviewUpdate(BaseModel):
    """
    Request to update an existing customer review.
    """
    rating: Optional[int] = Field(None, ge=1, le=5, description="Updated rating between 1 and 5 stars")
    comment: Optional[str] = Field(None, max_length=2000, description="Updated feedback comment")

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 5):
            raise ValueError("Rating must be between 1 and 5 stars.")
        return v


class ReviewResponse(BaseModel):
    """
    Detailed review entity returned to clients.
    """
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    tailor_shop_id: int
    tailor_shop_name: Optional[str] = None
    order_id: int
    order_number: Optional[str] = None
    item_title: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShopReviewSummaryResponse(BaseModel):
    """
    Summary view for public tailor shop profiles including average rating and reviews.
    """
    shop_id: int
    shop_name: str
    average_rating: float
    review_count: int
    rating_breakdown: Dict[str, int] = Field(default_factory=dict)
    reviews: List[ReviewResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
