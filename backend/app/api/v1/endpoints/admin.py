from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.user import User
from app.schemas.admin import (
    AdminDashboardStats,
    AdminTailorItem,
    AdminCustomerItem,
    AdminShopItem,
    AdminOrderItem,
    UserStatusUpdate,
    ShopStatusUpdate,
    AdminOrderStatusUpdate,
)
from app.services.admin_service import admin_service

router = APIRouter(dependencies=[Depends(require_admin)])


# ============================================================================
# 1. ADMIN DASHBOARD METRICS
# ============================================================================

@router.get(
    "/dashboard/stats",
    response_model=AdminDashboardStats,
    summary="Get platform aggregate metrics for admin dashboard",
)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> AdminDashboardStats:
    """
    Returns total customers, total tailors, total shops, total orders,
    pending shop approvals, and completed order volume.
    Strictly protected for ADMIN role.
    """
    return admin_service.get_dashboard_stats(db=db)


# ============================================================================
# 2. TAILOR MANAGEMENT
# ============================================================================

@router.get(
    "/tailors",
    summary="List tailor accounts with search and pagination",
)
def list_tailors(
    search: Optional[str] = Query(None, description="Search by name, email, phone, city"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> Dict[str, Any]:
    return admin_service.get_tailors(
        db=db,
        search=search,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/tailors/{id}/status",
    response_model=AdminTailorItem,
    summary="Update tailor account status (activate/deactivate/verify)",
)
def update_tailor_status(
    id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> AdminTailorItem:
    return admin_service.update_tailor_status(db=db, tailor_id=id, payload=payload)


# ============================================================================
# 3. CUSTOMER MANAGEMENT
# ============================================================================

@router.get(
    "/customers",
    summary="List customer accounts with search, filters, and pagination",
)
def list_customers(
    search: Optional[str] = Query(None, description="Search by name, email, phone"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    country: Optional[str] = Query(None, description="Filter by country"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> Dict[str, Any]:
    return admin_service.get_customers(
        db=db,
        search=search,
        is_active=is_active,
        country=country,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/customers/{id}/status",
    response_model=AdminCustomerItem,
    summary="Update customer account active state",
)
def update_customer_status(
    id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> AdminCustomerItem:
    return admin_service.update_customer_status(db=db, customer_id=id, payload=payload)


# ============================================================================
# 4. SHOP MANAGEMENT
# ============================================================================

@router.get(
    "/shops",
    summary="List tailor atelier shops with approval state and search",
)
def list_shops(
    search: Optional[str] = Query(None, description="Search by shop name, owner, city"),
    is_active: Optional[bool] = Query(None, description="Filter by active/approved status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> Dict[str, Any]:
    return admin_service.get_shops(
        db=db,
        search=search,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/shops/{id}/status",
    response_model=AdminShopItem,
    summary="Approve or suspend tailor shop storefront",
)
def update_shop_status(
    id: int,
    payload: ShopStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> AdminShopItem:
    return admin_service.update_shop_status(db=db, shop_id=id, payload=payload)


# ============================================================================
# 5. ORDER MANAGEMENT
# ============================================================================

@router.get(
    "/orders",
    summary="List all platform orders with search, status filters, and pagination",
)
def list_orders(
    search: Optional[str] = Query(None, description="Search by order #, customer, atelier"),
    status: Optional[str] = Query(None, description="Filter by order status"),
    shop_id: Optional[int] = Query(None, description="Filter by atelier shop ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> Dict[str, Any]:
    return admin_service.get_orders(
        db=db,
        search=search,
        status_filter=status,
        shop_id=shop_id,
        page=page,
        page_size=page_size,
    )


@router.put(
    "/orders/{id}/status",
    response_model=AdminOrderItem,
    summary="Administrative override of order status with audit trail",
)
def update_order_status(
    id: int,
    payload: AdminOrderStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> AdminOrderItem:
    return admin_service.update_order_status(
        db=db,
        admin_user=admin_user,
        order_id=id,
        payload=payload,
    )


# ============================================================================
# 6. REVIEW MANAGEMENT
# ============================================================================

@router.get(
    "/reviews",
    summary="List all reviews across shops with moderation filtering",
)
def list_reviews(
    search: Optional[str] = Query(None, description="Search comment, customer, shop"),
    rating: Optional[int] = Query(None, ge=1, le=5, description="Filter by star rating"),
    shop_id: Optional[int] = Query(None, description="Filter by shop ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> Dict[str, Any]:
    return admin_service.get_reviews(
        db=db,
        search=search,
        rating=rating,
        shop_id=shop_id,
        page=page,
        page_size=page_size,
    )


@router.delete(
    "/reviews/{id}",
    summary="Moderate and permanently delete an inappropriate review",
)
def delete_review(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> Dict[str, str]:
    return admin_service.delete_review(db=db, review_id=id)
