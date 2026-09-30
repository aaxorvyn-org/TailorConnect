import React, { useState, useEffect } from 'react';
import { api } from '@tailorconnect/api-client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { EmptyState, Skeleton } from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  Scissors,
  Clock,
  Calendar,
  Phone,
  CheckCircle2,
  CreditCard,
  Banknote,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const STAGE_TRANSITIONS: Record<string, string[]> = {
  ACCEPTED: ['MEASUREMENT', 'CUTTING', 'CANCELLED'],
  APPOINTMENT_BOOKED: ['MEASUREMENT', 'CANCELLED'],
  MEASUREMENT: ['CUTTING', 'CANCELLED'],
  CUTTING: ['STITCHING', 'CANCELLED'],
  STITCHING: ['FITTING', 'READY', 'CANCELLED'],
  FITTING: ['ALTERATION', 'READY'],
  ALTERATION: ['FITTING', 'READY'],
  READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'COMPLETED'],
  DELIVERED: ['COMPLETED'],
};

export function TailorOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Status Advance Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Offline Payment Modal
  const [payOrder, setPayOrder] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'OFFLINE_CASH' | 'OFFLINE_UPI_QR'>('OFFLINE_UPI_QR');
  const [payNotes, setPayNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.orders.getTailorOrders();
      if (res.success && res.data) {
        setOrders(res.data);
        setMetrics(res.meta || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openAdvanceModal = (order: any, nextStatus?: string) => {
    setSelectedOrder(order);
    const available = STAGE_TRANSITIONS[order.status] || [];
    setTargetStatus(nextStatus || available[0] || 'STITCHING');
    setStatusNote('');
  };

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !targetStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await api.orders.transitionStatus(selectedOrder.id, targetStatus, statusNote);
      if (res.success) {
        setSelectedOrder(null);
        await loadOrders();
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRecordOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payOrder || payAmount <= 0) return;
    setIsRecordingPayment(true);
    try {
      const res = await api.payments.recordOffline({
        orderId: payOrder.id,
        amount: payAmount,
        method: payMethod,
        notes: payNotes || 'Payment settled in shop',
      });
      if (res.success) {
        setPayOrder(null);
        await loadOrders();
      }
    } catch (e: any) {
      alert(e.message || 'Failed to record payment');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'DUE_TODAY') {
      const todayStr = new Date().toISOString().split('T')[0];
      return o.estimatedCompletion?.split('T')[0] === todayStr && !['COMPLETED', 'CANCELLED'].includes(o.status);
    }
    if (statusFilter === 'IN_PROGRESS') {
      return ['MEASUREMENT', 'CUTTING', 'STITCHING', 'FITTING', 'ALTERATION'].includes(o.status);
    }
    if (statusFilter === 'READY') {
      return ['READY', 'OUT_FOR_DELIVERY'].includes(o.status);
    }
    if (statusFilter === 'COMPLETED') {
      return o.status === 'COMPLETED';
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Order Management Workbench
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Advance garment stages, record in-person cash/UPI payments, and keep customers informed.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-3 text-xs font-semibold">
        {[
          { key: 'ALL', label: `All Orders (${orders.length})` },
          { key: 'DUE_TODAY', label: `Due Today (${metrics.dueToday || 0})` },
          { key: 'IN_PROGRESS', label: `In Progress (${metrics.inProgress || 0})` },
          { key: 'READY', label: `Ready for Pickup (${metrics.ready || 0})` },
          { key: 'COMPLETED', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full transition-colors select-none ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 rounded-2xl border border-stone-200 bg-white space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<Scissors className="w-6 h-6 text-stone-400" />}
          title="No orders found in this filter"
          description="Orders move through this pipeline as you accept customer quotes and update tailoring milestones."
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const nextStages = STAGE_TRANSITIONS[order.status] || [];
            const remainingBalance = Math.max(0, Number(order.totalAmount) - Number(order.paidAmount));

            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Order summary */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-stone-400">{order.orderNumber}</span>
                        <h3 className="font-bold text-lg text-stone-900">{order.garmentName}</h3>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                        <span className="font-semibold text-stone-900">
                          Customer: {order.customer?.profile?.firstName} {order.customer?.profile?.lastName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          +91 {order.customer?.phone || '9876543210'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          Target: <strong>{formatDate(order.estimatedCompletion)}</strong>
                        </span>
                        <span className="font-bold text-stone-900">
                          Total: {formatCurrency(order.totalAmount)} (Paid: {formatCurrency(order.paidAmount)})
                        </span>
                      </div>

                      {/* Latest Note */}
                      {order.statusHistory && order.statusHistory.length > 0 && (
                        <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100 italic">
                          Latest Note: "{order.statusHistory[0].note}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                      {/* Advance Stage Primary Button */}
                      {nextStages.length > 0 && order.status !== 'COMPLETED' && (
                        <Button
                          size="sm"
                          onClick={() => openAdvanceModal(order, nextStages[0])}
                          className="w-full sm:w-auto"
                        >
                          <TrendingUp className="w-3.5 h-3.5 mr-1 text-amber-400" />
                          Advance to {nextStages[0].replace('_', ' ')}
                        </Button>
                      )}

                      {/* Record Offline Payment Button */}
                      {remainingBalance > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPayOrder(order);
                            setPayAmount(remainingBalance);
                            setPayNotes('');
                          }}
                          className="w-full sm:w-auto text-xs"
                        >
                          <Banknote className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Record Cash / UPI
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Advance Status Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Advance Stage: ${selectedOrder?.garmentName}`}
        description="Every transition updates the customer's timeline and sends an in-app progress alert."
      >
        {selectedOrder && (
          <form onSubmit={handleStatusTransition} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Select Next Production Stage</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-stone-200 bg-white font-semibold text-stone-900"
              >
                {(STAGE_TRANSITIONS[selectedOrder.status] || []).map((st) => (
                  <option key={st} value={st}>
                    {st.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <Textarea
              label="Transition Note (Visible to Customer on Timeline)"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Lining attached. Ready for trial fitting on Friday."
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" size="md" isLoading={isUpdatingStatus}>
                Confirm Stage Transition
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Record In-Person Offline Payment Modal */}
      <Modal
        isOpen={!!payOrder}
        onClose={() => setPayOrder(null)}
        title="Record In-Person Payment"
        description="Log offline cash or UPI QR payments received at the studio or doorstep."
      >
        {payOrder && (
          <form onSubmit={handleRecordOfflinePayment} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Amount Received (₹)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                max={Number(payOrder.totalAmount) - Number(payOrder.paidAmount)}
                className="w-full p-2.5 rounded-lg border border-stone-200 text-sm font-bold text-stone-900"
                required
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-stone-200 bg-white"
              >
                <option value="OFFLINE_UPI_QR">In-Shop UPI QR Code</option>
                <option value="OFFLINE_CASH">Physical Cash</option>
                <option value="PAY_AT_SHOP">Pay at Shop</option>
              </select>
            </div>

            <Input
              label="Receipt Notes / Transaction Reference"
              value={payNotes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayNotes(e.target.value)}
              placeholder="e.g. Paid in cash during fitting trial"
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setPayOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" size="md" isLoading={isRecordingPayment}>
                Save Payment Receipt
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
