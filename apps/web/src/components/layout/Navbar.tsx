import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Scissors,
  MapPin,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Check,
} from 'lucide-react';

export function Navbar() {
  const { user, logout, loginAsDemo } = useAuth();
  const { unreadCount, notifications, markRead } = useNotifications();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-stone-900 tracking-tight flex items-center gap-1.5">
                TailorConnect
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase">
                  V1
                </span>
              </span>
              <p className="text-[10px] text-stone-500 tracking-wider uppercase font-medium">
                Bespoke Atelier Marketplace
              </p>
            </div>
          </Link>

          {/* Location Indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100/80 px-3 py-1.5 rounded-full border border-stone-200">
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span>Hyderabad, TS</span>
            <span className="text-stone-300">·</span>
            <span className="text-stone-500">Madhapur & Banjara Hills</span>
          </div>
        </div>

        {/* Navigation links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-700">
          <Link to="/explore" className="hover:text-stone-900 transition-colors">
            Find Tailors
          </Link>
          {user?.role === 'CUSTOMER' && (
            <>
              <Link to="/app/requests" className="hover:text-stone-900 transition-colors">
                My Requests
              </Link>
              <Link to="/app/orders" className="hover:text-stone-900 transition-colors">
                Track Orders
              </Link>
            </>
          )}
          {user?.role === 'BUSINESS' && (
            <>
              <Link to="/tailor/dashboard" className="hover:text-stone-900 transition-colors">
                Studio Dashboard
              </Link>
              <Link to="/tailor/requests" className="hover:text-stone-900 transition-colors">
                Inbound Requests
              </Link>
              <Link to="/tailor/orders" className="hover:text-stone-900 transition-colors">
                Work Orders
              </Link>
            </>
          )}
          {user?.role === 'ADMIN' && (
            <Link to="/admin/dashboard" className="hover:text-stone-900 transition-colors text-amber-700 font-semibold">
              Admin Console
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Role Switcher (Hidden in production) */}
          {import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_BAR !== 'false' && (
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors"
                title="Switch demo persona for instant testing"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Demo:</span>
                <span className="capitalize">{user ? user.role.toLowerCase() : 'Switch Persona'}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    1-Click Demo Accounts
                  </div>
                  <button
                    onClick={async () => {
                      await loginAsDemo('customer');
                      setShowDemoMenu(false);
                      navigate('/app/orders');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center justify-between text-stone-800"
                  >
                    <div>
                      <p className="font-semibold">Customer: Priya</p>
                      <p className="text-[11px] text-stone-500">Active bridal blouse order</p>
                    </div>
                    {user?.email === 'priya.sharma@example.com' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                  <button
                    onClick={async () => {
                      await loginAsDemo('tailor');
                      setShowDemoMenu(false);
                      navigate('/tailor/dashboard');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center justify-between text-stone-800"
                  >
                    <div>
                      <p className="font-semibold">Tailor: Meera Boutique</p>
                      <p className="text-[11px] text-stone-500">Banjara Hills studio</p>
                    </div>
                    {user?.email === 'meera@meeraboutique.com' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                  <button
                    onClick={async () => {
                      await loginAsDemo('admin');
                      setShowDemoMenu(false);
                      navigate('/admin/dashboard');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center justify-between text-stone-800"
                  >
                    <div>
                      <p className="font-semibold">Admin Console</p>
                      <p className="text-[11px] text-stone-500">Approve studios & orders</p>
                    </div>
                    {user?.role === 'ADMIN' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notifications Dropdown */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 py-3 z-50 text-xs">
                  <div className="px-4 py-1.5 flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="font-semibold text-stone-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="gold" className="text-[10px]">
                        {unreadCount} unread
                      </Badge>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-stone-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markRead(n.id);
                            if (n.linkUrl) navigate(n.linkUrl);
                            setShowNotifications(false);
                          }}
                          className={`p-3.5 hover:bg-stone-50 cursor-pointer transition-colors ${
                            !n.isRead ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          <p className="font-semibold text-stone-900">{n.title}</p>
                          <p className="text-stone-600 mt-0.5 line-clamp-2">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Auth CTA */}
          {user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (user.role === 'BUSINESS') navigate('/tailor/profile');
                  else if (user.role === 'ADMIN') navigate('/admin/dashboard');
                  else navigate('/app/orders');
                }}
                className="hidden sm:inline-flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>{user.profile?.firstName || 'My Account'}</span>
              </Button>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-stone-500 hover:text-red-600 hover:bg-stone-100 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
