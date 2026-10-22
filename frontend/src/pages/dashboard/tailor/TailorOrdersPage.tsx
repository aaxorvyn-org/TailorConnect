import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Filter,
  Scissors,
  CheckCircle2,
  Clock,
  Calendar,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { Order, OrderStatus } from '../../../types/order';
import { OrderCard } from '../../../components/shared/OrderCard';
import { OrderDetailsModal } from '../../../components/shared/OrderDetailsModal';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Select } from '../../../components/common/FormFields';
import { EmptyState } from '../../../components/common/FeedbackStates';
import { useToast } from '../../../hooks/useToast';
import { orderService } from '../../../services/orderService';
import { useTranslation } from '../../../i18n';

export const TailorOrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await orderService.getTailorOrders();
      setOrders(fetched);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to atelier orders API';
      setError(msg);
      showToast('error', 'Sync Failed', msg);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const stagesList = [
    { value: 'All', label: 'All Workshop Stages' },
    { value: 'PENDING', label: 'Pending Atelier Review' },
    { value: 'ACCEPTED', label: 'Accepted Commissions' },
    { value: 'MEASUREMENT_CONFIRMED', label: 'Measurements Confirmed' },
    { value: 'CUTTING', label: 'Fabric Cutting' },
    { value: 'STITCHING', label: 'Hand Stitching' },
    { value: 'QUALITY_CHECK', label: 'Master Quality Check' },
    { value: 'READY', label: 'Ready for Dispatch' },
    { value: 'SHIPPED', label: 'In Transit' },
    { value: 'DELIVERED', label: 'Delivered' },
  ];

  const filtered = orders.filter((o) => {
    if (filterStage === 'All') return true;
    return o.status === filterStage;
  });

  const handleOrderUpdated = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelectedOrder(updated);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/20 relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Atelier Workshop Queue</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t('tailor.orders.title', 'Production & Commission Orders')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t('tailor.orders.subtitle', 'Review client orders, inspect anatomical measurements, and update progress')}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="md"
              leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={fetchOrders}
            >
              {t('common.refresh', 'Sync Production Queue')}
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span>{t('tailor.orders.filterStatus', 'Filter Workshop Stage:')}</span>
        </div>

        <div className="w-full sm:w-72">
          <Select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            options={stagesList}
          />
        </div>
      </Card>

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
          <h3 className="text-base font-bold text-white">{t('common.error', 'Failed to Load Atelier Orders')}</h3>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchOrders} className="mt-4">
            {t('common.refresh', 'Retry Sync')}
          </Button>
        </Card>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isTailorView
              onViewDetails={(ord) => setSelectedOrder(ord)}
              onUpdateStatus={(ord) => setSelectedOrder(ord)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('tailor.orders.noOrders', 'No Orders in Production')}
          description={
            filterStage === 'All'
              ? 'No client commissions have been submitted to this atelier yet.'
              : `No orders currently match the '${filterStage}' stage filter.`
          }
          actionLabel={t('common.refresh', 'Refresh Floor')}
          onAction={fetchOrders}
        />
      )}

      {/* Order Details & Stage Control Modal */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        isTailorView={true}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
};
