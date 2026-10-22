import { apiClient } from './api';
import type {
  Customer,
  CustomerCreatePayload,
  CustomerListResponse,
  CustomerNote,
  CustomerNoteCreatePayload,
  CustomerUpdatePayload,
} from '../types/customer';

export interface CustomerQueryParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const customerService = {
  /**
   * Fetch paginated list of customers for the authenticated tailor atelier
   */
  async getCustomers(params: CustomerQueryParams = {}): Promise<CustomerListResponse> {
    const query = new URLSearchParams();
    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params.status && params.status.trim()) {
      query.append('status', params.status.trim());
    }
    if (params.page) {
      query.append('page', String(params.page));
    }
    if (params.limit) {
      query.append('limit', String(params.limit));
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/tailors/customers?${queryString}` : '/tailors/customers';
    return apiClient<CustomerListResponse>(endpoint, { method: 'GET' });
  },

  /**
   * Fetch a single customer's detailed profile, notes history, and order history
   */
  async getCustomerById(id: number): Promise<Customer> {
    return apiClient<Customer>(`/tailors/customers/${id}`, { method: 'GET' });
  },

  /**
   * Register a new patron under the tailor atelier
   */
  async createCustomer(payload: CustomerCreatePayload): Promise<Customer> {
    return apiClient<Customer>('/tailors/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update existing customer information
   */
  async updateCustomer(id: number, payload: CustomerUpdatePayload): Promise<Customer> {
    return apiClient<Customer>(`/tailors/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete customer and their associated notes
   */
  async deleteCustomer(id: number): Promise<{ success: boolean; message: string; id: number }> {
    return apiClient<{ success: boolean; message: string; id: number }>(`/tailors/customers/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Add a new atelier note or fitting observation to customer profile
   */
  async addCustomerNote(customerId: number, payload: CustomerNoteCreatePayload): Promise<CustomerNote> {
    return apiClient<CustomerNote>(`/tailors/customers/${customerId}/notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch all notes for a customer
   */
  async getCustomerNotes(customerId: number): Promise<CustomerNote[]> {
    return apiClient<CustomerNote[]>(`/tailors/customers/${customerId}/notes`, {
      method: 'GET',
    });
  },

  /**
   * Delete an atelier note
   */
  async deleteCustomerNote(customerId: number, noteId: number): Promise<{ success: boolean; message: string; id: number }> {
    return apiClient<{ success: boolean; message: string; id: number }>(`/tailors/customers/${customerId}/notes/${noteId}`, {
      method: 'DELETE',
    });
  },
};
