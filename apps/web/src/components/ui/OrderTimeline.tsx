import React from 'react';
import { cn, formatDateTime } from '../../lib/utils';
import { Check, Clock, CircleDot, AlertCircle } from 'lucide-react';
import type { OrderStatusHistoryDto } from '@tailorconnect/types';

export interface Milestone {
  status: string;
  label: string;
  description: string;
}

const ORDER_MILESTONES: Milestone[] = [
  { status: 'ACCEPTED', label: 'Order Accepted', description: 'Quote confirmed and order initiated' },
  { status: 'MEASUREMENT', label: 'Measurements Taken', description: 'In-store or home measurements recorded' },
  { status: 'CUTTING', label: 'Pattern Cutting', description: 'Fabric cut to exact customer specifications' },
  { status: 'STITCHING', label: 'Stitching in Progress', description: 'Artisanal assembly, detailing & lining' },
  { status: 'FITTING', label: 'Trial & Fitting', description: 'Garment trial for fit adjustments' },
  { status: 'READY', label: 'Ready for Pickup', description: 'Garment pressed, quality checked & packaged' },
  { status: 'DELIVERED', label: 'Delivered', description: 'Handed over to customer' },
  { status: 'COMPLETED', label: 'Completed', description: 'Order finalized and settled' },
];

export interface OrderTimelineProps {
  currentStatus: string;
  history?: OrderStatusHistoryDto[];
  estimatedDate?: string;
  className?: string;
}

export function OrderTimeline({ currentStatus, history = [], estimatedDate, className }: OrderTimelineProps) {
  const isCancelled = currentStatus === 'CANCELLED';

  // Map history events by toStatus for quick timestamp lookup
  const historyMap = new Map<string, OrderStatusHistoryDto>();
  for (const h of history) {
    historyMap.set(h.toStatus, h);
  }

  // Find index of current milestone in sequence
  const currentIdx = ORDER_MILESTONES.findIndex(m => m.status === currentStatus);

  if (isCancelled) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-red-900">Order Cancelled</h4>
          <p className="text-xs text-red-700 mt-1">This order has been cancelled. No further production transitions will occur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative pl-2 sm:pl-4 space-y-6', className)}>
      {ORDER_MILESTONES.map((milestone, idx) => {
        const isPast = currentIdx > idx || currentStatus === 'COMPLETED';
        const isCurrent = currentStatus === milestone.status;
        const isFuture = !isPast && !isCurrent;
        const historyEntry = historyMap.get(milestone.status);

        return (
          <div key={milestone.status} className="relative flex items-start group">
            {/* Vertical connector line */}
            {idx < ORDER_MILESTONES.length - 1 && (
              <div
                className={cn(
                  'absolute left-[15px] top-[28px] -bottom-[28px] w-0.5 transition-colors duration-300',
                  isPast ? 'bg-emerald-500' : 'bg-stone-200'
                )}
              />
            )}

            {/* Icon Step Indicator */}
            <div className="relative z-10 flex items-center justify-center mr-4">
              {isPast ? (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              ) : isCurrent ? (
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md animate-pulse-ring">
                  <CircleDot className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-stone-300 bg-stone-50 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-stone-300" />
                </div>
              )}
            </div>

            {/* Content info */}
            <div className="flex-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <h4
                  className={cn(
                    'text-sm font-semibold transition-colors',
                    isPast && 'text-stone-900',
                    isCurrent && 'text-amber-900 font-bold',
                    isFuture && 'text-stone-400'
                  )}
                >
                  {milestone.label}
                </h4>

                {historyEntry && (
                  <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    {formatDateTime(historyEntry.createdAt)}
                  </span>
                )}

                {isCurrent && !historyEntry && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                    In Progress
                  </span>
                )}
              </div>

              <p
                className={cn(
                  'text-xs mt-0.5',
                  isFuture ? 'text-stone-400' : 'text-stone-600'
                )}
              >
                {milestone.description}
              </p>

              {/* Status transition note from tailor/customer */}
              {historyEntry?.note && (
                <div className="mt-2 p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-700 italic">
                  "{historyEntry.note}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
