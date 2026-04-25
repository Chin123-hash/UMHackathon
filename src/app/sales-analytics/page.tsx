'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import useSWR from 'swr';
import {
  getSalesAnalytics,
  getInventorySummary,
  getAIAnalystInsight,
  getAIDailyBriefing,
  fetchAnomalyInsights,
  getStockPredictions,
} from '@/lib/actions/analytics';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  Loader2,
  RefreshCw,
  BrainCircuit,
  Sparkles,
  FileText,
  Activity,
  PackageX,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';

function StatCard({ icon: Icon, label, value, subValue, trend, iconBg }: any) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {trend.positive ? '+' : ''}
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

function AIBriefingPanel({ sales, inventory }: any) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await getAIDailyBriefing(sales, inventory);
      setBriefing(res);
      toast.success('Daily briefing generated!');
    } catch (err) {
      toast.error('Briefing failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white p-5 rounded-card border border-border shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          <h3 className="font-bold">AI Daily Briefing</h3>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !sales}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}{' '}
          Generate
        </button>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <Loader2 className="animate-spin text-blue-400" size={24} />
        </div>
      ) : briefing ? (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{briefing}</p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-xs text-gray-400">Click generate for a daily business summary.</p>
        </div>
      )}
    </div>
  );
}

function AIAnomalyPanel() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const cleanText = (text: string) => text.replace(/[#*|`]/g, '').trim();
  const handleDetect = async () => {
    setLoading(true);
    try {
      const res = await fetchAnomalyInsights();
      setInsights(res);
      toast.success('Anomaly detection complete!');
    } catch (err) {
      toast.error('Detection failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white p-5 rounded-card border border-border shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-orange-600" />
          <h3 className="font-bold">Anomaly Explainer</h3>
        </div>
        <button
          onClick={handleDetect}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}{' '}
          Detect
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <Loader2 className="animate-spin text-orange-400" size={24} />
          </div>
        ) : insights.length === 0 ? (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-xs text-gray-400">Detect sudden spikes/drops in sales.</p>
          </div>
        ) : (
          insights.map((text: string, idx: number) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg"
            >
              <Sparkles size={12} className="text-orange-500 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                {cleanText(text)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StockRiskPanel() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const patternMeanings: Record<string, string> = {
    Momentum: '📈 Demand is accelerating',
    Decay: '📉 Hype is fading out',
    Spike: '⚡ Erratic viral bursts',
    Volatile: '🔄 Unpredictable shifts',
    Stable: '➖ Consistent daily sales',
    Unknown: '⏳ Calculating...',
  };

  const handleScan = async () => {
    setIsLoading(true);
    try {
      const res = await getStockPredictions();
      setData(res.data);
      if (res.data.length > 0) toast.success('Stock risks scanned!');
      else toast.error('No data or AI offline.');
    } catch (err) {
      toast.error('Scan failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-card border border-border shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <PackageX size={18} className="text-red-500" />
          <div>
            <h3 className="font-bold">Top 5 Sales Risk</h3>
            <p className="text-[10px] text-gray-400">Out-of-stock prediction for best sellers</p>
          </div>
        </div>
        <button
          onClick={handleScan}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Scan
        </button>
      </div>

      {/* ✅ ADDED: Metric Legend to explain Days, Pattern, and Conf */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 mb-4 text-[10px] text-gray-400 border-t border-dashed border-gray-100 pt-2">
        <span>
          <b className="text-gray-500">Days:</b> Est. until out of stock
        </span>
        <span>
          <b className="text-gray-500">Pattern:</b> Sales curve shape
        </span>
        <span>
          <b className="text-gray-500">Conf:</b> Prediction reliability
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-300" size={24} />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg px-4 text-center">
            <div>
              <WifiOff size={20} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 font-medium">AI Offline / No Data</p>
              <p className="text-[10px] text-gray-400 mt-1">
                Click scan to predict stock risks for your top selling items.
              </p>
            </div>
          </div>
        ) : (
          data.map((p) => (
            <div
              key={p.id}
              className={`p-3 rounded-xl border transition-all ${
                p.status === 'critical'
                  ? 'bg-red-50 border-red-200 shadow-sm shadow-red-100'
                  : p.status === 'warning'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Velocity: {p.dailyVelocity}/day · Left: {p.currentStock} units
                  </p>
                </div>
                <div
                  className={`px-2 py-1 rounded-lg flex flex-col items-center shrink-0 ${
                    p.status === 'critical'
                      ? 'bg-red-100'
                      : p.status === 'warning'
                        ? 'bg-orange-100'
                        : 'bg-gray-100'
                  }`}
                >
                  <span className="text-lg font-black leading-none text-gray-800">
                    {p.daysRemaining || 0}
                  </span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">days</span>
                </div>
              </div>

              <div className="w-full bg-gray-200/80 h-1.5 rounded-full mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    p.status === 'critical'
                      ? 'bg-red-500'
                      : p.status === 'warning'
                        ? 'bg-orange-500'
                        : 'bg-gray-500'
                  }`}
                  style={{ width: `${Math.min(100, ((p.daysRemaining || 0) / 7) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-600 italic flex items-center gap-1 flex-wrap">
                  <Sparkles size={10} className="text-indigo-400 shrink-0" />
                  <span className="font-semibold not-italic text-indigo-600">
                    {p.aiTrendInsight}
                  </span>
                  {patternMeanings[p.aiTrendInsight] && (
                    <span className="text-gray-400 not-italic ml-1">
                      ({patternMeanings[p.aiTrendInsight]})
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-gray-400">{p.riskScore}% conf.</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600">
                    AI
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AIAnalystPanel({ sales, inventory, predictions }: any) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await getAIAnalystInsight(sales, inventory, predictions || []);
      setInsight(res);
      toast.success('AI Analyst report generated!');
    } catch (err) {
      toast.error('AI Insight failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-card border border-indigo-100 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-indigo-900">SellerMate AI Analyst</h2>
            <p className="text-sm text-indigo-700">Predictive insights and stock management tips</p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !sales}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-200"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {insight ? 'Regenerate Analysis' : 'Analyze Performance & Stock'}
        </button>
      </div>
      {loading ? (
        <div className="text-center py-8 px-4 border-2 border-dashed border-indigo-200 rounded-xl bg-white/50">
          <Loader2 className="mx-auto text-indigo-400 animate-spin mb-3" size={32} />
          <p className="text-sm text-indigo-900 font-medium">Analyzing performance...</p>
        </div>
      ) : insight ? (
        <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-inner max-h-[400px] overflow-y-auto whitespace-pre-wrap text-gray-800 leading-relaxed text-sm">
          {insight}
        </div>
      ) : (
        <div className="text-center py-8 px-4 border-2 border-dashed border-indigo-200 rounded-xl bg-white/50">
          <Sparkles className="mx-auto text-indigo-300 mb-3" size={32} />
          <p className="text-sm text-indigo-900 font-medium">
            Click to generate AI-powered performance insights.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SalesAnalyticsPage() {
  const { data: salesData, mutate: mutateSales } = useSWR('sales-analytics', () =>
    getSalesAnalytics(30)
  );
  const { data: inventoryData, mutate: mutateInventory } = useSWR('inventory-summary', () =>
    getInventorySummary()
  );

  const handleRefresh = () => {
    mutateSales();
    mutateInventory();
    toast.info('Refreshing base metrics...');
  };
  const lowStockTrend = inventoryData?.lowStockCount
    ? { value: `${inventoryData.lowStockCount} alerts`, positive: false }
    : undefined;

  return (
    <AppLayout breadcrumbs={[{ label: 'Sales Analytics' }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Sales Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-1">AI-driven business intelligence</p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <AIAnalystPanel sales={salesData} inventory={inventoryData} predictions={[]} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`RM${(salesData?.totalRevenue || 0).toFixed(2)}`}
            iconBg="bg-green-500"
          />
          <StatCard
            icon={ShoppingCart}
            label="Total Orders"
            value={String(salesData?.totalOrders || 0)}
            subValue={`Avg RM${(salesData?.avgOrderValue || 0).toFixed(2)} / order`}
            iconBg="bg-blue-500"
          />
          <StatCard
            icon={Package}
            label="Total Stock"
            value={String(inventoryData?.totalStock || 0)}
            subValue={`${inventoryData?.totalProducts || 0} unique products`}
            iconBg="bg-purple-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Inventory Value"
            value={`RM${(inventoryData?.totalValue || 0).toFixed(2)}`}
            trend={lowStockTrend}
            iconBg="bg-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIBriefingPanel sales={salesData} inventory={inventoryData} />
          <AIAnomalyPanel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StockRiskPanel />

          <div className="bg-white p-5 rounded-card border border-border shadow-card h-full">
            <h3 className="font-bold mb-4 text-sm">Top Performing Products</h3>
            <div className="space-y-4">
              {!salesData ? (
                <div className="h-full flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-gray-300" size={20} />
                </div>
              ) : salesData.topProducts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">No sales data yet.</p>
              ) : (
                salesData.topProducts.map((p: any) => (
                  <div key={p.name} className="flex items-center justify-between group">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1.5">
                        <div
                          className="bg-primary-600 h-full rounded-full transition-all"
                          style={{
                            width: `${(p.revenue / (salesData.topProducts[0]?.revenue || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-gray-50 p-1 rounded ml-4">
                      RM{p.revenue.toFixed(0)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-card border border-border shadow-card h-full overflow-hidden">
          <h3 className="font-bold mb-4 text-sm">Recent Sales Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {!salesData ? (
              <div className="col-span-2 h-32 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-300" size={20} />
              </div>
            ) : salesData.recentOrders.length === 0 ? (
              <p className="col-span-2 text-xs text-gray-400 text-center py-8">No recent orders.</p>
            ) : (
              salesData.recentOrders.map((o: any) => (
                <div
                  key={o.id}
                  className="py-2 flex items-center justify-between text-xs border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-700 truncate max-w-[180px]">
                      {o.product_name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase">
                      {o.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">RM{o.total_price.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-mono">QTY: {o.quantity}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
