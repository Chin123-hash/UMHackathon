"use server";

import { createClient } from "@/lib/supabase/server";

export interface Message {
  id: string;
  conversation_id: string;
  sender: "customer" | "bot" | "owner";
  text: string;
  created_at: string;
}

export async function getConversationMessages(
  conversationId: string
): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return data || [];
}

export async function getConversations(): Promise<
  { conversation_id: string; last_message: string; last_time: string }[]
> {
  const supabase = await createClient();

  // Get distinct conversations with their latest message
  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id, text, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  // Group by conversation_id and get the latest message
  const conversationMap = new Map<
    string,
    { conversation_id: string; last_message: string; last_time: string }
  >();

  for (const msg of data || []) {
    if (!conversationMap.has(msg.conversation_id)) {
      conversationMap.set(msg.conversation_id, {
        conversation_id: msg.conversation_id,
        last_message: msg.text,
        last_time: msg.created_at,
      });
    }
  }

  return Array.from(conversationMap.values());
}

export async function addMessage(
  conversationId: string,
  sender: "customer" | "bot" | "owner",
  text: string
): Promise<{ success: boolean; data?: Message; error?: string }> {
  const supabase = await createClient();

  // --- FIX: Map sender to the correct database status ---
  let status = "unanswered";
  if (sender === "bot") status = "bot-responded";
  if (sender === "owner") status = "owner-replied";

  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: conversationId,
        sender,
        text,
        status, // Now we explicitly tell the DB what the status is
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding message:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
