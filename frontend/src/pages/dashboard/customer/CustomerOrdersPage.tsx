import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Filter,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { Order } from '../../../types/order';
import { OrderCard } from '../../../components/shared/OrderCard';
import { CreateOrderModal } from '../../../components/shared/CreateOrderModal';
import { OrderDetailsModal } from '../../../components/shared/OrderDetailsModal';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { EmptyState } from '../../../components/common/FeedbackStates';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../../../components/common/SearchBar';
import { Search, X } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';
import { orderService } from '../../../services/orderService';
import { useTranslation } from '../../../i18n';

export const CustomerOrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Completed' | 'Cancelled'>('All');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');

  // Keep search query synced if URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await orderService.getCustomerOrders();
      setOrders(fetched);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to orders API';
      setError(msg);
      showToast('error', 'Orders Sync Error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    const st = order.status;
    let matchesStatus = true;
    if (filterStatus === 'Active') {
      matchesStatus = (
        st !== 'DELIVERED' &&
        st !== 'Completed' &&
        st !== 'CANCELLED' &&
        st !== 'Cancelled' &&
        st !== 'REJECTED'
      );
    } else if (filterStatus === 'Completed') {
      matchesStatus = st === 'DELIVERED' || st === 'Completed';
    } else if (filterStatus === 'Cancelled') {
      matchesStatus = st === 'CANCELLED' || st === 'Cancelled' || st === 'REJECTED';
    }

    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchId =
      String(order.id).toLowerCase().includes(q) ||
      (order.order_number && order.order_number.toLowerCase().includes(q)) ||
      (order.orderNumber && order.orderNumber.toLowerCase().includes(q));
    const matchItem =
      (order.itemTitle && order.itemTitle.toLowerCase().includes(q)) ||
      (order.category && order.category.toLowerCase().includes(q)) ||
      (order.items &&
        order.items.some(
          (it) =>
            (it.item_title && it.item_title.toLowerCase().includes(q)) ||
            (it.customization_notes && it.customization_notes.toLowerCase().includes(q))
        ));
    const matchTailor =
      (order.tailorName && order.tailorName.toLowerCase().includes(q)) ||
      (order.tailor_shop_name && order.tailor_shop_name.toLowerCase().includes(q));
    const matchNotes =
      (order.customer_notes && order.customer_notes.toLowerCase().includes(q)) ||
      (order.notes && order.notes.toLowerCase().includes(q));
    const matchStatus = order.status && String(order.status).toLowerCase().includes(q);
    const matchDelivery =
      order.delivery &&
      ((order.delivery.courier_name && order.delivery.courier_name.toLowerCase().includes(q)) ||
        (order.delivery.tracking_number && order.delivery.tracking_number.toLowerCase().includes(q)));

    return Boolean(matchId || matchItem || matchTailor || matchNotes || matchStatus || matchDelivery);
  });

  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setSelectedOrder(newOrder);
  };

  const handleOrderUpdated = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelectedOrder(updated);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/20 relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 9 Tailoring Orders</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t('customer.orders.title', 'My Bespoke Commissions')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t('customer.orders.subtitle', 'Real-time tracking of hand-cut tailoring stages, anatomical fittings, and doorstep delivery.')}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t('customer.orders.newCommission', 'Commission New Garment')}
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={fetchOrders}
            >
              {t('common.refresh', 'Refresh Orders')}
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Status Filter Row */}
      <Card className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex-1 max-w-lg">
          <SearchBar
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              if (val.trim()) {
                setSearchParams({ search: val });
              } else {
                setSearchParams({});
              }
            }}
            placeholder="Search orders by # (e.g. TC-2026-899), garment, atelier, notes, or status..."
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs self-start md:self-auto overflow-x-auto shrink-0">
          {(['All', 'Active', 'Completed', 'Cancelled'] as const).map((tab) => {
            const label =
              tab === 'All'
                ? t('common.all', 'All')
                : tab === 'Active'
                ? t('common.active', 'Active')
                : tab === 'Completed'
                ? t('common.completed', 'Completed')
                : t('common.cancelled', 'Cancelled');
            return (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  filterStatus === tab
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Search match stats */}
      {searchQuery && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <span>
            Found <strong className="text-white">{filteredOrders.length}</strong> matching {filteredOrders.length === 1 ? 'order' : 'orders'} for "{searchQuery}"
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchParams({});
            }}
            className="text-emerald-400 hover:text-emerald-300 font-semibold underline"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse p-6"
            />
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center border-red-500/20 bg-red-950/10">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">{t('customer.orders.loadError', 'Failed to Load Orders')}</h3>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchOrders} className="mt-4">
            {t('customer.orders.retry', 'Retry Connection')}
          </Button>
        </Card>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={(ord) => setSelectedOrder(ord)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            {searchQuery ? <Search className="w-8 h-8 text-emerald-400" /> : <ShoppingBag className="w-8 h-8 text-emerald-400" />}
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {searchQuery ? `No orders found matching "${searchQuery}"` : t('customer.orders.noOrders', 'No orders found.')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery
              ? 'Try searching with an order ID (e.g. "TC-2026-899"), garment type, atelier name, or change the status filter.'
              : t('customer.orders.subtitle', 'Track the artisan production and white-glove delivery of your orders')}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                }}
              >
                Clear Search
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                {t('customer.orders.orderNow', 'Explore Designs')}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOrderPlaced={handleOrderCreated}
      />

      {/* Order Details / Tracking Modal */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
};
