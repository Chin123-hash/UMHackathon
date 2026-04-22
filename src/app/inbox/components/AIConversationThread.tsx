"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Send,
  Bot,
  User,
  Crown,
  Loader2,
  Info,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import StatusBadge from "@/components/ui/StatusBadge";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  customer: string;
  avatar: string;
  lastMessage: string;
  time: string;
  status: "new" | "ongoing" | "escalated" | "resolved";
  intent: string;
}

interface AIConversationThreadProps {
  conversation: Conversation;
  viralSpike: boolean;
  onEscalate: (id: string) => void;
}

export default function AIConversationThread({
  conversation,
  viralSpike,
  onEscalate,
}: AIConversationThreadProps) {
  const [escalated, setEscalated] = useState(
    conversation.status === "escalated"
  );
  const [ownerReplyText, setOwnerReplyText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
  } = useChat({
    api: "/api/chat",
    body: {
      conversationId: conversation.id,
    },
    initialMessages: [
      {
        id: "initial-customer-msg",
        role: "user",
        content: conversation.lastMessage,
      },
    ],
  });
  const customerInput = input ?? "";

  useEffect(() => {
    setEscalated(conversation.status === "escalated");
  }, [conversation.status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle viral spike auto-response simulation
  useEffect(() => {
    if (viralSpike && conversation.id.startsWith("spike")) {
      const timeout = setTimeout(() => {
        append({
          role: "user",
          content: "stk size M ada tak? nak beli",
        });
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [viralSpike, conversation.id, append]);

  const handleEscalate = () => {
    setEscalated(true);
    onEscalate(conversation.id);
    toast.warning(
      `Conversation escalated to owner — ${conversation.customer}`,
      {
        description: "You will be notified when the owner replies.",
      }
    );
  };

  const handleSendOwnerReply = () => {
    if (!ownerReplyText.trim()) return;
    append({
      role: "assistant",
      content: `[Owner Reply] ${ownerReplyText}`,
    });
    setOwnerReplyText("");
    toast.success("Reply sent as Owner");
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e);
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
              <StatusBadge status={conversation.status} />
              <span className="text-xs text-muted-foreground mono">
                {conversation.intent.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!escalated && (
            <button
              onClick={handleEscalate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors active:scale-95"
            >
              <AlertTriangle size={13} />
              Escalate to Owner
            </button>
          )}
          {escalated && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium mono">
              <AlertTriangle size={13} />
              Escalated
            </span>
          )}
        </div>
      </div>

      {/* Viral spike indicator */}
      {viralSpike && conversation.id.startsWith("spike") && (
        <div className="flex items-center gap-2 px-5 py-2 bg-orange-50 border-b border-orange-200 text-xs text-orange-700">
          <Loader2 size={12} className="animate-spin" />
          Agent is auto-responding to viral spike messages…
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fade-in">
            {/* Tool invocations */}
            {msg.parts?.map((part, idx) => {
              if (part.type === "tool-invocation") {
                return (
                  <div key={idx} className="flex justify-center mb-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-xs mono text-primary-700">
                      {part.toolInvocation.state === "result" ? (
                        <Info size={11} />
                      ) : (
                        <Loader2 size={11} className="animate-spin" />
                      )}
                      <span className="font-semibold">
                        {part.toolInvocation.toolName}
                      </span>
                      {part.toolInvocation.state === "result" && (
                        <span className="text-primary-500">
                          → {JSON.stringify(part.toolInvocation.result).slice(0, 50)}...
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })}

            {/* Message bubble */}
            {msg.content && (
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
                  <p className="text-xs text-muted-foreground mono mt-1 text-right">
                    {new Date().toLocaleTimeString("en-MY", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

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

      {/* Customer message input (simulating customer) */}
      <div className="px-5 py-2 border-t border-border shrink-0 bg-muted/30">
        <form onSubmit={handleCustomerSubmit} className="flex gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mono">
            <User size={12} className="text-muted-foreground" />
            Simulate Customer
          </div>
          <input
            type="text"
            value={customerInput}
            onChange={handleInputChange}
            placeholder="Type as customer to test bot response…"
            className="flex-1 px-3 py-2 text-sm bg-white rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
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
            value={ownerReplyText}
            onChange={(e) => setOwnerReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendOwnerReply()}
            placeholder="Type a reply as owner…"
            className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
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
