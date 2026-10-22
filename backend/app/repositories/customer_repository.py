from typing import List, Optional, Tuple
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.customer import Customer, CustomerNote
from app.repositories.base import BaseRepository
from app.schemas.customer import CustomerCreate, CustomerNoteCreate, CustomerUpdate


class CustomerRepository(BaseRepository[Customer, CustomerCreate, CustomerUpdate]):
    """
    Repository handling database operations for customers and their atelier notes.
    Guarantees strict tenant-isolation by filtering by tailor_id on all operations.
    """

    def __init__(self):
        super().__init__(Customer)

    def get_by_id_and_tailor(
        self, db: Session, customer_id: int, tailor_id: int
    ) -> Optional[Customer]:
        """
        Fetch a customer by ID ensuring they belong to the authenticated tailor.
        """
        return (
            db.query(Customer)
            .filter(Customer.id == customer_id, Customer.tailor_id == tailor_id)
            .first()
        )

    def list_for_tailor(
        self,
        db: Session,
        tailor_id: int,
        search: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 10,
    ) -> Tuple[List[Customer], int]:
        """
        List customers for a specific tailor with search, status filtering, and pagination.
        Returns a tuple of (items, total_count).
        """
        query = db.query(Customer).filter(Customer.tailor_id == tailor_id)

        # Apply search filter across full_name, email, phone, and city
        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            query = query.filter(
                or_(
                    Customer.full_name.ilike(term),
                    Customer.email.ilike(term),
                    Customer.phone.ilike(term),
                    Customer.city.ilike(term),
                    Customer.country.ilike(term),
                )
            )

        # Apply status filter
        if status and status.strip():
            query = query.filter(Customer.status == status.strip().upper())

        total = query.count()
        items = (
            query.order_by(Customer.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total

    def create_customer(
        self,
        db: Session,
        tailor_id: int,
        customer_in: CustomerCreate,
        shop_id: Optional[int] = None,
        shop_name: Optional[str] = None,
    ) -> Customer:
        """
        Creates a customer entity for the tailor atelier, and attaches initial note if provided.
        """
        data = customer_in.model_dump(exclude={"initial_note", "note_category"})
        db_customer = Customer(
            tailor_id=tailor_id,
            shop_id=shop_id,
            shop_name=shop_name,
            **data,
        )
        db.add(db_customer)
        db.flush()  # assign db_customer.id

        # Attach initial note if provided
        if customer_in.initial_note and customer_in.initial_note.strip():
            initial_note = CustomerNote(
                customer_id=db_customer.id,
                tailor_id=tailor_id,
                note=customer_in.initial_note.strip(),
                category=customer_in.note_category or "GENERAL",
            )
            db.add(initial_note)

        db.commit()
        db.refresh(db_customer)
        return db_customer

    def update_customer(
        self,
        db: Session,
        customer: Customer,
        customer_in: CustomerUpdate,
    ) -> Customer:
        """
        Updates an existing customer's attributes.
        """
        update_data = customer_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(customer, field, value)

        db.commit()
        db.refresh(customer)
        return customer

    def delete_customer(self, db: Session, customer: Customer) -> None:
        """
        Deletes a customer and cascade deletes all attached notes.
        """
        db.delete(customer)
        db.commit()

    def add_note(
        self,
        db: Session,
        customer_id: int,
        tailor_id: int,
        note_in: CustomerNoteCreate,
    ) -> CustomerNote:
        """
        Creates and stores a new atelier note for a customer.
        """
        db_note = CustomerNote(
            customer_id=customer_id,
            tailor_id=tailor_id,
            note=note_in.note.strip(),
            category=note_in.category or "GENERAL",
        )
        db.add(db_note)
        db.commit()
        db.refresh(db_note)
        return db_note

    def get_notes(
        self, db: Session, customer_id: int, tailor_id: int
    ) -> List[CustomerNote]:
        """
        Fetch all notes for a customer belonging to this tailor.
        """
        return (
            db.query(CustomerNote)
            .filter(
                CustomerNote.customer_id == customer_id,
                CustomerNote.tailor_id == tailor_id,
            )
            .order_by(CustomerNote.created_at.desc())
            .all()
        )

    def delete_note(
        self, db: Session, note_id: int, customer_id: int, tailor_id: int
    ) -> bool:
        """
        Deletes a specific note verifying both customer and tailor ownership.
        """
        note = (
            db.query(CustomerNote)
            .filter(
                CustomerNote.id == note_id,
                CustomerNote.customer_id == customer_id,
                CustomerNote.tailor_id == tailor_id,
            )
            .first()
        )
        if note:
            db.delete(note)
            db.commit()
            return True
        return False


customer_repository = CustomerRepository()
