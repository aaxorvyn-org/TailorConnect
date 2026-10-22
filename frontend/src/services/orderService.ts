import { apiClient } from './api';
import { appConfig } from '../utils/env';
import { mockOrders } from '../mock';
import type {
  Order,
  OrderCreatePayload,
  OrderStatusUpdatePayload,
  OrderReferenceImage,
  OrderStatusHistory,
  OrderDelivery,
  DeliveryUpdatePayload,
} from '../types/order';
import type { Design } from '../types/design';

export const orderService = {
  /**
   * Submit a new tailoring order
   */
  async createOrder(payload: OrderCreatePayload): Promise<Order> {
    return apiClient<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch all orders placed by the authenticated customer
   */
  async getCustomerOrders(status?: string): Promise<Order[]> {
    try {
      const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
      const data = await apiClient<Order[]>(`/api/orders${query}`, {
        method: 'GET',
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch single order details for customer
   */
  async getCustomerOrderById(id: number | string): Promise<Order> {
    return apiClient<Order>(`/api/orders/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Fetch all incoming / production orders for the authenticated tailor's shop
   */
  async getTailorOrders(status?: string): Promise<Order[]> {
    try {
      const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
      const data = await apiClient<Order[]>(`/api/tailors/orders${query}`, {
        method: 'GET',
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch single order details for tailor atelier
   */
  async getTailorOrderById(id: number | string): Promise<Order> {
    return apiClient<Order>(`/api/tailors/orders/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Update order status with notes (controlled transition)
   */
  async updateOrderStatus(
    id: number | string,
    payload: OrderStatusUpdatePayload
  ): Promise<Order> {
    return apiClient<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Upload an inspiration reference image
   */
  async uploadReferenceImage(
    id: number | string,
    file?: File,
    imageUrl?: string
  ): Promise<OrderReferenceImage> {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('threadcraft_token');
      const baseUrl = appConfig.apiBaseUrl.replace(/\/+$/, '');
      const response = await fetch(`${baseUrl}/api/orders/${id}/reference-images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to upload image file');
      }
      return response.json();
    } else if (imageUrl) {
      const formData = new FormData();
      formData.append('image_url', imageUrl);
      const token = localStorage.getItem('threadcraft_token');
      const baseUrl = appConfig.apiBaseUrl.replace(/\/+$/, '');
      const response = await fetch(`${baseUrl}/api/orders/${id}/reference-images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to attach reference URL');
      }
      return response.json();
    }
    throw new Error('Must provide either a file or an image URL');
  },

  /**
   * Fetch status history timeline
   */
  async getOrderStatusHistory(id: number | string): Promise<OrderStatusHistory[]> {
    return apiClient<OrderStatusHistory[]>(`/api/orders/${id}/status-history`, {
      method: 'GET',
    });
  },

  /**
   * Fetch lookbook designs from backend
   */
  async getDesigns(shopId?: number): Promise<Design[]> {
    const query = shopId ? `?shop_id=${shopId}` : '';
    return apiClient<Design[]>(`/api/designs${query}`, {
      method: 'GET',
    });
  },

  /**
   * Fetch a single design by ID
   */
  async getDesignById(id: number | string): Promise<Design> {
    return apiClient<Design>(`/api/designs/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Fetch delivery & tracking details for an order
   */
  async getOrderDelivery(orderId: number | string): Promise<OrderDelivery> {
    return apiClient<OrderDelivery>(`/api/orders/${orderId}/delivery`, {
      method: 'GET',
    });
  },

  /**
   * Update courier dispatch, tracking number, and delivery status (tailor / admin)
   */
  async updateOrderDelivery(
    orderId: number | string,
    payload: DeliveryUpdatePayload
  ): Promise<OrderDelivery> {
    return apiClient<OrderDelivery>(`/api/orders/${orderId}/delivery`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};
