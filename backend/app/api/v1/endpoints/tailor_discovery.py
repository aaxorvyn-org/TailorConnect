from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.tailor_discovery import NearbyTailorResponse, MarketplaceSearchResponse
from app.services.tailor_discovery_service import tailor_discovery_service

router = APIRouter()


@router.get(
    "/search",
    response_model=MarketplaceSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search tailors and bespoke designs",
    description="Fullstack multi-field search across tailor shops, craftsmanship specialties, and bespoke garment designs.",
)
def search_marketplace(
    q: str = Query("", description="Search term for atelier, garment design, fabric, or style (e.g. 'ladies kurta', 'blouse', 'suit')"),
    category: Optional[str] = Query(None, description="Garment category filter"),
    city: Optional[str] = Query(None, description="City location filter"),
    sort_by: str = Query("rating", description="Sort order: rating, experience, price"),
    db: Session = Depends(get_db),
) -> MarketplaceSearchResponse:
    """
    Search both tailor shops and lookbook designs simultaneously.
    Returns categorized matching results for fullstack discovery.
    """
    return tailor_discovery_service.search_marketplace(
        db=db,
        query=q,
        category=category,
        city=city,
        sort_by=sort_by,
    )


@router.get(
    "/nearby",
    response_model=List[NearbyTailorResponse],
    status_code=status.HTTP_200_OK,
    summary="Discover nearby tailor ateliers",
    description="Calculates geographic distances between customer coordinates and registered atelier shops, returning nearby ateliers sorted by distance.",
)
def get_nearby_tailors(
    latitude: float = Query(
        ...,
        ge=-90.0,
        le=90.0,
        description="Customer latitude (-90.0 to 90.0 degrees)",
    ),
    longitude: float = Query(
        ...,
        ge=-180.0,
        le=180.0,
        description="Customer longitude (-180.0 to 180.0 degrees)",
    ),
    radius: float = Query(
        50.0,
        gt=0.0,
        le=500.0,
        description="Maximum search radius in kilometers (km). Defaults to 50.0 km.",
    ),
    db: Session = Depends(get_db),
) -> List[NearbyTailorResponse]:
    """
    Returns registered tailor shops within the requested radius sorted by proximity.
    Excludes all private customer and personal tailor credentials.
    """
    return tailor_discovery_service.find_nearby_tailors(
        db=db,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius,
    )

