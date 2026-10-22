import React from 'react';
import { Calendar, Scissors, ArrowUpRight, Clock, CheckCircle2, XCircle, Truck } from 'lucide-react';
import type { Order } from '../../types/order';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { internationalService } from '../../services/internationalService';
import { useTranslation } from '../../i18n';

export interface OrderCardProps {
  order: Order;
  onViewDetails?: (order: Order) => void;
  onUpdateStatus?: (order: Order) => void;
  isTailorView?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  onUpdateStatus,
  isTailorView = false,
}) => {
  const { t } = useTranslation();
  // Extract fields gracefully whether from API or legacy mock
  const orderNumber = order.order_number || order.orderNumber || String(order.id);
  const status = order.status;
  const itemTitle =
    order.items && order.items.length > 0
      ? order.items[0].item_title
      : order.itemTitle || 'Custom Bespoke Commission';
  const totalAmount = order.total_amount ?? order.price ?? 0;
  const customerName = order.customer_name || order.customerName || 'Bespoke Patron';
  const tailorName = order.tailor_shop_name || order.tailorName || 'Atelier Studio';
  const thumbnail =
    (order.items && order.items[0]?.design_thumbnail) ||
    (order.reference_images && order.reference_images[0]?.image_url) ||
    order.thumbnail ||
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&auto=format&fit=crop&q=80';

  const getStatusProgress = (st: string): number => {
    switch (st) {
      case 'PENDING':
        return 10;
      case 'ACCEPTED':
        return 25;
      case 'MEASUREMENT_CONFIRMED':
        return 38;
      case 'CUTTING':
        return 52;
      case 'STITCHING':
        return 72;
      case 'QUALITY_CHECK':
        return 86;
      case 'READY':
        return 95;
      case 'SHIPPED':
        return 98;
      case 'DELIVERED':
      case 'Completed':
        return 100;
      case 'CANCELLED':
      case 'REJECTED':
      case 'Cancelled':
        return 0;
      // Fallback for legacy statuses
      case 'Consultation':
        return 15;
      case 'Measurements Taken':
        return 35;
      case 'Fabric Cutting':
        return 55;
      case 'Trial Fitting':
        return 75;
      case 'Final Stitching':
        return 88;
      case 'Ready for Pickup':
        return 95;
      default:
        return 30;
    }
  };

  const progressPercent = order.progressPercent ?? getStatusProgress(status);

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'DELIVERED':
      case 'Completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'READY':
      case 'Ready for Pickup':
      case 'SHIPPED':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'CUTTING':
      case 'STITCHING':
      case 'QUALITY_CHECK':
      case 'Fabric Cutting':
      case 'Final Stitching':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'ACCEPTED':
      case 'MEASUREMENT_CONFIRMED':
      case 'Trial Fitting':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'PENDING':
      case 'Consultation':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'CANCELLED':
      case 'REJECTED':
      case 'Cancelled':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatStageLabel = (st: string) => {
    return t(
      `status.${st.toUpperCase()}`,
      st.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  return (
    <Card hoverEffect className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center space-x-4 min-w-0">
        <img
          src={thumbnail}
          alt={itemTitle}
          className="w-16 h-16 rounded-xl object-cover ring-1 ring-slate-800 shrink-0 bg-slate-900"
        />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-emerald-400">
              #{orderNumber}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                status
              )}`}
            >
              {formatStageLabel(status)}
            </span>
            {order.currency && (
              <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                {order.currency}
              </span>
            )}
            {order.delivery_address?.country && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {order.delivery_address.country}
              </span>
            )}
            {order.delivery && (order.delivery.tracking_number || order.delivery.courier_name) && (
              <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 inline-flex items-center gap-1">
                <Truck className="w-3 h-3 shrink-0" />
                <span>
                  {order.delivery.courier_name ? `${order.delivery.courier_name}: ` : ''}
                  {order.delivery.tracking_number || order.delivery.status}
                </span>
              </span>
            )}
            {order.items && order.items.length > 1 && (
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                +{order.items.length - 1} more items
              </span>
            )}
          </div>

          <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
            {itemTitle}
          </h4>

          <p className="text-xs text-slate-400">
            {isTailorView ? (
              <>
                Customer: <span className="text-slate-200 font-medium">{customerName}</span>
              </>
            ) : (
              <>
                Atelier: <span className="text-slate-200 font-medium">{tailorName}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Progress & Milestone */}
      <div className="w-full md:w-56 space-y-2 py-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5 text-emerald-400" />
            Stage Progress
          </span>
          <span className="font-mono font-semibold text-emerald-400">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'CANCELLED' || status === 'REJECTED'
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            {order.delivery?.expected_delivery_date
              ? `Est: ${new Date(order.delivery.expected_delivery_date).toLocaleDateString()}`
              : `Date: ${new Date(order.created_at || Date.now()).toLocaleDateString()}`}
          </span>
          <span className="font-mono font-bold text-slate-200">
            {internationalService.formatCurrency(totalAmount, order.currency || 'USD')}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
        {isTailorView && onUpdateStatus && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateStatus(order)}
          >
            {t('tailor.orders.updateStatus')}
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onViewDetails?.(order)}
          rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
        >
          {t('common.viewDetails')}
        </Button>
      </div>
    </Card>
  );
};
