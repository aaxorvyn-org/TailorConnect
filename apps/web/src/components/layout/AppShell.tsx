import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { PWAInstallBanner } from './PWAInstallBanner';
import { WifiOff } from 'lucide-react';

export function AppShell() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9]">
      <Navbar />
      <PWAInstallBanner />

      {/* Offline Indicator Banner */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs font-medium py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>You are currently offline. Viewing cached shell & orders.</span>
        </div>
      )}

      {/* Main Canvas */}
      <main className="flex-1 pb-20 lg:pb-12">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <BottomNav />
    </div>
  );
}
