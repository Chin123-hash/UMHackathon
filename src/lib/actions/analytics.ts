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
  aiTrendInsight: string; // Now holds the curve pattern (e.g., "Momentum", "Decay")
  riskScore: number; // Now acts as AI Confidence Score
  source: "ai";
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

// --- HELPER: Unified AI Fetcher with Groq Fallback ---
async function fetchAIResponse(prompt: string, maxTokens = 500): Promise<string> {
  const zaiApiKey = process.env.ZAI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (zaiApiKey && !zaiApiKey.includes("your-zai")) {
    try {
      const res = await fetchWithTimeout("https://api.ilmu.ai/anthropic/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": zaiApiKey.trim() },
        body: JSON.stringify({ model: "ilmu-glm-5.1", max_tokens: maxTokens, temperature: 0.3, messages: [{ role: "user", content: prompt }] }),
      }, 25000);
      if (res.ok) { const data = await res.json(); const text = data.content?.[0]?.text; if (text) return text; }
    } catch (err) { console.error(">>> [Analytics AI] Z.ai Exception:", err); }
  }

  if (groqApiKey && !groqApiKey.includes("your-groq")) {
    try {
      const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqApiKey.trim()}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: maxTokens, temperature: 0.3, messages: [{ role: "user", content: prompt }] }),
      }, 25000);
      if (res.ok) { const data = await res.json(); const text = data.choices?.[0]?.message?.content; if (text) return text; }
    } catch (err) { console.error(">>> [Analytics AI] Groq Exception:", err); }
  }

  return "";
}

export async function getSalesAnalytics(days = 30): Promise<SalesAnalytics | null> {
  const supabase = await createClient();
  const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
  const { data: orders, error } = await supabase.from("orders").select("id, product_id, quantity, total_price, status, created_at, products (name)").gte("created_at", startDate.toISOString()).order("created_at", { ascending: false });
  if (error) return null;
  const completed = (orders || []).filter(o => o.status === "completed" || o.status === "pending" || o.status === "shipped");
  const totalRevenue = completed.reduce((sum, o) => sum + Number(o.total_price), 0);
  const productMap = new Map<string, { quantity: number; revenue: number }>();
  completed.forEach(o => {
    const name = (o.products as any)?.name || "Unknown";
    const existing = productMap.get(name) || { quantity: 0, revenue: 0 };
    productMap.set(name, { quantity: existing.quantity + o.quantity, revenue: existing.revenue + Number(o.total_price) });
  });
  return { 
    totalRevenue, totalOrders: completed.length, avgOrderValue: completed.length > 0 ? totalRevenue / completed.length : 0, 
    topProducts: Array.from(productMap.entries()).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.revenue - a.revenue).slice(0, 5), 
    recentOrders: completed.slice(0, 10).map(o => ({ id: o.id, product_name: (o.products as any)?.name || "Unknown", quantity: o.quantity, total_price: Number(o.total_price), created_at: o.created_at })) 
  };
}

export async function getInventorySummary(): Promise<InventorySummary> {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("stock, price");
  if (!products) return { totalProducts: 0, totalStock: 0, totalValue: 0, lowStockCount: 0 };
  return { totalProducts: products.length, totalStock: products.reduce((sum, p) => sum + (p.stock || 0), 0), totalValue: products.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0), lowStockCount: products.filter(p => (p.stock || 0) < 10).length };
}

export async function getAIDailyBriefing(sales: SalesAnalytics, inventory: InventorySummary): Promise<string> {
  if (!process.env.ZAI_API_KEY?.trim() && !process.env.GROQ_API_KEY?.trim()) return "Briefing unavailable.";
  const topProduct = sales.topProducts[0];
  const stockHealth = inventory.lowStockCount > 3 ? "Critical" : (inventory.lowStockCount > 0 ? "Needs Attention" : "Healthy");
  const prompt = `You are a retail data analyst for a Malaysian fashion store. Write a short, professional daily briefing for the store owner in English.\n\nData:\n- Revenue: RM${sales.totalRevenue.toFixed(2)} (${sales.totalOrders} orders).\n- Top Product: ${topProduct?.name || "None"}\n- Stock Health: ${stockHealth} (${inventory.lowStockCount} items low)\n\nWrite 2 paragraphs. P1: Celebrate top product. P2: Stock advice.`;
  const resultText = await fetchAIResponse(prompt, 500);
  return resultText || "Briefing unavailable.";
}

