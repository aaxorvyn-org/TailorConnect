import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MapPin, 
  ShoppingBag, 
  User, 
  Store, 
  Users, 
  Palette, 
  Settings, 
  ShieldCheck, 
  ArrowLeft,
  ChevronRight,
  Scissors,
  Menu,
  X,
  LogOut,
  Ruler
} from 'lucide-react';

import { appConfig } from '../../utils/env';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from '../../i18n';
import { ThemeToggle } from '../common/ThemeToggle';

export type DashboardRole = 'customer' | 'tailor' | 'admin';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarProps {
  role: DashboardRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('info', t('nav.signOut'), 'Successfully logged out.');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const customerNav: NavItem[] = [
    { label: t('customer.sidebar.overview'), path: '/dashboard/customer', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: t('customer.sidebar.nearby'), path: '/dashboard/customer/nearby', icon: <MapPin className="w-4 h-4" /> },
    { label: t('customer.sidebar.measurements'), path: '/dashboard/customer/measurements', icon: <Ruler className="w-4 h-4" /> },
    { label: t('customer.sidebar.orders'), path: '/dashboard/customer/orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: t('customer.sidebar.profile'), path: '/dashboard/customer/profile', icon: <User className="w-4 h-4" /> },
  ];

  const tailorNav: NavItem[] = [
    { label: t('tailor.sidebar.dashboard'), path: '/dashboard/tailor', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: t('tailor.sidebar.profile'), path: '/dashboard/tailor/profile', icon: <Store className="w-4 h-4" /> },
    { label: t('tailor.sidebar.customers'), path: '/dashboard/tailor/customers', icon: <Users className="w-4 h-4" /> },
    { label: t('tailor.sidebar.designs'), path: '/dashboard/tailor/designs', icon: <Palette className="w-4 h-4" /> },
    { label: t('tailor.sidebar.orders'), path: '/dashboard/tailor/orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: t('tailor.sidebar.settings'), path: '/dashboard/tailor/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const adminNav: NavItem[] = [
    { label: t('admin.nav.dashboard', 'Admin Overview'), path: '/dashboard/admin', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: t('admin.nav.tailors', 'Tailor Management'), path: '/dashboard/admin?tab=tailors', icon: <Scissors className="w-4 h-4" /> },
    { label: t('admin.nav.customers', 'Customer Management'), path: '/dashboard/admin?tab=customers', icon: <Users className="w-4 h-4" /> },
    { label: t('admin.nav.shops', 'Shop Management'), path: '/dashboard/admin?tab=shops', icon: <Store className="w-4 h-4" /> },
    { label: t('admin.nav.orders', 'Order Management'), path: '/dashboard/admin?tab=orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: t('admin.nav.reviews', 'Review Management'), path: '/dashboard/admin?tab=reviews', icon: <Palette className="w-4 h-4" /> },
  ];

  const navItems = role === 'customer' ? customerNav : role === 'tailor' ? tailorNav : adminNav;

  const roleColors = {
    customer: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    tailor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    admin: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  };

  const roleLabels = {
    customer: t('nav.customerPortal'),
    tailor: t('nav.tailorAtelier'),
    admin: t('nav.adminConsole'),
  };

  const isActive = (path: string) => {
    if (path.includes('?')) {
      return (location.pathname + location.search) === path;
    }
    return location.pathname === path && (!location.search || location.search === '?tab=overview');
  };

  const getDashboardHome = () => {
    if (role === 'customer') return '/dashboard/customer';
    if (role === 'tailor') return '/dashboard/tailor';
    return '/dashboard/admin';
  };

  return (
    <>
      {/* Mobile Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <Link to={getDashboardHome()} className="flex items-center space-x-2 group">
          <Scissors className="w-5 h-5 text-white transform -rotate-45 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-white text-sm">{appConfig.appName}</span>
          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${roleColors[role]}`}>
            {roleLabels[role]}
          </span>
        </Link>
        <div className="flex items-center space-x-2">
          <ThemeToggle variant="icon" />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300"
            aria-label="Toggle navigation drawer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top Header */}
          <div className="p-6 border-b border-slate-900">
            <Link to={getDashboardHome()} className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 flex items-center justify-center shadow-md border border-zinc-700 group-hover:scale-105 transition-transform">
                <Scissors className="w-4 h-4 text-zinc-950 font-bold transform -rotate-45" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-base text-white tracking-tight block truncate group-hover:text-zinc-300 transition-colors">
                  {appConfig.appName}
                </span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${roleColors[role]}`}>
                  {roleLabels[role]}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t('nav.workspaceMenu')}
            </div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-zinc-850 text-white font-semibold border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive(item.path) ? 'text-white' : 'text-zinc-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Switch Role Portals */}
          <div className="p-4 pt-2">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t('nav.switchPortals')}
            </div>
            <div className="space-y-1 text-xs">
              {role !== 'customer' && (
                <Link
                  to="/dashboard/customer"
                  className="flex items-center justify-between p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <span>{t('nav.customerView')}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </Link>
              )}
              {role !== 'tailor' && (
                <Link
                  to="/dashboard/tailor"
                  className="flex items-center justify-between p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <span>{t('nav.tailorView')}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </Link>
              )}
              {role !== 'admin' && (
                <Link
                  to="/dashboard/admin"
                  className="flex items-center justify-between p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <span>{t('nav.adminView')}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions: Theme Toggle + Back to Store + Logout */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/60 space-y-1.5">
          <div className="pb-0.5">
            <ThemeToggle variant="pill" className="w-full justify-center" />
          </div>

          <Link
            to="/"
            title="Browse public marketplace catalog (session stays active)"
            className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
            <span>{t('auth.browseMarketplace', 'Browse Storefront')}</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>{t('nav.signOut')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
