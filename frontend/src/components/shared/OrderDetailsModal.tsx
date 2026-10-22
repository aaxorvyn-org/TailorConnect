import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Ruler,
  MapPin,
  Calendar,
  Clock,
  Scissors,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Truck,
  Sparkles,
  User,
  Phone,
  FileText,
  ChevronRight,
  ShieldCheck,
  Copy,
  Check,
  Edit2,
  Plus,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, Textarea, Select } from '../common/FormFields';
import { useToast } from '../../hooks/useToast';
import { orderService } from '../../services/orderService';
import { internationalService } from '../../services/internationalService';
import { useTranslation } from '../../i18n';
import type { Order, OrderStatus, OrderDelivery, DeliveryUpdatePayload } from '../../types/order';

export interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  isTailorView?: boolean;
  onOrderUpdated?: (updated: Order) => void;
}

const PRODUCTION_STAGES: Array<{ status: OrderStatus; label: string; desc: string }> = [
  { status: 'PENDING', label: 'Order Placed', desc: 'Awaiting atelier review' },
  { status: 'ACCEPTED', label: 'Accepted', desc: 'Fabric reserved & schedule booked' },
  { status: 'MEASUREMENT_CONFIRMED', label: 'Measurements Verified', desc: 'Anatomical draft confirmed' },
  { status: 'CUTTING', label: 'Cloth Cutting', desc: 'Hand-shearing & pattern drafting' },
  { status: 'STITCHING', label: 'Artisanal Stitching', desc: 'Assembly & canvas structuring' },
  { status: 'QUALITY_CHECK', label: 'Quality Audit', desc: 'Master cutter inspection' },
  { status: 'READY', label: 'Garment Ready', desc: 'Pressed & prepared for dispatch' },
  { status: 'SHIPPED', label: 'In Transit', desc: 'Courier dispatch in progress' },
  { status: 'DELIVERED', label: 'Delivered & Fitted', desc: 'Handed over to patron' },
];

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  isTailorView = false,
  onOrderUpdated,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [selectedNextStatus, setSelectedNextStatus] = useState<OrderStatus>('ACCEPTED');
  const [statusNotes, setStatusNotes] = useState<string>('');

  // Delivery & Tracking state
  const [delivery, setDelivery] = useState<OrderDelivery | null>(order?.delivery || null);
  const [isEditingDelivery, setIsEditingDelivery] = useState<boolean>(false);
  const [isSavingDelivery, setIsSavingDelivery] = useState<boolean>(false);
  const [hasCopiedTracking, setHasCopiedTracking] = useState<boolean>(false);

  // Delivery Edit Form Fields
  const [deliveryMethod, setDeliveryMethod] = useState<string>('STANDARD_COURIER');
  const [courierName, setCourierName] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [deliveryStatus, setDeliveryStatus] = useState<string>('PENDING');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');

  // Synchronize delivery when order prop changes or modal opens
  useEffect(() => {
    if (order) {
      const curDelivery = order.delivery || null;
      setDelivery(curDelivery);
      if (curDelivery) {
        setDeliveryMethod(curDelivery.delivery_method || 'STANDARD_COURIER');
        setCourierName(curDelivery.courier_name || '');
        setTrackingNumber(curDelivery.tracking_number || '');
        setExpectedDeliveryDate(
          curDelivery.expected_delivery_date
            ? curDelivery.expected_delivery_date.split('T')[0]
            : ''
        );
        setDeliveryStatus(curDelivery.status || 'PENDING');
        setDeliveryNotes(curDelivery.notes || '');
      } else {
        // Attempt fresh delivery fetch from API
        orderService
          .getOrderDelivery(order.id)
          .then((fetched) => {
            if (fetched) {
              setDelivery(fetched);
              setDeliveryMethod(fetched.delivery_method || 'STANDARD_COURIER');
              setCourierName(fetched.courier_name || '');
              setTrackingNumber(fetched.tracking_number || '');
              setExpectedDeliveryDate(
                fetched.expected_delivery_date
                  ? fetched.expected_delivery_date.split('T')[0]
                  : ''
              );
              setDeliveryStatus(fetched.status || 'PENDING');
              setDeliveryNotes(fetched.notes || '');
            }
          })
          .catch(() => {
            // No delivery record yet; default state remains
          });
      }
      setIsEditingDelivery(false);
    }
  }, [order, isOpen]);

  if (!order) return null;

  const orderNumber = order.order_number || order.orderNumber || String(order.id);
  const currentStatus = order.status;
  const totalAmount = order.total_amount ?? order.price ?? 0;
  const subtotal = order.subtotal ?? (totalAmount > 15 ? totalAmount - 15 : totalAmount);
  const deliveryCharge = order.delivery_charge ?? 15.0;

  // Determine active stage index
  const activeStageIdx = PRODUCTION_STAGES.findIndex((s) => s.status === currentStatus);

  const handleUpdateStatus = async (targetStatus: OrderStatus, customNotes?: string) => {
    setIsUpdating(true);
    try {
      const updated = await orderService.updateOrderStatus(order.id, {
        status: targetStatus,
        notes: customNotes || statusNotes.trim() || undefined,
      });

      showToast(
        'success',
        'Order Stage Updated',
        `Order #${orderNumber} is now in "${targetStatus}" stage.`
      );
      onOrderUpdated?.(updated);
      setStatusNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update order status';
      showToast('error', 'Update Failed', msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCustomerCancel = async () => {
    if (!window.confirm('Are you sure you wish to cancel this commission?')) return;
    await handleUpdateStatus('CANCELLED', 'Cancelled by customer.');
  };

  const handleSaveDelivery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!order) return;
    setIsSavingDelivery(true);
    try {
      const payload: DeliveryUpdatePayload = {
        delivery_method: deliveryMethod,
        courier_name: courierName.trim() || undefined,
        tracking_number: trackingNumber.trim() || undefined,
        expected_delivery_date: expectedDeliveryDate || undefined,
        status: deliveryStatus,
        notes: deliveryNotes.trim() || undefined,
      };
      const updatedDelivery = await orderService.updateOrderDelivery(order.id, payload);
      setDelivery(updatedDelivery);
      setIsEditingDelivery(false);
      showToast(
        'success',
        t('delivery.saveTracking', 'Tracking Details Saved'),
        `Courier details for Order #${orderNumber} updated successfully.`
      );

      // If delivery status moved to SHIPPED or DELIVERED, reflect that in local order status
      let newOrderStatus = order.status;
      if (deliveryStatus === 'SHIPPED' && order.status !== 'DELIVERED') {
        newOrderStatus = 'SHIPPED';
      } else if (deliveryStatus === 'DELIVERED') {
        newOrderStatus = 'DELIVERED';
      }

      const updatedOrder: Order = {
        ...order,
        status: newOrderStatus,
        delivery: updatedDelivery,
      };
      onOrderUpdated?.(updatedOrder);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update delivery information';
      showToast('error', 'Delivery Update Failed', msg);
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const handleCopyTracking = () => {
    if (delivery?.tracking_number) {
      navigator.clipboard.writeText(delivery.tracking_number);
      setHasCopiedTracking(true);
      showToast('info', 'Copied', `Tracking #${delivery.tracking_number} copied to clipboard.`);
      setTimeout(() => setHasCopiedTracking(false), 2500);
    }
  };

  const getDeliveryStatusBadge = (st?: string) => {
    switch (st) {
      case 'DELIVERED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'OUT_FOR_DELIVERY':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'IN_TRANSIT':
      case 'SHIPPED':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'LABEL_CREATED':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'FAILED':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'PENDING':
      default:
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bespoke Commission #${orderNumber}`}
      description={order.tailor_shop_name || order.tailorName || 'Atelier Order'}
      size="xl"
    >
      <div className="space-y-6">
        {/* Status Header Strip */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Current Status</span>
              <span className="text-sm font-extrabold uppercase text-white tracking-wide">
                {currentStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Investment</span>
            <span className="text-lg font-mono font-extrabold text-emerald-400">
              {internationalService.formatCurrency(totalAmount, order.currency || 'USD')}
            </span>
          </div>
        </div>

        {/* Multi-Stage Stepper Track */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-emerald-400" />
            Atelier Production Timeline
          </h4>

          <div className="overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center min-w-[700px] justify-between relative px-2">
              {PRODUCTION_STAGES.map((stg, idx) => {
                const isPassed = activeStageIdx >= 0 && idx <= activeStageIdx;
                const isCurrent = idx === activeStageIdx;

                return (
                  <div key={stg.status} className="flex-1 flex flex-col items-center relative text-center">
                    {/* Connecting line */}
                    {idx > 0 && (
                      <div
                        className={`absolute top-3.5 right-1/2 left-[-50%] h-0.5 -z-0 transition-colors ${
                          isPassed ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      />
                    )}

                    {/* Stage Dot */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>

                    <span
                      className={`text-[10px] font-bold mt-2 truncate max-w-[80px] ${
                        isCurrent
                          ? 'text-emerald-400 font-extrabold'
                          : isPassed
                          ? 'text-slate-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {stg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DELIVERY & TRACKING LOGISTICS SECTION (PHASE 10)                           */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {t('delivery.title', 'Delivery & Tracking')}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {delivery?.delivery_method
                    ? t(`delivery.methods.${delivery.delivery_method}`, delivery.delivery_method.replace(/_/g, ' '))
                    : t('delivery.methods.STANDARD_COURIER', 'Standard Courier')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {delivery?.status && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getDeliveryStatusBadge(
                    delivery.status
                  )}`}
                >
                  {t(`delivery.statuses.${delivery.status}`, delivery.status.replace(/_/g, ' '))}
                </span>
              )}

              {isTailorView && !isEditingDelivery && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => setIsEditingDelivery(true)}
                >
                  {delivery?.tracking_number
                    ? t('delivery.updateTracking', 'Update Tracking')
                    : t('delivery.manageTracking', 'Add Tracking')}
                </Button>
              )}
            </div>
          </div>

          {/* Tailor Edit Form */}
          {isTailorView && isEditingDelivery ? (
            <div className="space-y-4 p-4 rounded-xl bg-slate-950/70 border border-sky-500/30">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  {t('delivery.manageTracking', 'Manage Delivery & Tracking')}
                </span>
                <span className="text-[11px] text-slate-400 italic">Manual Courier Dispatch</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Select
                  label={t('delivery.method', 'Delivery Method')}
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  options={[
                    { value: 'STANDARD_COURIER', label: t('delivery.methods.STANDARD_COURIER', 'Standard Courier') },
                    { value: 'EXPRESS_COURIER', label: t('delivery.methods.EXPRESS_COURIER', 'Express Air Courier') },
                    { value: 'WHITE_GLOVE', label: t('delivery.methods.WHITE_GLOVE', 'White-Glove Atelier Delivery') },
                    { value: 'LOCAL_DELIVERY', label: t('delivery.methods.LOCAL_DELIVERY', 'Local Hand Delivery') },
                    { value: 'SELF_PICKUP', label: t('delivery.methods.SELF_PICKUP', 'In-Store Atelier Pickup') },
                  ]}
                />

                <Select
                  label={t('delivery.status', 'Delivery Status')}
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                  options={[
                    { value: 'PENDING', label: t('delivery.statuses.PENDING', 'Pending Dispatch') },
                    { value: 'LABEL_CREATED', label: t('delivery.statuses.LABEL_CREATED', 'Shipping Label Created') },
                    { value: 'SHIPPED', label: t('delivery.statuses.SHIPPED', 'Dispatched / Shipped') },
                    { value: 'IN_TRANSIT', label: t('delivery.statuses.IN_TRANSIT', 'In Transit') },
                    { value: 'OUT_FOR_DELIVERY', label: t('delivery.statuses.OUT_FOR_DELIVERY', 'Out for Delivery') },
                    { value: 'DELIVERED', label: t('delivery.statuses.DELIVERED', 'Delivered') },
                    { value: 'FAILED', label: t('delivery.statuses.FAILED', 'Delivery Failed / Returned') },
                  ]}
                />

                <Input
                  label={t('delivery.courier', 'Courier Name')}
                  placeholder="e.g., Blue Dart, DHL Express, FedEx, India Post..."
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                />

                <Input
                  label={t('delivery.trackingNumber', 'Tracking Number')}
                  placeholder="e.g., BLU-984729103"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />

                <Input
                  type="date"
                  label={t('delivery.expectedDate', 'Expected Delivery Date')}
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />

                <div className="sm:col-span-2">
                  <Textarea
                    label={t('delivery.notes', 'Delivery Notes / Remarks')}
                    placeholder="e.g., Sealed in protective garment bag, hand-delivered with verification..."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsEditingDelivery(false)}
                  disabled={isSavingDelivery}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveDelivery}
                  isLoading={isSavingDelivery}
                >
                  {t('delivery.saveTracking', 'Save Tracking Details')}
                </Button>
              </div>
            </div>
          ) : (
            /* Read-Only Display Mode (Customer View or Tailor Preview) */
            <div>
              {delivery && (delivery.tracking_number || delivery.courier_name || delivery.expected_delivery_date) ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                    {/* Courier Name */}
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {t('delivery.courier', 'Courier Name')}
                      </span>
                      <p className="font-bold text-white text-sm">
                        {delivery.courier_name || 'Designated Courier'}
                      </p>
                    </div>

                    {/* Tracking Number */}
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {t('delivery.trackingNumber', 'Tracking Number')}
                      </span>
                      {delivery.tracking_number ? (
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-emerald-400 tracking-wider">
                            {delivery.tracking_number}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyTracking}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
                            title="Copy tracking number"
                          >
                            {hasCopiedTracking ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">{t('delivery.copied', 'Copied!')}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{t('delivery.copyTracking', 'Copy')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Not assigned yet</span>
                      )}
                    </div>

                    {/* Expected Delivery Date */}
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {t('delivery.expectedDate', 'Expected Delivery Date')}
                      </span>
                      <p className="font-bold text-white text-sm">
                        {delivery.expected_delivery_date
                          ? new Date(delivery.expected_delivery_date).toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Pending schedule'}
                      </p>
                    </div>
                  </div>

                  {/* Notes & Timestamps */}
                  {(delivery.notes || delivery.shipped_at || delivery.delivered_at) && (
                    <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs space-y-1">
                      {delivery.notes && (
                        <p className="text-slate-300">
                          <span className="text-slate-500 font-semibold">{t('delivery.notes', 'Notes')}:</span>{' '}
                          &ldquo;{delivery.notes}&rdquo;
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 pt-1">
                        {delivery.shipped_at && (
                          <span>
                            {t('delivery.shippedAt', 'Dispatched')}: {new Date(delivery.shipped_at).toLocaleString()}
                          </span>
                        )}
                        {delivery.delivered_at && (
                          <span className="text-emerald-400">
                            {t('delivery.deliveredAt', 'Delivered')}: {new Date(delivery.delivered_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2">
                  <Truck className="w-6 h-6 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    {isTailorView
                      ? t('delivery.noTracking', 'Tracking details have not been assigned yet.')
                      : t('delivery.noTrackingCustomer', 'Tracking details will appear here once the atelier dispatches your garment.')}
                  </p>
                  {isTailorView && (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => setIsEditingDelivery(true)}
                    >
                      {t('delivery.manageTracking', 'Add Tracking Information')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Commissioned Items &amp; Measurements
          </h4>

          <div className="space-y-2">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3">
                    {item.design_thumbnail && (
                      <img
                        src={item.design_thumbnail}
                        alt={item.item_title}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-950 shrink-0"
                      />
                    )}
                    <div>
                      <h5 className="text-sm font-bold text-white">{item.item_title}</h5>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <span>Qty: {item.quantity}</span>
                        <span>• Unit Price: ${item.unit_price}</span>
                        {item.measurement_name && (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <Ruler className="w-3 h-3" />
                            {item.measurement_name}
                          </span>
                        )}
                      </div>
                      {item.customization_notes && (
                        <p className="text-xs text-slate-400 italic mt-1">
                          Custom: &ldquo;{item.customization_notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="font-mono font-bold text-white text-sm">
                    ${(item.unit_price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 text-xs text-slate-400">
                {order.itemTitle || 'Bespoke Garment Commission'} (${totalAmount})
              </div>
            )}
          </div>
        </div>

        {/* Reference Images Gallery */}
        {order.reference_images && order.reference_images.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Style Inspiration Reference Photos
            </h4>
            <div className="flex flex-wrap gap-3">
              {order.reference_images.map((img) => (
                <a
                  key={img.id}
                  href={img.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative group rounded-xl overflow-hidden border border-slate-800"
                >
                  <img
                    src={img.image_url}
                    alt="Reference"
                    className="w-20 h-20 object-cover group-hover:scale-105 transition-transform"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Delivery & Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shipping Address */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              Delivery Destination
            </span>
            {order.delivery_address ? (
              <>
                <p className="font-bold text-white mt-1">
                  {order.delivery_address.full_name} ({order.delivery_address.phone})
                </p>
                <p className="text-slate-300">
                  {order.delivery_address.address_line_1}
                  {order.delivery_address.address_line_2 && `, ${order.delivery_address.address_line_2}`}
                </p>
                <p className="text-slate-400">
                  {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.postal_code || order.delivery_address.pincode}
                </p>
                <p className="text-emerald-400 font-medium">
                  {order.delivery_address.country}
                  {order.delivery_address.country_code ? ` (${order.delivery_address.country_code})` : ''}
                </p>
              </>
            ) : (
              <p className="text-slate-400 italic">Standard registered studio handover.</p>
            )}
          </div>

          {/* Pricing Ledger */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Financial Summary ({order.currency || 'USD'})
            </span>
            <div className="flex justify-between text-slate-400 pt-1">
              <span>Subtotal:</span>
              <span className="font-mono text-white">
                {internationalService.formatCurrency(subtotal, order.currency || 'USD')}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Insured Delivery:</span>
              <span className="font-mono text-white">
                {internationalService.formatCurrency(deliveryCharge, order.currency || 'USD')}
              </span>
            </div>
            <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800">
              <span>Total Verified:</span>
              <span className="font-mono text-emerald-400 text-sm">
                {internationalService.formatCurrency(totalAmount, order.currency || 'USD')}
              </span>
            </div>
          </div>
        </div>

        {/* Status History Audit Trail */}
        {order.status_history && order.status_history.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Status Audit History
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {order.status_history.map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white uppercase text-[11px]">
                      {h.status.replace(/_/g, ' ')}
                    </span>
                    {h.notes && <span className="text-slate-400 ml-2">&ldquo;{h.notes}&rdquo;</span>}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tailor Action Controls Box */}
        {isTailorView && (
          <div className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Atelier Workshop Controls
              </span>
              {currentStatus === 'PENDING' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => handleUpdateStatus('ACCEPTED', 'Accepted by atelier master.')}
                    isLoading={isUpdating}
                  >
                    Accept Commission
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() => handleUpdateStatus('REJECTED', 'Capacity reached at atelier.')}
                    isLoading={isUpdating}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>

            {currentStatus !== 'PENDING' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Advance Production Stage"
                    value={selectedNextStatus}
                    onChange={(e) => setSelectedNextStatus(e.target.value as OrderStatus)}
                    options={[
                      { value: 'MEASUREMENT_CONFIRMED', label: 'Measurement Confirmed' },
                      { value: 'CUTTING', label: 'Cutting Stage' },
                      { value: 'STITCHING', label: 'Stitching Stage' },
                      { value: 'QUALITY_CHECK', label: 'Quality Check' },
                      { value: 'READY', label: 'Ready for Pickup / Dispatch' },
                      { value: 'SHIPPED', label: 'Shipped to Patron' },
                      { value: 'DELIVERED', label: 'Delivered' },
                    ]}
                  />
                  <Textarea
                    label="Production Note / Fitting Remarks"
                    placeholder="e.g., Cloth cut to Savile Row spec, 2 baste fittings scheduled..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleUpdateStatus(selectedNextStatus)}
                    isLoading={isUpdating}
                  >
                    Update Production Stage
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-800">
          {!isTailorView && (currentStatus === 'PENDING' || currentStatus === 'ACCEPTED') ? (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
              onClick={handleCustomerCancel}
              isLoading={isUpdating}
            >
              Cancel Order
            </Button>
          ) : (
            <div />
          )}

          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Window
          </Button>
        </div>
      </div>
    </Modal>
  );
};

