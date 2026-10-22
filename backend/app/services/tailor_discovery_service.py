import math
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.shop import TailorShop, ShopLocation
from app.models.design import Design, DesignCategory
from app.models.user import User
from app.schemas.tailor_discovery import NearbyTailorResponse, MarketplaceSearchResponse
from app.schemas.design import DesignResponse, DesignImageResponse
from app.utils.logger import logger


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two geographic coordinates in kilometers.
    Uses standard Haversine formula on spherical Earth (radius = 6371.0 km).
    """
    R = 6371.0  # Earth's mean radius in kilometers

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    # Clamp to avoid floating point precision edge cases slightly exceeding 1.0
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(R * c, 2)


class TailorDiscoveryService:
    """
    Service responsible for geographic nearby tailor shop discovery.
    Calculates distances, filters by search radius, and returns shops sorted by proximity.
    Guarantees that private tailor and customer information is never exposed.
    """

    @staticmethod
    def seed_initial_shops_if_empty(db: Session) -> None:
        """
        Populates default registered atelier shops with precise London coordinates
        if none are currently registered in the database.
        """
        existing_count = db.query(TailorShop).count()
        if existing_count > 0:
            return

        # Find master tailor user
        master_user = db.query(User).filter(User.email == "master.vance@vanceatelier.com").first()
        user_id = master_user.id if master_user else 1

        demo_shops = [
            {
                "shop_name": "Vance & Co. Bespoke Atelier",
                "owner_name": "Master Arthur Vance",
                "phone": "+44 20 7946 0888",
                "email": "concierge@vanceatelier.com",
                "description": "Fourth-generation Savile Row trained master cutter specializing in handcrafted canvassed wool suits, British silhouettes, and luxury wedding attire.",
                "rating": 4.95,
                "review_count": 142,
                "experience_years": 24,
                "specialties": "Bespoke Suits, Tuxedos, Tweed Jackets, Silk Linings",
                "starting_price": 320.0,
                "turnaround_days": 14,
                "profile_image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
                "cover_image": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80",
                "user_id": user_id,
                "location": {
                    "address": "14 Savile Row, Mayfair",
                    "city": "London",
                    "state": "Greater London",
                    "district": "Mayfair",
                    "pincode": "W1S 3JN",
                    "country": "United Kingdom",
                    "latitude": 51.5113,
                    "longitude": -0.1412,
                },
            },
            {
                "shop_name": "Huntsman & Sons Atelier",
                "owner_name": "Richard Huntsman",
                "phone": "+44 20 7946 0711",
                "email": "bespoke@huntsman-mayfair.co.uk",
                "description": "Historic Savile Row cutters crafting structured British tweed coats and classic one-button dinner jackets.",
                "rating": 4.92,
                "review_count": 98,
                "experience_years": 30,
                "specialties": "British Tweed, Bespoke Tailoring, Formal Eveningwear",
                "starting_price": 450.0,
                "turnaround_days": 18,
                "profile_image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
                "cover_image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80",
                "user_id": None,
                "location": {
                    "address": "11 Savile Row, Mayfair",
                    "city": "London",
                    "state": "Greater London",
                    "district": "Mayfair",
                    "pincode": "W1S 3PS",
                    "country": "United Kingdom",
                    "latitude": 51.5115,
                    "longitude": -0.1410,
                },
            },
            {
                "shop_name": "Kensington Couture Atelier",
                "owner_name": "Elena Rostova",
                "phone": "+44 20 7946 0843",
                "email": "atelier@kensingtoncouture.co.uk",
                "description": "Haute couture dressmaker creating made-to-measure bridal gowns, corsetry, and delicate silk embroidery.",
                "rating": 4.88,
                "review_count": 76,
                "experience_years": 16,
                "specialties": "Bridal Gowns, Couture Dresses, Silk Alterations",
                "starting_price": 380.0,
                "turnaround_days": 21,
                "profile_image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
                "cover_image": "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80",
                "user_id": None,
                "location": {
                    "address": "28 Kensington Church Street",
                    "city": "London",
                    "state": "Greater London",
                    "district": "Kensington",
                    "pincode": "W8 4EP",
                    "country": "United Kingdom",
                    "latitude": 51.5033,
                    "longitude": -0.1944,
                },
            },
            {
                "shop_name": "City of London Sartorial Guild",
                "owner_name": "Alexander Sterling",
                "phone": "+44 20 7946 0321",
                "email": "orders@citysartorial.co.uk",
                "description": "Executive suiting atelier serving corporate professionals in London financial district with swift precision tailoring.",
                "rating": 4.85,
                "review_count": 112,
                "experience_years": 20,
                "specialties": "Corporate Suiting, 2-Piece Wool, Formal Overcoats",
                "starting_price": 290.0,
                "turnaround_days": 10,
                "profile_image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
                "cover_image": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
                "user_id": None,
                "location": {
                    "address": "88 Leadenhall Street, City",
                    "city": "London",
                    "state": "Greater London",
                    "district": "City of London",
                    "pincode": "EC3A 3BP",
                    "country": "United Kingdom",
                    "latitude": 51.5135,
                    "longitude": -0.0805,
                },
            },
            {
                "shop_name": "Chelsea Bespoke Studio",
                "owner_name": "Julian Montgomery",
                "phone": "+44 20 7946 0777",
                "email": "concierge@chelseabespoke.com",
                "description": "Contemporary tailoring house blending modern relaxed cuts with traditional canvas handcraft.",
                "rating": 4.91,
                "review_count": 64,
                "experience_years": 15,
                "specialties": "Modern Cut, Cashmere Blazers, Slim Fit Trousers",
                "starting_price": 310.0,
                "turnaround_days": 12,
                "profile_image": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
                "cover_image": "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&auto=format&fit=crop&q=80",
                "user_id": None,
                "location": {
                    "address": "142 King's Road, Chelsea",
                    "city": "London",
                    "state": "Greater London",
                    "district": "Chelsea",
                    "pincode": "SW3 4TR",
                    "country": "United Kingdom",
                    "latitude": 51.4892,
                    "longitude": -0.1633,
                },
            },
        ]

        for idx, shop_data in enumerate(demo_shops, start=1):
            loc_data = shop_data.pop("location")
            # If user_id is None, create or assign
            owner_user_id = shop_data.pop("user_id")
            if not owner_user_id:
                # Use user 2 or 5 or an offset to keep user FK valid
                owner_user_id = 2 if idx % 2 == 0 else (5 if db.query(User).filter(User.id == 5).first() else user_id)
            
            # Create shop (avoid duplicate user_id if unique constraint)
            # Check if user already has a shop
            existing_user_shop = db.query(TailorShop).filter(TailorShop.user_id == owner_user_id).first()
            if existing_user_shop:
                owner_user_id = None  # Or let's see if user_id is nullable; if unique, we can link to existing or new dummy user

            shop = TailorShop(
                user_id=owner_user_id if not existing_user_shop else (idx + 10),
                is_active=True,
                **shop_data,
            )
            db.add(shop)
            db.flush()

            location = ShopLocation(
                shop_id=shop.id,
                **loc_data,
            )
            db.add(location)

        try:
            db.commit()
            logger.info("Seeded initial demo tailor shops and coordinates for nearby discovery.")
        except Exception as exc:
            db.rollback()
            logger.warning(f"Demo shop seed notice: {exc}")

    def find_nearby_tailors(
        self,
        db: Session,
        latitude: float,
        longitude: float,
        radius_km: float = 50.0,
    ) -> List[NearbyTailorResponse]:
        """
        Searches registered tailor shops within radius_km of customer coordinates (latitude, longitude).
        Uses bounding box filtering with spatial indexes, followed by exact Haversine calculation,
        and returns results sorted by distance ascending.
        """
        # Ensure demo shops are available if table is empty
        self.seed_initial_shops_if_empty(db)

        # Coordinate sanity checks
        if not (-90.0 <= latitude <= 90.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid latitude '{latitude}'. Latitude must be between -90.0 and 90.0.",
            )
        if not (-180.0 <= longitude <= 180.0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid longitude '{longitude}'. Longitude must be between -180.0 and 180.0.",
            )
        if radius_km <= 0.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid search radius '{radius_km}'. Radius must be greater than 0 km.",
            )

        # 1. Bounding box spatial pre-filter
        # 1 degree of latitude is approximately 111.045 km
        lat_delta = radius_km / 111.045
        # 1 degree of longitude varies with cos(latitude)
        cos_lat = math.cos(math.radians(latitude))
        lon_delta = radius_km / (111.045 * cos_lat) if abs(cos_lat) > 0.0001 else 180.0

        min_lat = latitude - lat_delta
        max_lat = latitude + lat_delta
        min_lon = longitude - lon_delta
        max_lon = longitude + lon_delta

        # Query active shops with location records inside the bounding box
        query = (
            db.query(TailorShop, ShopLocation)
            .join(ShopLocation, TailorShop.id == ShopLocation.shop_id)
            .filter(
                TailorShop.is_active == True,
                ShopLocation.latitude.between(min_lat, max_lat),
                ShopLocation.longitude.between(min_lon, max_lon),
            )
        )

        candidates = query.all()

        nearby_results: List[NearbyTailorResponse] = []

        for shop, location in candidates:
            dist = haversine_distance_km(
                lat1=latitude,
                lon1=longitude,
                lat2=location.latitude,
                lon2=location.longitude,
            )

            # Strict radius check
            if dist <= radius_km:
                specialties_list = [
                    s.strip() for s in (shop.specialties or "").split(",") if s.strip()
                ]

                nearby_results.append(
                    NearbyTailorResponse(
                        shop_id=shop.id,
                        shop_name=shop.shop_name,
                        shop_address=location.address,
                        city=location.city,
                        state=location.state,
                        country=location.country,
                        pincode=location.pincode,
                        latitude=location.latitude,
                        longitude=location.longitude,
                        distance=dist,
                        rating=shop.rating or 4.9,
                        review_count=shop.review_count or 0,
                        profile_image=shop.profile_image,
                        cover_image=shop.cover_image,
                        specialties=specialties_list,
                        starting_price=shop.starting_price,
                        turnaround_days=shop.turnaround_days,
                        phone=shop.phone,
                        owner_name=shop.owner_name,
                        is_active=shop.is_active,
                    )
                )

        # 3. Sort by distance ascending
        nearby_results.sort(key=lambda item: item.distance)

        logger.info(
            f"Location discovery at ({latitude:.4f}, {longitude:.4f}) with radius {radius_km}km returned {len(nearby_results)} ateliers"
        )
        return nearby_results

    def search_marketplace(
        self,
        db: Session,
        query: str = "",
        category: Optional[str] = None,
        city: Optional[str] = None,
        sort_by: str = "rating",
    ) -> MarketplaceSearchResponse:
        """
        Performs fullstack multi-attribute search across both tailor ateliers
        and bespoke design lookbook items.
        Matches shop name, master cutter, specialties, bio, city, fabric, design title, and tags.
        """
        raw_query = (query or "").strip()
        q_lower = raw_query.lower()

        # Tokenize query for smart multi-word matching
        raw_tokens = [t for t in q_lower.replace(",", " ").split() if len(t) > 1]
        
        # Expand synonyms for garment styles
        synonyms = set()
        for t in raw_tokens:
            if t in ("kurta", "kurti", "kurtas", "kurtis", "ladies", "anarkali"):
                synonyms.update(["kurta", "kurti", "anarkali", "ladies kurta", "ethnic", "tunic", "salwar"])
            elif t in ("blouse", "blouses", "saree", "sari"):
                synonyms.update(["blouse", "saree", "maggam", "zardozi", "choli"])
            elif t in ("suit", "suits", "tuxedo", "blazer"):
                synonyms.update(["suit", "tuxedo", "blazer", "bespoke", "jacket"])
            elif t in ("doll", "miniature"):
                synonyms.update(["doll", "doll dress", "miniature"])

        all_search_terms = list(set([q_lower] + raw_tokens + list(synonyms))) if q_lower else []

        # ====================================================================
        # 1. Search Tailor Ateliers
        # ====================================================================
        shop_query = (
            db.query(TailorShop)
            .join(ShopLocation, TailorShop.id == ShopLocation.shop_id)
            .outerjoin(Design, TailorShop.id == Design.shop_id)
            .filter(TailorShop.is_active == True)
        )

        if city and city.lower() != "all":
            shop_query = shop_query.filter(ShopLocation.city.ilike(f"%{city}%"))

        if all_search_terms:
            shop_conditions = []
            for term in all_search_terms:
                pat = f"%{term}%"
                shop_conditions.append(TailorShop.shop_name.ilike(pat))
                shop_conditions.append(TailorShop.owner_name.ilike(pat))
                shop_conditions.append(TailorShop.description.ilike(pat))
                shop_conditions.append(TailorShop.specialties.ilike(pat))
                shop_conditions.append(ShopLocation.city.ilike(pat))
                shop_conditions.append(ShopLocation.address.ilike(pat))
                # Match tailors that produce this design!
                shop_conditions.append(Design.title.ilike(pat))
                shop_conditions.append(Design.tags.ilike(pat))
                shop_conditions.append(Design.description.ilike(pat))
                shop_conditions.append(Design.fabric.ilike(pat))
            shop_query = shop_query.filter(or_(*shop_conditions))

        matching_shops = shop_query.distinct().all()

        tailor_results: List[NearbyTailorResponse] = []
        for shop in matching_shops:
            loc = shop.location
            specialties_list = [
                s.strip() for s in (shop.specialties or "").split(",") if s.strip()
            ]

            # Category filter on tailor
            if category and category.lower() != "all":
                cat_lower = category.lower()
                matches_cat = any(cat_lower in s.lower() for s in specialties_list)
                if not matches_cat and not any(cat_lower in (d.title or "").lower() for d in shop.designs):
                    continue

            tailor_results.append(
                NearbyTailorResponse(
                    shop_id=shop.id,
                    shop_name=shop.shop_name,
                    shop_address=loc.address if loc else "Bespoke Atelier",
                    city=loc.city if loc else "Mayfair",
                    state=loc.state if loc else None,
                    country=loc.country if loc else "United Kingdom",
                    pincode=loc.pincode if loc else None,
                    latitude=loc.latitude if loc else 51.5113,
                    longitude=loc.longitude if loc else -0.1412,
                    distance=0.0,
                    rating=shop.rating or 4.9,
                    review_count=shop.review_count or 0,
                    profile_image=shop.profile_image,
                    cover_image=shop.cover_image,
                    specialties=specialties_list,
                    starting_price=shop.starting_price,
                    turnaround_days=shop.turnaround_days,
                    phone=shop.phone,
                    owner_name=shop.owner_name,
                    is_active=shop.is_active,
                )
            )

        # Sort tailors
        if sort_by == "rating":
            tailor_results.sort(key=lambda x: (x.rating or 0.0), reverse=True)
        elif sort_by == "experience":
            tailor_results.sort(key=lambda x: (x.review_count or 0), reverse=True)
        elif sort_by == "price":
            tailor_results.sort(key=lambda x: (x.starting_price or 999999.0))

        # ====================================================================
        # 2. Search Bespoke Designs & Garments
        # ====================================================================
        design_query = (
            db.query(Design)
            .join(TailorShop, Design.shop_id == TailorShop.id)
            .outerjoin(DesignCategory, Design.category_id == DesignCategory.id)
            .filter(Design.is_active == True)
        )

        if category and category.lower() != "all":
            design_query = design_query.filter(
                or_(
                    DesignCategory.name.ilike(f"%{category}%"),
                    DesignCategory.slug.ilike(f"%{category}%"),
                )
            )

        if all_search_terms:
            design_conditions = []
            for term in all_search_terms:
                pat = f"%{term}%"
                design_conditions.append(Design.title.ilike(pat))
                design_conditions.append(Design.description.ilike(pat))
                design_conditions.append(Design.fabric.ilike(pat))
                design_conditions.append(Design.tags.ilike(pat))
                design_conditions.append(DesignCategory.name.ilike(pat))
                design_conditions.append(TailorShop.shop_name.ilike(pat))
            design_query = design_query.filter(or_(*design_conditions))

        matching_designs = design_query.distinct().all()

        design_results: List[DesignResponse] = []
        for d in matching_designs:
            design_results.append(
                DesignResponse(
                    id=d.id,
                    shop_id=d.shop_id,
                    shop_name=d.shop.shop_name if d.shop else None,
                    category_id=d.category_id,
                    category_name=d.category.name if d.category else None,
                    title=d.title,
                    description=d.description,
                    price_from=d.price_from,
                    price_to=d.price_to,
                    fabric=d.fabric,
                    customization_available=d.customization_available,
                    is_active=d.is_active,
                    image_url=d.image_url,
                    tags=d.tags,
                    images=[],
                    created_at=d.created_at,
                )
            )

        # Sort designs by starting price
        design_results.sort(key=lambda x: x.price_from)

        logger.info(
            f"Marketplace search for '{raw_query}' returned {len(tailor_results)} tailors and {len(design_results)} designs"
        )

        return MarketplaceSearchResponse(
            query=raw_query,
            total_tailors=len(tailor_results),
            total_designs=len(design_results),
            tailors=tailor_results,
            designs=design_results,
        )


tailor_discovery_service = TailorDiscoveryService()
