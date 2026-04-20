import React from 'react';

type StatusType =
  | 'bot-responded' |'owner-replied' |'unanswered' |'escalated' |'shipped' |'pending' |'to-ship' |'delivered' |'low-stock' |'out-of-stock' |'in-stock' |'active' |'inactive';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  'bot-responded': { label: 'Bot Responded', className: 'badge-bot' },
  'owner-replied': { label: 'Owner Replied', className: 'badge-owner' },
  unanswered: { label: 'Unanswered', className: 'badge-unanswered' },
  escalated: { label: 'Escalated', className: 'badge-escalated' },
  shipped: { label: 'Shipped', className: 'badge-shipped' },
  pending: { label: 'Pending', className: 'badge-pending' },
  'to-ship': { label: 'To Ship', className: 'badge-escalated' },
  delivered: { label: 'Delivered', className: 'badge-owner' },
  'low-stock': { label: 'Low Stock', className: 'badge-lowstock' },
  'out-of-stock': { label: 'Out of Stock', className: 'badge-outofstock' },
  'in-stock': { label: 'In Stock', className: 'badge-owner' },
  active: { label: 'Active', className: 'badge-owner' },
  inactive: { label: 'Inactive', className: 'badge-unanswered' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;
  return (
    <span className={`${config.className} ${className}`}>
      {config.label}
    </span>
  );
}