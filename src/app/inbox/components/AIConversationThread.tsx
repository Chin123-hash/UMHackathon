"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  Bot,
  User,
  Crown,
  Loader2,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { toast } from "sonner";
import { createBrowserClient } from '@supabase/ssr';
import { addMessage } from "@/lib/actions/messages";

export interface Conversation {
  id: string;
  customer: string;
  avatar: string;
  lastMessage: string;
  time: string;
  status: string;
  intent: string;
}

interface AIConversationThreadProps {
  conversation: Conversation;
  viralSpike: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIConversationThread({
  conversation,
  viralSpike,
}: AIConversationThreadProps) {
  const [ownerReplyText, setOwnerReplyText] = useState("");
  const [customerInput, setCustomerInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Initialize Supabase Client for the chat window
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch the full chat history when the conversation changes
  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true }); // Oldest first for chat view

      if (error) {
        console.error("Failed to fetch chat history:", error);
      } else if (data && isMounted) {
        // Map database rows to our local UI state
        const history: Message[] = data.map((msg) => ({
          id: msg.id,
          role: msg.sender === 'customer' ? 'user' : 'assistant',
          content: msg.text,
        }));
        setMessages(history);
      }
      
      if (isMounted) {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [conversation.id, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isLoadingHistory]);

  const appendMessage = async (role: "user" | "assistant", content: string) => {
    const newMessage: Message = { id: Date.now().toString(), role, content };
    setMessages((prev) => [...prev, newMessage]);

    if (role === "user") {
      setIsLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversation.id,
            message: content,
          }),
        });

        if (!res.ok) throw new Error("API Request Failed");

        const data = await res.json();
        
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "-bot",
            role: "assistant",
            content: data.reply || "Sorry, no response received.",
          },
        ]);
      } catch (error) {
        toast.error("Failed to fetch bot response.");
        console.error("Chat Error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Viral spike auto-response simulation
  useEffect(() => {
    if (viralSpike && conversation.id.startsWith("spike")) {
      const timeout = setTimeout(() => {
        appendMessage("user", "stk size M ada tak? nak beli");
      }, 1000);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viralSpike, conversation.id]);

  const handleSendOwnerReply = async () => {
    if (!ownerReplyText.trim()) return;
    
    const textToSend = `[Owner Reply] ${ownerReplyText}`;
    setOwnerReplyText("");

    // Use our server action which now handles the 'status' column correctly
    const result = await addMessage(conversation.id, 'owner', textToSend);

    if (result.success) {
       // Update the local messages state
       setMessages((prev) => [
         ...prev,
         {
           id: result.data?.id || Date.now().toString(),
           role: "assistant",
           content: textToSend,
         },
       ]);
       toast.success("Status updated to Owner Replied");
    } else {
       toast.error("Database sync failed");
    }
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInput.trim() || isLoading) return;
    appendMessage("user", customerInput);
    setCustomerInput("");
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Thread header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
            {conversation.avatar}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mono">
              {conversation.customer}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded mono font-medium">
                Shopee
              </span>
              <StatusBadge status={conversation.status as any} />
              <span className="text-xs text-muted-foreground mono">
                {conversation.intent.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2" />
      </div>

      {/* Viral spike indicator */}
      {viralSpike && conversation.id.startsWith("spike") && (
        <div className="flex items-center gap-2 px-5 py-2 bg-orange-50 border-b border-orange-200 text-xs text-orange-700">
          <Loader2 size={12} className="animate-spin" />
          Agent is auto-responding to viral spike messages…
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-3">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
            <Loader2 className="animate-spin" size={24} />
            <p className="text-sm">Loading chat history...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="animate-fade-in">
              <div
                className={[
                  "flex items-end gap-2",
                  msg.role === "user" ? "justify-start" : "justify-end",
                ].join(" ")}
              >
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mb-1">
                    <User size={12} className="text-muted-foreground" />
                  </div>
                )}
                <div className="max-w-xs xl:max-w-sm">
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 mb-1 justify-end">
                      {msg.content.startsWith("[Owner Reply]") ? (
                        <>
                          <Crown size={11} className="text-green-600" />
                          <span className="text-xs text-green-600 font-medium mono">
                            Owner
                          </span>
                        </>
                      ) : (
                        <>
                          <Bot size={11} className="text-primary-600" />
                          <span className="text-xs text-primary-600 font-medium mono">
                            Agent
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  <div
                    className={[
                      "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-muted text-foreground rounded-bl-sm"
                        : msg.content.startsWith("[Owner Reply]")
                        ? "bg-green-600 text-white rounded-br-sm"
                        : "bg-primary-600 text-white rounded-br-sm",
                    ].join(" ")}
                  >
                    {msg.content.startsWith("[Owner Reply]")
                      ? msg.content.replace("[Owner Reply] ", "")
                      : msg.content}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-end animate-fade-in">
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-primary-600 rounded-2xl rounded-br-sm">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Customer message input */}
      <div className="px-5 py-2 border-t border-border shrink-0 bg-muted/30">
        <form onSubmit={handleCustomerSubmit} className="flex gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mono">
            <User size={12} className="text-muted-foreground" />
            Simulate Customer
          </div>
          <input
            type="text"
            value={customerInput}
            onChange={(e) => setCustomerInput(e.target.value)}
            placeholder="Type as customer to test bot response…"
            className="flex-1 px-3 py-2 text-sm bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
            suppressHydrationWarning
          />
          <button
            type="submit"
            disabled={!customerInput.trim() || isLoading}
            className="px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Owner reply input */}
      <div className="px-5 py-3.5 border-t border-border shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 mono">
          <Crown size={12} className="text-green-600" />
          Reply as Owner
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={ownerReplyText ?? ""}
            onChange={(e) => setOwnerReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendOwnerReply()}
            placeholder="Type a reply as owner…"
            className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
            suppressHydrationWarning
          />
          <button
            onClick={handleSendOwnerReply}
            disabled={!ownerReplyText.trim()}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}