export async function fetchAnomalyInsights(): Promise<string[]> {
  const supabase = await createClient();
  const startDate = new Date(); startDate.setDate(startDate.getDate() - 14);
  const { data: orders } = await supabase.from("orders").select("product_id, quantity, created_at").gte("created_at", startDate.toISOString());
  const { data: products } = await supabase.from("products").select("id, name");
  if (!products || !orders) return ["Not enough data."];
  
  const week1Start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const anomalies: { name: string; change: number }[] = [];
  
  products.forEach((p: any) => {
    const w1 = orders.filter((o: any) => o.product_id === p.id && new Date(o.created_at) >= week1Start).reduce((s: number, o: any) => s + o.quantity, 0);
    const w2 = orders.filter((o: any) => o.product_id === p.id && new Date(o.created_at) < week1Start && new Date(o.created_at) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)).reduce((s: number, o: any) => s + o.quantity, 0);
    if (w2 > 0) { const change = Math.round(((w1 - w2) / w2) * 100); if (Math.abs(change) > 40) anomalies.push({ name: p.name, change }); }
  });
  
  if (anomalies.length === 0) return ["No major anomalies detected."];
  if (!process.env.ZAI_API_KEY?.trim() && !process.env.GROQ_API_KEY?.trim()) return ["AI Unavailable"];
  
  const anomalyText = anomalies.map((a: any) => `${a.name} (${a.change > 0 ? '+' : ''}${a.change}%)`).join(", ");
  
  // ✅ UPDATED: Strict formatting rules to prevent Markdown tables
  const text = await fetchAIResponse(
    `Sales changes: ${anomalyText}. Give brief reasons in English and suggested steps to handle this anomaly. 
    STRICT FORMAT: 
    - Use plain text only.
    - DO NOT use markdown tables, hashtags (#), or bold asterisks (**).
    - Format as bullet points: "- Product: Reason. Action: Suggestion"`, 
    400
  );
  
  return text ? text.split('\n').filter((s: string) => s.trim().length > 0) : ["Failed to fetch insights."];
}

// ✅ UPGRADED: Advanced Strategic AI Analyst
// ✅ UPDATED: Advanced Strategic AI Analyst (English, Plain Text, High Token)
export async function getAIAnalystInsight(sales: SalesAnalytics, inventory: InventorySummary, predictions: StockPrediction[]): Promise<string> {
  if (!process.env.ZAI_API_KEY?.trim() && !process.env.GROQ_API_KEY?.trim()) return "AI Analyst unavailable.";
  
  const stateHash = `${sales.totalRevenue}-${inventory.totalStock}`;
  if (cachedAnalyst && (Date.now() - cachedAnalyst.timestamp < 30 * 60 * 1000) && cachedAnalyst.stateHash === stateHash) return cachedAnalyst.text;
  
  const topProduct = sales.topProducts[0];
  const aov = sales.avgOrderValue;
  const riskItems = predictions.filter(p => p.status !== "stable");

  const prompt = `You are a Senior Retail Strategist for a Malaysian fashion e-commerce store. Analyze this data and provide a highly actionable, advanced business strategy in English.

DATA SNAPSHOT:
- Total Revenue: RM${sales.totalRevenue.toFixed(2)} from ${sales.totalOrders} orders.
- Average Order Value (AOV): RM${aov.toFixed(2)}
- Top Seller Dependency: ${topProduct?.name || "None"} (Generating RM${topProduct?.revenue?.toFixed(2) || 0})
- Inventory Health: ${inventory.totalStock} units total, ${inventory.lowStockCount} items critically low.
 ${riskItems.length > 0 ? `- SUPPLY CHAIN RISKS: ${riskItems.map(p => `${p.name} (est. ${p.daysRemaining} days left, Pattern: ${p.aiTrendInsight})`).join(", ")}` : "- Stock levels are generally healthy."}

STRICT FORMATTING RULES:
- DO NOT use any Markdown formatting (no ###, no **, no asterisks, no hashtags).
- Use plain text only. You can use numbers (1., 2., 3.) or UPPERCASE text for section headers.
- Separate sections with a blank line.

Provide your analysis in exactly 3 sections:
1. HIDDEN INSIGHT: What is the real story behind these numbers? (e.g., Is AOV too low? Too dependent on one product? Are we buying traffic but not converting?)
2. STRATEGIC BOTTLENECK: What is the single biggest risk or constraint preventing revenue scaling this week?
3. IMMEDIATE ACTION PLAN: Give 2 specific, unconventional tactics to execute RIGHT NOW to fix the bottleneck or boost revenue. (e.g., specific dynamic bundling ideas, pricing shifts, or ad focus strategies).`;

  // ✅ Increased max_tokens to 1000 for longer plain-text output
  const resultText = await fetchAIResponse(prompt, 1000); 
  if (resultText) { cachedAnalyst = { text: resultText, timestamp: Date.now(), stateHash }; return resultText; }
  return cachedAnalyst ? cachedAnalyst.text : "AI Analyst failed.";
}

