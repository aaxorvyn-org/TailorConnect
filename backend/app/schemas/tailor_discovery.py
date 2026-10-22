from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class NearbyTailorResponse(BaseModel):
    """
    Public storefront response for nearby tailor shop discovery.
    Strictly excludes all private customer or personal tailor details.
    """
    shop_id: int = Field(..., description="Unique shop identifier")
    shop_name: str = Field(..., description="Commercial atelier name")
    shop_address: str = Field(..., description="Street address of the atelier")
    city: str = Field(..., description="City or district")
    state: Optional[str] = Field(None, description="State or province")
    country: Optional[str] = Field("United Kingdom", description="Country")
    pincode: Optional[str] = Field(None, description="Postal code")
    latitude: float = Field(..., description="Shop geographic latitude")
    longitude: float = Field(..., description="Shop geographic longitude")
    distance: float = Field(..., description="Calculated distance in kilometers (km)")
    rating: Optional[float] = Field(None, description="Customer satisfaction rating out of 5.0")
    review_count: Optional[int] = Field(0, description="Total verified reviews")
    profile_image: Optional[str] = Field(None, description="Atelier avatar or profile photo URL")
    cover_image: Optional[str] = Field(None, description="Atelier storefront cover photo URL")
    specialties: Optional[List[str]] = Field(default_factory=list, description="Craftsmanship specialties")
    starting_price: Optional[float] = Field(None, description="Bespoke starting price")
    turnaround_days: Optional[int] = Field(None, description="Standard turnaround lead time in days")
    phone: Optional[str] = Field(None, description="Public shop telephone")
    owner_name: Optional[str] = Field(None, description="Master cutter or owner name")
    is_active: bool = Field(True, description="Atelier active status")

    model_config = ConfigDict(from_attributes=True)


from app.schemas.design import DesignResponse


class MarketplaceSearchResponse(BaseModel):
    """
    Unified fullstack search response containing both matching tailor ateliers
    and matching bespoke designs/garments.
    """
    query: str
    total_tailors: int
    total_designs: int
    tailors: List[NearbyTailorResponse]
    designs: List[DesignResponse]

    model_config = ConfigDict(from_attributes=True)
