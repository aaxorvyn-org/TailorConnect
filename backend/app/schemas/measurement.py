from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class MeasurementFieldResponse(BaseModel):
    id: int
    template_id: int
    field_name: str
    field_label: str
    unit: str
    required: bool
    display_order: int
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MeasurementTemplateSummaryResponse(BaseModel):
    id: int
    garment_type: str
    name: str
    description: Optional[str] = None
    field_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MeasurementTemplateDetailResponse(BaseModel):
    id: int
    garment_type: str
    name: str
    description: Optional[str] = None
    fields: List[MeasurementFieldResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerMeasurementValueInput(BaseModel):
    field_id: int = Field(..., description="MeasurementField ID")
    value: float = Field(..., gt=0.0, description="Measurement numeric value (must be > 0)")

    @field_validator("value")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Measurement value must be greater than zero.")
        return round(v, 2)


class CustomerMeasurementValueResponse(BaseModel):
    id: int
    field_id: int
    field_name: str
    field_label: str
    unit: str
    value: float

    model_config = ConfigDict(from_attributes=True)


class CustomerMeasurementCreate(BaseModel):
    template_id: int = Field(..., description="ID of the garment measurement template")
    tailor_shop_id: Optional[int] = Field(None, description="Optional tailor shop association")
    measurement_name: str = Field(..., min_length=1, max_length=255, description="Label for this measurement profile")
    unit: Optional[str] = Field("inches", description="Measurement unit ('inches' or 'cm')")
    notes: Optional[str] = Field(None, max_length=2000, description="Personal fitting preferences or posture notes")
    values: List[CustomerMeasurementValueInput] = Field(..., min_length=1, description="List of measured values")

    @field_validator("measurement_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Measurement name cannot be empty.")
        return trimmed

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: Optional[str]) -> str:
        if not v:
            return "inches"
        unit_clean = v.strip().lower()
        if unit_clean not in ["inches", "in", "cm", "centimeters"]:
            raise ValueError("Measurement unit must be 'inches' or 'cm'.")
        return "cm" if unit_clean in ["cm", "centimeters"] else "inches"


class CustomerMeasurementUpdate(BaseModel):
    measurement_name: Optional[str] = Field(None, min_length=1, max_length=255)
    unit: Optional[str] = None
    tailor_shop_id: Optional[int] = None
    notes: Optional[str] = None
    values: Optional[List[CustomerMeasurementValueInput]] = None

    @field_validator("measurement_name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Measurement name cannot be empty.")
            return trimmed
        return v

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            unit_clean = v.strip().lower()
            if unit_clean not in ["inches", "in", "cm", "centimeters"]:
                raise ValueError("Measurement unit must be 'inches' or 'cm'.")
            return "cm" if unit_clean in ["cm", "centimeters"] else "inches"
        return v


class CustomerMeasurementResponse(BaseModel):
    id: int
    customer_id: int
    tailor_shop_id: Optional[int] = None
    tailor_shop_name: Optional[str] = None
    template_id: int
    garment_type: str
    template_name: str
    measurement_name: str
    unit: str
    notes: Optional[str] = None
    values: List[CustomerMeasurementValueResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
