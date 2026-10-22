/**
 * Customer Measurement Management Types (Phase 8)
 */

export interface MeasurementField {
  id: number;
  template_id: number;
  field_name: string;
  field_label: string;
  unit: string;
  required: boolean;
  display_order: number;
  min_value?: number | null;
  max_value?: number | null;
  description?: string | null;
}

export interface MeasurementTemplateSummary {
  id: number;
  garment_type: string;
  name: string;
  description?: string | null;
  field_count: number;
  created_at: string;
}

export interface MeasurementTemplateDetail {
  id: number;
  garment_type: string;
  name: string;
  description?: string | null;
  fields: MeasurementField[];
  created_at: string;
  updated_at: string;
}

export interface CustomerMeasurementValue {
  id: number;
  field_id: number;
  field_name: string;
  field_label: string;
  unit: string;
  value: number;
}

export interface CustomerMeasurement {
  id: number;
  customer_id: number;
  tailor_shop_id?: number | null;
  tailor_shop_name?: string | null;
  template_id: number;
  garment_type: string;
  template_name: string;
  measurement_name: string;
  unit: 'inches' | 'cm' | string;
  notes?: string | null;
  values: CustomerMeasurementValue[];
  created_at: string;
  updated_at: string;
}

export interface CustomerMeasurementValueInput {
  field_id: number;
  value: number;
}

export interface CustomerMeasurementCreatePayload {
  template_id: number;
  tailor_shop_id?: number | null;
  measurement_name: string;
  unit?: 'inches' | 'cm' | string;
  notes?: string | null;
  values: CustomerMeasurementValueInput[];
}

export interface CustomerMeasurementUpdatePayload {
  measurement_name?: string;
  unit?: 'inches' | 'cm' | string;
  tailor_shop_id?: number | null;
  notes?: string | null;
  values?: CustomerMeasurementValueInput[];
}
