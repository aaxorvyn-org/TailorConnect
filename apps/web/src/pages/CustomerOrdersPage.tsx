import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@tailorconnect/api-client';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState, Skeleton } from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  Scissors,
  Clock,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      try {
        const res = await api.orders.getCustomerOrders();
        if (res.success && res.data) {
          setOrders(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  const activeOrders = orders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status));
  const completedOrders = orders.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status));

  const displayedOrders = activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Track Custom Garment Orders
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Live Amazon-style timeline progress from cutting through final delivery.
        </p>
      </div>

      {/* Active vs Completed Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors select-none ${
            activeTab === 'active'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Active Stitching ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors select-none ${
            activeTab === 'completed'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Past & Completed ({completedOrders.length})
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="p-6 rounded-2xl border border-stone-200 bg-white space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : displayedOrders.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-6 h-6 text-stone-400" />}
          title={activeTab === 'active' ? 'No active orders in progress' : 'No past orders found'}
          description={
            activeTab === 'active'
              ? 'Once you accept a quote from a tailor, your order will appear here with step-by-step timeline tracking.'
              : 'Completed and delivered garments will be archived here for reference.'
          }
          actionLabel="Find a Tailor"
          onAction={() => (window.location.href = '/explore')}
        />
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-stone-400">
                        {order.orderNumber}
                      </span>
                      <h3 className="font-bold text-lg text-stone-900">
                        {order.garmentName}
                      </h3>
                      <StatusBadge status={order.status} />
                    </div>

                    <p className="text-xs text-stone-600 flex items-center gap-2">
                      <span className="font-semibold text-stone-900">{order.business?.name}</span>
                      <span>·</span>
                      <span>Est. Ready: <strong>{formatDate(order.estimatedCompletion)}</strong></span>
                      <span>·</span>
                      <span>Total: <strong>{formatCurrency(order.totalAmount)}</strong></span>
                    </p>

                    {/* Latest Status History Note */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                      <p className="text-xs text-amber-900 bg-amber-50/70 border border-amber-200/60 p-2 rounded-lg italic">
                        Current Status Note: "{order.statusHistory[0].note}"
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <span className="text-xs font-semibold text-emerald-700">
                      Paid: {formatCurrency(order.paidAmount)} / {formatCurrency(order.totalAmount)}
                    </span>
                    <Link to={`/app/orders/${order.id}`}>
                      <Button size="sm">
                        View Order Timeline
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