export async function getShippingRecommendations(destination: string) {
  const supabase = await createClient();
  const { data: rates, error } = await supabase.from('courier_rates').select(`base_price, buyer_base_price, handling_fee, destination, courier_partners(name)`).ilike('destination', `%${destination}%`);
  if (error || !rates || rates.length === 0) return { success: false, message: "No rates found." };
  const recommendations = rates.map(r => {
    const partner = Array.isArray(r.courier_partners) ? r.courier_partners[0]?.name : (r.courier_partners as any)?.name;
    const sellerCost = Number(r.base_price); const buyerCharge = Number(r.buyer_base_price) + Number(r.handling_fee);
    return { partner, sellerCost: sellerCost.toFixed(2), buyerCharge: buyerCharge.toFixed(2), profit: (buyerCharge - sellerCost).toFixed(2) };
  }).sort((a, b) => Number(a.sellerCost) - Number(b.sellerCost));
  const prompt = `Analyze courier for ${destination}: ${recommendations.map(r => `${r.partner}: Cost RM${r.sellerCost}, Profit RM${r.profit}`).join(", ")}. Short best option recommendation.`;
  const aiSummary = await fetchAIResponse(prompt, 200);
  return { success: true, recommendations, aiSummary: aiSummary || `Recommend ${recommendations[0].partner}.` };
}

