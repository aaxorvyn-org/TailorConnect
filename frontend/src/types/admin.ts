/**
 * Administrative Governance Types
 */

export interface AdminDashboardStats {
  total_customers: number;
  total_tailors: number;
  total_shops: number;
  total_orders: number;
  pending_shop_approvals: number;
  completed_orders: number;
  total_revenue: number;
  currency: string;
  recent_orders: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    shop_name: string;
    status: string;
    total_amount: number;
    currency: string;
    created_at?: string;
  }>;
  recent_tailors: Array<{
    id: number;
    full_name: string;
    email: string;
    city?: string;
    shop_name?: string;
    is_active: boolean;
    created_at?: string;
  }>;
}

export interface AdminTailor {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  shop_id?: number | null;
  shop_name?: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AdminCustomer {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  orders_count: number;
  total_spent: number;
  is_active: boolean;
  created_at: string;
}

export interface AdminShop {
  id: number;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  phone: string;
  city?: string | null;
  rating?: number | null;
  review_count?: number | null;
  starting_price?: number | null;
  is_active: boolean;
  orders_count: number;
  created_at: string;
}

export interface AdminOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  tailor_shop_id: number;
  tailor_shop_name: string;
  status: string;
  payment_status?: string;
  total_amount: number;
  currency: string;
  item_count: number;
  created_at: string;
}

export interface AdminReview {
  id: number;
  customer_id: number;
  customer_name: string;
  tailor_shop_id: number;
  tailor_shop_name: string;
  order_id: number;
  order_number?: string | null;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
