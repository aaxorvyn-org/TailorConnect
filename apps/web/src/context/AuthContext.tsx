import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@tailorconnect/api-client';
import type { UserDto } from '@tailorconnect/types';

interface AuthContextType {
  user: UserDto | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<UserDto>;
  register: (data: any) => Promise<UserDto>;
  logout: () => Promise<void>;
  loginAsDemo: (type: 'customer' | 'tailor' | 'admin') => Promise<void>;
  setUserFromSession: (user: UserDto) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUserFromSession = (newUser: UserDto) => {
    setUser(newUser);
  };

  useEffect(() => {
    async function loadUser() {
      const token = api.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.auth.me();
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          api.setToken(null);
          setUser(null);
        }
      } catch {
        api.setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login({ identifier, password });
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Login failed');
      }
      api.setToken(res.data.accessToken);
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.auth.register(data);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Registration failed');
      }
      api.setToken(res.data.accessToken);
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {}
    api.setToken(null);
    setUser(null);
  };

  const loginAsDemo = async (type: 'customer' | 'tailor' | 'admin') => {
    if (type === 'customer') {
      await login('priya.sharma@example.com', 'Password123!');
    } else if (type === 'tailor') {
      await login('meera@meeraboutique.com', 'Password123!');
    } else if (type === 'admin') {
      await login('admin@tailorconnect.com', 'Password123!');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, loginAsDemo, setUserFromSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
