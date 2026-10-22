from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserRole

from app.models.shop import TailorShop
from app.models.measurement import CustomerMeasurement
from app.models.design import Design, DesignCategory, DesignImage
from app.models.order import (
    Order,
    OrderItem,
    OrderReferenceImage,
    DeliveryAddress,
    OrderStatusHistory,
    OrderStatus,
    ALLOWED_TRANSITIONS,
)
from app.models.delivery import (
    OrderDelivery,
    DeliveryStatus,
    DeliveryMethod,
)
from app.schemas.order import (
    OrderCreate,
    OrderStatusUpdate,
    OrderResponse,
    OrderItemResponse,
    DeliveryAddressResponse,
    OrderReferenceImageResponse,
    OrderStatusHistoryResponse,
)
from app.schemas.delivery import (
    DeliveryCreateOrUpdate,
    DeliveryResponse,
)
from app.repositories.order_repository import order_repository
from app.utils.international import validate_international_address, get_currency_config
from app.utils.logger import logger


class OrderService:
    """
    Business logic for tailoring order creation, pricing calculation, status progression, and access control.
    """

    STANDARD_DELIVERY_FEE = 15.00  # Insured white-glove courier delivery

    def generate_order_number(self, db: Session) -> str:
        """
        Generate human-readable, unique public order number (e.g. TAILOR-2026-000001).
        """
        year = datetime.now().year
        count = order_repository.get_order_count(db) + 1
        candidate = f"TAILOR-{year}-{count:06d}"

        attempts = 0
        while order_repository.get_order_by_number(db, candidate) and attempts < 100:
            count += 1
            candidate = f"TAILOR-{year}-{count:06d}"
            attempts += 1

        return candidate

    def create_order(self, db: Session, customer: User, payload: OrderCreate) -> OrderResponse:
        """
        Place a new made-to-measure tailoring commission.
        Calculates all prices strictly on the backend and enforces customer measurement ownership.
        """
        if customer.role not in [UserRole.CUSTOMER, "CUSTOMER", UserRole.ADMIN, "ADMIN"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only registered customer accounts can place tailoring orders.",
            )

        # 1. Validate tailor shop exists
        shop = db.query(TailorShop).filter(TailorShop.id == payload.tailor_shop_id).first()
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tailor shop ID {payload.tailor_shop_id} does not exist.",
            )

        # 2. Validate & Persist International Delivery Address
        addr_in = payload.delivery_address
        validated_addr = validate_international_address(
            full_name=addr_in.full_name,
            phone=addr_in.phone,
            address_line_1=addr_in.address_line_1,
            city=addr_in.city,
            state=addr_in.state,
            country=addr_in.country,
            pincode=addr_in.pincode,
            country_code=addr_in.country_code,
        )

        delivery_addr = DeliveryAddress(
            customer_id=customer.id,
            full_name=validated_addr["full_name"],
            phone=validated_addr["phone"],
            address_line_1=validated_addr["address_line_1"],
            address_line_2=addr_in.address_line_2.strip() if addr_in.address_line_2 else None,
            city=validated_addr["city"],
            state=validated_addr["state"],
            country=validated_addr["country"],
            country_code=validated_addr["country_code"],
            pincode=validated_addr["pincode"],
            postal_code=validated_addr["postal_code"],
            latitude=addr_in.latitude,
            longitude=addr_in.longitude,
        )
        saved_address = order_repository.create_delivery_address(db, delivery_addr)

        # 3. Currency configuration & price calculation
        target_currency = (payload.currency or "INR").strip().upper()
        currency_cfg = get_currency_config(target_currency)
        currency_code = currency_cfg["code"]

        # Check local delivery (e.g. Hyderabad to Hyderabad)
        customer_city = (saved_address.city or "").strip().lower()
        shop_location = getattr(shop, "location", None)
        shop_city = (
            shop_location.city if shop_location and shop_location.city 
            else (shop.user.city if shop.user and shop.user.city else "Hyderabad")
        ).strip().lower()
        is_local_city = (
            (customer_city == shop_city) or
            ("hyderabad" in customer_city or "secunderabad" in customer_city) or
            (customer_city in ["hyderabad", "secunderabad"] and shop_city in ["hyderabad", "secunderabad"])
        )

        if currency_code == "INR" or (saved_address.country and saved_address.country.lower() == "india"):
            if is_local_city:
                delivery_charge = 60.0  # Local City Doorstep Courier (Hyderabad to Hyderabad)
            else:
                delivery_charge = 100.0  # Domestic Garment Courier across India
        else:
            delivery_charge = float(currency_cfg.get("standard_delivery_fee", 15.0))

        subtotal = 0.0
        order_items: List[OrderItem] = []

        for item_in in payload.items:
            # Validate design exists
            design = order_repository.get_design_by_id(db, item_in.design_id)
            if not design:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Design ID {item_in.design_id} not found in atelier lookbook.",
                )

            # Validate measurement profile belongs to the customer
            measurement = (
                db.query(CustomerMeasurement)
                .filter(
                    CustomerMeasurement.id == item_in.measurement_id,
                    CustomerMeasurement.customer_id == customer.id,
                )
                .first()
            )
            if not measurement:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Measurement profile ID {item_in.measurement_id} was not found or "
                        "does not belong to your authenticated customer account."
                    ),
                )

            # Unit price derived from design catalog
            # For INR, catalog price is already in Indian Rupees directly!
            base_price = float(design.price_from)
            if currency_code == "INR":
                unit_price = round(base_price, 2)
            else:
                if base_price > 100:
                    unit_price = round(base_price / 83.5, 2)
                else:
                    unit_price = round(base_price, 2)

            item_subtotal = round(unit_price * item_in.quantity, 2)
            subtotal += item_subtotal

            order_items.append(
                OrderItem(
                    design_id=design.id,
                    item_title=design.title,
                    quantity=item_in.quantity,
                    unit_price=unit_price,
                    customization_notes=item_in.customization_notes.strip() if item_in.customization_notes else None,
                    measurement_id=measurement.id,
                )
            )

        # GST 5% for tailoring commissions in India (HSN 9988)
        gst_amount = 0.0
        if currency_code == "INR" or (saved_address.country and saved_address.country.lower() == "india"):
            gst_amount = round(subtotal * 0.05, 2)

        total_amount = round(subtotal + delivery_charge + gst_amount, 2)
        order_num = self.generate_order_number(db)

        # 4. Create Order entity
        order = Order(
            order_number=order_num,
            customer_id=customer.id,
            tailor_shop_id=shop.id,
            delivery_address_id=saved_address.id,
            status=OrderStatus.PENDING.value,
            subtotal=subtotal,
            delivery_charge=delivery_charge,
            total_amount=total_amount,
            currency=currency_code,
            customer_notes=payload.customer_notes.strip() if payload.customer_notes else None,
        )


        # Initial status history entry
        initial_history = OrderStatusHistory(
            status=OrderStatus.PENDING.value,
            changed_by=customer.id,
            notes="Order placed by customer via marketplace portal.",
        )

        # Reference images if supplied
        ref_images = []
        if payload.reference_image_urls:
            for url in payload.reference_image_urls:
                if url.strip():
                    ref_images.append(OrderReferenceImage(image_url=url.strip()))

        created_order = order_repository.create_order(
            db=db,
            order=order,
            items=order_items,
            initial_history=initial_history,
            reference_images=ref_images,
        )

        logger.info(
            f"Customer {customer.id} placed order {created_order.order_number} "
            f"at shop {shop.id} for total ${total_amount}"
        )
        return self._format_order_response(created_order)

    def get_customer_orders(
        self,
        db: Session,
        customer_id: int,
        status_filter: Optional[str] = None,
    ) -> List[OrderResponse]:
        """
        Fetch all orders belonging to the authenticated customer.
        """
        orders = order_repository.get_customer_orders(db, customer_id, status_filter)
        return [self._format_order_response(o) for o in orders]

    def get_customer_order_by_id(
        self,
        db: Session,
        customer_id: int,
        order_id: int,
    ) -> OrderResponse:
        """
        Fetch single order with isolation check.
        """
        order = order_repository.get_order_by_id(db, order_id)
        if not order or order.customer_id != customer_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {order_id} not found.",
            )
        return self._format_order_response(order)

    def get_tailor_orders(
        self,
        db: Session,
        tailor_user: User,
        status_filter: Optional[str] = None,
    ) -> List[OrderResponse]:
        """
        Fetch all orders for the tailor's atelier shop.
        """
        shop = db.query(TailorShop).filter(TailorShop.user_id == tailor_user.id).first()
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No tailor shop profile found for your account.",
            )
        orders = order_repository.get_shop_orders(db, shop.id, status_filter)
        return [self._format_order_response(o) for o in orders]

    def get_tailor_order_by_id(
        self,
        db: Session,
        tailor_user: User,
        order_id: int,
    ) -> OrderResponse:
        """
        Fetch single order for tailor with atelier ownership verification.
        """
        shop = db.query(TailorShop).filter(TailorShop.user_id == tailor_user.id).first()
        if not shop:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No tailor shop profile found for your account.",
            )
        order = order_repository.get_order_by_id(db, order_id)
        if not order or order.tailor_shop_id != shop.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {order_id} not found in your atelier.",
            )
        return self._format_order_response(order)

    def update_order_status(
        self,
        db: Session,
        user: User,
        order_id: int,
        payload: OrderStatusUpdate,
    ) -> OrderResponse:
        """
        Update order status with controlled transition rules and role-based permissions.
        """
        order = order_repository.get_order_by_id(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {order_id} not found.",
            )

        new_status_enum = OrderStatus(payload.status)
        current_status_enum = OrderStatus(order.status)

        # Check role authorization
        if user.role in [UserRole.CUSTOMER, "CUSTOMER"]:
            if order.customer_id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Order ID {order_id} not found.",
                )
            # Customers may ONLY cancel an order, and ONLY if still in PENDING or ACCEPTED
            if new_status_enum != OrderStatus.CANCELLED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Customers can only cancel orders, not advance workshop production stages.",
                )
            if current_status_enum not in [OrderStatus.PENDING, OrderStatus.ACCEPTED]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Order cannot be cancelled in '{order.status}' stage as cutting or tailoring is underway.",
                )

        elif user.role in [UserRole.TAILOR, "TAILOR"]:
            shop = db.query(TailorShop).filter(TailorShop.user_id == user.id).first()
            if not shop or order.tailor_shop_id != shop.id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Order ID {order_id} not found in your atelier.",
                )
            # Verify status transition follows the allowed state machine
            allowed = ALLOWED_TRANSITIONS.get(current_status_enum, set())
            if new_status_enum not in allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Invalid status transition from '{current_status_enum.value}' to '{new_status_enum.value}'. "
                        f"Allowed next stages: {[s.value for s in allowed] or 'None (Terminal state)'}"
                    ),
                )
        elif user.role not in [UserRole.ADMIN, "ADMIN"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized to update order status.",
            )

        updated_order = order_repository.update_order_status(
            db=db,
            order=order,
            new_status=new_status_enum.value,
            changed_by_id=user.id,
            notes=payload.notes,
        )
        logger.info(
            f"User {user.id} ({user.role}) updated order {order.order_number} "
            f"status to '{new_status_enum.value}'"
        )
        return self._format_order_response(updated_order)

    def add_reference_image(
        self,
        db: Session,
        user: User,
        order_id: int,
        image_url: str,
    ) -> OrderReferenceImageResponse:
        """
        Attach reference image with access authorization check.
        """
        order = order_repository.get_order_by_id(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {order_id} not found.",
            )

        # Validate access
        if user.role in [UserRole.CUSTOMER, "CUSTOMER"] and order.customer_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        if user.role in [UserRole.TAILOR, "TAILOR"]:
            shop = db.query(TailorShop).filter(TailorShop.user_id == user.id).first()
            if not shop or order.tailor_shop_id != shop.id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        saved_img = order_repository.add_reference_image(db, order_id, image_url)
        return OrderReferenceImageResponse.model_validate(saved_img)

    def get_order_status_history(
        self,
        db: Session,
        user: User,
        order_id: int,
    ) -> List[OrderStatusHistoryResponse]:
        """
        Get audit trail for order status changes.
        """
        order = order_repository.get_order_by_id(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {order_id} not found.",
            )

        # Check access
        if user.role in [UserRole.CUSTOMER, "CUSTOMER"] and order.customer_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        if user.role in [UserRole.TAILOR, "TAILOR"]:
            shop = db.query(TailorShop).filter(TailorShop.user_id == user.id).first()
            if not shop or order.tailor_shop_id != shop.id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

        history = order_repository.get_order_status_history(db, order_id)
        return [
            OrderStatusHistoryResponse(
                id=h.id,
                order_id=h.order_id,
                status=h.status,
                changed_by=h.changed_by,
                changed_by_name=h.user.full_name if h.user else None,
                notes=h.notes,
                created_at=h.created_at,
            )
            for h in history
        ]

    def seed_default_designs(self, db: Session):
        """
        Seed initial signature designs for the demo tailor shops if none exist.
        """
        existing_count = db.query(Design).count()
        if existing_count > 0:
            return

        # Find or create demo shop (Vance & Co)
        shop = db.query(TailorShop).first()
        if not shop:
            return

        # Seed categories
        categories_data = [
            ("Men Suits", "men-suits", "Bespoke two-piece and three-piece sartorial suits"),
            ("Formal Wear", "formal-wear", "Black-tie evening tuxedos and gala jackets"),
            ("Women Couture", "women-couture", "Made-to-measure evening dresses and bridal couture"),
            ("Traditional", "traditional", "Heritage sherwanis, bandhgalas and lehengas"),
            ("Ladies Kurtas & Ethnic", "ladies-kurtas", "Bespoke Chikankari kurtas, designer kurtis, and silk Anarkali sets"),
        ]
        created_categories = {}
        for name, slug, desc in categories_data:
            cat = db.query(DesignCategory).filter(DesignCategory.slug == slug).first()
            if not cat:
                cat = DesignCategory(name=name, slug=slug, description=desc)
                db.add(cat)
                db.flush()
            created_categories[slug] = cat

        demo_designs = [
            {
                "title": "Handcrafted Lucknowi Chikankari Ladies Kurta & Trouser Set",
                "category_slug": "ladies-kurtas",
                "price_from": 165.0,
                "price_to": 240.0,
                "fabric": "Pure Chanderi Silk & Mulmul Cotton",
                "description": "Bespoke tailored ladies kurta set with intricate hand-embroidered Lucknowi Chikankari needlework, delicate floral motifs, pearl accents, and custom matching trousers.",
                "image_url": "/designs/ladies-chikankari-kurta.jpg",
                "tags": "Ladies Kurta, Chikankari, Chanderi Silk, Kurti, Hand Embroidery, Ethnic Wear, Trouser Set",
            },
            {
                "title": "Royal Emerald Silk Anarkali Ladies Kurta with Zari Yoke",
                "category_slug": "ladies-kurtas",
                "price_from": 220.0,
                "price_to": 350.0,
                "fabric": "Pure Raw Silk & Banarasi Brocade",
                "description": "Regal floor-length flared Anarkali ladies kurta featuring antique golden zari embroidery across the mandarin collar yoke, structured cuffs, and flared kalis.",
                "image_url": "/designs/ladies-anarkali-kurta.jpg",
                "tags": "Ladies Kurta, Anarkali Kurta, Silk Kurta, Zari Embroidery, Festive Kurti, Traditional",
            },
            {
                "title": "Artisan Heirloom Miniature Couture Doll Dress",
                "category_slug": "women-couture",
                "price_from": 195.0,
                "price_to": 320.0,
                "fabric": "Blush Silk Satin & French Chantilly Lace",
                "description": "Bespoke heirloom miniature gown meticulously tailored for collector dolls and display mannequins with pearl needlework.",
                "image_url": "/designs/miniature-doll-dress.jpg",
                "tags": "Miniature Couture, French Lace, Hand Pearls, Silk Organza",
            },
            {
                "title": "Made-to-Measure Anatomical Fitting & Dressmaking",
                "category_slug": "women-couture",
                "price_from": 120.0,
                "price_to": 250.0,
                "fabric": "Pure Natural Linen & Italian Silk Crepe",
                "description": "Personalized couture measurement and bespoke silhouette fitting consultation with complete 32-point body measurements.",
                "image_url": "/designs/woman-taking-measurements.jpg",
                "tags": "32-Point Measuring, Doorstep Fitting, Couture Silhouette",
            },
            {
                "title": "Savile Row Master Shear Hand-Cut Bespoke Jacket",
                "category_slug": "men-suits",
                "price_from": 750.0,
                "price_to": 1150.0,
                "fabric": "Dormeuil Royal Navy Wool & Horsehair Canvas",
                "description": "Traditional bespoke cutter craftsmanship where panels are individually hand-sheared with precision brass shears.",
                "image_url": "/designs/tailor-cutting-cloth.jpg",
                "tags": "Hand Sheared, Tailor Chalk Lines, Savile Row Cut",
            },
            {
                "title": "Midnight Navy Bespoke Three-Piece Suit",
                "category_slug": "men-suits",
                "price_from": 850.0,
                "price_to": 1200.0,
                "fabric": "Scabal Super 150s Wool",
                "description": "Custom handcrafted three-piece suit featuring British roped shoulders and silk jacquard lining.",
                "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80",
                "tags": "Super 150s, Full Canvas, Peak Lapel",
            },
            {
                "title": "Emerald Silk Velvet Evening Gala Tuxedo",
                "category_slug": "formal-wear",
                "price_from": 920.0,
                "price_to": 1350.0,
                "fabric": "Italian Silk Velvet",
                "description": "Decadent evening tuxedo jacket tailored in rich jewel-toned Italian silk velvet with black silk grosgrain finishes.",
                "image_url": "/designs/emerald-silk-tuxedo.jpg",
                "tags": "Silk Velvet, Satin Shawl Collar, Savile Row",
            },
            {
                "title": "Camel Cashmere Tailored Trench Overcoat",
                "category_slug": "formal-wear",
                "price_from": 680.0,
                "price_to": 950.0,
                "fabric": "Loro Piana Double Cashmere",
                "description": "Minimalist double-breasted overcoat cut with structured shoulders and handcrafted pick-stitch edges.",
                "image_url": "/designs/cashmere-tailored-trench.jpg",
                "tags": "Double-Faced Cashmere, Horn Buckle, Pick Stitching",
            },
            {
                "title": "Ivory Chantilly Lace Bridal Mermaid Gown",
                "category_slug": "women-couture",
                "price_from": 1450.0,
                "price_to": 2200.0,
                "fabric": "French Chantilly Lace & Silk Organza",
                "description": "Made-to-measure bridal gown with hand-applied crystal beadwork and illusion back.",
                "image_url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
                "tags": "French Chantilly Lace, Mermaid Train",
            },
            {
                "title": "Royal Heritage Raw Silk Wedding Sherwani",
                "category_slug": "traditional",
                "price_from": 780.0,
                "price_to": 1100.0,
                "fabric": "Pure Matka Silk",
                "description": "Artisanal handcrafted sherwani featuring antique gold bullion thread embroidery.",
                "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80",
                "tags": "Hand Zardozi, Matka Silk",
            },
        ]

        for d_info in demo_designs:
            cat = created_categories.get(d_info["category_slug"])
            design = Design(
                shop_id=shop.id,
                category_id=cat.id if cat else None,
                title=d_info["title"],
                price_from=d_info["price_from"],
                price_to=d_info["price_to"],
                fabric=d_info["fabric"],
                description=d_info["description"],
                image_url=d_info["image_url"],
                tags=d_info["tags"],
                customization_available=True,
                is_active=True,
            )
            db.add(design)

        db.commit()
        logger.info(f"Seeded {len(demo_designs)} default atelier designs for shop {shop.id}")

    def _format_order_response(self, order: Order) -> OrderResponse:
        """
        Serialize Order model into complete Pydantic response with joined entities.
        """
        items_resp = []
        for item in order.items:
            items_resp.append(
                OrderItemResponse(
                    id=item.id,
                    order_id=item.order_id,
                    design_id=item.design_id,
                    item_title=item.item_title,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    customization_notes=item.customization_notes,
                    measurement_id=item.measurement_id,
                    measurement_name=item.measurement.measurement_name if item.measurement else None,
                    design_thumbnail=item.design.image_url if item.design else None,
                )
            )

        ref_images_resp = [
            OrderReferenceImageResponse(
                id=img.id,
                order_id=img.order_id,
                image_url=img.image_url,
                created_at=img.created_at,
            )
            for img in order.reference_images
        ]

        history_resp = [
            OrderStatusHistoryResponse(
                id=h.id,
                order_id=h.order_id,
                status=h.status,
                changed_by=h.changed_by,
                changed_by_name=h.user.full_name if h.user else None,
                notes=h.notes,
                created_at=h.created_at,
            )
            for h in order.status_history
        ]

        delivery_resp = (
            DeliveryAddressResponse.model_validate(order.delivery_address)
            if order.delivery_address
            else None
        )

        delivery_tracking_resp = (
            DeliveryResponse.model_validate(order.delivery)
            if getattr(order, "delivery", None)
            else None
        )

        return OrderResponse(
            id=order.id,
            order_number=order.order_number,
            customer_id=order.customer_id,
            customer_name=order.customer.full_name if order.customer else None,
            customer_email=order.customer.email if order.customer else None,
            customer_phone=order.customer.phone if order.customer else None,
            tailor_shop_id=order.tailor_shop_id,
            tailor_shop_name=order.tailor_shop.shop_name if order.tailor_shop else None,
            status=order.status,
            payment_status=getattr(order, "payment_status", "UNPAID") or "UNPAID",
            subtotal=order.subtotal,
            delivery_charge=order.delivery_charge,
            total_amount=order.total_amount,
            currency=order.currency,
            customer_notes=order.customer_notes,
            delivery_address=delivery_resp,
            delivery=delivery_tracking_resp,
            items=items_resp,
            reference_images=ref_images_resp,
            status_history=history_resp,
            created_at=order.created_at,
            updated_at=order.updated_at,
        )

    def get_order_delivery(
        self,
        db: Session,
        user: User,
        order_id: int,
    ) -> DeliveryResponse:
        """
        Fetch delivery & tracking information for an order.
        Customers can view their own orders; tailors can view orders for their atelier; admins can view all.
        """
        order = order_repository.get_order_by_id(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {order_id} not found.",
            )

        # Authorization check
        if user.role in [UserRole.CUSTOMER, "CUSTOMER"] and order.customer_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view delivery information for this order.",
            )
        elif user.role in [UserRole.TAILOR, "TAILOR"]:
            shop = db.query(TailorShop).filter(TailorShop.user_id == user.id).first()
            if not shop or order.tailor_shop_id != shop.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This order does not belong to your atelier workshop.",
                )

        if not order.delivery:
            # Auto-create initial pending delivery record for the order
            delivery_record = OrderDelivery(
                order_id=order.id,
                delivery_method="STANDARD_COURIER",
                status="PENDING",
            )
            db.add(delivery_record)
            db.commit()
            db.refresh(delivery_record)
            return DeliveryResponse.model_validate(delivery_record)

        return DeliveryResponse.model_validate(order.delivery)

    def create_or_update_order_delivery(
        self,
        db: Session,
        user: User,
        order_id: int,
        payload: DeliveryCreateOrUpdate,
    ) -> DeliveryResponse:
        """
        Add or update manual courier tracking and dispatch information for an order.
        Only the assigned tailor atelier or administrator may update delivery tracking.
        """
        order = order_repository.get_order_by_id(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order ID {order_id} not found.",
            )

        # Authorization: Tailor owning the shop or Admin
        if user.role in [UserRole.TAILOR, "TAILOR"]:
            shop = db.query(TailorShop).filter(TailorShop.user_id == user.id).first()
            if not shop or order.tailor_shop_id != shop.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the master tailor handling this order can update delivery details.",
                )
        elif user.role not in [UserRole.ADMIN, "ADMIN"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the tailor atelier or administrator can update delivery information.",
            )

        delivery_record = order.delivery
        if not delivery_record:
            delivery_record = OrderDelivery(
                order_id=order.id,
                delivery_method=payload.delivery_method or "STANDARD_COURIER",
                courier_name=payload.courier_name,
                tracking_number=payload.tracking_number,
                tracking_url=payload.tracking_url,
                status=payload.status or "SHIPPED",
                expected_delivery_date=payload.expected_delivery_date,
                shipped_at=payload.shipped_at or (datetime.now() if payload.status == "SHIPPED" else None),
                delivered_at=payload.delivered_at,
                notes=payload.notes,
            )
            db.add(delivery_record)
        else:
            if payload.delivery_method is not None:
                delivery_record.delivery_method = payload.delivery_method
            if payload.courier_name is not None:
                delivery_record.courier_name = payload.courier_name
            if payload.tracking_number is not None:
                delivery_record.tracking_number = payload.tracking_number
            if payload.tracking_url is not None:
                delivery_record.tracking_url = payload.tracking_url
            if payload.status is not None:
                delivery_record.status = payload.status
            if payload.expected_delivery_date is not None:
                delivery_record.expected_delivery_date = payload.expected_delivery_date
            if payload.shipped_at is not None:
                delivery_record.shipped_at = payload.shipped_at
            elif payload.status == "SHIPPED" and not delivery_record.shipped_at:
                delivery_record.shipped_at = datetime.now()
            if payload.delivered_at is not None:
                delivery_record.delivered_at = payload.delivered_at
            elif payload.status == "DELIVERED" and not delivery_record.delivered_at:
                delivery_record.delivered_at = datetime.now()
            if payload.notes is not None:
                delivery_record.notes = payload.notes

        # Synchronize order lifecycle status if appropriate:
        if delivery_record.status == "SHIPPED" and order.status not in ["SHIPPED", "DELIVERED"]:
            order.status = "SHIPPED"
            history = OrderStatusHistory(
                order_id=order.id,
                status="SHIPPED",
                changed_by=user.id,
                notes=f"Dispatched via {delivery_record.courier_name or 'courier'}. Tracking: {delivery_record.tracking_number or 'N/A'}",
            )
            db.add(history)
        elif delivery_record.status == "DELIVERED" and order.status != "DELIVERED":
            order.status = "DELIVERED"
            history = OrderStatusHistory(
                order_id=order.id,
                status="DELIVERED",
                changed_by=user.id,
                notes="Confirmed delivery to customer.",
            )
            db.add(history)

        db.commit()
        db.refresh(delivery_record)
        logger.info(
            f"Order {order.id} delivery updated: courier={delivery_record.courier_name}, tracking={delivery_record.tracking_number}, status={delivery_record.status}"
        )
        return DeliveryResponse.model_validate(delivery_record)


order_service = OrderService()
