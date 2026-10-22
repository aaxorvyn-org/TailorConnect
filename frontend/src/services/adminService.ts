import { apiClient } from './api';
import type {
  AdminDashboardStats,
  AdminTailor,
  AdminCustomer,
  AdminShop,
  AdminOrder,
  AdminReview,
  PaginatedResult,
} from '../types/admin';

export interface QueryParams {
  search?: string;
  is_active?: boolean;
  status?: string;
  country?: string;
  city?: string;
  rating?: number;
  shop_id?: number;
  page?: number;
  page_size?: number;
}

function buildQuery(params: QueryParams = {}): string {
  const parts: string[] = [];
  if (params.search && params.search.trim()) {
    parts.push(`search=${encodeURIComponent(params.search.trim())}`);
  }
  if (typeof params.is_active === 'boolean') {
    parts.push(`is_active=${params.is_active}`);
  }
  if (params.status && params.status !== 'All') {
    parts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params.country && params.country !== 'All') {
    parts.push(`country=${encodeURIComponent(params.country)}`);
  }
  if (params.city && params.city !== 'All') {
    parts.push(`city=${encodeURIComponent(params.city)}`);
  }
  if (params.rating && params.rating > 0) {
    parts.push(`rating=${params.rating}`);
  }
  if (params.shop_id) {
    parts.push(`shop_id=${params.shop_id}`);
  }
  if (params.page) {
    parts.push(`page=${params.page}`);
  }
  if (params.page_size) {
    parts.push(`page_size=${params.page_size}`);
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export const adminService = {
  /**
   * Fetch aggregate platform metrics for Admin Dashboard
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    return apiClient<AdminDashboardStats>('/api/admin/dashboard/stats', {
      method: 'GET',
    });
  },

  /**
   * List tailor accounts with search and pagination
   */
  async getTailors(params: QueryParams = {}): Promise<PaginatedResult<AdminTailor>> {
    return apiClient<PaginatedResult<AdminTailor>>(`/api/admin/tailors${buildQuery(params)}`, {
      method: 'GET',
    });
  },

  /**
   * Activate or deactivate tailor account
   */
  async updateTailorStatus(
    id: number,
    payload: { is_active: boolean; is_verified?: boolean }
  ): Promise<AdminTailor> {
    return apiClient<AdminTailor>(`/api/admin/tailors/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * List customer client accounts with order statistics
   */
  async getCustomers(params: QueryParams = {}): Promise<PaginatedResult<AdminCustomer>> {
    return apiClient<PaginatedResult<AdminCustomer>>(`/api/admin/customers${buildQuery(params)}`, {
      method: 'GET',
    });
  },

  /**
   * Activate or deactivate customer account
   */
  async updateCustomerStatus(
    id: number,
    payload: { is_active: boolean }
  ): Promise<AdminCustomer> {
    return apiClient<AdminCustomer>(`/api/admin/customers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * List tailor atelier shops with approval state
   */
  async getShops(params: QueryParams = {}): Promise<PaginatedResult<AdminShop>> {
    return apiClient<PaginatedResult<AdminShop>>(`/api/admin/shops${buildQuery(params)}`, {
      method: 'GET',
    });
  },

  /**
   * Approve or suspend a tailor shop storefront
   */
  async updateShopStatus(
    id: number,
    payload: { is_active: boolean }
  ): Promise<AdminShop> {
    return apiClient<AdminShop>(`/api/admin/shops/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * List all platform orders with status filter and search
   */
  async getOrders(params: QueryParams = {}): Promise<PaginatedResult<AdminOrder>> {
    return apiClient<PaginatedResult<AdminOrder>>(`/api/admin/orders${buildQuery(params)}`, {
      method: 'GET',
    });
  },

  /**
   * Admin status update with audit note
   */
  async updateOrderStatus(
    id: number,
    payload: { status: string; notes?: string }
  ): Promise<AdminOrder> {
    return apiClient<AdminOrder>(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * List reviews across all shops for moderation
   */
  async getReviews(params: QueryParams = {}): Promise<PaginatedResult<AdminReview>> {
    return apiClient<PaginatedResult<AdminReview>>(`/api/admin/reviews${buildQuery(params)}`, {
      method: 'GET',
    });
  },

  /**
   * Delete an inappropriate review
   */
  async deleteReview(id: number): Promise<{ status: string; message: string }> {
    return apiClient<{ status: string; message: string }>(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
    });
  },
};
