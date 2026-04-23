"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import useSWR from "swr";
import {
  getSalesAnalytics,
  getInventorySummary,
  getAIAnalystInsight,
  getAIDailyBriefing,
  fetchAnomalyInsights,
} from "@/lib/actions/analytics";
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
  Clock,
  FileText,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

function StatCard({ icon: Icon, label, value, subValue, trend, iconBg }: any) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${iconBg}`}><Icon size={20} className="text-white" /></div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend.positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {trend.positive ? "+" : ""}{trend.value}
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

// ✅ NEW: AI Daily Briefing Panel
function AIBriefingPanel({ sales, inventory }: any) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const generateBriefing = async () => {
    setLoading(true);
    try {
      const res = await getAIDailyBriefing(sales, inventory);
      setBriefing(res);
      toast.success("Daily briefing generated!");
    } catch (err) { toast.error("Briefing failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white p-5 rounded-card border border-border shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          <h3 className="font-bold">AI Daily Briefing</h3>
        </div>
        <button 
          onClick={generateBriefing} 
          disabled={loading || !sales} 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Generate
        </button>
      </div>
      
      {briefing ? (
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

// ✅ NEW: AI Anomaly Explainer Panel
// ✅ NEW: AI Anomaly Explainer Panel
function AIAnomalyPanel() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const detectAnomalies = async () => {
    setLoading(true);
    try {
      const res = await fetchAnomalyInsights();
      setInsights(res);
      toast.success("Anomaly detection complete!");
    } catch (err) { toast.error("Detection failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white p-5 rounded-card border border-border shadow-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-orange-600" />
          <h3 className="font-bold">Anomaly Explainer</h3>
        </div>
        <button 
          onClick={detectAnomalies} 
          disabled={loading} 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
          Detect
        </button>
      </div>
      
      <div className="flex-1 space-y-2 overflow-y-auto">
        {insights.length === 0 ? (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-xs text-gray-400">Detect sudden spikes/drops in sales.</p>
          </div>
        ) : (
          // ✅ FIXED: Explicitly type 'text' and 'idx'
          insights.map((text: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg">
              <Sparkles size={12} className="text-orange-500 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-700 leading-relaxed">{text}</p>
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
  const generateInsight = async () => {
    setLoading(true);
    try {
      const res = await getAIAnalystInsight(sales, inventory, []);
      setInsight(res);
      toast.success("AI Analyst report generated!");
    } catch (err) { toast.error("AI Insight failed"); }
    finally { setLoading(false); }
  };
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-card border border-indigo-100 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><BrainCircuit size={24} /></div>
          <div><h2 className="text-lg font-bold text-indigo-900">SellerMate AI Analyst</h2><p className="text-sm text-indigo-700">Predictive insights and stock management tips</p></div>
        </div>
        <button onClick={generateInsight} disabled={loading || !sales} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-200">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {insight ? "Regenerate Analysis" : "Analyze Performance & Stock"}
        </button>
      </div>
      {insight ? (
        <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-inner max-h-[400px] overflow-y-auto whitespace-pre-wrap text-gray-800 leading-relaxed text-sm prose prose-indigo prose-sm max-w-none">{insight}</div>
      ) : (
        <div className="text-center py-8 px-4 border-2 border-dashed border-indigo-200 rounded-xl bg-white/50">
          <Sparkles className="mx-auto text-indigo-300 mb-3" size={32} />
          <p className="text-sm text-indigo-900 font-medium">Click to generate AI-powered performance insights.</p>
        </div>
      )}
    </div>
  );
}

export default function SalesAnalyticsPage() {
  const { data: salesData, mutate: mutateSales } = useSWR("sales-analytics", () => getSalesAnalytics(30));
  const { data: inventoryData, mutate: mutateInventory } = useSWR("inventory-summary", () => getInventorySummary());
  
  // ✅ Removed getStockPredictions SWR call
  const handleRefresh = () => { mutateSales(); mutateInventory(); toast.info("Refreshing data..."); };
  
  return (
    <AppLayout breadcrumbs={[{ label: "Sales Analytics" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-semibold text-foreground tracking-tight">Sales Analytics</h1><p className="text-sm text-muted-foreground mt-1">AI-driven business intelligence</p></div>
          <button onClick={handleRefresh} className="p-2 hover:bg-muted rounded-full transition-colors"><RefreshCw size={18} /></button>
        </div>
        
        <AIAnalystPanel sales={salesData} inventory={inventoryData} />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Total Revenue" value={`RM${(salesData?.totalRevenue || 0).toFixed(2)}`} iconBg="bg-green-500" />
          <StatCard icon={ShoppingCart} label="Total Orders" value={String(salesData?.totalOrders || 0)} subValue={`Avg RM${(salesData?.avgOrderValue || 0).toFixed(2)} / order`} iconBg="bg-blue-500" />
          <StatCard icon={Package} label="Total Stock" value={String(inventoryData?.totalStock || 0)} subValue={`${inventoryData?.totalProducts || 0} unique products`} iconBg="bg-purple-500" />
          <StatCard icon={TrendingUp} label="Inventory Value" value={`RM${(inventoryData?.totalValue || 0).toFixed(2)}`} trend={inventoryData?.lowStockCount > 0 ? { value: `${inventoryData.lowStockCount} alerts`, positive: false } : undefined} iconBg="bg-orange-500" />
        </div>

        {/* ✅ NEW LAYOUT: AI Features Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIBriefingPanel sales={salesData} inventory={inventoryData} />
          <AIAnomalyPanel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-card border border-border shadow-card h-full">
            <h3 className="font-bold mb-4 text-sm">Top Performing Products</h3>
            <div className="space-y-4">
              {salesData?.topProducts.map((p: any) => (
                <div key={p.name} className="flex items-center justify-between group">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1.5">
                      <div className="bg-primary-600 h-full rounded-full transition-all" style={{ width: `${(p.revenue / (salesData?.topProducts[0]?.revenue || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-gray-50 p-1 rounded ml-4">RM{p.revenue.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-card border border-border shadow-card h-full overflow-hidden">
            <h3 className="font-bold mb-4 text-sm">Recent Sales Activity</h3>
            <div className="space-y-2">
              {salesData?.recentOrders.map((o: any) => (
                <div key={o.id} className="py-2 flex items-center justify-between text-xs border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-700 truncate max-w-[180px]">{o.product_name}</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase">{o.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">RM{o.total_price.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-mono">QTY: {o.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}