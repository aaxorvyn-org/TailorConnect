import { apiClient } from './api';
import type {
  MeasurementTemplateSummary,
  MeasurementTemplateDetail,
  CustomerMeasurement,
  CustomerMeasurementCreatePayload,
  CustomerMeasurementUpdatePayload,
} from '../types/measurement';

export const measurementService = {
  /**
   * Fetch all active garment measurement templates (Shirt, Pants, Blouse, Dress, etc.)
   */
  async getTemplates(): Promise<MeasurementTemplateSummary[]> {
    return apiClient<MeasurementTemplateSummary[]>('/api/measurement-templates', {
      method: 'GET',
    });
  },

  /**
   * Fetch a specific garment template with its defined anatomical fields and specifications
   */
  async getTemplateById(id: number): Promise<MeasurementTemplateDetail> {
    return apiClient<MeasurementTemplateDetail>(`/api/measurement-templates/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Fetch all saved measurement profiles for the currently authenticated customer
   * Optionally filtered by garment template ID
   */
  async getCustomerMeasurements(templateId?: number): Promise<CustomerMeasurement[]> {
    const url = templateId
      ? `/api/customers/measurements?template_id=${templateId}`
      : '/api/customers/measurements';
    return apiClient<CustomerMeasurement[]>(url, {
      method: 'GET',
    });
  },

  /**
   * Fetch a single saved measurement profile by ID
   */
  async getCustomerMeasurementById(id: number): Promise<CustomerMeasurement> {
    return apiClient<CustomerMeasurement>(`/api/customers/measurements/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new bespoke customer measurement profile
   */
  async createMeasurement(payload: CustomerMeasurementCreatePayload): Promise<CustomerMeasurement> {
    return apiClient<CustomerMeasurement>('/api/customers/measurements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update an existing customer measurement profile (name, notes, values, unit)
   */
  async updateMeasurement(
    id: number,
    payload: CustomerMeasurementUpdatePayload
  ): Promise<CustomerMeasurement> {
    return apiClient<CustomerMeasurement>(`/api/customers/measurements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete a saved customer measurement profile
   */
  async deleteMeasurement(id: number): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/api/customers/measurements/${id}`, {
      method: 'DELETE',
    });
  },
};
