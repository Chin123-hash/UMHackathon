"use server";

import { createClient } from "@/lib/supabase/server";

// Define the union type to match StatusBadge.tsx exactly to fix TS errors
export type StatusType =
  | 'bot-responded' | 'owner-replied' | 'unanswered'
  | 'shipped' | 'pending' | 'to-ship' | 'delivered' | 'low-stock' 
  | 'out-of-stock' | 'in-stock' | 'active' | 'inactive';

export interface DashboardData {
  kpis: {
    totalMessages: number;
    botHandled: number;
    activeChats: number;
    ordersToday: number;
    unansweredConversations: number;
    avgReplyTimeSeconds: number;
  };
  volumeData: { time: string; messages: number; botHandled: number; ownerHandled: number }[];
  replyTimeData: { bucket: string; count: number }[];
  liveActivity: {
    id: string;
    customer: string;
    avatar: string;
    message: string;
    platform: "Shopee";
    status: StatusType; // UPDATED: Now aligns with Inbox and DB
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  // 1. Fetch all messages for today (including the new 'status' column)
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .gte("created_at", todayStr)
    .order("created_at", { ascending: true });

  const msgList = messages || [];

  // Group by conversation_id to find the latest state of each chat
  const latestMessagePerConv = new Map<string, any>();
  msgList.forEach((m) => {
    latestMessagePerConv.set(m.conversation_id, m);
  });

  // A conversation is unanswered only if the latest message status is unanswered.
  const unansweredConversations = Array.from(latestMessagePerConv.values())
    .filter((m) => m.status === "unanswered").length;
  const totalMessages = msgList.length;
  const botHandled = msgList.filter((m) => m.sender === "bot").length;
  const activeChats = latestMessagePerConv.size;

  // Pair each customer message with the next bot response in the same conversation.
  const pendingCustomerAt = new Map<string, number>();
  const replyDurationsSeconds: number[] = [];

  msgList.forEach((m) => {
    const createdAtMs = new Date(m.created_at).getTime();
    if (Number.isNaN(createdAtMs)) return;

    if (m.sender === "customer") {
      pendingCustomerAt.set(m.conversation_id, createdAtMs);
      return;
    }

    if (m.sender === "bot") {
      const pendingAt = pendingCustomerAt.get(m.conversation_id);
      if (pendingAt !== undefined) {
        const durationSeconds = (createdAtMs - pendingAt) / 1000;
        if (durationSeconds >= 0) {
          replyDurationsSeconds.push(durationSeconds);
        }
        pendingCustomerAt.delete(m.conversation_id);
      }
    }
  });

  const avgReplyTimeSeconds = replyDurationsSeconds.length
    ? replyDurationsSeconds.reduce((sum, secs) => sum + secs, 0) / replyDurationsSeconds.length
    : 0;

  // --- Volume Chart (Total, Bot, Owner) ---
  const volumeMap: Record<string, { messages: number; botHandled: number; ownerHandled: number }> = {};
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

  const currentHour = new Date().getHours();
  const volumeData = Object.keys(volumeMap)
    .map(time => ({ time, ...volumeMap[time] }))
    .filter(d => parseInt(d.time) <= currentHour);

  // --- Live Activity Feed (Now using real DB statuses) ---
  // Get the latest message from each active customer
  const liveActivity = Array.from(latestMessagePerConv.values())
    .reverse()
    .slice(0, 5)
    .map((m) => {
      const date = new Date(m.created_at);
      
      // Determine the correct StatusType for the badge
      let status: StatusType = (m.status as StatusType) || 'unanswered';
      if (!m.status) {
        if (m.sender === 'bot') status = 'bot-responded';
        if (m.sender === 'owner') status = 'owner-replied';
      }

      return {
        id: m.id,
        customer: `Shopper-${m.conversation_id.substring(0, 4).toUpperCase()}`,
        avatar: m.conversation_id.charAt(0).toUpperCase(),
        message: m.text,
        platform: "Shopee" as const,
        status: status, // REAL STATUS FROM DB
        time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
        intent: "inquiry"
      };
    });

  const replyTimeRanges = [
    { bucket: "0–2s", min: 0, max: 2 },
    { bucket: "2–4s", min: 2, max: 4 },
    { bucket: "4–6s", min: 4, max: 6 },
    { bucket: "6–10s", min: 6, max: 10 },
    { bucket: "10–15s", min: 10, max: 15 },
    { bucket: ">15s", min: 15, max: Number.POSITIVE_INFINITY },
  ];
  const replyTimeData = replyTimeRanges.map(({ bucket, min, max }) => ({
    bucket,
    count: replyDurationsSeconds.filter((secs) => secs >= min && secs < max).length,
  }));

  const timeline = msgList.filter((m) => m.sender === "bot" || m.sender === "system").reverse().slice(0, 5).map((m, idx) => ({
    id: m.id || `tl-${idx}`,
    label: m.sender === "system" ? "System Action" : "Bot Reply",
    detail: m.text,
    time: new Date(m.created_at).toLocaleTimeString('en-MY', { hour12: false }),
    type: m.sender === "system" ? "tool" as const : "reply" as const,
    latency: m.sender === "system" ? "0.1s" : "1.2s"
  }));
  return {
    kpis: {
      totalMessages,
      botHandled,
      activeChats,
      ordersToday: msgList.filter((m) => m.sender === "system" && m.text.includes("ORDER")).length,
      unansweredConversations,
      avgReplyTimeSeconds,
    },
    volumeData,
    replyTimeData,
    liveActivity,
    timeline
  };
}