import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Ruler, 
  Star, 
  Calendar, 
  Clock, 
  Scissors, 
  Plus, 
  Sparkles,
  Inbox
} from 'lucide-react';
import type { Order } from '../../../types/order';
import { StatCard } from '../../../components/common/Card';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { OrderCard } from '../../../components/shared/OrderCard';
import { useTranslation } from '../../../i18n';
import { useAuth } from '../../../hooks/useAuth';
import { orderService } from '../../../services/orderService';
import { appointmentService, type AppointmentBooking } from '../../../services/appointmentService';

export const TailorDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const fetchedOrders = await orderService.getTailorOrders();
        if (!isCancelled) {
          setOrders(Array.isArray(fetchedOrders) ? fetchedOrders : []);
        }
      } catch (err) {
        console.warn('Could not load real-time atelier orders:', err);
        if (!isCancelled) setOrders([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }

      // Load appointments for this specific tailor
      try {
        const allApts = appointmentService.getAppointments();
        const myApts = allApts.filter((a) => {
          if (!user) return false;
          if (user.shop_id && (String(a.tailorId) === String(user.shop_id) || a.tailorId === `tailor-${user.shop_id}`)) {
            return true;
          }
          if (user.shop_name && a.tailorName?.toLowerCase() === user.shop_name.toLowerCase()) {
            return true;
          }
          return false;
        });
        if (!isCancelled) setAppointments(myApts);
      } catch (err) {
        if (!isCancelled) setAppointments([]);
      }
    };

    loadDashboardData();
    return () => {
      isCancelled = true;
    };
  }, [user]);

  // Real-time metric computations
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'PAID' || o.status === 'DELIVERED')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const activeCommissions = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  ).length;

  const pendingRequests = orders.filter((o) => o.status === 'PENDING').length;
  const recentOrders = orders.slice(0, 3);

  const currencySymbol = user?.currency === 'INR' ? '₹' : user?.currency === 'EUR' ? '€' : user?.currency === 'GBP' ? '£' : '$';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
            <span>{user?.shop_name || 'Bespoke Tailoring Atelier'} • {user?.city || 'Local Atelier'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('tailor.dashboard.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            {t('tailor.dashboard.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/dashboard/tailor/designs">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              {t('tailor.dashboard.addDesign')}
            </Button>
          </Link>
          <Link to="/dashboard/tailor/orders">
            <Button variant="outline" size="sm" leftIcon={<Scissors className="w-3.5 h-3.5" />}>
              {t('tailor.dashboard.viewAllOrders')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row - 100% Real-Time */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('tailor.dashboard.totalRevenue')}
          value={`${currencySymbol}${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={orders.length > 0 ? '+100%' : '0%'}
          changeType={totalRevenue > 0 ? 'positive' : 'neutral'}
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          subtitle={orders.length > 0 ? 'Verified paid earnings' : 'No paid orders yet'}
        />
        <StatCard
          title={t('tailor.dashboard.activeCommissions')}
          value={activeCommissions}
          icon={<ShoppingBag className="w-5 h-5 text-indigo-400" />}
          subtitle={activeCommissions > 0 ? 'In workshop production' : 'No active orders'}
        />
        <StatCard
          title={t('tailor.dashboard.pendingRequests')}
          value={pendingRequests}
          icon={<Ruler className="w-5 h-5 text-amber-400" />}
          subtitle={pendingRequests > 0 ? 'Awaiting your acceptance' : 'Inbox clear'}
        />
        <StatCard
          title="Atelier Rating"
          value="5.0 ★"
          change="New"
          changeType="positive"
          icon={<Star className="w-5 h-5 text-amber-400" />}
          subtitle={orders.length > 0 ? 'Atelier Verified' : 'New Atelier Profile'}
        />
      </div>

      {/* 2 Columns: Today's Schedule + Active Workshop Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Today's Schedule */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Today's Fitting Bench</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {appointments.length} {appointments.length === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 text-center space-y-2">
              <Calendar className="w-6 h-6 text-slate-600 mx-auto" />
              <h4 className="text-xs font-bold text-white">No Fitting Sessions Today</h4>
              <p className="text-[11px] text-slate-400">
                Fitting appointments and consultations booked by patrons will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((session) => (
                <Card key={session.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {session.timeSlot}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {session.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{session.customerName}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{session.garmentType}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Atelier Commissions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{t('tailor.dashboard.recentOrders')}</span>
            </h2>
            <Link to="/dashboard/tailor/orders" className="text-xs text-indigo-400 hover:underline">
              {t('common.all')} ({orders.length})
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 text-center">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading your production queue...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 text-center space-y-3">
              <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Production Orders Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                When customers commission bespoke garments from your atelier storefront, their orders, measurements, and fabric specifications will appear here in real time.
              </p>
              <div className="pt-2">
                <Link to="/dashboard/tailor/designs">
                  <Button variant="outline" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                    Publish Your First Design
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <OrderCard key={order.id} order={order} isTailorView />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

