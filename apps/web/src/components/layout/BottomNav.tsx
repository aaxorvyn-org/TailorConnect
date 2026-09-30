import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  FileText,
  Clock,
  Calendar,
  User,
  LayoutDashboard,
  Inbox,
  ShieldCheck,
  Star,
  Scissors,
} from 'lucide-react';

export function BottomNav() {
  const { user } = useAuth();

  // Role-specific bottom navigation tabs
  const getTabs = () => {
    if (user?.role === 'BUSINESS') {
      return [
        { label: 'Workload', to: '/tailor/dashboard', icon: LayoutDashboard },
        { label: 'Requests', to: '/tailor/requests', icon: Inbox },
        { label: 'Orders', to: '/tailor/orders', icon: Scissors },
        { label: 'Schedule', to: '/tailor/schedule', icon: Calendar },
        { label: 'Studio', to: '/tailor/profile', icon: User },
      ];
    }

    if (user?.role === 'ADMIN') {
      return [
        { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Studios', to: '/admin/businesses', icon: ShieldCheck },
        { label: 'Orders', to: '/admin/orders', icon: Clock },
        { label: 'Reviews', to: '/admin/reviews', icon: Star },
        { label: 'Profile', to: '/app/profile', icon: User },
      ];
    }

    // Default: Customer tabs
    return [
      { label: 'Discover', to: '/explore', icon: Compass },
      { label: 'Requests', to: '/app/requests', icon: FileText },
      { label: 'Orders', to: '/app/orders', icon: Clock },
      { label: 'Fittings', to: '/app/appointments', icon: Calendar },
      { label: 'Account', to: user ? '/app/profile' : '/login', icon: User },
    ];
  };

  const tabs = getTabs();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 safe-bottom lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors select-none ${
                  isActive
                    ? 'text-slate-900 font-bold'
                    : 'text-stone-400 hover:text-stone-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-amber-100 text-amber-900' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="mt-0.5 tracking-tight">{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
