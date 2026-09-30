import { z } from 'zod';

// Auth Validation
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15).optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CUSTOMER', 'BUSINESS', 'ADMIN']).default('CUSTOMER'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone must be provided',
  path: ['email'],
});

export const LoginSchema = z.object({
  identifier: z.string().min(3, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

// Profile Validation
export const UpdateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  approxLocation: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// Business Onboarding
export const BusinessOnboardingSchema = z.object({
  name: z.string().min(2, 'Business name is required'),
  businessType: z.enum(['INDIVIDUAL_TAILOR', 'BOUTIQUE']).default('INDIVIDUAL_TAILOR'),
  description: z.string().optional(),
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  typicalTurnaroundDays: z.number().int().min(1).max(90).default(7),
  startingPrice: z.number().min(0).default(300),
  serviceRadiusKm: z.number().min(1).max(100).default(15),
  offersHomePickup: z.boolean().default(false),
  offersHomeDelivery: z.boolean().default(false),
  offersHomeMeasurement: z.boolean().default(false),
  requiresAppointment: z.boolean().default(false),
  workingHours: z.record(z.any()).optional(),
  languagesSpoken: z.array(z.string()).default(['English', 'Hindi']),
  location: z.object({
    addressLine1: z.string().min(3, 'Address is required'),
    addressLine2: z.string().optional(),
    landmark: z.string().optional(),
    locality: z.string().min(2, 'Locality is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    postalCode: z.string().min(4, 'Postal code is required'),
    latitude: z.number().default(17.4399),
    longitude: z.number().default(78.3908),
  }),
  specializations: z.array(z.string()).default([]),
  services: z.array(z.object({
    serviceId: z.string().uuid(),
    basePrice: z.number().min(0),
    estimatedDays: z.number().int().min(1),
  })).optional(),
});

// AI Requirement Extraction Schema
export const GarmentRequirementSchema = z.object({
  garmentType: z.string().min(1).default('Custom Garment'),
  category: z.string().default('General'),
  occasion: z.string().optional(),
  sleeveStyle: z.string().optional(),
  necklineStyle: z.string().optional(),
  fabricProvidedByCustomer: z.boolean().default(true),
  embroidery: z.boolean().default(false),
  urgency: z.enum(['low', 'normal', 'high']).default('normal'),
  detectedTurnaroundDays: z.number().int().min(1).max(90).default(7),
  requirements: z.array(z.string()).default([]),
  suggestedBudget: z.object({
    min: z.number().min(0).default(500),
    max: z.number().min(0).default(2000),
  }).optional(),
});

// Customer Request Submission
export const CreateRequestSchema = z.object({
  serviceId: z.string().uuid().optional(),
  garmentType: z.string().min(2, 'Garment type is required'),
  categoryName: z.string().min(2, 'Category is required'),
  rawPrompt: z.string().min(5, 'Please provide more details on what you need'),
  structuredRequirements: GarmentRequirementSchema.optional(),
  fabricProvidedByCustomer: z.boolean().default(true),
  requiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required date must be YYYY-MM-DD'),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  pickupRequired: z.boolean().default(false),
  deliveryRequired: z.boolean().default(false),
  locationLocality: z.string().min(2, 'Locality is required'),
  locationCity: z.string().min(2, 'City is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  imageUrls: z.array(z.string()).optional(),
});

// Quote Creation
export const CreateQuoteSchema = z.object({
  requestId: z.string().uuid(),
  totalAmount: z.number().positive('Total amount must be greater than 0'),
  advanceAmount: z.number().min(0).default(0),
  estimatedReadyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Estimated date must be YYYY-MM-DD'),
  fittingsIncluded: z.number().int().min(0).default(1),
  notes: z.string().optional(),
  validDays: z.number().int().min(1).max(30).default(7),
  items: z.array(z.object({
    title: z.string().min(2, 'Item title is required'),
    description: z.string().optional(),
    amount: z.number().positive(),
  })).min(1, 'Quote must include at least one itemized line'),
});

// Order Status Transition
export const OrderStatusTransitionSchema = z.object({
  toStatus: z.enum([
    'REQUESTED',
    'QUOTE_SENT',
    'ACCEPTED',
    'APPOINTMENT_BOOKED',
    'MEASUREMENT',
    'CUTTING',
    'STITCHING',
    'FITTING',
    'ALTERATION',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ]),
  note: z.string().max(500).optional(),
});

// Appointment Booking
export const CreateAppointmentSchema = z.object({
  businessId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  type: z.enum(['CONSULTATION', 'MEASUREMENT', 'FITTING', 'PICKUP']).default('MEASUREMENT'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().min(4, 'Start time is required (e.g., 10:30)'),
  endTime: z.string().min(4, 'End time is required (e.g., 11:00)'),
  notes: z.string().optional(),
});

// Payment Recording
export const RecordOfflinePaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['OFFLINE_CASH', 'OFFLINE_UPI_QR', 'PAY_AT_SHOP']),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
});

// Review Submission
export const CreateReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  serviceType: z.string().min(2),
  comment: z.string().min(5, 'Review comment must be at least 5 characters'),
  fitRating: z.number().int().min(1).max(5).optional(),
  finishingRating: z.number().int().min(1).max(5).optional(),
});
