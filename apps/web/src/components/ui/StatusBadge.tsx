import React from 'react';
import { Badge } from './Badge';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'gold' }> = {
    // Request statuses
    DRAFT: { label: 'Draft', variant: 'secondary' },
    SUBMITTED: { label: 'Request Submitted', variant: 'secondary' },
    MATCHING: { label: 'Matching Tailors', variant: 'warning' },
    QUOTED: { label: 'Quotes Received', variant: 'gold' },
    ACCEPTED: { label: 'Order Accepted', variant: 'success' },
    CANCELLED: { label: 'Cancelled', variant: 'destructive' },
    EXPIRED: { label: 'Expired', variant: 'secondary' },

    // Order production statuses
    APPOINTMENT_BOOKED: { label: 'Appointment Booked', variant: 'warning' },
    MEASUREMENT: { label: 'Measurements Taken', variant: 'warning' },
    CUTTING: { label: 'Pattern Cutting', variant: 'secondary' },
    STITCHING: { label: 'Stitching in Progress', variant: 'gold' },
    FITTING: { label: 'Fitting / Trial Ready', variant: 'warning' },
    ALTERATION: { label: 'Adjustments / Alteration', variant: 'warning' },
    READY: { label: 'Ready for Pickup', variant: 'success' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'warning' },
    DELIVERED: { label: 'Delivered', variant: 'success' },
    COMPLETED: { label: 'Order Completed', variant: 'success' },
    DECLINED: { label: 'Declined', variant: 'destructive' },
    SENT: { label: 'Quote Sent', variant: 'gold' },
  };

  const config = statusConfig[status] || { label: status.replace(/_/g, ' '), variant: 'secondary' };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
