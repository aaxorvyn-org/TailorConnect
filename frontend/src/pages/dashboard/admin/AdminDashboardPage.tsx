import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Store,
  Users,
  User,
  ShoppingBag,
  Star,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  X,
  Server,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { StatCard, Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input, Select } from '../../../components/common/FormFields';
import { Modal } from '../../../components/common/Modal';
import { LoadingSpinner, EmptyState } from '../../../components/common/FeedbackStates';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from '../../../i18n';
import { internationalService } from '../../../services/internationalService';
import { adminService } from '../../../services/adminService';
import type {
  AdminDashboardStats,
  AdminTailor,
  AdminCustomer,
  AdminShop,
  AdminOrder,
  AdminReview,
} from '../../../types/admin';

type AdminTab = 'overview' | 'tailors' | 'customers' | 'shops' | 'orders' | 'reviews';

export const AdminDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as AdminTab) || 'overview';
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Tab State
  const setTab = (tab: AdminTab) => {
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  // =========================================================================
  // 1. DASHBOARD OVERVIEW STATE
  // =========================================================================
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch admin stats';
      showToast('error', 'Stats Load Error', msg);
    } finally {
      setIsStatsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (currentTab === 'overview') {
      fetchStats();
    }
  }, [currentTab, fetchStats]);

  // =========================================================================
  // 2. TAILOR MANAGEMENT STATE
  // =========================================================================
  const [tailors, setTailors] = useState<AdminTailor[]>([]);
  const [tailorSearch, setTailorSearch] = useState('');
  const [tailorActiveFilter, setTailorActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [tailorPage, setTailorPage] = useState(1);
  const [tailorTotalPages, setTailorTotalPages] = useState(1);
  const [tailorTotal, setTailorTotal] = useState(0);
  const [isTailorsLoading, setIsTailorsLoading] = useState(false);

  const fetchTailors = useCallback(async () => {
    setIsTailorsLoading(true);
    try {
      const res = await adminService.getTailors({
        search: tailorSearch,
        is_active: tailorActiveFilter === 'All' ? undefined : tailorActiveFilter === 'Active',
        page: tailorPage,
        page_size: 10,
      });
      setTailors(res.items);
      setTailorTotal(res.total);
      setTailorTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load tailors';
      showToast('error', 'Tailor Load Error', msg);
    } finally {
      setIsTailorsLoading(false);
    }
  }, [tailorSearch, tailorActiveFilter, tailorPage, showToast]);

  useEffect(() => {
    if (currentTab === 'tailors') {
      fetchTailors();
    }
  }, [currentTab, fetchTailors]);

  const handleToggleTailorStatus = async (tailor: AdminTailor) => {
    try {
      const updated = await adminService.updateTailorStatus(tailor.id, {
        is_active: !tailor.is_active,
      });
      setTailors((prev) => prev.map((t) => (t.id === tailor.id ? updated : t)));
      showToast(
        'success',
        'Tailor Status Updated',
        `"${tailor.full_name}" is now ${updated.is_active ? 'ACTIVE' : 'DEACTIVATED'}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update tailor status';
      showToast('error', 'Update Failed', msg);
    }
  };

  // =========================================================================
  // 3. CUSTOMER MANAGEMENT STATE
  // =========================================================================
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerActiveFilter, setCustomerActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [customerPage, setCustomerPage] = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [isCustomersLoading, setIsCustomersLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsCustomersLoading(true);
    try {
      const res = await adminService.getCustomers({
        search: customerSearch,
        is_active: customerActiveFilter === 'All' ? undefined : customerActiveFilter === 'Active',
        page: customerPage,
        page_size: 10,
      });
      setCustomers(res.items);
      setCustomerTotal(res.total);
      setCustomerTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load customers';
      showToast('error', 'Customer Load Error', msg);
    } finally {
      setIsCustomersLoading(false);
    }
  }, [customerSearch, customerActiveFilter, customerPage, showToast]);

  useEffect(() => {
    if (currentTab === 'customers') {
      fetchCustomers();
    }
  }, [currentTab, fetchCustomers]);

  const handleToggleCustomerStatus = async (cust: AdminCustomer) => {
    try {
      const updated = await adminService.updateCustomerStatus(cust.id, {
        is_active: !cust.is_active,
      });
      setCustomers((prev) => prev.map((c) => (c.id === cust.id ? updated : c)));
      showToast(
        'success',
        'Customer Status Updated',
        `"${cust.full_name}" account is now ${updated.is_active ? 'ACTIVE' : 'DEACTIVATED'}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update customer status';
      showToast('error', 'Update Failed', msg);
    }
  };

  // =========================================================================
  // 4. SHOP MANAGEMENT STATE
  // =========================================================================
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [shopSearch, setShopSearch] = useState('');
  const [shopActiveFilter, setShopActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [shopPage, setShopPage] = useState(1);
  const [shopTotalPages, setShopTotalPages] = useState(1);
  const [shopTotal, setShopTotal] = useState(0);
  const [isShopsLoading, setIsShopsLoading] = useState(false);

  const fetchShops = useCallback(async () => {
    setIsShopsLoading(true);
    try {
      const res = await adminService.getShops({
        search: shopSearch,
        is_active: shopActiveFilter === 'All' ? undefined : shopActiveFilter === 'Active',
        page: shopPage,
        page_size: 10,
      });
      setShops(res.items);
      setShopTotal(res.total);
      setShopTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load shops';
      showToast('error', 'Shop Load Error', msg);
    } finally {
      setIsShopsLoading(false);
    }
  }, [shopSearch, shopActiveFilter, shopPage, showToast]);

  useEffect(() => {
    if (currentTab === 'shops') {
      fetchShops();
    }
  }, [currentTab, fetchShops]);

  const handleToggleShopStatus = async (shop: AdminShop) => {
    try {
      const updated = await adminService.updateShopStatus(shop.id, {
        is_active: !shop.is_active,
      });
      setShops((prev) => prev.map((s) => (s.id === shop.id ? updated : s)));
      showToast(
        'success',
        'Shop Storefront Updated',
        `"${shop.shop_name}" is now ${updated.is_active ? 'APPROVED / PUBLISHED' : 'SUSPENDED / PENDING'}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update shop storefront';
      showToast('error', 'Update Failed', msg);
    }
  };

  // =========================================================================
  // 5. ORDER MANAGEMENT STATE
  // =========================================================================
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<string>('ACCEPTED');
  const [overrideNotes, setOverrideNotes] = useState<string>('');

  const fetchOrders = useCallback(async () => {
    setIsOrdersLoading(true);
    try {
      const res = await adminService.getOrders({
        search: orderSearch,
        status: orderStatusFilter === 'All' ? undefined : orderStatusFilter,
        page: orderPage,
        page_size: 10,
      });
      setOrders(res.items);
      setOrderTotal(res.total);
      setOrderTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders';
      showToast('error', 'Order Load Error', msg);
    } finally {
      setIsOrdersLoading(false);
    }
  }, [orderSearch, orderStatusFilter, orderPage, showToast]);

  useEffect(() => {
    if (currentTab === 'orders') {
      fetchOrders();
    }
  }, [currentTab, fetchOrders]);

  const handleSaveOrderStatus = async () => {
    if (!editingOrder) return;
    try {
      const updated = await adminService.updateOrderStatus(editingOrder.id, {
        status: overrideStatus,
        notes: overrideNotes.trim() || undefined,
      });
      setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? updated : o)));
      showToast('success', 'Order Status Overridden', `Commission #${editingOrder.order_number} set to ${updated.status}.`);
      setEditingOrder(null);
      setOverrideNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to override status';
      showToast('error', 'Override Failed', msg);
    }
  };

  // =========================================================================
  // 6. REVIEW MANAGEMENT STATE
  // =========================================================================
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number>(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    setIsReviewsLoading(true);
    try {
      const res = await adminService.getReviews({
        search: reviewSearch,
        rating: reviewRatingFilter > 0 ? reviewRatingFilter : undefined,
        page: reviewPage,
        page_size: 10,
      });
      setReviews(res.items);
      setReviewTotal(res.total);
      setReviewTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load reviews';
      showToast('error', 'Review Load Error', msg);
    } finally {
      setIsReviewsLoading(false);
    }
  }, [reviewSearch, reviewRatingFilter, reviewPage, showToast]);

  useEffect(() => {
    if (currentTab === 'reviews') {
      fetchReviews();
    }
  }, [currentTab, fetchReviews]);

  const handleDeleteReview = async (review: AdminReview) => {
    if (!window.confirm(`Are you sure you wish to moderate and delete review #${review.id}?`)) return;
    try {
      await adminService.deleteReview(review.id);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      showToast('info', 'Review Moderated', `Review #${review.id} has been permanently deleted.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete review';
      showToast('error', 'Delete Failed', msg);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-amber-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Governance Console</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Administrator Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Global oversight across master tailors, patron accounts, atelier storefronts, bespoke commission lifecycles, and client reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => {
              if (currentTab === 'overview') fetchStats();
              if (currentTab === 'tailors') fetchTailors();
              if (currentTab === 'customers') fetchCustomers();
              if (currentTab === 'shops') fetchShops();
              if (currentTab === 'orders') fetchOrders();
              if (currentTab === 'reviews') fetchReviews();
            }}
          >
            Refresh Records
          </Button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Stats', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'tailors', label: 'Tailor Management', icon: <Users className="w-4 h-4" /> },
          { id: 'customers', label: 'Customer Management', icon: <User className="w-4 h-4" /> },
          { id: 'shops', label: 'Shop Management', icon: <Store className="w-4 h-4" /> },
          { id: 'orders', label: 'Order Management', icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'reviews', label: 'Review Management', icon: <Star className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id as AdminTab)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center space-x-2 transition-all whitespace-nowrap ${
              currentTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & DASHBOARD METRICS                                       */}
      {/* ========================================================================= */}
      {currentTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {isStatsLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : stats ? (
            <>
              {/* Primary Metrics Grid (Total Customers, Tailors, Shops, Orders, Pending Approvals, Completed Orders) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <StatCard
                  title="Total Customers"
                  value={stats.total_customers}
                  icon={<User className="w-4 h-4 text-emerald-400" />}
                  subtitle="Registered patrons"
                />
                <StatCard
                  title="Total Tailors"
                  value={stats.total_tailors}
                  icon={<Users className="w-4 h-4 text-indigo-400" />}
                  subtitle="Artisan accounts"
                />
                <StatCard
                  title="Total Shops"
                  value={stats.total_shops}
                  icon={<Store className="w-4 h-4 text-amber-400" />}
                  subtitle="Active ateliers"
                />
                <StatCard
                  title="Total Orders"
                  value={stats.total_orders}
                  icon={<ShoppingBag className="w-4 h-4 text-sky-400" />}
                  subtitle="All commissions"
                />
                <StatCard
                  title="Pending Approvals"
                  value={stats.pending_shop_approvals}
                  icon={<Clock className="w-4 h-4 text-rose-400" />}
                  subtitle="Awaiting authorization"
                  changeType={stats.pending_shop_approvals > 0 ? 'negative' : 'positive'}
                />
                <StatCard
                  title="Completed Orders"
                  value={stats.completed_orders}
                  icon={<CheckCircle2 className="w-4 h-4 text-teal-400" />}
                  subtitle="Delivered & fitted"
                />
              </div>

              {/* Total Revenue Highlight Card */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                      Platform Gross Tailoring Volume
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                      {internationalService.formatCurrency(stats.total_revenue, stats.currency || 'USD')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setTab('orders')}>
                    View Orders Ledger
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => setTab('shops')}>
                    Audit Ateliers
                  </Button>
                </div>
              </div>

              {/* Split Activity Panels: Recent Orders & Recent Tailors */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Commissions */}
                <Card className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-400" />
                      Recent Bespoke Commissions
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setTab('orders')}>
                      View All
                    </Button>
                  </div>

                  <div className="divide-y divide-slate-800/80">
                    {stats.recent_orders && stats.recent_orders.length > 0 ? (
                      stats.recent_orders.map((ord) => (
                        <div key={ord.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-mono font-bold text-white block">#{ord.order_number}</span>
                            <span className="text-slate-400">{ord.customer_name} • {ord.shop_name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-400 block">
                              {internationalService.formatCurrency(ord.total_amount, ord.currency || 'USD')}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                              {ord.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No orders registered yet.</p>
                    )}
                  </div>
                </Card>

                {/* Recent Registered Tailors */}
                <Card className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      Recent Tailor Onboarding
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setTab('tailors')}>
                      View All
                    </Button>
                  </div>

                  <div className="divide-y divide-slate-800/80">
                    {stats.recent_tailors && stats.recent_tailors.length > 0 ? (
                      stats.recent_tailors.map((tlr) => (
                        <div key={tlr.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-white block">{tlr.full_name}</span>
                            <span className="text-slate-400">{tlr.email} • {tlr.shop_name || 'Independent Master'}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              tlr.is_active
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {tlr.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No tailors registered yet.</p>
                    )}
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <EmptyState
              title="Failed to Load Dashboard Stats"
              description="Unable to retrieve metrics from backend API."
              actionLabel="Retry"
              onAction={fetchStats}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TAILOR MANAGEMENT                                                  */}
      {/* ========================================================================= */}
      {currentTab === 'tailors' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search tailor by name, email, city, shop..."
                value={tailorSearch}
                onChange={(e) => {
                  setTailorSearch(e.target.value);
                  setTailorPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={tailorActiveFilter}
                onChange={(e) => {
                  setTailorActiveFilter(e.target.value as any);
                  setTailorPage(1);
                }}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Active', label: 'Active Only' },
                  { value: 'Inactive', label: 'Deactivated / Suspended' },
                ]}
              />
            </div>
          </div>

          {isTailorsLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : tailors.length > 0 ? (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="p-4 pl-6">Master Tailor</th>
                      <th className="p-4">Contact &amp; Location</th>
                      <th className="p-4">Atelier Shop</th>
                      <th className="p-4">Verification</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {tailors.map((tailor) => (
                      <tr key={tailor.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 pl-6">
                          <span className="font-bold text-white block">{tailor.full_name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">ID: #{tailor.id}</span>
                        </td>
                        <td className="p-4 text-slate-300">
                          <span className="block">{tailor.email}</span>
                          <span className="text-slate-400 text-[11px]">{tailor.phone || 'No phone'} • {tailor.city || tailor.country || 'Global'}</span>
                        </td>
                        <td className="p-4 text-slate-300">
                          <span className="font-medium text-emerald-400">{tailor.shop_name || 'Independent'}</span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tailor.is_verified
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {tailor.is_verified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              tailor.is_active
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {tailor.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Button
                            size="sm"
                            variant={tailor.is_active ? 'danger' : 'primary'}
                            onClick={() => handleToggleTailorStatus(tailor)}
                          >
                            {tailor.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Showing {tailors.length} of {tailorTotal} tailors</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={tailorPage <= 1}
                    onClick={() => setTailorPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span>Page {tailorPage} of {tailorTotalPages}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={tailorPage >= tailorTotalPages}
                    onClick={() => setTailorPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              title="No Tailors Found"
              description="No tailor accounts matched the current search criteria."
              actionLabel="Reset Search"
              onAction={() => {
                setTailorSearch('');
                setTailorActiveFilter('All');
                setTailorPage(1);
              }}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CUSTOMER MANAGEMENT                                                */}
      {/* ========================================================================= */}
      {currentTab === 'customers' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search patron by name, email, phone..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setCustomerPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={customerActiveFilter}
                onChange={(e) => {
                  setCustomerActiveFilter(e.target.value as any);
                  setCustomerPage(1);
                }}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Active', label: 'Active Only' },
                  { value: 'Inactive', label: 'Deactivated Accounts' },
                ]}
              />
            </div>
          </div>

          {isCustomersLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : customers.length > 0 ? (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="p-4 pl-6">Patron Name</th>
                      <th className="p-4">Email &amp; Phone</th>
                      <th className="p-4">Country</th>
                      <th className="p-4">Orders Placed</th>
                      <th className="p-4">Total Invested</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {customers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 pl-6">
                          <span className="font-bold text-white block">{cust.full_name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">ID: #{cust.id}</span>
                        </td>
                        <td className="p-4 text-slate-300">
                          <span className="block">{cust.email}</span>
                          <span className="text-slate-400 text-[11px]">{cust.phone || 'No phone'}</span>
                        </td>
                        <td className="p-4 text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                            {cust.country || 'Global'}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-white">
                          {cust.orders_count}
                        </td>
                        <td className="p-4 font-mono font-bold text-emerald-400">
                          ${cust.total_spent.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              cust.is_active
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {cust.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Button
                            size="sm"
                            variant={cust.is_active ? 'danger' : 'primary'}
                            onClick={() => handleToggleCustomerStatus(cust)}
                          >
                            {cust.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Showing {customers.length} of {customerTotal} patrons</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={customerPage <= 1}
                    onClick={() => setCustomerPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span>Page {customerPage} of {customerTotalPages}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={customerPage >= customerTotalPages}
                    onClick={() => setCustomerPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              title="No Customers Found"
              description="No patron accounts matched the search filter."
              actionLabel="Reset Search"
              onAction={() => {
                setCustomerSearch('');
                setCustomerActiveFilter('All');
                setCustomerPage(1);
              }}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SHOP MANAGEMENT                                                    */}
      {/* ========================================================================= */}
      {currentTab === 'shops' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search atelier by shop name, cutter, city..."
                value={shopSearch}
                onChange={(e) => {
                  setShopSearch(e.target.value);
                  setShopPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={shopActiveFilter}
                onChange={(e) => {
                  setShopActiveFilter(e.target.value as any);
                  setShopPage(1);
                }}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Active', label: 'Published / Approved' },
                  { value: 'Inactive', label: 'Suspended / Pending Approval' },
                ]}
              />
            </div>
          </div>

          {isShopsLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : shops.length > 0 ? (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="p-4 pl-6">Atelier Shop</th>
                      <th className="p-4">Master Cutter &amp; Contact</th>
                      <th className="p-4">Rating</th>
                      <th className="p-4">Commissions</th>
                      <th className="p-4">Starting Price</th>
                      <th className="p-4">Storefront Status</th>
                      <th className="p-4 pr-6 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {shops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 pl-6">
                          <span className="font-bold text-white block">{shop.shop_name}</span>
                          <span className="text-[11px] text-slate-400">{shop.city || 'Atelier Location'}</span>
                        </td>
                        <td className="p-4 text-slate-300">
                          <span className="block font-medium">{shop.owner_name}</span>
                          <span className="text-slate-400 text-[11px]">{shop.owner_email} • {shop.phone}</span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {shop.rating ? shop.rating.toFixed(1) : '5.0'}
                            <span className="text-[10px] text-slate-500 font-normal">({shop.review_count || 0})</span>
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-white">
                          {shop.orders_count}
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          {shop.starting_price ? `$${shop.starting_price}` : 'Bespoke'}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              shop.is_active
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {shop.is_active ? 'Approved & Live' : 'Pending / Suspended'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Button
                            size="sm"
                            variant={shop.is_active ? 'danger' : 'primary'}
                            onClick={() => handleToggleShopStatus(shop)}
                          >
                            {shop.is_active ? 'Suspend Storefront' : 'Approve & Publish'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Showing {shops.length} of {shopTotal} ateliers</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={shopPage <= 1}
                    onClick={() => setShopPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span>Page {shopPage} of {shopTotalPages}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={shopPage >= shopTotalPages}
                    onClick={() => setShopPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              title="No Shops Found"
              description="No atelier shops matched the filter criteria."
              actionLabel="Reset Search"
              onAction={() => {
                setShopSearch('');
                setShopActiveFilter('All');
                setShopPage(1);
              }}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ORDER MANAGEMENT                                                   */}
      {/* ========================================================================= */}
      {currentTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search order by #, customer, atelier..."
                value={orderSearch}
                onChange={(e) => {
                  setOrderSearch(e.target.value);
                  setOrderPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={orderStatusFilter}
                onChange={(e) => {
                  setOrderStatusFilter(e.target.value);
                  setOrderPage(1);
                }}
                options={[
                  { value: 'All', label: 'All Stages' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'ACCEPTED', label: 'Accepted' },
                  { value: 'MEASUREMENT_CONFIRMED', label: 'Measurements Confirmed' },
                  { value: 'CUTTING', label: 'Cutting' },
                  { value: 'STITCHING', label: 'Stitching' },
                  { value: 'QUALITY_CHECK', label: 'Quality Check' },
                  { value: 'READY', label: 'Ready' },
                  { value: 'SHIPPED', label: 'Shipped' },
                  { value: 'DELIVERED', label: 'Delivered' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                ]}
              />
            </div>
          </div>

          {isOrdersLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : orders.length > 0 ? (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="p-4 pl-6">Order Number</th>
                      <th className="p-4">Patron</th>
                      <th className="p-4">Atelier Studio</th>
                      <th className="p-4">Production Stage</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Total Investment</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 pr-6 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 pl-6 font-mono font-bold text-white">
                          #{ord.order_number}
                        </td>
                        <td className="p-4 text-slate-300">
                          <span className="font-semibold block">{ord.customer_name}</span>
                          <span className="text-[11px] text-slate-400">{ord.customer_email}</span>
                        </td>
                        <td className="p-4 text-emerald-400 font-medium">
                          {ord.tailor_shop_name}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                            {ord.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.payment_status === 'PAID'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-amber-500/15 text-amber-400'
                            }`}
                          >
                            {ord.payment_status || 'UNPAID'}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-white">
                          {internationalService.formatCurrency(ord.total_amount, ord.currency || 'USD')}
                        </td>
                        <td className="p-4 text-slate-400 text-[11px]">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingOrder(ord);
                              setOverrideStatus(ord.status);
                              setOverrideNotes('');
                            }}
                          >
                            Update Stage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Showing {orders.length} of {orderTotal} commissions</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={orderPage <= 1}
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span>Page {orderPage} of {orderTotalPages}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={orderPage >= orderTotalPages}
                    onClick={() => setOrderPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              title="No Orders Found"
              description="No commission records matched the current filter."
              actionLabel="Reset Search"
              onAction={() => {
                setOrderSearch('');
                setOrderStatusFilter('All');
                setOrderPage(1);
              }}
            />
          )}

          {/* Admin Order Stage Override Modal */}
          {editingOrder && (
            <Modal
              isOpen={Boolean(editingOrder)}
              onClose={() => setEditingOrder(null)}
              title={`Admin Stage Override: #${editingOrder.order_number}`}
              description="Manually advance, reset, or cancel a commission lifecycle stage with administrative audit entry."
              size="md"
            >
              <div className="space-y-4">
                <Select
                  label="Target Commission Stage"
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  options={[
                    { value: 'PENDING', label: 'Order Placed (Pending)' },
                    { value: 'ACCEPTED', label: 'Accepted by Atelier' },
                    { value: 'MEASUREMENT_CONFIRMED', label: 'Measurements Confirmed' },
                    { value: 'CUTTING', label: 'Cutting Cloth' },
                    { value: 'STITCHING', label: 'Artisanal Stitching' },
                    { value: 'QUALITY_CHECK', label: 'Quality Audit' },
                    { value: 'READY', label: 'Garment Ready' },
                    { value: 'SHIPPED', label: 'Shipped to Patron' },
                    { value: 'DELIVERED', label: 'Delivered' },
                    { value: 'CANCELLED', label: 'Cancelled by Admin' },
                  ]}
                />

                <Input
                  label="Administrative Reason / Audit Note"
                  placeholder="e.g., Override requested by patron due to express VIP priority..."
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                />

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <Button variant="secondary" size="sm" onClick={() => setEditingOrder(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveOrderStatus}>
                    Save Administrative Override
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: REVIEW MANAGEMENT                                                  */}
      {/* ========================================================================= */}
      {currentTab === 'reviews' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search reviews by comment, customer, shop..."
                value={reviewSearch}
                onChange={(e) => {
                  setReviewSearch(e.target.value);
                  setReviewPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={String(reviewRatingFilter)}
                onChange={(e) => {
                  setReviewRatingFilter(Number(e.target.value));
                  setReviewPage(1);
                }}
                options={[
                  { value: '0', label: 'All Star Ratings' },
                  { value: '5', label: '★★★★★ 5 Stars Only' },
                  { value: '4', label: '★★★★☆ 4 Stars' },
                  { value: '3', label: '★★★☆☆ 3 Stars' },
                  { value: '2', label: '★★☆☆☆ 2 Stars' },
                  { value: '1', label: '★☆☆☆☆ 1 Star' },
                ]}
              />
            </div>
          </div>

          {isReviewsLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <Card key={rev.id} className="p-5 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < rev.rating ? 'fill-current' : 'text-slate-700'}`}
                            />
                          ))}
                          <span className="font-bold text-xs text-white ml-1.5">{rev.rating}/5</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed italic bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                        &ldquo;{rev.comment || 'No written commentary provided.'}&rdquo;
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{rev.customer_name}</span>
                        <span className="text-slate-400 text-[11px]">
                          Atelier: <span className="text-emerald-400">{rev.tailor_shop_name}</span>
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => handleDeleteReview(rev)}
                      >
                        Moderate
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination Bar */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Showing {reviews.length} of {reviewTotal} reviews</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={reviewPage <= 1}
                    onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span>Page {reviewPage} of {reviewTotalPages}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={reviewPage >= reviewTotalPages}
                    onClick={() => setReviewPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No Reviews Recorded"
              description="No customer atelier reviews found under this filter."
              actionLabel="Reset Filter"
              onAction={() => {
                setReviewSearch('');
                setReviewRatingFilter(0);
                setReviewPage(1);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
