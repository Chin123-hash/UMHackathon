"use server";

import { createClient } from "@/lib/supabase/server";

export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    id: string;
    product_name: string;
    quantity: number;
    total_price: number;
    created_at: string;
  }[];
}

export async function getSalesAnalytics(
  days = 30
): Promise<SalesAnalytics | null> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch orders within the time period
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      `
      id,
      product_id,
      quantity,
      total_price,
      status,
      created_at,
      products (name)
    `
    )
    .gte("created_at", startDate.toISOString())
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  // Placeholder for the rest of sales analytics logic
  return null; 
}

// --- NEW DASHBOARD DATA FUNCTION ---

export interface DashboardData {
  kpis: {
    totalMessages: number;
    botHandled: number;
    activeChats: number;
    ordersToday: number;
  };
  volumeData: { time: string; messages: number; botHandled: number; ownerHandled: number }[];
  replyTimeData: { bucket: string; count: number }[];
  liveActivity: {
    id: string;
    customer: string;
    avatar: string;
    message: string;
    platform: "Shopee";
    status: "bot-responded" | "owner-replied" | "unanswered" | "escalated";
    time: string;
    intent: string;
  }[];
  timeline: {
    id: string;
    label: string;
    detail: string;
    time: string;
    type: "intent" | "tool" | "reply" | "complete";
    latency: string;
  }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  // Get start of today for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  // 1. Fetch all messages for today
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .gte("created_at", todayStr)
    .order("created_at", { ascending: true });

  const msgList = messages || [];

  // 2. Fetch system orders from chat (Our Chatbot Action Trigger)
  const systemOrders = msgList.filter(m => m.sender === 'system' && m.text.includes('ORDER'));
  
  // 3. Optionally fetch real orders from orders table
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .gte("created_at", todayStr);

  const ordersToday = (orders?.length || 0) + systemOrders.length;

  // --- KPIs ---
  const totalMessages = msgList.length;
  const botHandled = msgList.filter((m) => m.sender === "bot").length;
  const uniqueChats = new Set(msgList.map((m) => m.conversation_id)).size;

  // --- Volume Chart (Grouped by Hour) ---
  const volumeMap: Record<string, { messages: number; botHandled: number; ownerHandled: number }> = {};
  
  // Initialize hours 08:00 to 23:00 to keep the chart structure intact
  for (let i = 8; i <= 23; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    volumeMap[hour] = { messages: 0, botHandled: 0, ownerHandled: 0 };
  }

  msgList.forEach((m) => {
    const date = new Date(m.created_at);
    const hour = date.getHours().toString().padStart(2, '0') + ':00';
    if (volumeMap[hour]) {
      volumeMap[hour].messages++;
      if (m.sender === "bot") volumeMap[hour].botHandled++;
      if (m.sender === "owner") volumeMap[hour].ownerHandled++;
    }
  });

  // Filter to show hours up to the current hour
  const currentHour = new Date().getHours();
  const volumeData = Object.keys(volumeMap)
    .map(time => ({
      time,
      messages: volumeMap[time].messages,
      botHandled: volumeMap[time].botHandled,
      ownerHandled: volumeMap[time].ownerHandled
    }))
    .filter(d => parseInt(d.time) <= currentHour);

  // --- Reply Time Chart (Simulated distribution based on actual volume) ---
  // Calculates realistic buckets based on the total bot responses
  const replyTimeData = [
    { bucket: "0–2s", count: Math.floor(botHandled * 0.45) },
    { bucket: "2–4s", count: Math.floor(botHandled * 0.35) },
    { bucket: "4–6s", count: Math.floor(botHandled * 0.15) },
    { bucket: "6–10s", count: Math.floor(botHandled * 0.05) },
    { bucket: "10–15s", count: 0 },
    { bucket: ">15s", count: 0 },
  ];

  // --- Live Activity Feed (Latest 5 Customer Messages) ---
  const customers = msgList.filter((m) => m.sender === "customer").reverse().slice(0, 5);
  const liveActivity = customers.map((m, idx) => {
    const date = new Date(m.created_at);
    const textLower = m.text.toLowerCase();
    
    // Simple intent detection based on keywords
    let intent = "general_query";
    if (textLower.includes("beli") || textLower.includes("order")) intent = "purchase_intent";
    else if (textLower.includes("stok") || textLower.includes("ada")) intent = "stock_query";
    else if (textLower.includes("pos") || textLower.includes("shipping")) intent = "shipping_query";

    return {
      id: m.id || `act-${idx}`,
      customer: m.conversation_id || "ShopeeUser",
      avatar: (m.conversation_id || "SU").substring(0, 2).toUpperCase(),
      message: m.text,
      platform: "Shopee" as const,
      status: "bot-responded" as const,
      time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
      intent: intent
    };
  });

  // --- Agent Timeline (Latest 5 Bot/System Actions) ---
  const botSysMsgs = msgList.filter((m) => m.sender === "bot" || m.sender === "system").reverse().slice(0, 5);
  const timeline = botSysMsgs.map((m, idx) => {
    const date = new Date(m.created_at);
    const isSystem = m.sender === "system";
    return {
      id: m.id || `tl-${idx}`,
      label: isSystem ? "System Action" : "Bot Reply",
      detail: m.text,
      time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`,
      type: isSystem ? "tool" as const : "reply" as const,
      latency: isSystem ? "0.1s" : "1.2s" // Simulated latency
    };
  });

  return {
    kpis: {
      totalMessages,
      botHandled,
      activeChats: uniqueChats,
      ordersToday
    },
    volumeData,
    replyTimeData,
    liveActivity,
    timeline
  };
}