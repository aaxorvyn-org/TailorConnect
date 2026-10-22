export interface Tailor {
  id: string;
  name: string;
  shopName: string;
  avatar: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  specialties: string[];
  startingPrice: number;
  location: {
    city: string;
    area: string;
    distanceKm?: number;
  };
  turnaroundDays: number;
  verified: boolean;
  featured: boolean;
  bio: string;
  completedOrders: number;
}

export interface NearbyTailor {
  shop_id: number;
  shop_name: string;
  shop_address: string;
  city: string;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  latitude: number;
  longitude: number;
  distance: number;
  rating?: number | null;
  review_count?: number | null;
  profile_image?: string | null;
  cover_image?: string | null;
  specialties?: string[];
  starting_price?: number | null;
  turnaround_days?: number | null;
  phone?: string | null;
  owner_name?: string | null;
  is_active: boolean;
}
