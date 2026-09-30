import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@tailorconnect/api-client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  Scissors,
  Clock,
  Inbox,
  Calendar,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function TailorDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>({ orders: [], metrics: {} });
  const [requestsCount, setRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [ordersRes, requestsRes] = await Promise.all([
          api.orders.getTailorOrders(),
          api.requests.getTailorInbox(),
        ]);
        if (ordersRes.success && ordersRes.data) {
          setData({ orders: ordersRes.data, metrics: ordersRes.meta || {} });
        }
        if (requestsRes.success && requestsRes.data) {
          setRequestsCount(requestsRes.data.length);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const metrics = data.metrics || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Studio Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Production Hub</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">
            {user?.business?.name || 'My Tailor Studio'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Manage your daily cutting, stitching, trials, and inbound quote requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/tailor/requests">
            <Button variant="secondary" size="sm">
              <Inbox className="w-4 h-4 mr-1.5" />
              View Requests ({requestsCount})
            </Button>
          </Link>
          <Link to="/tailor/orders">
            <Button variant="outline" size="sm" className="border-slate-700 text-white hover:bg-slate-800">
              <Scissors className="w-4 h-4 mr-1.5" />
              All Orders
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily Workload Metrics Counters (Section 28) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Due Today */}
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Due Today</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="font-display text-3xl font-extrabold text-amber-950 mt-2">
              {metrics.dueToday || 0}
            </p>
            <p className="text-[11px] text-amber-800 mt-1">Garments committed for delivery</p>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">In Progress</span>
              <Scissors className="w-4 h-4 text-slate-800" />
            </div>
            <p className="font-display text-3xl font-extrabold text-stone-900 mt-2">
              {metrics.inProgress || 0}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">In cutting, stitching or alteration</p>
          </CardContent>
        </Card>

        {/* Ready for Pickup */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Ready / Trials</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-display text-3xl font-extrabold text-stone-900 mt-2">
              {metrics.ready || 0}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">Ready for pickup or fitting trial</p>
          </CardContent>
        </Card>

        {/* New Inbound Requests */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">New Requests</span>
              <Inbox className="w-4 h-4 text-amber-600" />
            </div>
            <p className="font-display text-3xl font-extrabold text-stone-900 mt-2">
              {requestsCount}
            </p>
            <p className="text-[11px] text-stone-500 mt-1">Customers waiting for quotes</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Work Pipeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-stone-900">Current Production Queue</h2>
          <Link to="/tailor/orders" className="text-xs font-semibold text-amber-700 hover:underline">
            View Order Management Workbench →
          </Link>
        </div>

        {data.orders.length === 0 ? (
          <Card className="p-8 text-center text-xs text-stone-500">
            No active orders right now. Check inbound requests to quote new customers!
          </Card>
        ) : (
          <div className="space-y-3">
            {data.orders.slice(0, 5).map((order: any) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-stone-400">{order.orderNumber}</span>
                      <h3 className="font-bold text-stone-900">{order.garmentName}</h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-stone-500">
                      Customer: <strong>{order.customer?.profile?.firstName} {order.customer?.profile?.lastName}</strong> · Est. Ready: <strong>{formatDate(order.estimatedCompletion)}</strong> · Total: {formatCurrency(order.totalAmount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/tailor/orders`}>
                      <Button size="sm" variant="outline">
                        Advance Stage
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
