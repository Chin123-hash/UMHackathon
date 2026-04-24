"use server";

import { createClient } from "@/lib/supabase/server";
import { StatusType } from "@/components/ui/StatusBadge";

// --- CACHE STATE (Server Memory) ---
let cachedPredictions: { data: StockPrediction[], timestamp: number, stateHash: string } | null = null;
let cachedAnalyst: { text: string, timestamp: number, stateHash: string } | null = null;

export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: { id: string; product_name: string; quantity: number; total_price: number; created_at: string; }[];
}

export interface InventorySummary {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  lowStockCount: number;
}

export interface StockPrediction {
  id: string;
  name: string;
  currentStock: number;
  dailyVelocity: number;
  daysRemaining: number | null;
  status: "critical" | "warning" | "stable";
  aiTrendInsight: string;
  riskScore: number;
  source: "ai" | "math";
}

export interface PredictionResponse {
  data: StockPrediction[];
  lastUpdated: number;
}

// --- HELPER: Fetch with Hard Timeout ---
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getSalesAnalytics(days = 30): Promise<SalesAnalytics | null> {
  const supabase = await createClient();
  const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, product_id, quantity, total_price, status, created_at, products (name)")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });
    
  if (error) return null;
  
  const completed = (orders || []).filter(o => o.status === "completed" || o.status === "pending");
  const totalRevenue = completed.reduce((sum, o) => sum + Number(o.total_price), 0);
  
  const productMap = new Map<string, { quantity: number; revenue: number }>();
  completed.forEach(o => {
    const name = (o.products as any)?.name || "Unknown";
    const existing = productMap.get(name) || { quantity: 0, revenue: 0 };
    productMap.set(name, { quantity: existing.quantity + o.quantity, revenue: existing.revenue + Number(o.total_price) });
  });

  return { 
    totalRevenue, totalOrders: completed.length, 
    avgOrderValue: completed.length > 0 ? totalRevenue / completed.length : 0, 
    topProducts: Array.from(productMap.entries()).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.revenue - a.revenue).slice(0, 5), 
    recentOrders: completed.slice(0, 10).map(o => ({ id: o.id, product_name: (o.products as any)?.name || "Unknown", quantity: o.quantity, total_price: Number(o.total_price), created_at: o.created_at })) 
  };
}

export async function getInventorySummary(): Promise<InventorySummary> {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("stock, price");
  if (!products) return { totalProducts: 0, totalStock: 0, totalValue: 0, lowStockCount: 0 };
  
  return { 
    totalProducts: products.length, totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0), 
    totalValue: products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0), 
    lowStockCount: products.filter(p => (p.stock || 0) < 10).length 
  };
}

export async function getAIDailyBriefing(sales: SalesAnalytics, inventory: InventorySummary): Promise<string> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey || apiKey.includes("your-zai")) return "Briefing unavailable.";

  // Node.js does the heavy analytical lifting
  const topProduct = sales.topProducts[0];
  const stockHealth = inventory.lowStockCount > 3 ? "Critical" : (inventory.lowStockCount > 0 ? "Needs Attention" : "Healthy");

  const prompt = `You are a retail data analyst for a Malaysian fashion store. Write a short, professional daily briefing for the store owner in Malay.
  
Here is the automated data:
- Total Revenue: RM${sales.totalRevenue.toFixed(2)} from ${sales.totalOrders} orders.
- Top Product: ${topProduct?.name || "None"} (Generated RM${topProduct?.revenue.toFixed(0)})
- Overall Stock Health: ${stockHealth} (${inventory.lowStockCount} items are low)

Write 2 paragraphs. Paragraph 1: Celebrate the top product. Paragraph 2: Actionable advice regarding stock health.`;

  try {
    const res = await fetchWithTimeout("https://api.ilmu.ai/anthropic/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ model: "ilmu-glm-5.1", max_tokens: 500, temperature: 0.5, messages: [{ role: "user", content: prompt }] }),
    }, 15000);
    
    const data = await res.json();
    return data.content?.[0]?.text || "Failed to generate briefing.";
  } catch (err) {
    return "Briefing generation failed.";
  }
}

