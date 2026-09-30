import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@tailorconnect/api-client';
import { useAuth } from './AuthContext';
import type { NotificationDto } from '@tailorconnect/types';

interface NotificationContextType {
  notifications: NotificationDto[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);

  const refresh = async () => {
    if (!user) return;
    try {
      const res = await api.notifications.getAll();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch {}
  };

  useEffect(() => {
    if (user) {
      refresh();
      const interval = setInterval(refresh, 15000); // 15s poll for notifications
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user]);

  const markRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
