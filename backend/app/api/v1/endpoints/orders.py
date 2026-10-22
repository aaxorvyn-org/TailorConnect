import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.api.deps import get_current_user, get_optional_current_user, require_customer, require_tailor
from app.schemas.order import (
    OrderCreate,
    OrderStatusUpdate,
    OrderResponse,
    OrderReferenceImageResponse,
    OrderStatusHistoryResponse,
)
from app.schemas.delivery import (
    DeliveryCreateOrUpdate,
    DeliveryResponse,
)
from app.schemas.design import DesignResponse, DesignCreate
from app.services.order_service import order_service
from app.repositories.order_repository import order_repository

orders_router = APIRouter()
tailor_orders_router = APIRouter()
designs_router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


# ============================================================================
# CUSTOMER ORDER ENDPOINTS (/api/orders)
# ============================================================================

@orders_router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Place a new made-to-measure tailoring order",
)
def create_order(
    payload: OrderCreate,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    """
    Submit a custom tailoring commission with selected design, customer measurement profile,
    and shipping details. Price and total are strictly calculated by the backend.
    """
    return order_service.create_order(db=db, customer=current_user, payload=payload)


@orders_router.get(
    "",
    response_model=List[OrderResponse],
    summary="List customer's bespoke orders",
)
def get_customer_orders(
    status: Optional[str] = Query(None, description="Optional status filter"),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    """
    Retrieve all orders placed by the authenticated customer.
    """
    return order_service.get_customer_orders(db=db, customer_id=current_user.id, status_filter=status)


@orders_router.get(
    "/{id}",
    response_model=OrderResponse,
    summary="Get single order details for customer",
)
def get_customer_order_by_id(
    id: int,
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db),
):
    """
    Fetch comprehensive details for an order including items, measurements, reference images, and history.
    """
    return order_service.get_customer_order_by_id(db=db, customer_id=current_user.id, order_id=id)


ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MIME_TO_EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


@orders_router.post(
    "/{id}/reference-images",
    response_model=OrderReferenceImageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload inspiration/reference image for an order",
)
async def upload_order_reference_image(
    id: int,
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Attach styling inspiration or reference photograph to an order.
    Enforces authorization check before disk write, verifies MIME type,
    validates magic bytes, and enforces safe file extensions.
    """
    # 1. Verify order existence and user authorization prior to file processing
    order = order_repository.get_order_by_id(db, id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order ID {id} not found.",
        )

    if current_user.role in ["CUSTOMER", "customer"] and order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to upload images for this order.",
        )
    elif current_user.role in ["TAILOR", "tailor"]:
        from app.models.shop import TailorShop
        shop = db.query(TailorShop).filter(TailorShop.user_id == current_user.id).first()
        if not shop or order.tailor_shop_id != shop.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This order does not belong to your atelier workshop.",
            )

    final_url = None

    if file:
        content_type = (file.content_type or "").lower().strip()
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '{file.content_type}'. Supported: JPEG, PNG, WebP.",
            )

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum allowable limit of 5MB.",
            )

        # Magic byte signature check for image authenticity
        is_valid_image = False
        if content_type in ["image/jpeg", "image/jpg"] and content.startswith(b"\xff\xd8"):
            is_valid_image = True
        elif content_type == "image/png" and content.startswith(b"\x89PNG\r\n\x1a\n"):
            is_valid_image = True
        elif content_type == "image/webp" and content.startswith(b"RIFF") and b"WEBP" in content[:16]:
            is_valid_image = True

        if not is_valid_image:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not match the declared image format signature.",
            )

        # Secure extension extraction and normalization
        raw_ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else ""
        ext = raw_ext if raw_ext in ALLOWED_EXTENSIONS else MIME_TO_EXT.get(content_type, "jpg")
        unique_name = f"ref_{id}_{uuid.uuid4().hex[:10]}.{ext}"

        # Static upload folder
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "static", "order_references")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_name)

        with open(file_path, "wb") as f:
            f.write(content)

        final_url = f"/static/order_references/{unique_name}"
    elif image_url and image_url.strip():
        final_url = image_url.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must provide an image file upload or image_url.",
        )

    return order_service.add_reference_image(
        db=db,
        user=current_user,
        order_id=id,
        image_url=final_url,
    )


@orders_router.get(
    "/{id}/status-history",
    response_model=List[OrderStatusHistoryResponse],
    summary="Get order status change audit history",
)
def get_order_status_history(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve chronological audit log of production stage milestones.
    """
    return order_service.get_order_status_history(db=db, user=current_user, order_id=id)


@orders_router.put(
    "/{id}/status",
    response_model=OrderResponse,
    summary="Update order status (Controlled transition)",
)
def update_order_status(
    id: int,
    payload: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Advance or cancel order status based on role-based access control and state machine rules.
    """
    return order_service.update_order_status(
        db=db,
        user=current_user,
        order_id=id,
        payload=payload,
    )


@orders_router.get(
    "/{id}/delivery",
    response_model=DeliveryResponse,
    summary="Get order delivery & tracking information",
)
def get_order_delivery(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve manual courier tracking details, expected delivery date, and dispatch status.
    Available to the customer who commissioned the order, the tailor atelier, and admins.
    """
    return order_service.get_order_delivery(db=db, user=current_user, order_id=id)


@orders_router.put(
    "/{id}/delivery",
    response_model=DeliveryResponse,
    summary="Update order delivery & tracking information",
)
@orders_router.post(
    "/{id}/delivery",
    response_model=DeliveryResponse,
    summary="Add or update order delivery & tracking information",
)
def update_order_delivery(
    id: int,
    payload: DeliveryCreateOrUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Set or update manual courier name, tracking number, expected delivery date, and dispatch status.
    Allowed for the tailor atelier handling the order or platform administrators.
    """
    return order_service.create_or_update_order_delivery(
        db=db,
        user=current_user,
        order_id=id,
        payload=payload,
    )


# ============================================================================
# TAILOR ATELIER ORDER ENDPOINTS (/api/tailors/orders)
# ============================================================================

@tailor_orders_router.get(
    "",
    response_model=List[OrderResponse],
    summary="List orders for the tailor's atelier shop",
)
def get_tailor_orders(
    status: Optional[str] = Query(None, description="Optional status filter"),
    current_user: User = Depends(require_tailor),
    db: Session = Depends(get_db),
):
    """
    Retrieve all incoming and in-progress commissions for the authenticated tailor's shop.
    """
    return order_service.get_tailor_orders(db=db, tailor_user=current_user, status_filter=status)


@tailor_orders_router.get(
    "/{id}",
    response_model=OrderResponse,
    summary="Get single atelier order details",
)
def get_tailor_order_by_id(
    id: int,
    current_user: User = Depends(require_tailor),
    db: Session = Depends(get_db),
):
    """
    Retrieve full details of an order under the tailor's atelier shop with customer contact and specs.
    """
    return order_service.get_tailor_order_by_id(db=db, tailor_user=current_user, order_id=id)


@tailor_orders_router.get(
    "/{id}/delivery",
    response_model=DeliveryResponse,
    summary="Get delivery & tracking details for atelier order",
)
def get_tailor_order_delivery(
    id: int,
    current_user: User = Depends(require_tailor),
    db: Session = Depends(get_db),
):
    """
    Get delivery and tracking information for an order in the tailor's atelier.
    """
    return order_service.get_order_delivery(db=db, user=current_user, order_id=id)


@tailor_orders_router.put(
    "/{id}/delivery",
    response_model=DeliveryResponse,
    summary="Add or update courier tracking details for atelier order",
)
@tailor_orders_router.post(
    "/{id}/delivery",
    response_model=DeliveryResponse,
    summary="Add or update courier tracking details for atelier order",
)
def update_tailor_order_delivery(
    id: int,
    payload: DeliveryCreateOrUpdate,
    current_user: User = Depends(require_tailor),
    db: Session = Depends(get_db),
):
    """
    Update manual courier dispatch, tracking number, and delivery status for an atelier order.
    """
    return order_service.create_or_update_order_delivery(
        db=db,
        user=current_user,
        order_id=id,
        payload=payload,
    )


# ============================================================================
# DESIGNS ENDPOINTS (/api/designs)
# ============================================================================

@designs_router.get(
    "",
    response_model=List[DesignResponse],
    summary="List available atelier designs for commissions",
)
def list_designs(
    shop_id: Optional[int] = Query(None, description="Filter by tailor shop ID"),
    search: Optional[str] = Query(None, description="Search by title, fabric, tags, or description"),
    category: Optional[str] = Query(None, description="Filter by garment category"),
    db: Session = Depends(get_db),
):
    """
    List lookbook designs with category, search, and pricing specifications.
    """
    designs = order_repository.get_all_active_designs(
        db=db,
        shop_id=shop_id,
        search=search,
        category=category,
    )

    results = []
    for d in designs:
        results.append(
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
    return results
 
 
@designs_router.get(
    "/my",
    response_model=List[DesignResponse],
    summary="Get authenticated tailor atelier's own lookbook designs",
)
def get_my_designs(
    current_user: User = Depends(require_tailor),
    db: Session = Depends(get_db),
):
    """
    Returns only the designs created by and belonging to the currently authenticated tailor.
    Newly registered tailors start with an empty clean lookbook.
    """
    if not current_user.shop:
        return []
    designs = order_repository.get_all_active_designs(db=db, shop_id=current_user.shop.id)
    results = []
    for d in designs:
        results.append(
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
    return results


@designs_router.get(
     "/{id}",
     response_model=DesignResponse,
     summary="Get single design details",
 )
def get_design_by_id(
    id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieve details for a specific design item.
    """
    design = order_repository.get_design_by_id(db, id)
    if not design:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Design ID {id} not found.",
        )
    return DesignResponse(
        id=design.id,
        shop_id=design.shop_id,
        shop_name=design.shop.shop_name if design.shop else None,
        category_id=design.category_id,
        category_name=design.category.name if design.category else None,
        title=design.title,
        description=design.description,
        price_from=design.price_from,
        price_to=design.price_to,
        fabric=design.fabric,
        customization_available=design.customization_available,
        is_active=design.is_active,
        image_url=design.image_url,
        tags=design.tags,
        images=[],
        created_at=design.created_at,
    )


@designs_router.post(
    "",
    response_model=DesignResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publish a new bespoke design to the atelier lookbook",
)
def create_design(
    payload: DesignCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Publish a new bespoke design. If authenticated as a tailor, links to the tailor's shop.
    Otherwise assigns to the specified or default active atelier.
    """
    from app.models.design import Design, DesignCategory
    from app.models.shop import TailorShop

    # Determine shop_id
    shop = None
    if current_user and getattr(current_user, "shop", None):
        shop = current_user.shop
    elif payload.shop_id:
        shop = db.query(TailorShop).filter(TailorShop.id == payload.shop_id).first()

    if not shop:
        shop = db.query(TailorShop).filter(TailorShop.shop_name.ilike("%Royal Zari%")).first() or db.query(TailorShop).first()

    shop_id = shop.id if shop else 1

    # Resolve category
    category_id = payload.category_id
    if not category_id and payload.category:
        cat = db.query(DesignCategory).filter(
            (DesignCategory.name.ilike(payload.category)) |
            (DesignCategory.slug.ilike(payload.category.lower().replace(" ", "-")))
        ).first()
        if not cat:
            cat = DesignCategory(
                name=payload.category,
                slug=payload.category.lower().replace(" ", "-").replace("&", "and"),
                description=f"Bespoke {payload.category} collection",
            )
            db.add(cat)
            db.flush()
        category_id = cat.id

    design = Design(
        shop_id=shop_id,
        category_id=category_id,
        title=payload.title,
        description=payload.description or "Handcrafted bespoke garment tailored with precision fit and luxury finishing.",
        price_from=payload.price_from,
        price_to=payload.price_to or (payload.price_from * 1.3),
        fabric=payload.fabric or "Pure Silk",
        customization_available=payload.customization_available,
        is_active=True,
        image_url=payload.image_url or "/designs/ladies-kurta-formal-dress.jpg",
        tags=payload.tags or "Ladies Kurta, Formal Dress, Bespoke",
    )
    db.add(design)
    db.commit()
    db.refresh(design)

    return DesignResponse(
        id=design.id,
        shop_id=design.shop_id,
        shop_name=design.shop.shop_name if design.shop else None,
        category_id=design.category_id,
        category_name=design.category.name if design.category else None,
        title=design.title,
        description=design.description,
        price_from=design.price_from,
        price_to=design.price_to,
        fabric=design.fabric,
        customization_available=design.customization_available,
        is_active=design.is_active,
        image_url=design.image_url,
        tags=design.tags,
        images=[],
        created_at=design.created_at,
    )


@designs_router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete / archive an atelier lookbook design",
)
def delete_design(
    id: int,
    current_user: User = Depends(require_tailor),
    db: Session = Depends(get_db),
):
    from app.models.design import Design
    design = db.query(Design).filter(Design.id == id).first()
    if not design:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Design {id} not found."
        )
    # Check ownership
    if current_user.role != "ADMIN":
        if not current_user.shop or design.shop_id != current_user.shop.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete designs belonging to your own atelier."
            )
    db.delete(design)
    db.commit()
    return None