export async function getAnomalyExplanations(products: any[], orders: any[]): Promise<string[]> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey || apiKey.includes("your-zai")) return [];

  // Node.js calculates the anomalies (e.g., comparing week 1 vs week 2)
  const week1Start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const anomalies: { name: string, change: number }[] = [];

  products.forEach(p => {
    const w1 = orders.filter(o => o.product_id === p.id && new Date(o.created_at) >= week1Start).reduce((s, o) => s + o.quantity, 0);
    const w2 = orders.filter(o => o.product_id === p.id && new Date(o.created_at) < week1Start && new Date(o.created_at) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)).reduce((s, o) => s + o.quantity, 0);
    
    if (w2 > 0) {
      const change = Math.round(((w1 - w2) / w2) * 100);
      if (Math.abs(change) > 50) anomalies.push({ name: p.name, change }); // Flag if > 50% change
    }
  });

  if (anomalies.length === 0) return ["No major anomalies detected today."];

  // Ask Z.AI to explain the anomaly
  const anomalyText = anomalies.map(a => `${a.name} (Sales ${a.change > 0 ? 'up' : 'down'} ${Math.abs(a.change)}%)`).join(", ");
  
  const prompt = `A Malaysian fashion store detected sudden sales anomalies for these items: ${anomalyText}. 
  Give exactly ${anomalies.length} very brief sentences explaining possible business reasons for these sudden changes (e.g., viral trend, out of stock, seasonal end). Reply in Malay.`;

  try {
    const res = await fetchWithTimeout("https://api.ilmu.ai/anthropic/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ model: "ilmu-glm-5.1", max_tokens: 300, temperature: 0.5, messages: [{ role: "user", content: prompt }] }),
    }, 15000);
    
    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    // Split the AI's response into an array of sentences
    return text.split('\n').filter((s: string) => s.trim().length > 0);
  } catch (err) {
    return ["Could not fetch AI explanations."];
  }
}

export async function fetchAnomalyInsights(): Promise<string[]> {
  const supabase = await createClient();
  const daysWindow = 14;
  const startDate = new Date(); startDate.setDate(startDate.getDate() - daysWindow);
  
  const { data: orders } = await supabase.from("orders").select("product_id, quantity, created_at").gte("created_at", startDate.toISOString());
  const { data: products } = await supabase.from("products").select("id, name");
  if (!products || !orders) return ["Not enough data to detect anomalies."];

  const week1Start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const anomalies: { name: string; change: number }[] = [];

  products.forEach((p: any) => {
    const w1 = orders.filter((o: any) => o.product_id === p.id && new Date(o.created_at) >= week1Start).reduce((s: number, o: any) => s + o.quantity, 0);
    const w2 = orders.filter((o: any) => o.product_id === p.id && new Date(o.created_at) < week1Start && new Date(o.created_at) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)).reduce((s: number, o: any) => s + o.quantity, 0);
    if (w2 > 0) {
      const change = Math.round(((w1 - w2) / w2) * 100);
      if (Math.abs(change) > 40) anomalies.push({ name: p.name, change });
    }
  });

  if (anomalies.length === 0) return ["No major anomalies detected today. Sales remain stable."];

  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey || apiKey.includes("your-zai")) return ["AI Unavailable"];

  const anomalyText = anomalies.map((a: any) => `${a.name} (Sales ${a.change > 0 ? 'up' : 'down'} ${Math.abs(a.change)}%)`).join(", ");
  const prompt = `A retail fashion store detected sudden sales changes: ${anomalyText}. Provide exactly ${anomalies.length} brief sentences explaining possible business reasons (e.g., viral trend, out of stock, end of season). Answer in English.`;

  try {
    const res = await fetchWithTimeout("https://api.ilmu.ai/anthropic/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ model: "ilmu-glm-5.1", max_tokens: 300, temperature: 0.5, messages: [{ role: "user", content: prompt }] }),
    }, 15000);
    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    // ✅ FIXED: Explicitly type 's' as string
    return text.split('\n').filter((s: string) => s.trim().length > 0);
  } catch (err) { return ["Failed to fetch AI explanations."]; }
}

export async function getAIAnalystInsight(sales: SalesAnalytics, inventory: InventorySummary, predictions: StockPrediction[]): Promise<string> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey || apiKey.includes("your-zai")) return "AI Analyst unavailable. API Key is not configured.";
  
  const stateHash = `${sales.totalRevenue}-${inventory.totalStock}`;
  if (cachedAnalyst && (Date.now() - cachedAnalyst.timestamp < 30 * 60 * 1000) && cachedAnalyst.stateHash === stateHash) {
    return cachedAnalyst.text;
  }

  const fstr = predictions.filter(p => p.status !== "stable").map(p => `${p.name} (${p.daysRemaining}d left)`).join(", ");
  const prompt = `Business: RM${sales.totalRevenue.toFixed(2)} revenue, ${sales.totalOrders} orders. Risks: ${fstr || "None"}. Write 3 short inventory tips in Malay.`;

  try {
    const res = await fetchWithTimeout(
      "https://api.ilmu.ai/anthropic/v1/messages",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ model: "ilmu-glm-5.1", max_tokens: 400, temperature: 0.3, messages: [{ role: "user", content: prompt }] }),
      },
      15000 
    );
    
    const data = await res.json();
    const resultText = data.content?.[0]?.text || "";
    if (resultText) cachedAnalyst = { text: resultText, timestamp: Date.now(), stateHash };
    return resultText;
  } catch (err) {
    return cachedAnalyst ? cachedAnalyst.text : "AI Analyst request failed.";
  }
}

