import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@tailorconnect/api-client';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { OrderTimeline } from '../components/ui/OrderTimeline';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import {
  Scissors,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CreditCard,
  Star,
  CheckCircle2,
  FileText,
  AlertCircle,
  Truck,
} from 'lucide-react';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Online Pay Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const loadOrder = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.orders.getById(id);
      if (res.success && res.data) {
        setOrder(res.data);
        const remaining = Number(res.data.totalAmount) - Number(res.data.paidAmount);
        setPayAmount(remaining > 0 ? remaining : 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handlePayNow = async () => {
    if (!order) return;
    setIsPaying(true);
    try {
      const res = await api.payments.createIntent(order.id, payAmount, 'ONLINE_UPI');
      if (res.success) {
        setShowPayModal(false);
        await loadOrder();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPaying(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !reviewComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      const res = await api.reviews.create({
        orderId: order.id,
        rating,
        serviceType: order.garmentName,
        comment: reviewComment.trim(),
      });
      if (res.success) {
        setReviewSuccess(true);
        setShowReviewModal(false);
        await loadOrder();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-500">Loading order timeline...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-stone-900">Order Not Found</h2>
        <Link to="/app/orders" className="mt-4 inline-block">
          <Button size="sm">Back to My Orders</Button>
        </Link>
      </div>
    );
  }

  const remainingBalance = Math.max(0, Number(order.totalAmount) - Number(order.paidAmount));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Identity Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-stone-400">{order.orderNumber}</span>
            <h1 className="font-display text-2xl font-bold text-stone-900">{order.garmentName}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Ordered on {formatDate(order.createdAt)} · Estimated Completion: <strong>{formatDate(order.estimatedCompletion)}</strong>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {order.status === 'COMPLETED' && !order.review && (
            <Button size="sm" variant="secondary" onClick={() => setShowReviewModal(true)}>
              <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />
              Write Verified Review
            </Button>
          )}
          {remainingBalance > 0 && (
            <Button size="sm" onClick={() => setShowPayModal(true)}>
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Pay Balance ({formatCurrency(remainingBalance)})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Amazon-style Vertical Timeline Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Production Status Timeline</CardTitle>
                <p className="text-xs text-stone-500 mt-0.5">
                  Live verification of each garment stage updated by {order.business?.name}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-800">
                Est: {formatDate(order.estimatedCompletion)}
              </span>
            </CardHeader>
            <CardContent className="pt-2">
              <OrderTimeline
                currentStatus={order.status}
                history={order.statusHistory}
                estimatedDate={order.estimatedCompletion}
              />
            </CardContent>
          </Card>

          {/* Booked Appointments & Fitting Trials */}
          {order.appointments && order.appointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-800" />
                  Scheduled Fitting / Visits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.appointments.map((apt: any) => (
                  <div key={apt.id} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-stone-900 capitalize">{apt.type.toLowerCase()} Appointment</p>
                      <p className="text-stone-600 mt-0.5">
                        {formatDate(apt.date)} at <strong>{apt.startTime} - {apt.endTime}</strong>
                      </p>
                      {apt.notes && <p className="text-stone-500 italic mt-1">"{apt.notes}"</p>}
                    </div>
                    <Badge variant="gold">{apt.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Customer Review Summary (if left) */}
          {order.review && (
            <Card className="bg-emerald-50/40 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Your Verified Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-xs text-emerald-950">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: order.review.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <span className="text-stone-600 ml-1 font-bold">{order.review.rating} / 5</span>
                </div>
                <p className="italic">"{order.review.comment}"</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Tailor Details & Itemized Price Summary */}
        <div className="space-y-6">
          {/* Tailor Studio Card */}
          <Card>
            <CardHeader className="pb-3">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Assigned Studio</span>
              <CardTitle className="text-base">
                <Link to={`/tailors/${order.business?.slug}`} className="hover:text-amber-700 transition-colors">
                  {order.business?.name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-stone-600">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                <span>{order.business?.location?.addressLine1}, {order.business?.location?.locality}, {order.business?.location?.city}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                <span>+91 {order.business?.phone}</span>
              </p>
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="font-semibold text-stone-900">Delivery Method:</span>
                <Badge variant="secondary">{order.deliveryOption}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Billing Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Total & Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {/* Line items */}
              {order.quote?.items && order.quote.items.length > 0 && (
                <div className="space-y-1.5 pb-3 border-b border-stone-100">
                  {order.quote.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-stone-600">
                      <span>{item.title}</span>
                      <span className="font-medium text-stone-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between font-bold text-sm text-stone-900">
                <span>Total Amount</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Amount Paid</span>
                <span className="font-semibold">{formatCurrency(order.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-stone-700 pt-1 border-t border-stone-100">
                <span>Pending Balance</span>
                <span className="font-bold text-amber-700">{formatCurrency(remainingBalance)}</span>
              </div>

              {/* Status banner */}
              <div className="pt-2">
                <Badge
                  variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                  className="w-full justify-center py-1 text-xs"
                >
                  Payment: {order.paymentStatus}
                </Badge>
              </div>

              {/* Payments log */}
              {order.payments && order.payments.length > 0 && (
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <p className="font-semibold text-[11px] text-stone-400 uppercase tracking-wider">Payment Receipts</p>
                  {order.payments.map((p: any) => (
                    <div key={p.id} className="p-2 rounded-lg bg-stone-50 border border-stone-100 flex justify-between">
                      <div>
                        <p className="font-medium text-stone-900">{p.paymentNumber}</p>
                        <p className="text-[10px] text-stone-500">{p.method?.replace('_', ' ')} · {formatDate(p.createdAt)}</p>
                      </div>
                      <span className="font-semibold text-emerald-700">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Online Pay Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Settle Order Payment"
        description="Choose payment amount and simulate instant settlement via test payment adapter."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-stone-700 font-medium mb-1">Payment Amount (₹)</label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              max={remainingBalance}
              className="w-full p-2.5 rounded-lg border border-stone-200 text-base font-bold text-stone-900"
            />
            <p className="text-[11px] text-stone-500 mt-1">Remaining balance: {formatCurrency(remainingBalance)}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-stone-800">
            <p className="font-semibold">Test / Mock Payment Adapter</p>
            <p className="text-[11px] text-stone-600 mt-0.5">
              Simulates live payment gateway authorization without requiring production credentials.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setShowPayModal(false)}>Cancel</Button>
            <Button size="md" onClick={handlePayNow} isLoading={isPaying} disabled={payAmount <= 0}>
              Authorize & Pay {formatCurrency(payAmount)}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Write Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review Your Finished Garment"
        description="Only customers with completed custom orders can submit verified ratings."
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-stone-700 font-semibold mb-1">Overall Star Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Your Review & Fit Feedback"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="How was the fitting, stitching quality, finishing, and turnaround commitment?"
            rows={4}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button type="submit" size="md" isLoading={isSubmittingReview} disabled={!reviewComment.trim()}>
              Submit Verified Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
