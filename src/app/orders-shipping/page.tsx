'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import useSWR from 'swr';
import { getAllOrders, DbOrder, updateOrderCourier } from '@/lib/actions/orders';
import { getShippingRecommendations } from '@/lib/actions/analytics';
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
  Brain,
  X,
  Camera,
  Music,
  MessageCircle,
  ShoppingBag,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  db_id: string;
  customer: string;
  items: string;
  platform: 'Instagram' | 'TikTok' | 'WhatsApp' | 'Shopee' | 'Telegram';
  status: 'Pending' | 'To Ship' | 'Shipped' | 'Delivered';
  trackingNo: string | null;
  courier: string | null;
  lastUpdated: string;
  destination: string;
  eastMalaysia: boolean;
}

const statusConfig: Record<
  Order['status'],
  { label: string; classes: string; icon: React.ReactNode }
> = {
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

const platformConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; text: string }
> = {
  Instagram: {
    icon: <Camera size={12} className="text-pink-600" />,
    color: 'text-pink-700',
    bg: 'bg-pink-50 border-pink-200',
    text: 'IG',
  },
  TikTok: {
    icon: <Music size={12} className="text-black" />,
    color: 'text-gray-800',
    bg: 'bg-gray-100 border-gray-300',
    text: 'TT',
  },
  WhatsApp: {
    icon: <MessageCircle size={12} className="text-green-600" />,
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    text: 'WA',
  },
  Shopee: {
    icon: <ShoppingBag size={12} className="text-orange-600" />,
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
    text: 'SP',
  },
  Telegram: {
    icon: <Send size={12} className="text-blue-500" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    text: 'TG',
  },
};

