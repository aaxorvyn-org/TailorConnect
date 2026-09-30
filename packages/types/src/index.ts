export type UserRole = 'CUSTOMER' | 'BUSINESS' | 'ADMIN';

export type BusinessType = 'INDIVIDUAL_TAILOR' | 'BOUTIQUE';

export type BusinessVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'MATCHING'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export type OrderStatus =
  | 'REQUESTED'
  | 'QUOTE_SENT'
  | 'ACCEPTED'
  | 'APPOINTMENT_BOOKED'
  | 'MEASUREMENT'
  | 'CUTTING'
  | 'STITCHING'
  | 'FITTING'
  | 'ALTERATION'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type AppointmentType = 'CONSULTATION' | 'MEASUREMENT' | 'FITTING' | 'PICKUP';

export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PaymentMethod =
  | 'ONLINE_CARD'
  | 'ONLINE_UPI'
  | 'ONLINE_NETBANKING'
  | 'OFFLINE_CASH'
  | 'OFFLINE_UPI_QR'
  | 'PAY_AT_SHOP';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUNDED'
  | 'FAILED';

export type NotificationChannel = 'IN_APP' | 'PUSH' | 'SMS' | 'EMAIL';

// Standard API Envelope
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

// User & Auth
export interface UserDto {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  profile?: ProfileDto | null;
  business?: BusinessSummaryDto | null;
}

export interface ProfileDto {
  id: string;
  userId: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  approxLocation: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  user: UserDto;
}

// Business
export interface BusinessLocationDto {
  id?: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export interface BusinessSummaryDto {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  verificationStatus: BusinessVerificationStatus;
  description: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  phone: string;
  email: string | null;
  typicalTurnaroundDays: number;
  startingPrice: number;
  serviceRadiusKm: number;
  offersHomePickup: boolean;
  offersHomeDelivery: boolean;
  offersHomeMeasurement: boolean;
  requiresAppointment: boolean;
  ratingAverage: number;
  totalReviewsCount: number;
  completedOrdersCount: number;
  isAcceptingOrders: boolean;
  location?: BusinessLocationDto | null;
  specializations?: string[];
  distanceKm?: number;
  matchScore?: number;
  matchReasons?: string[];
}

export interface PortfolioItemDto {
  id: string;
  businessId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  title: string;
  category: string;
  garmentType: string;
  description: string | null;
  displayOrder: number;
  createdAt: string;
}

// Service Taxonomy
export interface ServiceCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  displayOrder: number;
  isActive: boolean;
  services?: ServiceDto[];
}

export interface ServiceDto {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  gender: string;
  description: string | null;
  benchmarkStartingPrice: number;
  typicalTurnaroundDays: number;
  isActive: boolean;
}

// AI Extraction
export interface StructuredGarmentRequirement {
  garmentType: string;
  category: string;
  occasion?: string;
  sleeveStyle?: string;
  necklineStyle?: string;
  fabricProvidedByCustomer: boolean;
  embroidery?: boolean;
  urgency?: 'low' | 'normal' | 'high';
  detectedTurnaroundDays?: number;
  requirements?: string[];
  suggestedBudget?: {
    min: number;
    max: number;
  };
}

// Requests
export interface CustomerRequestDto {
  id: string;
  requestNumber: string;
  customerId: string;
  serviceId: string | null;
  garmentType: string;
  categoryName: string;
  rawPrompt: string;
  structuredRequirements: StructuredGarmentRequirement | null;
  fabricProvidedByCustomer: boolean;
  requiredDate: string;
  budgetMin: number | null;
  budgetMax: number | null;
  pickupRequired: boolean;
  deliveryRequired: boolean;
  locationLocality: string;
  locationCity: string;
  latitude: number | null;
  longitude: number | null;
  status: RequestStatus;
  createdAt: string;
  images: { id: string; imageUrl: string; caption?: string | null }[];
  quotesCount?: number;
  customer?: {
    firstName: string;
    lastName: string | null;
    avatarUrl: string | null;
    approxLocation: string | null;
  };
  messages?: any[];
  quotes?: any[];
  order?: any;
}

// Quotes
export interface QuoteItemDto {
  id?: string;
  title: string;
  description?: string | null;
  amount: number;
}

export interface QuoteDto {
  id: string;
  quoteNumber: string;
  requestId: string;
  businessId: string;
  business?: BusinessSummaryDto;
  status: QuoteStatus;
  totalAmount: number;
  advanceAmount: number;
  estimatedReadyDate: string;
  fittingsIncluded: number;
  notes: string | null;
  validUntil: string;
  createdAt: string;
  items: QuoteItemDto[];
}

// Orders
export interface OrderStatusHistoryDto {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedById: string;
  note: string | null;
  createdAt: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: {
    firstName: string;
    lastName: string | null;
    phone: string | null;
    email: string | null;
  };
  businessId: string;
  business?: BusinessSummaryDto;
  requestId: string | null;
  quoteId: string;
  quote?: QuoteDto;
  garmentName: string;
  status: OrderStatus;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  estimatedCompletion: string;
  deliveryOption: string;
  customerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: OrderStatusHistoryDto[];
  appointments?: AppointmentDto[];
  payments?: PaymentDto[];
  review?: ReviewDto | null;
}

// Appointments
export interface AppointmentDto {
  id: string;
  appointmentNumber: string;
  customerId: string;
  businessId: string;
  business?: BusinessSummaryDto;
  orderId: string | null;
  type: AppointmentType;
  status: AppointmentStatus;
  date: string;
  startTime: string;
  endTime: string;
  notes: string | null;
  createdAt: string;
}

// Payments
export interface PaymentDto {
  id: string;
  paymentNumber: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
}

// Reviews
export interface ReviewDto {
  id: string;
  orderId: string;
  customerId: string;
  businessId: string;
  rating: number;
  serviceType: string;
  comment: string | null;
  fitRating: number | null;
  finishingRating: number | null;
  createdAt: string;
  customerName?: string;
}

// Notifications
export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  body: string;
  linkUrl: string | null;
  channel: NotificationChannel;
  isRead: boolean;
  createdAt: string;
}
