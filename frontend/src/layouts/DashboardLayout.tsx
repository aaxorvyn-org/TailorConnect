import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sidebar, type DashboardRole } from '../components/layout/Sidebar';
import { ToastContainer } from '../components/common/Toast';
import { Bell, Sparkles, LogOut, ShieldCheck, UserCheck, Search, X, ShoppingBag, Scissors, Ruler } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useTranslation } from '../i18n';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { ThemeToggle } from '../components/common/ThemeToggle';

export interface DashboardLayoutProps {
  role: DashboardRole;
  title?: string;
  subtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Global Header Search
  const [topSearch, setTopSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTopSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topSearch.trim()) return;
    const q = topSearch.trim();
    setIsSearchFocused(false);
    if (role === 'customer') {
      navigate(`/dashboard/customer/orders?search=${encodeURIComponent(q)}`);
    } else if (role === 'tailor') {
      navigate(`/dashboard/tailor/orders?search=${encodeURIComponent(q)}`);
    } else {
      navigate(`/dashboard/admin?search=${encodeURIComponent(q)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('info', t('nav.signOut'), 'You have been safely signed out of your session.');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'TC';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = user?.full_name || (role === 'customer' ? 'Customer Client' : role === 'tailor' ? 'Master Tailor' : 'System Administrator');
  const roleDisplay = user?.role || role.toUpperCase();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar role={role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Dashboard Header */}
        <header className="sticky top-0 z-30 h-16 bg-slate-950/85 backdrop-blur-md border-b border-slate-900 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-xs text-slate-400 hidden sm:inline">{t('nav.workspaceMenu')}</span>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 capitalize">
              {role === 'customer' ? t('nav.customerView') : role === 'tailor' ? t('nav.tailorView') : t('nav.adminView')}
            </span>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <UserCheck className="w-3 h-3 mr-1" />
              {t('nav.verifiedSession')}
            </span>
          </div>

          {/* Global Header Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md mx-4 hidden md:block">
            <form onSubmit={handleTopSearchSubmit} className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder={role === 'customer' ? 'Search orders, tailors, measurements...' : 'Search atelier records...'}
                className="w-full bg-slate-900/90 hover:bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              {topSearch && (
                <button
                  type="button"
                  onClick={() => setTopSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Quick Search Dropdown suggestions when focused */}
            {isSearchFocused && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl z-50 text-xs backdrop-blur-md">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                  Quick Search Actions
                </div>
                <button
                  type="button"
                  onMouseDown={() => {
                    navigate(`/dashboard/customer/orders${topSearch ? `?search=${encodeURIComponent(topSearch)}` : ''}`);
                    setIsSearchFocused(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Search My Orders {topSearch && `for "${topSearch}"`}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Orders</span>
                </button>
                <button
                  type="button"
                  onMouseDown={() => {
                    navigate(`/dashboard/customer/nearby${topSearch ? `?search=${encodeURIComponent(topSearch)}` : ''}`);
                    setIsSearchFocused(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-teal-400" />
                    <span>Search Nearby Tailors {topSearch && `for "${topSearch}"`}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Tailors</span>
                </button>
                <button
                  type="button"
                  onMouseDown={() => {
                    navigate(`/dashboard/customer/measurements${topSearch ? `?search=${encodeURIComponent(topSearch)}` : ''}`);
                    setIsSearchFocused(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-300 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-amber-400" />
                    <span>Search Made-to-Measure Profiles {topSearch && `for "${topSearch}"`}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Profiles</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Multilingual Selector */}
            <LanguageSelector />

            {/* Dark/Light Mode Theme Toggle */}
            <ThemeToggle variant="icon" />

            {/* Quick Public Link */}
            <Link
              to="/tailors"
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('nav.exploreTailors')}</span>
            </Link>

            {/* Notifications button */}
            <button
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors relative"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5" />
            </button>

            {/* User Profile Capsule */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-850">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {getInitials(displayName)}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <div className="font-semibold text-slate-200 truncate max-w-[140px]">
                  {displayName}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {roleDisplay}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition-all text-xs"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Dynamic Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </main>

      </div>

      <ToastContainer />
    </div>
  );
};