function PlatformBadge({ platform }: { platform: string }) {
  const config = platformConfig[platform] || platformConfig['Instagram'];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mono ${config.bg} ${config.color} border`}
    >
      {config.icon}
      {config.text}
    </span>
  );
}

function ShippingComparisonModal({
  order,
  onClose,
  onRefresh,
}: {
  order: Order;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchRecs = async () => {
    setLoading(true);
    const res = await getShippingRecommendations(order.destination);
    if (res.success) setData(res);
    else toast.error(res.message);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchRecs();
  }, [order.destination]);

  const handleSelect = async (partner: string) => {
    const tracking = `MY${Math.random().toString().slice(2, 14)}`;
    toast.promise(updateOrderCourier(order.db_id, partner, tracking), {
      loading: 'Assigning courier...',
      success: () => {
        onRefresh();
        onClose();
        return `Order assigned to ${partner}`;
      },
      error: 'Failed to update order',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <Brain size={18} />
            <h3 className="font-semibold">AI Shipping Comparison</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
              <p className="text-sm text-muted-foreground animate-pulse">
                AI is comparing the best rates for {order.destination}...
              </p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest mb-1">
                  AI Recommendation
                </p>
                <p className="text-sm text-indigo-900 leading-relaxed italic">"{data.aiSummary}"</p>
              </div>
              <div className="space-y-2">
                {data.recommendations.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                  >
                    <div>
                      <p className="font-semibold text-sm">{rec.partner}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-muted-foreground">
                          Cost: <span className="text-red-500 font-medium">RM{rec.sellerCost}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Charge:{' '}
                          <span className="text-green-600 font-medium">RM{rec.buyerCharge}</span>
                        </p>
                        <p className="text-xs font-bold text-indigo-600">Profit: RM{rec.profit}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelect(rec.partner)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No courier data found for this location.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackingMessagePreview({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);
  
  // ✅ FIXED: Template placeholders cleaned
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
      <pre className="text-xs text-green-800 whitespace-pre-wrap font-mono leading-relaxed">
        {filled}
      </pre>
    </div>
  );
}

export default function OrdersShippingPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [comparingOrder, setComparingOrder] = useState<Order | null>(null);

  const { data: dbOrders, error, isLoading, mutate } = useSWR('all-orders', getAllOrders);

  const mappedOrders = useMemo(() => {
    if (!dbOrders) return [];
    return dbOrders.map((dbOrder: DbOrder): Order => {
      let status: Order['status'] = 'Pending';
      if (dbOrder.status === 'completed') status = 'Delivered';
      else if (dbOrder.status === 'shipped') status = 'Shipped';
      else if (dbOrder.status === 'pending') status = 'Pending';

      const dest = dbOrder.destination || 'Selangor';
      const isEM = dest.toLowerCase().includes('sabah') || dest.toLowerCase().includes('sarawak');

      return {
        id: dbOrder.id.slice(0, 8).toUpperCase(),
        db_id: dbOrder.id,
        customer: dbOrder.customer || 'Guest User',
        items: `${dbOrder.product_name || 'Product'} (×${dbOrder.quantity})`,
        platform: (dbOrder as any).platform || 'Instagram',
        status,
        trackingNo: dbOrder.tracking_no,
        courier: dbOrder.courier_name,
        lastUpdated: new Date(dbOrder.created_at).toLocaleString('en-MY', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        destination: dest,
        eastMalaysia: isEM,
      };
    });
  }, [dbOrders]);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    mappedOrders.forEach((order) => {
      const p = order.platform || 'Instagram';
      if (!groups[p]) groups[p] = [];
      groups[p].push(order);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [mappedOrders]);

  const filteredGroups = useMemo(() => {
    return groupedOrders.map(([platform, orders]) => {
      const filtered = orders.filter((o) => {
        const matchSearch =
          o.id.toLowerCase().includes(search.toLowerCase()) ||
          o.customer.toLowerCase().includes(search.toLowerCase()) ||
          o.items.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || o.status === statusFilter;
        const matchPlatform = platformFilter === 'All' || platform === platformFilter;
        return matchSearch && matchStatus && matchPlatform;
      });
      return [platform, filtered];
    });
  }, [groupedOrders, search, statusFilter, platformFilter]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Orders & Shipping</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              RachelFashion.my · {mappedOrders.length} orders total
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mono">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
              {isLoading ? 'Syncing...' : 'Synced Live'}
            </div>
            <button onClick={handleRefresh} disabled={isLoading} className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50">
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['Pending', 'To Ship', 'Shipped', 'Delivered'] as Order['status'][]).map((s) => {
            const cfg = statusConfig[s];
            return (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'All' : s)} className={['bg-white rounded-card border shadow-card hover:shadow-card-hover transition-all p-4 text-left', statusFilter === s ? 'ring-2 ring-primary-400' : 'border-border'].join(' ')}>
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

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search by order ID, customer, or item…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-4 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 transition" />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="pl-8 pr-8 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none cursor-pointer">
              <option value="All">All Statuses ({counts.All})</option>
              <option value="Pending">Pending ({counts.Pending})</option>
              <option value="To Ship">To Ship ({counts['To Ship']})</option>
              <option value="Shipped">Shipped ({counts.Shipped})</option>
              <option value="Delivered">Delivered ({counts.Delivered})</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setPlatformFilter('All')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${platformFilter === 'All' ? 'bg-foreground text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All Platforms
          </button>
          {Object.keys(platformConfig).map((p) => {
            const cfg = platformConfig[p];
            return (
              <button key={p} onClick={() => setPlatformFilter(platformFilter === p ? 'All' : p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 ${platformFilter === p ? `${cfg.bg} ${cfg.color} border-transparent shadow-sm` : 'bg-white text-gray-600 border-border hover:bg-gray-50'}`}>
                {cfg.icon}
                {p}
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="bg-white rounded-card border border-border shadow-card h-64 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
          ) : (
            // ✅ FIX 1: Explicitly cast to [string, Order[]][] to fix 'any' and 'map' errors
            (filteredGroups as [string, Order[]][]).map(([platform, orders]) => {
              const hasOrders = orders.length > 0;
              return (
                <div
                  key={platform as string} // ✅ FIX 2: Explicitly cast platform to string for key
                  className={`bg-white rounded-card border border-border shadow-card overflow-hidden ${!hasOrders ? 'opacity-50' : ''}`}
                >
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={platform as string} />
                      <h3 className="text-sm font-bold text-gray-800">{platform as string}</h3>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {orders.length}
                    </span>
                  </div>

                  {!hasOrders ? (
                    <div className="px-5 py-10 text-center text-sm text-gray-400 italic">No matching orders here.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mono">Order ID</th>
                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mono">Customer</th>
                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mono hidden md:table-cell">Items</th>
                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mono">Status</th>
                            <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mono hidden lg:table-cell">Tracking</th>
                            <th className="px-4 py-2.5" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {orders.map((order: Order) => {
                            // ✅ FIX 3: Cast order.status to valid Record key to fix indexing error
                            const cfg = statusConfig[order.status as keyof typeof statusConfig];
                            const isExpanded = expandedOrder === order.id;
                            return (
                              <React.Fragment key={order.id}>
                                <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                                  <td className="px-4 py-2.5"><span className="mono text-xs font-medium text-gray-800">{order.id}</span></td>
                                  <td className="px-4 py-2.5">
                                    <p className="text-sm font-medium text-gray-800 mono">{order.customer}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{order.destination}</p>
                                  </td>
                                  <td className="px-4 py-2.5 hidden md:table-cell"><p className="text-xs text-gray-600 max-w-[180px] truncate" title={order.items}>{order.items}</p></td>
                                  <td className="px-4 py-2.5">
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium mono ${cfg.classes}`}>
                                      {cfg.icon}
                                      {cfg.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 hidden lg:table-cell">
                                    {order.trackingNo ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="mono text-xs text-gray-800">{order.trackingNo}</span>
                                        <span className="text-[10px] text-gray-400">· {order.courier}</span>
                                      </div>
                                    ) : <span className="text-xs text-gray-400 italic">Pending</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-right"><ChevronDown size={14} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-gray-50">
                                    <td colSpan={6} className="px-4 pb-4">
                                      <div className="flex flex-col gap-4 mt-2">
                                        {order.status === 'Pending' && (
                                          <div className="flex items-center justify-between p-4 bg-white border border-dashed border-primary-300 rounded-xl">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600"><Brain size={20} /></div>
                                              <div>
                                                <p className="text-sm font-semibold text-gray-800">AI Shipping Comparison</p>
                                                <p className="text-xs text-muted-foreground">Let AI help you find the cheapest courier for {order.destination}.</p>
                                              </div>
                                            </div>
                                            <button onClick={() => setComparingOrder(order)} className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-all flex items-center gap-2">
                                              <Truck size={16} /> Compare Rates
                                            </button>
                                          </div>
                                        )}
                                        {order.status === 'Shipped' && <TrackingMessagePreview order={order} />}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {comparingOrder && <ShippingComparisonModal order={comparingOrder} onClose={() => setComparingOrder(null)} onRefresh={mutate} />}
    </AppLayout>
  );
}