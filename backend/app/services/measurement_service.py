from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.measurement import (
    MeasurementTemplate,
    MeasurementField,
    CustomerMeasurement,
    CustomerMeasurementValue,
)
from app.models.user import User
from app.repositories.measurement_repository import measurement_repository
from app.schemas.measurement import (
    CustomerMeasurementCreate,
    CustomerMeasurementResponse,
    CustomerMeasurementUpdate,
    CustomerMeasurementValueResponse,
    MeasurementFieldResponse,
    MeasurementTemplateDetailResponse,
    MeasurementTemplateSummaryResponse,
)
from app.utils.logger import logger


class MeasurementService:
    """
    Business logic and validation service for Customer Measurement Management.
    Enforces strict customer isolation and dynamic template-based validation.
    """

    @staticmethod
    def _to_measurement_response(meas: CustomerMeasurement) -> CustomerMeasurementResponse:
        values_list: List[CustomerMeasurementValueResponse] = []
        for val in (meas.values or []):
            field_name = val.field.field_name if val.field else f"field_{val.field_id}"
            field_label = val.field.field_label if val.field else f"Field {val.field_id}"
            unit = meas.unit or (val.field.unit if val.field else "inches")
            values_list.append(
                CustomerMeasurementValueResponse(
                    id=val.id,
                    field_id=val.field_id,
                    field_name=field_name,
                    field_label=field_label,
                    unit=unit,
                    value=val.value,
                )
            )

        template_name = meas.template.name if meas.template else "Custom Garment"
        garment_type = meas.template.garment_type if meas.template else "CUSTOM"
        tailor_shop_name = meas.tailor_shop.shop_name if meas.tailor_shop else None

        return CustomerMeasurementResponse(
            id=meas.id,
            customer_id=meas.customer_id,
            tailor_shop_id=meas.tailor_shop_id,
            tailor_shop_name=tailor_shop_name,
            template_id=meas.template_id,
            garment_type=garment_type,
            template_name=template_name,
            measurement_name=meas.measurement_name,
            unit=meas.unit,
            notes=meas.notes,
            values=values_list,
            created_at=meas.created_at,
            updated_at=meas.updated_at,
        )

    def list_templates(self, db: Session) -> List[MeasurementTemplateSummaryResponse]:
        templates = measurement_repository.list_templates(db)
        return [
            MeasurementTemplateSummaryResponse(
                id=t.id,
                garment_type=t.garment_type,
                name=t.name,
                description=t.description,
                field_count=len(t.fields) if t.fields else 0,
                created_at=t.created_at,
            )
            for t in templates
        ]

    def get_template_detail(self, db: Session, template_id: int) -> MeasurementTemplateDetailResponse:
        template = measurement_repository.get_template_by_id(db, template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Measurement template with ID {template_id} not found.",
            )

        fields_list = [
            MeasurementFieldResponse.model_validate(f) for f in (template.fields or [])
        ]

        return MeasurementTemplateDetailResponse(
            id=template.id,
            garment_type=template.garment_type,
            name=template.name,
            description=template.description,
            fields=fields_list,
            created_at=template.created_at,
            updated_at=template.updated_at,
        )

    def create_customer_measurement(
        self,
        db: Session,
        customer_id: int,
        data: CustomerMeasurementCreate,
    ) -> CustomerMeasurementResponse:
        # 1. Fetch template
        template = measurement_repository.get_template_by_id(db, data.template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Measurement template ID {data.template_id} does not exist.",
            )

        template_fields = {f.id: f for f in (template.fields or [])}

        # 2. Map input values by field_id
        input_values_dict: Dict[int, float] = {}
        for item in data.values:
            if item.field_id not in template_fields:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Field ID {item.field_id} is not part of template '{template.name}'.",
                )
            if item.value <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Measurement value for '{template_fields[item.field_id].field_label}' must be greater than zero.",
                )
            input_values_dict[item.field_id] = item.value

        # 3. Validate required fields
        missing_required = []
        for f in template.fields:
            if f.required and f.id not in input_values_dict:
                missing_required.append(f.field_label)

        if missing_required:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required measurement fields: {', '.join(missing_required)}.",
            )

        # 4. Value range checks (if min/max defined)
        # Note: if unit is cm, scale standard inch guidelines appropriately (1 in = 2.54 cm)
        unit = data.unit or "inches"
        scale = 2.54 if unit == "cm" else 1.0

        for field_id, val in input_values_dict.items():
            f = template_fields[field_id]
            if f.min_value is not None:
                min_allowed = f.min_value * scale
                if val < min_allowed:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Measurement for '{f.field_label}' ({val} {unit}) is lower than realistic minimum ({min_allowed:.1f} {unit}).",
                    )
            if f.max_value is not None:
                max_allowed = f.max_value * scale
                if val > max_allowed:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Measurement for '{f.field_label}' ({val} {unit}) exceeds realistic maximum ({max_allowed:.1f} {unit}).",
                    )

        # 5. Save to database
        db_meas = measurement_repository.create_customer_measurement(
            db=db,
            customer_id=customer_id,
            template_id=data.template_id,
            measurement_name=data.measurement_name.strip(),
            unit=unit,
            notes=data.notes.strip() if data.notes else None,
            values_dict=input_values_dict,
            tailor_shop_id=data.tailor_shop_id,
        )

        logger.info(
            f"Customer {customer_id} saved measurement profile '{db_meas.measurement_name}' (ID: {db_meas.id})"
        )
        return self._to_measurement_response(db_meas)

    def list_customer_measurements(
        self, db: Session, customer_id: int
    ) -> List[CustomerMeasurementResponse]:
        measurements = measurement_repository.list_customer_measurements(db, customer_id)
        return [self._to_measurement_response(m) for m in measurements]

    def get_customer_measurement(
        self, db: Session, measurement_id: int, customer_id: int
    ) -> CustomerMeasurementResponse:
        meas = measurement_repository.get_customer_measurement_by_id(
            db, measurement_id=measurement_id, customer_id=customer_id
        )
        if not meas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Measurement profile with ID {measurement_id} was not found in your records.",
            )
        return self._to_measurement_response(meas)

    def update_customer_measurement(
        self,
        db: Session,
        measurement_id: int,
        customer_id: int,
        data: CustomerMeasurementUpdate,
    ) -> CustomerMeasurementResponse:
        meas = measurement_repository.get_customer_measurement_by_id(
            db, measurement_id=measurement_id, customer_id=customer_id
        )
        if not meas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Measurement profile with ID {measurement_id} was not found in your records.",
            )

        template_fields = {f.id: f for f in (meas.template.fields or [])} if meas.template else {}
        values_dict: Optional[Dict[int, float]] = None

        if data.values is not None:
            values_dict = {}
            for item in data.values:
                if item.field_id not in template_fields:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Field ID {item.field_id} is not part of template '{meas.template.name}'.",
                    )
                if item.value <= 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Measurement value must be greater than zero.",
                    )
                values_dict[item.field_id] = item.value

        updated = measurement_repository.update_customer_measurement(
            db=db,
            measurement=meas,
            measurement_name=data.measurement_name.strip() if data.measurement_name else None,
            unit=data.unit,
            notes=data.notes.strip() if data.notes is not None else None,
            tailor_shop_id=data.tailor_shop_id,
            values_dict=values_dict,
        )

        logger.info(f"Customer {customer_id} updated measurement ID {measurement_id}")
        return self._to_measurement_response(updated)

    def delete_customer_measurement(
        self, db: Session, measurement_id: int, customer_id: int
    ) -> Dict[str, Any]:
        meas = measurement_repository.get_customer_measurement_by_id(
            db, measurement_id=measurement_id, customer_id=customer_id
        )
        if not meas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Measurement profile with ID {measurement_id} was not found in your records.",
            )

        name = meas.measurement_name
        measurement_repository.delete_customer_measurement(db, meas)
        logger.info(f"Customer {customer_id} deleted measurement ID {measurement_id} ('{name}')")
        return {
            "success": True,
            "message": f"Measurement profile '{name}' deleted successfully.",
            "id": measurement_id,
        }

    @staticmethod
    def seed_default_templates(db: Session) -> None:
        """
        Seeds common garment measurement templates with their respective fields
        (Shirt, Pants, Blouse, Dress, Lehenga, Suit, Kids Wear) if none are present.
        """
        existing = db.query(MeasurementTemplate).count()
        if existing > 0:
            return

        templates_config = [
            {
                "garment_type": "SHIRT",
                "name": "Classic Dress Shirt",
                "description": "Standard anatomical specs for casual, dress, and tuxedo shirts.",
                "fields": [
                    {"name": "chest", "label": "Chest Circumference", "req": True, "order": 1, "min": 20, "max": 80, "desc": "Measure fullest part of chest under armpits."},
                    {"name": "shoulder", "label": "Shoulder Width", "req": True, "order": 2, "min": 10, "max": 35, "desc": "Across shoulder bone to bone."},
                    {"name": "sleeve_length", "label": "Sleeve Length", "req": True, "order": 3, "min": 10, "max": 45, "desc": "From shoulder tip to wrist bone."},
                    {"name": "shirt_length", "label": "Shirt Length", "req": True, "order": 4, "min": 15, "max": 50, "desc": "From base of neck to desired hem."},
                    {"name": "neck", "label": "Neck Circumference", "req": True, "order": 5, "min": 10, "max": 30, "desc": "Measure around base of neck with one finger ease."},
                    {"name": "waist", "label": "Waist Circumference", "req": False, "order": 6, "min": 20, "max": 80, "desc": "Natural waistline above navel."},
                    {"name": "bicep", "label": "Bicep Circumference", "req": False, "order": 7, "min": 8, "max": 30, "desc": "Fullest part of bicep."},
                    {"name": "wrist", "label": "Cuff / Wrist Circumference", "req": False, "order": 8, "min": 5, "max": 20, "desc": "Around wrist bone."},
                ],
            },
            {
                "garment_type": "PANTS",
                "name": "Trousers & Pants",
                "description": "Bespoke specifications for formal trousers, chinos, and suit pants.",
                "fields": [
                    {"name": "waist", "label": "Pant Waist", "req": True, "order": 1, "min": 20, "max": 70, "desc": "Where trousers naturally rest."},
                    {"name": "hip", "label": "Hip Circumference", "req": True, "order": 2, "min": 20, "max": 80, "desc": "Fullest part of buttocks and hips."},
                    {"name": "inseam", "label": "Inseam Length", "req": True, "order": 3, "min": 15, "max": 50, "desc": "From inner crotch to bottom hem."},
                    {"name": "outseam", "label": "Outseam / Total Length", "req": True, "order": 4, "min": 20, "max": 60, "desc": "From waistband down side to hem."},
                    {"name": "thigh", "label": "Thigh Circumference", "req": True, "order": 5, "min": 10, "max": 40, "desc": "Around fullest part of thigh."},
                    {"name": "knee", "label": "Knee Circumference", "req": False, "order": 6, "min": 8, "max": 30, "desc": "Around knee with slight bend."},
                    {"name": "bottom_hem", "label": "Bottom Leg Opening", "req": False, "order": 7, "min": 8, "max": 30, "desc": "Desired ankle cuff opening width."},
                ],
            },
            {
                "garment_type": "BLOUSE",
                "name": "Traditional & Couture Blouse",
                "description": "Tailored saree blouses, crop tops, and corset blouses.",
                "fields": [
                    {"name": "bust", "label": "Bust Circumference", "req": True, "order": 1, "min": 20, "max": 70, "desc": "Fullest point of bust."},
                    {"name": "under_bust_waist", "label": "Underbust / Blouse Waist", "req": True, "order": 2, "min": 18, "max": 65, "desc": "Directly under bust where blouse ends."},
                    {"name": "shoulder", "label": "Shoulder Width", "req": True, "order": 3, "min": 8, "max": 30, "desc": "Shoulder edge to edge."},
                    {"name": "sleeve_length", "label": "Sleeve Length", "req": True, "order": 4, "min": 2, "max": 40, "desc": "Cap, short, or full sleeve."},
                    {"name": "arm_hole", "label": "Armhole Circumference", "req": True, "order": 5, "min": 8, "max": 30, "desc": "Around shoulder and armpit."},
                    {"name": "blouse_length", "label": "Blouse Length", "req": True, "order": 6, "min": 10, "max": 30, "desc": "Top of shoulder to hem."},
                    {"name": "front_neck_depth", "label": "Front Neck Depth", "req": False, "order": 7, "min": 3, "max": 15, "desc": "Shoulder base to front cleavage point."},
                    {"name": "back_neck_depth", "label": "Back Neck Depth", "req": False, "order": 8, "min": 3, "max": 18, "desc": "Shoulder base to deep back cut."},
                ],
            },
            {
                "garment_type": "DRESS",
                "name": "Evening Gown & Tailored Dress",
                "description": "Made-to-measure measurements for cocktails, formal gowns, and casual dresses.",
                "fields": [
                    {"name": "bust", "label": "Bust Circumference", "req": True, "order": 1, "min": 20, "max": 70, "desc": "Fullest part of bust."},
                    {"name": "waist", "label": "Natural Waist", "req": True, "order": 2, "min": 18, "max": 65, "desc": "Smallest part of waist."},
                    {"name": "hip", "label": "Hip Circumference", "req": True, "order": 3, "min": 20, "max": 80, "desc": "Around widest part of hips."},
                    {"name": "shoulder_to_waist", "label": "Shoulder to Waist Length", "req": True, "order": 4, "min": 10, "max": 30, "desc": "From shoulder base to natural waist."},
                    {"name": "total_length", "label": "Total Dress Length", "req": True, "order": 5, "min": 25, "max": 75, "desc": "Shoulder to bottom dress hem."},
                    {"name": "sleeve_length", "label": "Sleeve Length", "req": False, "order": 6, "min": 2, "max": 40, "desc": "Shoulder seam to cuff."},
                ],
            },
            {
                "garment_type": "LEHENGA",
                "name": "Bridal & Festivity Lehenga",
                "description": "Traditional bridal skirt, cancan flare, and choli measurements.",
                "fields": [
                    {"name": "skirt_waist", "label": "Skirt Waist / Navel", "req": True, "order": 1, "min": 18, "max": 70, "desc": "Where lehenga tie rests."},
                    {"name": "skirt_hip", "label": "Hip Circumference", "req": True, "order": 2, "min": 20, "max": 80, "desc": "Widest part of hips."},
                    {"name": "skirt_length", "label": "Lehenga Skirt Length", "req": True, "order": 3, "min": 25, "max": 60, "desc": "Waist to floor with heels."},
                    {"name": "choli_bust", "label": "Choli / Blouse Bust", "req": True, "order": 4, "min": 20, "max": 70, "desc": "Fullest bust point."},
                    {"name": "choli_length", "label": "Choli Length", "req": True, "order": 5, "min": 10, "max": 30, "desc": "Shoulder to choli hem."},
                    {"name": "skirt_flare", "label": "Skirt Flare (Ghera)", "req": False, "order": 6, "min": 50, "max": 300, "desc": "Desired total bottom circumference."},
                ],
            },
            {
                "garment_type": "SUIT",
                "name": "Bespoke Two-Piece Suit",
                "description": "Full anatomical profile for bespoke jacket, waistcoat, and matching trousers.",
                "fields": [
                    {"name": "jacket_chest", "label": "Jacket Chest", "req": True, "order": 1, "min": 25, "max": 75, "desc": "Across fullest chest."},
                    {"name": "jacket_waist", "label": "Jacket Waist", "req": True, "order": 2, "min": 20, "max": 75, "desc": "At jacket buttoning stance."},
                    {"name": "shoulder_width", "label": "Shoulder Width", "req": True, "order": 3, "min": 10, "max": 35, "desc": "Across upper back bone to bone."},
                    {"name": "jacket_length", "label": "Jacket Length", "req": True, "order": 4, "min": 20, "max": 45, "desc": "Collar base to jacket bottom hem."},
                    {"name": "sleeve_length", "label": "Jacket Sleeve Length", "req": True, "order": 5, "min": 15, "max": 45, "desc": "Shoulder seam to wrist bone."},
                    {"name": "trousers_waist", "label": "Trousers Waist", "req": True, "order": 6, "min": 20, "max": 70, "desc": "Natural trouser waistline."},
                    {"name": "trousers_inseam", "label": "Trousers Inseam", "req": True, "order": 7, "min": 15, "max": 50, "desc": "Inner crotch to trouser hem break."},
                    {"name": "trousers_hip", "label": "Trousers Hip", "req": True, "order": 8, "min": 20, "max": 80, "desc": "Around widest hip circumference."},
                ],
            },
            {
                "garment_type": "KIDS_WEAR",
                "name": "Kids Formal & Festive Wear",
                "description": "Proportional measurements for children's formal suits and dresses.",
                "fields": [
                    {"name": "chest", "label": "Chest Circumference", "req": True, "order": 1, "min": 15, "max": 45, "desc": "Around chest."},
                    {"name": "waist", "label": "Waist Circumference", "req": True, "order": 2, "min": 15, "max": 45, "desc": "Around waist."},
                    {"name": "shoulder", "label": "Shoulder Width", "req": True, "order": 3, "min": 6, "max": 25, "desc": "Shoulder bone to bone."},
                    {"name": "child_height", "label": "Total Child Height", "req": True, "order": 4, "min": 20, "max": 70, "desc": "Top of head to bare floor."},
                    {"name": "garment_length", "label": "Garment Length", "req": True, "order": 5, "min": 10, "max": 50, "desc": "Shoulder to desired hem."},
                    {"name": "sleeve_length", "label": "Sleeve Length", "req": False, "order": 6, "min": 5, "max": 30, "desc": "Shoulder to wrist."},
                ],
            },
        ]

        for cfg in templates_config:
            fields_data = cfg.pop("fields")
            template = MeasurementTemplate(**cfg)
            db.add(template)
            db.flush()

            for f_info in fields_data:
                field = MeasurementField(
                    template_id=template.id,
                    field_name=f_info["name"],
                    field_label=f_info["label"],
                    unit="inches",
                    required=f_info["req"],
                    display_order=f_info["order"],
                    min_value=f_info.get("min"),
                    max_value=f_info.get("max"),
                    description=f_info.get("desc"),
                )
                db.add(field)

        try:
            db.commit()
            logger.info("Seeded 7 default garment measurement templates with anatomical fields.")
        except Exception as exc:
            db.rollback()
            logger.warning(f"Template seed note: {exc}")


measurement_service = MeasurementService()
