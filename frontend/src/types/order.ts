/**
 * Tailoring Order Management Types (Phase 9)
 */

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'MEASUREMENT_CONFIRMED'
  | 'CUTTING'
  | 'STITCHING'
  | 'QUALITY_CHECK'
  | 'READY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  // Backwards-compatibility aliases for earlier static mock references
  | 'Consultation'
  | 'Measurements Taken'
  | 'Fabric Cutting'
  | 'Trial Fitting'
  | 'Final Stitching'
  | 'Ready for Pickup'
  | 'Completed'
  | 'Cancelled';

export interface DeliveryAddress {
  id?: number;
  customer_id?: number;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  country: string;
  country_code?: string | null;
  pincode: string;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  design_id?: number | null;
  item_title: string;
  quantity: number;
  unit_price: number;
  customization_notes?: string | null;
  measurement_id?: number | null;
  measurement_name?: string | null;
  design_thumbnail?: string | null;
}

export interface OrderReferenceImage {
  id: number;
  order_id: number;
  image_url: string;
  created_at: string;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  status: OrderStatus;
  changed_by?: number | null;
  changed_by_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Order {
  id: number | string;
  order_number?: string;
  customer_id?: number;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  tailor_shop_id?: number;
  tailor_shop_name?: string | null;
  status: OrderStatus;
  payment_status?: string | null;
  subtotal?: number;
  delivery_charge?: number;
  total_amount?: number;
  currency?: string;
  customer_notes?: string | null;
  delivery_address?: DeliveryAddress | null;
  delivery?: OrderDelivery | null;
  items?: OrderItem[];
  reference_images?: OrderReferenceImage[];
  status_history?: OrderStatusHistory[];
  created_at?: string;
  updated_at?: string;


  // Compatibility helpers with legacy mock components
  orderNumber?: string;
  customerName?: string;
  tailorName?: string;
  itemTitle?: string;
  category?: string;
  price?: number;
  progressPercent?: number;
  orderDate?: string;
  deliveryDate?: string;
  fabricType?: string;
  notes?: string;
  thumbnail?: string;
}

export interface OrderItemCreatePayload {
  design_id: number;
  quantity: number;
  customization_notes?: string;
  measurement_id: number;
}

export interface OrderCreatePayload {
  tailor_shop_id: number;
  customer_notes?: string;
  currency?: string;
  delivery_address: {
    full_name: string;
    phone: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    country?: string;
    country_code?: string;
    pincode: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
  };
  items: OrderItemCreatePayload[];
  reference_image_urls?: string[];
}

export interface OrderStatusUpdatePayload {
  status: OrderStatus;
  notes?: string;
}

export type DeliveryStatus =
  | 'PENDING'
  | 'LABEL_CREATED'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED';

export type DeliveryMethod =
  | 'STANDARD_COURIER'
  | 'EXPRESS_COURIER'
  | 'WHITE_GLOVE'
  | 'SELF_PICKUP'
  | 'LOCAL_DELIVERY';

export interface OrderDelivery {
  id?: number;
  order_id: number;
  delivery_method: string;
  courier_name?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  status: string;
  expected_delivery_date?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryUpdatePayload {
  delivery_method?: string;
  courier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  status?: string;
  expected_delivery_date?: string;
  shipped_at?: string;
  delivered_at?: string;
  notes?: string;
}
