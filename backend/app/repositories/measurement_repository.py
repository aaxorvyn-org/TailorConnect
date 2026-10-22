from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.measurement import (
    MeasurementTemplate,
    MeasurementField,
    CustomerMeasurement,
    CustomerMeasurementValue,
)


class MeasurementRepository:
    """
    Data repository for MeasurementTemplates, MeasurementFields,
    CustomerMeasurements, and CustomerMeasurementValues.
    """

    def list_templates(self, db: Session) -> List[MeasurementTemplate]:
        return db.query(MeasurementTemplate).order_by(MeasurementTemplate.id.asc()).all()

    def get_template_by_id(self, db: Session, template_id: int) -> Optional[MeasurementTemplate]:
        return db.query(MeasurementTemplate).filter(MeasurementTemplate.id == template_id).first()

    def get_template_by_garment(self, db: Session, garment_type: str) -> Optional[MeasurementTemplate]:
        return db.query(MeasurementTemplate).filter(
            MeasurementTemplate.garment_type == garment_type.upper().strip()
        ).first()

    def list_customer_measurements(self, db: Session, customer_id: int) -> List[CustomerMeasurement]:
        return (
            db.query(CustomerMeasurement)
            .filter(CustomerMeasurement.customer_id == customer_id)
            .order_by(CustomerMeasurement.updated_at.desc())
            .all()
        )

    def get_customer_measurement_by_id(
        self, db: Session, measurement_id: int, customer_id: int
    ) -> Optional[CustomerMeasurement]:
        return (
            db.query(CustomerMeasurement)
            .filter(
                CustomerMeasurement.id == measurement_id,
                CustomerMeasurement.customer_id == customer_id,
            )
            .first()
        )

    def create_customer_measurement(
        self,
        db: Session,
        customer_id: int,
        template_id: int,
        measurement_name: str,
        unit: str,
        notes: Optional[str],
        values_dict: Dict[int, float],
        tailor_shop_id: Optional[int] = None,
    ) -> CustomerMeasurement:
        db_meas = CustomerMeasurement(
            customer_id=customer_id,
            template_id=template_id,
            tailor_shop_id=tailor_shop_id,
            measurement_name=measurement_name,
            unit=unit,
            notes=notes,
        )
        db.add(db_meas)
        db.flush()

        for field_id, val in values_dict.items():
            db_val = CustomerMeasurementValue(
                measurement_id=db_meas.id,
                field_id=field_id,
                value=val,
            )
            db.add(db_val)

        db.commit()
        db.refresh(db_meas)
        return db_meas

    def update_customer_measurement(
        self,
        db: Session,
        measurement: CustomerMeasurement,
        measurement_name: Optional[str] = None,
        unit: Optional[str] = None,
        notes: Optional[str] = None,
        tailor_shop_id: Optional[int] = None,
        values_dict: Optional[Dict[int, float]] = None,
    ) -> CustomerMeasurement:
        if measurement_name is not None:
            measurement.measurement_name = measurement_name
        if unit is not None:
            measurement.unit = unit
        if notes is not None:
            measurement.notes = notes
        if tailor_shop_id is not None:
            measurement.tailor_shop_id = tailor_shop_id

        if values_dict is not None:
            # Update existing or add new values
            existing_values = {v.field_id: v for v in measurement.values}
            for field_id, new_val in values_dict.items():
                if field_id in existing_values:
                    existing_values[field_id].value = new_val
                else:
                    new_val_obj = CustomerMeasurementValue(
                        measurement_id=measurement.id,
                        field_id=field_id,
                        value=new_val,
                    )
                    db.add(new_val_obj)

        db.commit()
        db.refresh(measurement)
        return measurement

    def delete_customer_measurement(self, db: Session, measurement: CustomerMeasurement) -> None:
        db.delete(measurement)
        db.commit()


measurement_repository = MeasurementRepository()
