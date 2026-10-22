import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Scissors, 
  Menu, 
  X, 
  User, 
  ChevronDown, 
  Sparkles, 
  LayoutDashboard,
  ShieldCheck,
  Store,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { appConfig } from '../../utils/env';
import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from '../../i18n';
import { LanguageSelector } from '../common/LanguageSelector';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  isApiOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ isApiOnline = true }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardDropdownOpen, setDashboardDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const getUserDashboardPath = () => {
    if (!user) return '/dashboard/customer';
    if (user.role === 'CUSTOMER') return '/dashboard/customer';
    if (user.role === 'TAILOR') return '/dashboard/tailor';
    return '/dashboard/admin';
  };

  const getBrandHomePath = () => {
    if (!isAuthenticated || !user) return '/';
    return getUserDashboardPath();
  };

  const publicLinks = [
    { 
      label: isAuthenticated ? t('nav.dashboards') : t('nav.home'), 
      path: isAuthenticated ? getUserDashboardPath() : '/' 
    },
    { label: t('nav.findTailors'), path: '/tailors' },
    { label: t('nav.services'), path: '/services' },
    { label: t('nav.about'), path: '/about' },
    { label: t('nav.contact'), path: '/contact' },
  ];

  const dashboardLinks = [
    { label: t('nav.customerPortal'), path: '/dashboard/customer', icon: <User className="w-4 h-4 text-zinc-300" />, desc: t('nav.customerPortalDesc') },
    { label: t('nav.tailorAtelier'), path: '/dashboard/tailor', icon: <Store className="w-4 h-4 text-zinc-300" />, desc: t('nav.tailorAtelierDesc') },
    { label: t('nav.adminConsole'), path: '/dashboard/admin', icon: <ShieldCheck className="w-4 h-4 text-zinc-300" />, desc: t('nav.adminConsoleDesc') },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast('info', 'Signed Out', 'You have been safely signed out.');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 shadow-sm">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-18 py-2">
          
          {/* Brand Logo */}
          <Link to={getBrandHomePath()} className="flex items-center space-x-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-white text-zinc-950 flex items-center justify-center shadow-lg shadow-white/5 ring-1 ring-zinc-700 group-hover:scale-105 transition-all">
              <Scissors className="w-5 h-5 text-zinc-950 font-black transform -rotate-45" />
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white font-sans group-hover:text-zinc-300 transition-colors">
                ThreadCraft
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                {isAuthenticated && user ? user.role : 'Tailor Platform'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {publicLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-zinc-850 text-white font-semibold border border-zinc-700 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Items */}
          <div className="hidden md:flex items-center space-x-3.5">
            
            {/* Multilingual Selector */}
            <LanguageSelector variant="compact" />

            {/* Dark/Light Mode Theme Toggle */}
            <ThemeToggle variant="icon" />

            {/* Dashboard Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDashboardDropdownOpen(!dashboardDropdownOpen)}
                onBlur={() => setTimeout(() => setDashboardDropdownOpen(false), 200)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs sm:text-sm font-medium transition-colors"
                aria-expanded={dashboardDropdownOpen}
              >
                <LayoutDashboard className="w-4 h-4 text-zinc-300" />
                <span>{t('nav.dashboards')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dashboardDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    {t('nav.switchWorkspace')}
                  </div>
                  {dashboardLinks.map((dash) => (
                    <Link
                      key={dash.path}
                      to={dash.path}
                      onClick={() => setDashboardDropdownOpen(false)}
                      className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-850 text-slate-200 hover:text-white transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-slate-750 shrink-0">
                        {dash.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-white">
                          {dash.label}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {dash.desc}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Authenticated State vs Guest State */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2.5 pl-1">
                <Link
                  to={getUserDashboardPath()}
                  className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-zinc-700 text-xs sm:text-sm font-medium text-slate-200 hover:text-white transition-all group"
                >
                  <div className="w-7 h-7 rounded-full bg-zinc-800 text-white border border-zinc-700 font-bold text-xs flex items-center justify-center shadow-sm">
                    {user.full_name.charAt(0)}
                  </div>
                  <span className="truncate max-w-[140px] font-medium">{user.full_name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-750 uppercase">
                    {user.role}
                  </span>
                </Link>

                <button
                  onClick={handleSignOut}
                  title={t('nav.signOut')}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-zinc-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-4 py-2">
                    {t('nav.signIn')}
                  </Button>
                </Link>

                <Link to="/register">
                  <Button variant="primary" size="sm" className="text-xs sm:text-sm px-4 py-2" leftIcon={<Sparkles className="w-4 h-4" />}>
                    {t('nav.register')}
                  </Button>
                </Link>
              </div>
            )}

          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">{t('common.language')}</span>
              <LanguageSelector />
            </div>
            <ThemeToggle variant="pill" />
          </div>

          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('nav.workspaceMenu')}
            </div>
            {publicLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-zinc-850 text-white font-semibold border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t('nav.switchPortals')}
            </div>
            {dashboardLinks.map((dash) => (
              <Link
                key={dash.path}
                to={dash.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-900"
              >
                {dash.icon}
                <span>{dash.label}</span>
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{user.full_name}</div>
                    <div className="text-[10px] text-slate-400">{user.email} ({user.role})</div>
                  </div>
                  <Link
                    to={getUserDashboardPath()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2.5 py-1 rounded-lg bg-white text-zinc-950 font-semibold"
                  >
                    Dashboard
                  </Link>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-400 border-red-500/30"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                >
                  {t('nav.signOut')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    {t('nav.signIn')}
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                    {t('nav.register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
