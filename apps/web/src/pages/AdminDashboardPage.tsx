import React, { useState, useEffect } from 'react';
import { api } from '@tailorconnect/api-client';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import {
  ShieldCheck,
  Users,
  Store,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Eye,
  Star,
  AlertTriangle,
} from 'lucide-react';

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'businesses' | 'orders' | 'reviews'>('businesses');

  // Order History Inspector Modal
  const [inspectedOrder, setInspectedOrder] = useState<any | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [mRes, bRes, oRes, rRes] = await Promise.all([
        api.admin.getDashboardMetrics(),
        api.admin.getBusinesses(),
        api.admin.getOrders(),
        api.admin.getReviews(),
      ]);

      if (mRes.success) setMetrics(mRes.data);
      if (bRes.success) setBusinesses(bRes.data || []);
      if (oRes.success) setOrders(oRes.data || []);
      if (rRes.success) setReviews(rRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerify = async (businessId: string) => {
    try {
      await api.admin.verifyBusiness(businessId);
      await loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSuspend = async (businessId: string) => {
    const reason = prompt('Reason for suspension:');
    if (!reason) return;
    try {
      await api.admin.suspendBusiness(businessId, reason);
      await loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <Badge variant="gold" className="mb-2">Admin Governance Console</Badge>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          TailorConnect Marketplace Administration
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Inspect studios, verify tailoring businesses, audit order timelines, and moderate reviews.
        </p>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Gross Platform GMV</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
                {formatCurrency(metrics.totalRevenue)}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">From completed custom garments</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Active Orders</span>
                <Clock className="w-4 h-4 text-slate-800" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
                {metrics.activeOrders}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">Across all registered ateliers</p>
            </CardContent>
          </Card>

          <Card className="border-amber-300 bg-amber-50/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Verification Queue</span>
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-amber-950 mt-2">
                {metrics.pendingVerifications}
              </p>
              <p className="text-[11px] text-amber-800 mt-1">Awaiting document inspection</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Verified Studios</span>
                <Store className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
                {metrics.verifiedBusinesses}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">Active in discovery marketplace</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('businesses')}
          className={`py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'businesses' ? 'border-slate-900 text-slate-900' : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Studios & Verification ({businesses.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'orders' ? 'border-slate-900 text-slate-900' : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Order Audit Logs ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`py-3 px-4 border-b-2 transition-colors ${
            activeTab === 'reviews' ? 'border-slate-900 text-slate-900' : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Customer Reviews ({reviews.length})
        </button>
      </div>

      {/* Tab 1: Studios Management & Verification */}
      {activeTab === 'businesses' && (
        <div className="space-y-4">
          {businesses.map((b) => (
            <Card key={b.id} className="hover:shadow-sm">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-stone-900">{b.name}</h3>
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {b.businessType?.replace('_', ' ').toLowerCase()}
                    </Badge>
                    <Badge
                      variant={
                        b.verificationStatus === 'VERIFIED'
                          ? 'success'
                          : b.verificationStatus === 'PENDING'
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      {b.verificationStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500">
                    Location: {b.location?.addressLine1}, {b.location?.locality}, {b.location?.city} · Phone: +91 {b.phone}
                  </p>
                  <div className="flex gap-2 text-xs text-stone-600 pt-1">
                    <span>Turnaround: ~{b.typicalTurnaroundDays} days</span>
                    <span>·</span>
                    <span>Radius: {b.serviceRadiusKm} km</span>
                    <span>·</span>
                    <span>Rating: {Number(b.ratingAverage).toFixed(1)} ★ ({b.completedOrdersCount} orders)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {b.verificationStatus !== 'VERIFIED' && (
                    <Button size="sm" onClick={() => handleVerify(b.id)}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Approve & Verify
                    </Button>
                  )}
                  {b.verificationStatus !== 'SUSPENDED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSuspend(b.id)}
                      className="text-red-600 hover:bg-red-50 text-xs"
                    >
                      Suspend
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 2: Orders Inspection & Audit Log */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map((o) => (
            <Card key={o.id} className="hover:shadow-sm">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-stone-400">{o.orderNumber}</span>
                    <h3 className="font-bold text-stone-900">{o.garmentName}</h3>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-xs text-stone-500">
                    Customer: {o.customer?.profile?.firstName} {o.customer?.profile?.lastName} · Tailor: {o.business?.name} · Total: {formatCurrency(o.totalAmount)}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Timeline Entries: {o.statusHistory?.length || 0} transitions recorded immutably
                  </p>
                </div>

                <Button size="sm" variant="outline" onClick={() => setInspectedOrder(o)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> Inspect Audit Trail
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 3: Reviews Moderation */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-stone-900 text-sm">
                      {r.customer?.profile?.firstName} {r.customer?.profile?.lastName}
                    </span>
                    <span className="text-xs text-stone-400 ml-2">on {r.business?.name}</span>
                  </div>
                  <div className="flex text-amber-500">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-stone-700 italic">"{r.comment}"</p>
                <p className="text-[10px] text-stone-400">{formatDateTime(r.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inspect Audit Trail Modal */}
      <Modal
        isOpen={!!inspectedOrder}
        onClose={() => setInspectedOrder(null)}
        title={`Audit Trail: Order ${inspectedOrder?.orderNumber}`}
        description="Immutable transition history logged in OrderStatusHistory"
        maxWidth="lg"
      >
        {inspectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
              <p className="font-bold text-stone-900">{inspectedOrder.garmentName}</p>
              <p className="text-stone-500">
                Studio: {inspectedOrder.business?.name} · Customer: {inspectedOrder.customer?.profile?.firstName}
              </p>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {inspectedOrder.statusHistory?.map((h: any, i: number) => (
                <div key={h.id} className="p-3 rounded-xl border border-stone-200 bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">
                      Step {i + 1}: {h.toStatus}
                    </span>
                    <span className="text-stone-400 text-[10px]">{formatDateTime(h.createdAt)}</span>
                  </div>
                  {h.fromStatus && (
                    <span className="text-stone-400 text-[11px]">Transitioned from: {h.fromStatus}</span>
                  )}
                  {h.note && (
                    <p className="text-stone-700 italic mt-0.5">"{h.note}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
