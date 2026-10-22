export interface CustomerNote {
  id: number;
  customer_id: number;
  tailor_id: number;
  note: string;
  category: 'GENERAL' | 'FITTING' | 'PREFERENCE' | 'FABRIC' | 'URGENT' | string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  tailor_id: number;
  shop_id?: number | null;
  shop_name?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  postal_code?: string | null;
  country?: string | null;
  country_code?: string | null;
  currency?: string | null;
  preferred_contact_method?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  total_orders: number;
  total_spend: number;
  notes_count: number;
  created_at: string;
  updated_at: string;
  notes?: CustomerNote[];
  order_history?: Array<Record<string, unknown>>;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CustomerCreatePayload {
  full_name: string;
  email?: string;
  phone?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  postal_code?: string;
  country?: string;
  country_code?: string;
  currency?: string;
  preferred_contact_method?: string;
  status?: string;
  initial_note?: string;
  note_category?: string;
}

export interface CustomerUpdatePayload {
  full_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  postal_code?: string;
  country?: string;
  country_code?: string;
  currency?: string;
  preferred_contact_method?: string;
  status?: string;
}

export interface CustomerNoteCreatePayload {
  note: string;
  category?: string;
}
