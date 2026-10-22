import { apiClient } from './api';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '../types/auth';

const TOKEN_KEY = 'threadcraft_token';
const USER_KEY = 'threadcraft_user';

export const authService = {
  /**
   * Log in user with email & password, storing session upon success
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      }),
    });

    if (data.access_token && data.user) {
      this.setSession(data.access_token, data.user);
    }
    return data;
  },

  /**
   * Register customer or tailor, storing session upon success
   */
  async register(registerData: RegisterData): Promise<AuthResponse> {
    const data = await apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...registerData,
        email: registerData.email.trim().toLowerCase(),
      }),
    });

    if (data.access_token && data.user) {
      this.setSession(data.access_token, data.user);
    }
    return data;
  },

  /**
   * Retrieve current authenticated user profile from backend /auth/me
   */
  async getCurrentUser(): Promise<User> {
    const user = await apiClient<User>('/auth/me', {
      method: 'GET',
    });
    // Update local cache
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * Log out current user, notify backend to blacklist token, and purge local cache
   */
  async logout(): Promise<void> {
    const token = this.getToken();
    try {
      if (token) {
        await apiClient<{ status: string; message: string }>('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({}),
        });
      }
    } catch (err) {
      // Even if network fails, always clear local session
      console.warn('Backend logout notification skipped or errored:', err);
    } finally {
      this.clearSession();
    }
  },

  /**
   * Get JWT bearer token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get cached user profile from localStorage
   */
  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Persist session to localStorage
   */
  setSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Request password reset code
   */
  async requestPasswordReset(email: string): Promise<{ status: string; message: string; code?: string }> {
    return await apiClient<{ status: string; message: string; code?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  },

  /**
   * Reset password with verification code
   */
  async resetPassword(payload: { email: string; code: string; new_password: string }): Promise<{ status: string; message: string }> {
    return await apiClient<{ status: string; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        code: payload.code.trim(),
        new_password: payload.new_password,
      }),
    });
  },
};
