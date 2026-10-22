from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.order import (
    Order,
    OrderItem,
    OrderReferenceImage,
    DeliveryAddress,
    OrderStatusHistory,
)
from app.models.design import Design, DesignCategory


class OrderRepository:
    """
    Data access layer for tailoring orders, items, status history, and delivery addresses.
    """

    @staticmethod
    def get_order_count(db: Session) -> int:
        return db.query(func.count(Order.id)).scalar() or 0

    @staticmethod
    def create_delivery_address(db: Session, address: DeliveryAddress) -> DeliveryAddress:
        db.add(address)
        db.commit()
        db.refresh(address)
        return address

    @staticmethod
    def create_order(
        db: Session,
        order: Order,
        items: List[OrderItem],
        initial_history: OrderStatusHistory,
        reference_images: Optional[List[OrderReferenceImage]] = None,
    ) -> Order:
        db.add(order)
        db.flush()

        for item in items:
            item.order_id = order.id
            db.add(item)

        initial_history.order_id = order.id
        db.add(initial_history)

        if reference_images:
            for img in reference_images:
                img.order_id = order.id
                db.add(img)

        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def get_order_by_id(db: Session, order_id: int) -> Optional[Order]:
        return db.query(Order).filter(Order.id == order_id).first()

    @staticmethod
    def get_order_by_number(db: Session, order_number: str) -> Optional[Order]:
        return db.query(Order).filter(Order.order_number == order_number).first()

    @staticmethod
    def get_customer_orders(
        db: Session,
        customer_id: int,
        status: Optional[str] = None,
    ) -> List[Order]:
        query = db.query(Order).filter(Order.customer_id == customer_id)
        if status:
            query = query.filter(Order.status == status.upper())
        return query.order_by(Order.created_at.desc()).all()

    @staticmethod
    def get_shop_orders(
        db: Session,
        tailor_shop_id: int,
        status: Optional[str] = None,
    ) -> List[Order]:
        query = db.query(Order).filter(Order.tailor_shop_id == tailor_shop_id)
        if status:
            query = query.filter(Order.status == status.upper())
        return query.order_by(Order.created_at.desc()).all()

    @staticmethod
    def update_order_status(
        db: Session,
        order: Order,
        new_status: str,
        changed_by_id: Optional[int],
        notes: Optional[str] = None,
    ) -> Order:
        order.status = new_status
        history_entry = OrderStatusHistory(
            order_id=order.id,
            status=new_status,
            changed_by=changed_by_id,
            notes=notes,
        )
        db.add(history_entry)
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def add_reference_image(db: Session, order_id: int, image_url: str) -> OrderReferenceImage:
        image = OrderReferenceImage(order_id=order_id, image_url=image_url)
        db.add(image)
        db.commit()
        db.refresh(image)
        return image

    @staticmethod
    def get_order_status_history(db: Session, order_id: int) -> List[OrderStatusHistory]:
        return (
            db.query(OrderStatusHistory)
            .filter(OrderStatusHistory.order_id == order_id)
            .order_by(OrderStatusHistory.created_at.asc())
            .all()
        )

    # Design queries
    @staticmethod
    def get_design_by_id(db: Session, design_id: int) -> Optional[Design]:
        return db.query(Design).filter(Design.id == design_id).first()

    @staticmethod
    def get_designs_by_shop(db: Session, shop_id: int) -> List[Design]:
        return (
            db.query(Design)
            .filter(Design.shop_id == shop_id, Design.is_active == True)
            .order_by(Design.id.desc())
            .all()
        )

    @staticmethod
    def get_all_active_designs(
        db: Session,
        shop_id: Optional[int] = None,
        search: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[Design]:
        from app.models.design import DesignCategory
        from app.models.shop import TailorShop
        from sqlalchemy import or_

        query = (
            db.query(Design)
            .outerjoin(DesignCategory, Design.category_id == DesignCategory.id)
            .outerjoin(TailorShop, Design.shop_id == TailorShop.id)
            .filter(Design.is_active == True)
        )
        if shop_id:
            query = query.filter(Design.shop_id == shop_id)
        if category and category.lower() != "all":
            query = query.filter(
                or_(
                    DesignCategory.name.ilike(f"%{category}%"),
                    DesignCategory.slug.ilike(f"%{category}%"),
                )
            )
        if search and search.strip():
            terms = [t for t in search.strip().lower().split() if len(t) > 1]
            conds = [
                Design.title.ilike(f"%{search.strip()}%"),
                Design.description.ilike(f"%{search.strip()}%"),
                Design.tags.ilike(f"%{search.strip()}%"),
                Design.fabric.ilike(f"%{search.strip()}%"),
                DesignCategory.name.ilike(f"%{search.strip()}%"),
                TailorShop.shop_name.ilike(f"%{search.strip()}%"),
            ]
            for t in terms:
                conds.append(Design.title.ilike(f"%{t}%"))
                conds.append(Design.tags.ilike(f"%{t}%"))
            query = query.filter(or_(*conds))

        return query.order_by(Design.id.desc()).all()


order_repository = OrderRepository()
