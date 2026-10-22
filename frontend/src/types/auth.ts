export type UserRole = 'CUSTOMER' | 'TAILOR' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  is_active: boolean;
  is_verified: boolean;
  shop_name?: string | null;
  shop_id?: number | null;
  city?: string | null;
  experience_years?: number | null;
  specialties?: string | null;
  country?: string | null;
  currency?: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  shop_name?: string;
  city?: string;
  experience_years?: number;
  specialties?: string;
  country?: string;
  currency?: string;
  address?: string;
  admin_secret?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
