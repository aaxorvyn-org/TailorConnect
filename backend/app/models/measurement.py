from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.models.base import TimestampMixin


class MeasurementTemplate(Base, TimestampMixin):
    """
    Template for specific garment types (Shirt, Pants, Blouse, Dress, Lehenga, Suit, Kids Wear, etc.).
    Defines the anatomical measurements required for cutting that garment.
    """
    __tablename__ = "measurement_templates"

    garment_type = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    fields = relationship(
        "MeasurementField",
        back_populates="template",
        cascade="all, delete-orphan",
        order_by="MeasurementField.display_order.asc()",
        lazy="joined",
    )
    measurements = relationship("CustomerMeasurement", back_populates="template")

    def __repr__(self) -> str:
        return f"<MeasurementTemplate id={self.id} garment='{self.garment_type}' name='{self.name}'>"


class MeasurementField(Base, TimestampMixin):
    """
    An individual measurement specification required by a garment template
    (e.g., chest, waist, sleeve length, shoulder, neck).
    """
    __tablename__ = "measurement_fields"

    template_id = Column(
        Integer,
        ForeignKey("measurement_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    field_name = Column(String(100), nullable=False)
    field_label = Column(String(150), nullable=False)
    unit = Column(String(50), nullable=False, default="inches")
    required = Column(Boolean, nullable=False, default=True)
    display_order = Column(Integer, nullable=False, default=0)
    min_value = Column(Float, nullable=True)
    max_value = Column(Float, nullable=True)
    description = Column(String(255), nullable=True)

    # Relationships
    template = relationship("MeasurementTemplate", back_populates="fields")
    values = relationship("CustomerMeasurementValue", back_populates="field", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<MeasurementField id={self.id} template_id={self.template_id} field='{self.field_name}'>"


class CustomerMeasurement(Base, TimestampMixin):
    """
    Customer's saved bespoke measurement profile for a specific garment template.
    Scoped directly to the customer's user account with optional shop linkage.
    """
    __tablename__ = "customer_measurements"

    customer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tailor_shop_id = Column(
        Integer,
        ForeignKey("tailor_shops.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    template_id = Column(
        Integer,
        ForeignKey("measurement_templates.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    measurement_name = Column(String(255), nullable=False, index=True)
    unit = Column(String(20), nullable=False, default="inches")
    notes = Column(Text, nullable=True)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    tailor_shop = relationship("TailorShop", foreign_keys=[tailor_shop_id])
    template = relationship("MeasurementTemplate", back_populates="measurements", lazy="joined")
    values = relationship(
        "CustomerMeasurementValue",
        back_populates="measurement",
        cascade="all, delete-orphan",
        order_by="CustomerMeasurementValue.id.asc()",
        lazy="joined",
    )

    def __repr__(self) -> str:
        return f"<CustomerMeasurement id={self.id} customer_id={self.customer_id} name='{self.measurement_name}'>"


class CustomerMeasurementValue(Base, TimestampMixin):
    """
    Actual numerical value recorded for a specific measurement field on a customer measurement.
    """
    __tablename__ = "customer_measurement_values"

    measurement_id = Column(
        Integer,
        ForeignKey("customer_measurements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    field_id = Column(
        Integer,
        ForeignKey("measurement_fields.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    value = Column(Float, nullable=False)

    # Relationships
    measurement = relationship("CustomerMeasurement", back_populates="values")
    field = relationship("MeasurementField", back_populates="values", lazy="joined")

    def __repr__(self) -> str:
        return f"<CustomerMeasurementValue id={self.id} field_id={self.field_id} value={self.value}>"
