
'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import useSWR from 'swr';
import { getAllOrders, DbOrder } from '@/lib/actions/orders';
import {
  Truck,
  Search,
  Filter,
  Copy,
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  customer: string;
  items: string;
  platform: string;
  status: 'Pending' | 'To Ship' | 'Shipped' | 'Delivered';
  trackingNo: string | null;
  courier: string | null;
  lastUpdated: string;
  destination: string;
  eastMalaysia: boolean;
}

const statusConfig: Record<Order['status'], { label: string; classes: string; icon: React.ReactNode }> = {
  Pending: {
    label: 'Pending',
    classes: 'bg-amber-50 text-amber-600 border border-amber-200',
    icon: <Clock size={11} />,
  },
  'To Ship': {
    label: 'To Ship',
    classes: 'bg-blue-50 text-blue-600 border border-blue-200',
    icon: <Package size={11} />,
  },
  Shipped: {
    label: 'Shipped',
    classes: 'bg-green-50 text-green-600 border border-green-200',
    icon: <Truck size={11} />,
  },
  Delivered: {
    label: 'Delivered',
    classes: 'bg-teal-50 text-teal-600 border border-teal-200',
    icon: <CheckCircle2 size={11} />,
  },
};

function TrackingMessagePreview({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);

  const template = `Hi ${order.customer}! 👋 Pesanan anda telah dihantar!\n\n📦 No. Tracking: {tracking_no}\n🚚 Courier: {courier}\n📍 Anggaran tiba: {eta}\n\nSila semak status penghantaran di: https://track.shopee.com.my/{tracking_no}\n\nTerima kasih kerana membeli di NabilahFashion! 🌸`;

  const filled = template
    .replace(/{tracking_no}/g, order.trackingNo || 'MY240420XXXXXX')
    .replace(/{courier}/g, order.courier || 'Shopee Express')
    .replace(/{eta}/g, order.eastMalaysia ? '5–8 hari bekerja' : '2–4 hari bekerja');

  const handleCopy = () => {
    navigator.clipboard.writeText(filled);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-green-700 mono uppercase tracking-wide">
          Auto-generated Tracking Message
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 transition-colors"
        >
          {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="text-xs text-green-800 whitespace-pre-wrap font-mono leading-relaxed">{filled}</pre>
    </div>
  );
}

export default function OrdersShippingPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { data: dbOrders, error, isLoading, mutate } = useSWR('all-orders', getAllOrders);

  const mappedOrders = useMemo(() => {
    if (!dbOrders) return [];
    return dbOrders.map((dbOrder: DbOrder): Order => {
      let status: Order['status'] = 'Pending';
      if (dbOrder.status === 'completed') status = 'Delivered';
      else if (dbOrder.tracking_no) status = 'Shipped';
      else if (dbOrder.status === 'pending') status = 'Pending';

      return {
        id: dbOrder.id.slice(0, 13).toUpperCase(), // Simplified ID for UI
        customer: dbOrder.customer || 'Guest User',
        items: `${dbOrder.product_name || 'Product'} (×${dbOrder.quantity})`,
        platform: 'Shopee',
        status,
        trackingNo: dbOrder.tracking_no,
        courier: dbOrder.tracking_no ? 'J&T Express' : null,
        lastUpdated: new Date(dbOrder.created_at).toLocaleString('en-MY', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        destination: 'Unknown Destination', // Placeholder
        eastMalaysia: false, // Placeholder
      };
    });
  }, [dbOrders]);

  const filtered = mappedOrders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.items.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    All: mappedOrders.length,
    Pending: mappedOrders.filter((o) => o.status === 'Pending').length,
    'To Ship': mappedOrders.filter((o) => o.status === 'To Ship').length,
    Shipped: mappedOrders.filter((o) => o.status === 'Shipped').length,
    Delivered: mappedOrders.filter((o) => o.status === 'Delivered').length,
  };

  const handleRefresh = async () => {
    toast.promise(mutate(), {
      loading: 'Refreshing orders...',
      success: 'Orders synced!',
      error: 'Failed to sync orders',
    });
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'Commerce' }, { label: 'Orders & Shipping' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Orders & Shipping</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              NabilahFashion.my · {mappedOrders.length} orders total
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mono">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
              {isLoading ? 'Syncing...' : 'Synced Live'}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['Pending', 'To Ship', 'Shipped', 'Delivered'] as Order['status'][]).map((s) => {
            const cfg = statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? 'All' : s)}
                className={[
                  'bg-white rounded-card border shadow-card hover:shadow-card-hover transition-all p-4 text-left',
                  statusFilter === s ? 'ring-2 ring-primary-400' : 'border-border',
                ].join(' ')}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium mono ${cfg.classes}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>
                <p className="text-2xl font-bold tabular-nums text-foreground">{counts[s]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">orders</p>
              </button>
            );
          })}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by order ID, customer, or item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-8 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none cursor-pointer"
            >
              <option value="All">All Statuses ({counts.All})</option>
              <option value="Pending">Pending ({counts.Pending})</option>
              <option value="To Ship">To Ship ({counts['To Ship']})</option>
              <option value="Shipped">Shipped ({counts.Shipped})</option>
              <option value="Delivered">Delivered ({counts.Delivered})</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground mono">Order ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground mono">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground mono hidden md:table-cell">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground mono">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground mono hidden lg:table-cell">Tracking No.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground mono hidden xl:table-cell">Last Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-primary-500" />
                        <p className="text-xs text-muted-foreground">Loading orders from database...</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      {error ? 'Failed to load orders. Please try again.' : 'No orders match your search.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => {
                    const cfg = statusConfig[order.status];
                    const isExpanded = expandedOrder === order.id;
                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <td className="px-4 py-3.5">
                            <span className="mono text-xs font-medium text-foreground">{order.id}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-foreground mono">{order.customer}</span>
                              {order.eastMalaysia && (
                                <span className="inline-flex items-center gap-0.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded mono font-medium">
                                  <MapPin size={9} />
                                  EM
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{order.destination}</p>
                          </td>
                          <td className="px-4 py-3.5 hidden md:table-cell">
                            <p className="text-xs text-foreground max-w-[200px] truncate" title={order.items}>{order.items}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium mono ${cfg.classes}`}>
                              {cfg.icon}
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            {order.trackingNo ? (
                              <div className="flex items-center gap-1.5">
                                <span className="mono text-xs text-foreground">{order.trackingNo}</span>
                                <span className="text-xs text-muted-foreground">· {order.courier}</span>
                                <ExternalLink size={11} className="text-muted-foreground" />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Not assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 hidden xl:table-cell">
                            <span className="text-xs text-muted-foreground">{order.lastUpdated}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <ChevronDown
                              size={14}
                              className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </td>
                        </tr>
                        {isExpanded && order.status === 'Shipped' && (
                          <tr>
                            <td colSpan={7} className="px-4 pb-4 bg-green-50/30">
                              <TrackingMessagePreview order={order} />
                            </td>
                          </tr>
                        )}
                        {isExpanded && order.status !== 'Shipped' && (
                          <tr>
                            <td colSpan={7} className="px-4 pb-4 bg-muted/20">
                              <div className="mt-3 bg-white border border-border rounded-lg p-3 text-xs text-muted-foreground italic">
                                Tracking message preview will appear once order status changes to <strong>Shipped</strong> and a tracking number is assigned.
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{isLoading ? '...' : filtered.length}</span> of {isLoading ? '...' : mappedOrders.length} orders
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              <span className="text-xs text-muted-foreground mono">EM = East Malaysia (Sabah / Sarawak)</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
