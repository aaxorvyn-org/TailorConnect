import type {
  ApiResponse,
  AuthTokens,
  UserDto,
  BusinessSummaryDto,
  CustomerRequestDto,
  QuoteDto,
  OrderDto,
  AppointmentDto,
  PaymentDto,
  ReviewDto,
  NotificationDto,
  ServiceCategoryDto,
  ServiceDto,
  StructuredGarmentRequirement,
} from '@tailorconnect/types';

const defaultBaseUrl =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  !window.location.hostname.includes('127.0.0.1')
    ? 'https://tailorconnect-api.onrender.com/api/v1'
    : '/api/v1';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl = defaultBaseUrl) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('tc_token');
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.endsWith('/api/v1') ? url : `${url.replace(/\/$/, '')}/api/v1`;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('tc_token', token);
      } else {
        localStorage.removeItem('tc_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const json = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: json.error || {
            code: 'REQUEST_FAILED',
            message: `Request failed with status ${response.status}`,
          },
        };
      }
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message || 'Unable to communicate with server',
        },
      };
    }
  }

  // --- Auth API ---
  auth = {
    register: (data: any) => this.request<AuthTokens>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => this.request<AuthTokens>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => this.request<UserDto>('/auth/me'),
    clerkSync: (data: { clerkId: string; email: string; firstName?: string; lastName?: string; phone?: string; role?: string }) =>
      this.request<{ user: UserDto; accessToken: string; isNewUser: boolean }>('/auth/clerk-sync', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () => {
      this.setToken(null);
      return this.request('/auth/logout', { method: 'POST' });
    },
  };

  // --- Services / Catalog API ---
  services = {
    getCategories: () => this.request<ServiceCategoryDto[]>('/services/categories'),
    getServices: (params?: { categorySlug?: string; gender?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return this.request<ServiceDto[]>(`/services${query ? `?${query}` : ''}`);
    },
  };

  // --- Discovery API ---
  discovery = {
    search: (params: {
      q?: string;
      category?: string;
      lat?: number;
      lng?: number;
      radiusKm?: number;
      maxPrice?: number;
      maxDays?: number;
      pickupOnly?: boolean;
    }) => {
      const query = new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)])
      ).toString();
      return this.request<BusinessSummaryDto[]>(`/discovery/search${query ? `?${query}` : ''}`);
    },
    getBySlug: (slug: string) => this.request<BusinessSummaryDto>(`/businesses/${slug}`),
  };

  // --- Business / Studio API ---
  businesses = {
    onboard: (data: any) => this.request<BusinessSummaryDto>('/businesses', { method: 'POST', body: JSON.stringify(data) }),
    getMyBusiness: () => this.request<BusinessSummaryDto>('/businesses/my-business'),
    updateMyBusiness: (data: any) => this.request<BusinessSummaryDto>('/businesses/my-business', { method: 'PATCH', body: JSON.stringify(data) }),
    getPortfolio: (businessId: string) => this.request<any[]>(`/businesses/${businessId}/portfolio`),
    addPortfolioItem: (data: any) => this.request<any>('/businesses/my-business/portfolio', { method: 'POST', body: JSON.stringify(data) }),
    deletePortfolioItem: (id: string) => this.request(`/businesses/my-business/portfolio/${id}`, { method: 'DELETE' }),
  };

  // --- AI Matching & Extraction API ---
  ai = {
    extractRequirements: (promptText: string) =>
      this.request<StructuredGarmentRequirement>('/ai-matching/extract', {
        method: 'POST',
        body: JSON.stringify({ promptText }),
      }),
  };

  // --- Customer Requests API ---
  requests = {
    create: (data: any) => this.request<CustomerRequestDto>('/requests', { method: 'POST', body: JSON.stringify(data) }),
    getMyRequests: () => this.request<CustomerRequestDto[]>('/requests/my-requests'),
    getTailorInbox: () => this.request<CustomerRequestDto[]>('/requests/tailor-inbox'),
    getById: (id: string) => this.request<CustomerRequestDto>(`/requests/${id}`),
    sendMessage: (requestId: string, content: string) =>
      this.request<any>(`/requests/${requestId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    getMessages: (requestId: string) => this.request<any[]>(`/requests/${requestId}/messages`),
    cancel: (id: string) => this.request(`/requests/${id}/cancel`, { method: 'PATCH' }),
  };

  // --- Quotes API ---
  quotes = {
    create: (data: any) => this.request<QuoteDto>('/quotes', { method: 'POST', body: JSON.stringify(data) }),
    getByRequest: (requestId: string) => this.request<QuoteDto[]>(`/quotes/request/${requestId}`),
    accept: (quoteId: string, paymentOption: string) =>
      this.request<{ order: OrderDto }>(`/quotes/${quoteId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ paymentOption }),
      }),
    decline: (quoteId: string) => this.request(`/quotes/${quoteId}/decline`, { method: 'POST' }),
  };

  // --- Orders API ---
  orders = {
    getCustomerOrders: () => this.request<OrderDto[]>('/orders/customer'),
    getTailorOrders: () => this.request<OrderDto[]>('/orders/tailor'),
    getById: (id: string) => this.request<OrderDto>(`/orders/${id}`),
    transitionStatus: (id: string, toStatus: string, note?: string) =>
      this.request<OrderDto>(`/orders/${id}/status-transition`, {
        method: 'POST',
        body: JSON.stringify({ toStatus, note }),
      }),
    addNote: (id: string, content: string, isCustomerVisible = true) =>
      this.request<any>(`/orders/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content, isCustomerVisible }),
      }),
  };

  // --- Appointments API ---
  appointments = {
    getAvailability: (businessId: string, date: string) =>
      this.request<{ slots: string[] }>(`/appointments/availability?businessId=${businessId}&date=${date}`),
    create: (data: any) => this.request<AppointmentDto>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    getMySchedule: () => this.request<AppointmentDto[]>('/appointments/my-schedule'),
    updateStatus: (id: string, status: string) =>
      this.request<AppointmentDto>(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  };

  // --- Payments API ---
  payments = {
    createIntent: (orderId: string, amount: number, method: string) =>
      this.request<{ paymentId: string; clientSecret?: string; status: string }>('/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({ orderId, amount, method }),
      }),
    recordOffline: (data: any) =>
      this.request<PaymentDto>('/payments/record-offline', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getOrderPayments: (orderId: string) => this.request<PaymentDto[]>(`/payments/order/${orderId}`),
  };

  // --- Reviews API ---
  reviews = {
    create: (data: any) => this.request<ReviewDto>('/reviews', { method: 'POST', body: JSON.stringify(data) }),
    getByBusiness: (businessId: string) => this.request<ReviewDto[]>(`/reviews/business/${businessId}`),
  };

  // --- Notifications API ---
  notifications = {
    getAll: () => this.request<NotificationDto[]>('/notifications'),
    markRead: (id: string) => this.request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => this.request('/notifications/mark-all-read', { method: 'POST' }),
  };

  // --- Admin API ---
  admin = {
    getDashboardMetrics: () => this.request<any>('/admin/dashboard-metrics'),
    getBusinesses: (status?: string) => this.request<any[]>(`/admin/businesses${status ? `?status=${status}` : ''}`),
    verifyBusiness: (id: string) => this.request(`/admin/businesses/${id}/verify`, { method: 'POST' }),
    suspendBusiness: (id: string, reason?: string) =>
      this.request(`/admin/businesses/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) }),
    getOrders: () => this.request<any[]>('/admin/orders'),
    getReviews: () => this.request<any[]>('/admin/reviews'),
  };
}

export const api = new ApiClient();
