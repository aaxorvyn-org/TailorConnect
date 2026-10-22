import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  isOnline: boolean;
  isLoading: boolean;
  latencyMs: number | null;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  isOnline,
  isLoading,
  latencyMs,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      <Navbar
        isOnline={isOnline}
        isLoading={isLoading}
        latencyMs={latencyMs}
      />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
};