export interface DashboardData {
  kpis: { totalMessages: number; botHandled: number; activeChats: number; ordersToday: number; unansweredConversations: number; avgReplyTimeSeconds: number; };
  volumeData: { time: string; messages: number; botHandled: number; ownerHandled: number }[];
  replyTimeData: { bucket: string; count: number }[];
  liveActivity: { id: string; customer: string; avatar: string; message: string; platform: "Shopee"; status: StatusType; time: string; intent: string; }[];
  timeline: { id: string; label: string; detail: string; time: string; type: "intent" | "tool" | "reply" | "complete"; latency: string; }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { data: messages } = await supabase.from("messages").select("*").gte("created_at", today.toISOString()).order("created_at", { ascending: true });
  const msgList = messages || [];
  
  const latestMessagePerConv = new Map<string, any>();
  const replyDurations: number[] = [];
  const convLastCustomerTime = new Map<string, number>();

  msgList.forEach(m => {
    const time = new Date(m.created_at).getTime();
    latestMessagePerConv.set(m.conversation_id, m);
    if (m.sender === "customer") convLastCustomerTime.set(m.conversation_id, time);
    else if (m.sender === "bot" || m.sender === "owner") {
      const lastTime = convLastCustomerTime.get(m.conversation_id);
      if (lastTime) { replyDurations.push((time - lastTime) / 1000); convLastCustomerTime.delete(m.conversation_id); }
    }
  });

  const volumeMap: Record<string, { botHandled: number; ownerHandled: number; unanswered: number }> = {};
  for (let i = 8; i <= 23; i++) volumeMap[i.toString().padStart(2, "0") + ":00"] = { botHandled: 0, ownerHandled: 0, unanswered: 0 };
  
  msgList.forEach((m) => {
    const hour = new Date(m.created_at).getHours().toString().padStart(2, "0") + ":00";
    if (volumeMap[hour]) {
      if (m.sender === "bot") volumeMap[hour].botHandled++;
      else if (m.sender === "owner") volumeMap[hour].ownerHandled++;
      else if (m.sender === "customer" && (m.status === "unanswered" || !m.status)) volumeMap[hour].unanswered++;
    }
  });

  const currentHour = new Date().getHours();
  const finalVolumeData = Object.keys(volumeMap).map(time => {
    const d = volumeMap[time];
    return { time, botHandled: d.botHandled, ownerHandled: d.ownerHandled, messages: d.botHandled + d.ownerHandled + d.unanswered };
  }).filter(d => parseInt(d.time) <= currentHour);

  const { data: orders } = await supabase.from("orders").select("id").gte("created_at", today.toISOString());
  const systemOrders = msgList.filter(m => m.sender === "system" && m.text.includes("ORDER"));

  return {
    kpis: { 
      totalMessages: msgList.filter(m => m.sender === "customer").length, botHandled: msgList.filter(m => m.sender === "bot").length, 
      activeChats: latestMessagePerConv.size, ordersToday: (orders?.length || 0) + systemOrders.length, 
      unansweredConversations: Array.from(latestMessagePerConv.values()).filter(m => m.status === "unanswered" || m.sender === "customer").length, 
      avgReplyTimeSeconds: replyDurations.length > 0 ? replyDurations.reduce((a, b) => a + b, 0) / replyDurations.length : 0 
    },
    volumeData: finalVolumeData,
    replyTimeData: [
      { bucket: "0–2s", count: replyDurations.filter(d => d <= 2).length },
      { bucket: "2–4s", count: replyDurations.filter(d => d > 2 && d <= 4).length },
      { bucket: "4–6s", count: replyDurations.filter(d => d > 4 && d <= 6).length },
      { bucket: ">6s", count: replyDurations.filter(d => d > 6).length }
    ],
    liveActivity: Array.from(latestMessagePerConv.values()).reverse().slice(0, 5).map((m) => ({ 
      id: m.id, customer: `Shopper-${m.conversation_id.substring(0, 4).toUpperCase()}`, avatar: m.conversation_id.charAt(0).toUpperCase(), 
      message: m.text, platform: "Shopee" as const, status: (m.status as StatusType) || "unanswered", 
      time: new Date(m.created_at).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: false }), intent: "general_query" 
    })),
    timeline: msgList.filter((m) => m.sender === "bot" || m.sender === "system").reverse().slice(0, 5).map((m, idx) => ({ 
      id: m.id || `tl-${idx}`, label: m.sender === "system" ? "System Action" : "Bot Reply", detail: m.text, 
      time: new Date(m.created_at).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }), 
      type: (m.sender === "system" ? "tool" : "reply") as "intent" | "tool" | "reply" | "complete", latency: m.sender === "system" ? "0.1s" : "1.2s" 
    }))
  };
}