// ✅ UPGRADED: True AI Sequence Modeling for Stock Predictions
export async function getStockPredictions(): Promise<PredictionResponse> {
  const supabase = await createClient();
  const daysWindow = 10;
  const startDate = new Date(); startDate.setDate(startDate.getDate() - daysWindow);
  
  const { data: orders } = await supabase.from("orders").select("product_id, quantity, created_at").gte("created_at", startDate.toISOString());
  const { data: products } = await supabase.from("products").select("id, name, stock");
  
  if (!products || !orders) return { data: [], lastUpdated: Date.now() };

  // 1. Find Top 5 Selling Products
  const salesMap = new Map<string, number>();
  orders.forEach(o => { salesMap.set(o.product_id, (salesMap.get(o.product_id) || 0) + o.quantity); });

  const top5Products = products
    .map(p => ({ ...p, totalSold: salesMap.get(p.id) || 0 }))
    .filter(p => p.totalSold > 0)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);

  if (top5Products.length === 0) return { data: [], lastUpdated: Date.now() };

  // 2. Build Time-Series Data (Last 10 days array) instead of doing the math for the AI
  const itemsToAnalyze = top5Products.map(p => {
    const dailySalesSeq = [];
    for (let i = 9; i >= 0; i--) {
      const dayStart = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const daySold = orders.filter(o => 
        o.product_id === p.id && 
        new Date(o.created_at) >= dayStart && 
        new Date(o.created_at) < dayEnd
      ).reduce((sum, o) => sum + o.quantity, 0);
      dailySalesSeq.push(daySold);
    }
    
    // Calculate basic velocity just for fallback UI info, but don't send to AI
    const totalSold = dailySalesSeq.reduce((a, b) => a + b, 0);
    return { 
      id: p.id, name: p.name, stock: p.stock, dailySalesSeq, basicVelocity: totalSold / daysWindow
    };
  });

  // --- CACHE CHECK ---
  const currentStateHash = itemsToAnalyze.map(i => `${i.id}-${i.stock}`).join("|");
  if (cachedPredictions && (Date.now() - cachedPredictions.timestamp < 15 * 60 * 1000) && cachedPredictions.stateHash === currentStateHash) {
    return { data: cachedPredictions.data, lastUpdated: cachedPredictions.timestamp };
  }

  // --- API KEY CHECK ---
  const apiKey = process.env.ZAI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  if ((!apiKey || apiKey.includes("your-zai")) && (!groqApiKey || groqApiKey.includes("your-groq"))) {
    return { data: [], lastUpdated: Date.now() }; 
  }

  // Send raw sequence to AI for curve analysis
  const compressedData = itemsToAnalyze.map(i => 
    `${i.id}|Stock:${i.stock}|Seq:[${i.dailySalesSeq.join(",")}]`
  ).join(";");
  
  let aiText = "";

  const aiPrompt = `You are an advanced Supply Chain AI. Analyze the 10-day sales sequence for each product to predict stockouts.
Do NOT use simple averages. Look for trends, momentum, decay curves, or volatility.

Format: ID|predicted_days|confidence|pattern|insight
Data:
 ${compressedData}

Rules:
- predicted_days: Float or Int. If sequence is [0,0,0,5,10], momentum is high (predict faster stockout). If [10,8,5,2], decay is happening (predict slower).
- confidence: 0-100 (Lower if sequence is highly erratic like [0,10,0,5,0]).
- pattern: "Momentum", "Decay", "Stable", "Volatile", or "Spike".
- insight: Max 8 words explaining the curve shape.
Output:`;

  // 1. Try Z.ai
  if (apiKey && !apiKey.includes("your-zai")) {
    try {
      const res = await fetchWithTimeout("https://api.ilmu.ai/anthropic/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ model: "ilmu-glm-5.1", max_tokens: 300, temperature: 0, messages: [{ role: "user", content: aiPrompt }] })
      }, 10000);
      if (res.ok) aiText = (await res.json()).content?.[0]?.text || "";
    } catch (err) { console.error(">>> [Prediction] Z.ai failed"); }
  }

  // 2. Fallback to Groq
  if (!aiText && groqApiKey && !groqApiKey.includes("your-groq")) {
    try {
      const res = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqApiKey.trim()}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 300, temperature: 0, messages: [{ role: "user", content: aiPrompt }] })
      }, 10000);
      if (res.ok) aiText = (await res.json()).choices?.[0]?.message?.content || "";
    } catch (err) { console.error(">>> [Prediction] Groq failed"); }
  }

  if (!aiText) return { data: [], lastUpdated: Date.now() }; 

  // 3. Parse Advanced AI text
  const result: StockPrediction[] = itemsToAnalyze.map(item => {
    let days = 99; 
    let confidence = 50; 
    let pattern = "Unknown"; 
    let insight = "AI analyzed";

    const lineMatch = aiText.split("\n").find(l => l.startsWith(item.id));
    if (lineMatch) {
      const parts = lineMatch.split("|");
      days = parseFloat(parts[1]) || 99;
      confidence = parseInt(parts[2]) || 50;
      pattern = parts[3]?.trim() || "Stable";
      insight = parts[4]?.trim() || "Trend analyzed";
    }
    
    const status: "critical" | "warning" | "stable" = days <= 3 ? "critical" : (days <= 7 ? "warning" : "stable");
    
    return { 
      id: item.id, name: item.name, currentStock: item.stock, 
      dailyVelocity: item.basicVelocity, // Kept for UI context
      daysRemaining: days, status, 
      aiTrendInsight: pattern, // Now shows the curve pattern
      riskScore: confidence, // Now acts as AI Confidence Score
      source: "ai" 
    };
  });

  cachedPredictions = { data: result, timestamp: Date.now(), stateHash: currentStateHash };
  return { data: result, lastUpdated: Date.now() };
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { data: messages } = await supabase.from("messages").select("*").gte("created_at", today.toISOString()).order("created_at", { ascending: true });
  const msgList = messages || [];
  const latestMessagePerConv = new Map<string, any>(); const replyDurations: number[] = []; const convLastCustomerTime = new Map<string, number>();
  msgList.forEach(m => {
    const time = new Date(m.created_at).getTime(); latestMessagePerConv.set(m.conversation_id, m);
    if (m.sender === "customer") convLastCustomerTime.set(m.conversation_id, time);
    else if (m.sender === "bot" || m.sender === "owner") { const lastTime = convLastCustomerTime.get(m.conversation_id); if (lastTime) { replyDurations.push((time - lastTime) / 1000); convLastCustomerTime.delete(m.conversation_id); } }
  });
  const volumeMap: Record<string, { botHandled: number; ownerHandled: number; unanswered: number }> = {};
  for (let i = 8; i <= 23; i++) volumeMap[i.toString().padStart(2, "0") + ":00"] = { botHandled: 0, ownerHandled: 0, unanswered: 0 };
  msgList.forEach((m) => {
    const hour = new Date(m.created_at).getHours().toString().padStart(2, "0") + ":00";
    if (volumeMap[hour]) { if (m.sender === "bot") volumeMap[hour].botHandled++; else if (m.sender === "owner") volumeMap[hour].ownerHandled++; else if (m.sender === "customer" && (m.status === "unanswered" || !m.status)) volumeMap[hour].unanswered++; }
  });
  const currentHour = new Date().getHours();
  const finalVolumeData = Object.keys(volumeMap).map(time => { const d = volumeMap[time]; return { time, botHandled: d.botHandled, ownerHandled: d.ownerHandled, messages: d.botHandled + d.ownerHandled + d.unanswered }; }).filter(d => parseInt(d.time) <= currentHour);
  const { data: orders } = await supabase.from("orders").select("id").gte("created_at", today.toISOString());
  const systemOrders = msgList.filter(m => m.sender === "system" && m.text.includes("ORDER"));
  return {
    kpis: { totalMessages: msgList.filter(m => m.sender === "customer").length, botHandled: msgList.filter(m => m.sender === "bot").length, activeChats: latestMessagePerConv.size, ordersToday: (orders?.length || 0) + systemOrders.length, unansweredConversations: Array.from(latestMessagePerConv.values()).filter(m => m.status === "unanswered" || m.sender === "customer").length, avgReplyTimeSeconds: replyDurations.length > 0 ? replyDurations.reduce((a, b) => a + b, 0) / replyDurations.length : 0 },
    volumeData: finalVolumeData,
    replyTimeData: [ { bucket: "0–2s", count: replyDurations.filter(d => d <= 2).length }, { bucket: "2–4s", count: replyDurations.filter(d => d > 2 && d <= 4).length }, { bucket: "4–6s", count: replyDurations.filter(d => d > 4 && d <= 6).length }, { bucket: ">6s", count: replyDurations.filter(d => d > 6).length } ],
    liveActivity: Array.from(latestMessagePerConv.values()).reverse().slice(0, 5).map((m) => ({ id: m.id, customer: `Shopper-${m.conversation_id.substring(0, 4).toUpperCase()}`, avatar: m.conversation_id.charAt(0).toUpperCase(), message: m.text, platform: "Shopee" as const, status: (m.status as StatusType) || "unanswered", time: new Date(m.created_at).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: false }), intent: "general_query" })),
    timeline: msgList.filter((m) => m.sender === "bot" || m.sender === "system").reverse().slice(0, 5).map((m, idx) => ({ id: m.id || `tl-${idx}`, label: m.sender === "system" ? "System Action" : "Bot Reply", detail: m.text, time: new Date(m.created_at).toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }), type: (m.sender === "system" ? "tool" : "reply") as "intent" | "tool" | "reply" | "complete", latency: m.sender === "system" ? "0.1s" : "1.2s" }))
  };
}

export interface DashboardData {
  kpis: { totalMessages: number; botHandled: number; activeChats: number; ordersToday: number; unansweredConversations: number; avgReplyTimeSeconds: number; };
  volumeData: { time: string; messages: number; botHandled: number; ownerHandled: number }[];
  replyTimeData: { bucket: string; count: number }[];
  liveActivity: { id: string; customer: string; avatar: string; message: string; platform: "Shopee"; status: StatusType; time: string; intent: string; }[];
  timeline: { id: string; label: string; detail: string; time: string; type: "intent" | "tool" | "reply" | "complete"; latency: string; }[];
}