import math
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.shop import TailorShop
from app.models.order import Order, OrderStatus, OrderStatusHistory
from app.models.review import ShopReview
from app.schemas.admin import (
    AdminDashboardStats,
    AdminTailorItem,
    AdminCustomerItem,
    AdminShopItem,
    AdminOrderItem,
    AdminReviewItem,
    UserStatusUpdate,
    ShopStatusUpdate,
    AdminOrderStatusUpdate,
)
from app.utils.logger import logger


class AdminService:
    """
    Core administrative service handling platform oversight, metrics,
    and management for Tailors, Customers, Shops, Orders, and Reviews.
    Protected strictly by ADMIN role authorization.
    """

    def get_dashboard_stats(self, db: Session) -> AdminDashboardStats:
        """
        Calculates aggregate key performance indicators and dashboard metrics.
        """
        total_customers = db.query(User).filter(User.role == "CUSTOMER").count()
        total_tailors = db.query(User).filter(User.role == "TAILOR").count()
        total_shops = db.query(TailorShop).count()
        total_orders = db.query(Order).count()
        
        # Pending approvals (shops awaiting activation/verification)
        pending_shop_approvals = db.query(TailorShop).filter(TailorShop.is_active == False).count()
        
        # Completed commissions
        completed_orders = db.query(Order).filter(
            Order.status.in_([OrderStatus.DELIVERED.value, "Completed", "DELIVERED"])
        ).count()

        # Total revenue volume from completed or all active orders
        revenue_query = db.query(func.sum(Order.total_amount)).filter(
            Order.status.in_([OrderStatus.DELIVERED.value, "Completed", "DELIVERED", "SHIPPED", "READY"])
        ).scalar()
        total_revenue = round(float(revenue_query or 0.0), 2)

        # Recent 5 orders
        recent_orders_raw = db.query(Order).order_by(Order.id.desc()).limit(5).all()
        recent_orders = [
            {
                "id": o.id,
                "order_number": o.order_number,
                "customer_name": o.customer.full_name if o.customer else "Bespoke Patron",
                "shop_name": o.tailor_shop.shop_name if o.tailor_shop else "Atelier Studio",
                "status": o.status,
                "total_amount": o.total_amount,
                "currency": o.currency,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in recent_orders_raw
        ]

        # Recent 5 registered tailors
        recent_tailors_raw = db.query(User).filter(User.role == "TAILOR").order_by(User.id.desc()).limit(5).all()
        recent_tailors = [
            {
                "id": t.id,
                "full_name": t.full_name,
                "email": t.email,
                "city": t.city,
                "shop_name": t.shop.shop_name if t.shop else t.shop_name,
                "is_active": t.is_active,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in recent_tailors_raw
        ]

        return AdminDashboardStats(
            total_customers=total_customers,
            total_tailors=total_tailors,
            total_shops=total_shops,
            total_orders=total_orders,
            pending_shop_approvals=pending_shop_approvals,
            completed_orders=completed_orders,
            total_revenue=total_revenue,
            currency="USD",
            recent_orders=recent_orders,
            recent_tailors=recent_tailors,
        )

    def get_tailors(
        self,
        db: Session,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Dict[str, Any]:
        """
        List tailors with search, active status filter, and pagination.
        """
        query = db.query(User).filter(User.role == "TAILOR")

        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(s),
                    User.email.ilike(s),
                    User.phone.ilike(s),
                    User.city.ilike(s),
                    User.shop_name.ilike(s),
                )
            )

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        total = query.count()
        total_pages = max(1, math.ceil(total / page_size))
        page = max(1, min(page, total_pages)) if total > 0 else 1

        users = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

        items = []
        for u in users:
            shop = u.shop
            items.append(
                AdminTailorItem(
                    id=u.id,
                    full_name=u.full_name,
                    email=u.email,
                    phone=u.phone,
                    city=u.city or (shop.location.city if shop and shop.location else None),
                    country=u.country,
                    shop_id=shop.id if shop else None,
                    shop_name=shop.shop_name if shop else u.shop_name,
                    is_active=u.is_active,
                    is_verified=u.is_verified,
                    created_at=u.created_at,
                )
            )

        return {
            "items": [item.model_dump() for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    def update_tailor_status(
        self,
        db: Session,
        tailor_id: int,
        payload: UserStatusUpdate,
    ) -> AdminTailorItem:
        """
        Activate or deactivate a tailor user account.
        """
        tailor = db.query(User).filter(User.id == tailor_id, User.role == "TAILOR").first()
        if not tailor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tailor ID {tailor_id} not found.",
            )

        tailor.is_active = payload.is_active
        if payload.is_verified is not None:
            tailor.is_verified = payload.is_verified

        # If tailor is deactivated, also deactivate associated shop storefront
        if tailor.shop:
            tailor.shop.is_active = payload.is_active

        db.commit()
        db.refresh(tailor)

        shop = tailor.shop
        return AdminTailorItem(
            id=tailor.id,
            full_name=tailor.full_name,
            email=tailor.email,
            phone=tailor.phone,
            city=tailor.city or (shop.location.city if shop and shop.location else None),
            country=tailor.country,
            shop_id=shop.id if shop else None,
            shop_name=shop.shop_name if shop else tailor.shop_name,
            is_active=tailor.is_active,
            is_verified=tailor.is_verified,
            created_at=tailor.created_at,
        )

    def get_customers(
        self,
        db: Session,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        country: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Dict[str, Any]:
        """
        List customer accounts with order statistics and search.
        """
        query = db.query(User).filter(User.role == "CUSTOMER")

        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(s),
                    User.email.ilike(s),
                    User.phone.ilike(s),
                )
            )

        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        if country and country.strip() and country.upper() != "ALL":
            query = query.filter(User.country.ilike(f"%{country.strip()}%"))

        total = query.count()
        total_pages = max(1, math.ceil(total / page_size))
        page = max(1, min(page, total_pages)) if total > 0 else 1

        users = query.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

        items = []
        for u in users:
            # Query order count and total spent
            user_orders = db.query(Order).filter(Order.customer_id == u.id).all()
            orders_count = len(user_orders)
            total_spent = sum(o.total_amount for o in user_orders)

            items.append(
                AdminCustomerItem(
                    id=u.id,
                    full_name=u.full_name,
                    email=u.email,
                    phone=u.phone,
                    country=u.country,
                    orders_count=orders_count,
                    total_spent=round(total_spent, 2),
                    is_active=u.is_active,
                    created_at=u.created_at,
                )
            )

        return {
            "items": [item.model_dump() for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    def update_customer_status(
        self,
        db: Session,
        customer_id: int,
        payload: UserStatusUpdate,
    ) -> AdminCustomerItem:
        """
        Activate or deactivate a customer account.
        """
        customer = db.query(User).filter(User.id == customer_id, User.role == "CUSTOMER").first()
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer ID {customer_id} not found.",
            )

        customer.is_active = payload.is_active
        db.commit()
        db.refresh(customer)

        user_orders = db.query(Order).filter(Order.customer_id == customer.id).all()
        return AdminCustomerItem(
            id=customer.id,
            full_name=customer.full_name,
            email=customer.email,
            phone=customer.phone,
            country=customer.country,
            orders_count=len(user_orders),
            total_spent=round(sum(o.total_amount for o in user_orders), 2),
            is_active=customer.is_active,
            created_at=customer.created_at,
        )

    def get_shops(
        self,
        db: Session,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Dict[str, Any]:
        """
        List tailor atelier shops with approval state, ratings, and order statistics.
        """
        query = db.query(TailorShop)

        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    TailorShop.shop_name.ilike(s),
                    TailorShop.owner_name.ilike(s),
                    TailorShop.email.ilike(s),
                    TailorShop.phone.ilike(s),
                )
            )

        if is_active is not None:
            query = query.filter(TailorShop.is_active == is_active)

        total = query.count()
        total_pages = max(1, math.ceil(total / page_size))
        page = max(1, min(page, total_pages)) if total > 0 else 1

        shops = query.order_by(TailorShop.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

        items = []
        for s in shops:
            orders_cnt = db.query(Order).filter(Order.tailor_shop_id == s.id).count()
            items.append(
                AdminShopItem(
                    id=s.id,
                    shop_name=s.shop_name,
                    owner_name=s.owner_name,
                    owner_email=s.email,
                    phone=s.phone,
                    city=s.location.city if s.location else None,
                    rating=s.rating,
                    review_count=s.review_count,
                    starting_price=s.starting_price,
                    is_active=s.is_active,
                    orders_count=orders_cnt,
                    created_at=s.created_at,
                )
            )

        return {
            "items": [item.model_dump() for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    def update_shop_status(
        self,
        db: Session,
        shop_id: int,
        payload: ShopStatusUpdate,
    ) -> AdminShopItem:
        """
        Approve, publish, or suspend a tailor atelier shop storefront.
        """
        shop = db.query(TailorShop).filter(TailorShop.id == shop_id).first()
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tailor shop ID {shop_id} not found.",
            )

        shop.is_active = payload.is_active
        db.commit()
        db.refresh(shop)

        orders_cnt = db.query(Order).filter(Order.tailor_shop_id == shop.id).count()
        return AdminShopItem(
            id=shop.id,
            shop_name=shop.shop_name,
            owner_name=shop.owner_name,
            owner_email=shop.email,
            phone=shop.phone,
            city=shop.location.city if shop.location else None,
            rating=shop.rating,
            review_count=shop.review_count,
            starting_price=shop.starting_price,
            is_active=shop.is_active,
            orders_count=orders_cnt,
            created_at=shop.created_at,
        )

    def get_orders(
        self,
        db: Session,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        shop_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Dict[str, Any]:
        """
        List all platform orders with search, status filtering, and pagination.
        """
        query = db.query(Order)

        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.join(User, Order.customer_id == User.id).join(TailorShop, Order.tailor_shop_id == TailorShop.id)
            query = query.filter(
                or_(
                    Order.order_number.ilike(s),
                    User.full_name.ilike(s),
                    User.email.ilike(s),
                    TailorShop.shop_name.ilike(s),
                )
            )

        if status_filter and status_filter.strip() and status_filter.upper() != "ALL":
            query = query.filter(Order.status == status_filter.strip().upper())

        if shop_id:
            query = query.filter(Order.tailor_shop_id == shop_id)

        total = query.count()
        total_pages = max(1, math.ceil(total / page_size))
        page = max(1, min(page, total_pages)) if total > 0 else 1

        orders = query.order_by(Order.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

        items = []
        for o in orders:
            items.append(
                AdminOrderItem(
                    id=o.id,
                    order_number=o.order_number,
                    customer_id=o.customer_id,
                    customer_name=o.customer.full_name if o.customer else "Bespoke Patron",
                    customer_email=o.customer.email if o.customer else "",
                    tailor_shop_id=o.tailor_shop_id,
                    tailor_shop_name=o.tailor_shop.shop_name if o.tailor_shop else "Atelier Studio",
                    status=o.status,
                    payment_status=getattr(o, "payment_status", "UNPAID"),
                    total_amount=o.total_amount,
                    currency=o.currency,
                    item_count=len(o.items) if o.items else 1,
                    created_at=o.created_at,
                )
            )

        return {
            "items": [item.model_dump() for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    def update_order_status(
        self,
        db: Session,
        admin_user: User,
        order_id: int,
        payload: AdminOrderStatusUpdate,
    ) -> AdminOrderItem:
        """
        Administrative override of order status with audit log.
        """
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {order_id} not found.",
            )

        old_status = order.status
        order.status = payload.status.strip().upper()

        # Audit trail
        history = OrderStatusHistory(
            order_id=order.id,
            status=order.status,
            changed_by=admin_user.id,
            notes=payload.notes or f"Administrative status update from {old_status} to {order.status}.",
        )
        db.add(history)
        db.commit()
        db.refresh(order)

        return AdminOrderItem(
            id=order.id,
            order_number=order.order_number,
            customer_id=order.customer_id,
            customer_name=order.customer.full_name if order.customer else "Bespoke Patron",
            customer_email=order.customer.email if order.customer else "",
            tailor_shop_id=order.tailor_shop_id,
            tailor_shop_name=order.tailor_shop.shop_name if order.tailor_shop else "Atelier Studio",
            status=order.status,
            payment_status=getattr(order, "payment_status", "UNPAID"),
            total_amount=order.total_amount,
            currency=order.currency,
            item_count=len(order.items) if order.items else 1,
            created_at=order.created_at,
        )

    def get_reviews(
        self,
        db: Session,
        search: Optional[str] = None,
        rating: Optional[int] = None,
        shop_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> Dict[str, Any]:
        """
        List customer reviews with moderation controls and search.
        """
        query = db.query(ShopReview)

        if search and search.strip():
            s = f"%{search.strip()}%"
            query = query.join(User, ShopReview.customer_id == User.id).join(TailorShop, ShopReview.tailor_shop_id == TailorShop.id)
            query = query.filter(
                or_(
                    ShopReview.comment.ilike(s),
                    User.full_name.ilike(s),
                    TailorShop.shop_name.ilike(s),
                )
            )

        if rating is not None and rating > 0:
            query = query.filter(ShopReview.rating == rating)

        if shop_id:
            query = query.filter(ShopReview.tailor_shop_id == shop_id)

        total = query.count()
        total_pages = max(1, math.ceil(total / page_size))
        page = max(1, min(page, total_pages)) if total > 0 else 1

        reviews = query.order_by(ShopReview.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

        items = []
        for r in reviews:
            items.append(
                AdminReviewItem(
                    id=r.id,
                    customer_id=r.customer_id,
                    customer_name=r.customer.full_name if r.customer else "Patron",
                    tailor_shop_id=r.tailor_shop_id,
                    tailor_shop_name=r.tailor_shop.shop_name if r.tailor_shop else "Atelier",
                    order_id=r.order_id,
                    order_number=r.order.order_number if r.order else str(r.order_id),
                    rating=r.rating,
                    comment=r.comment,
                    created_at=r.created_at,
                )
            )

        return {
            "items": [item.model_dump() for item in items],
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    def delete_review(self, db: Session, review_id: int) -> Dict[str, str]:
        """
        Remove an inappropriate or fraudulent review and recalculate shop rating.
        """
        review = db.query(ShopReview).filter(ShopReview.id == review_id).first()
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Review ID {review_id} not found.",
            )

        shop = review.tailor_shop
        db.delete(review)
        db.commit()

        # Recalculate shop rating
        if shop:
            remaining = db.query(ShopReview).filter(ShopReview.tailor_shop_id == shop.id).all()
            if remaining:
                shop.rating = round(sum(r.rating for r in remaining) / len(remaining), 2)
                shop.review_count = len(remaining)
            else:
                shop.rating = 5.0
                shop.review_count = 0
            db.commit()

        return {"status": "ok", "message": f"Review ID {review_id} has been moderated and removed."}


admin_service = AdminService()
