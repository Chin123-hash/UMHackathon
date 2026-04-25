'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ConversationList from './ConversationList';
import ConversationThread from './ConversationThread';
import AIConversationThread from './AIConversationThread';
import { Bot, MessageSquare, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { StatusType } from '@/components/ui/StatusBadge';

export interface Conversation {
  id: string;
  customer: string;
  avatar: string;
  platform: 'Shopee';
  status: StatusType;
  lastMessage: string;
  time: string;
  unread: number;
  intent: string;
}

export default function InboxLayout() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viralSpike, setViralSpike] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- 1. REFACTORED FETCH LOGIC ---
  const fetchLiveConversations = useCallback(async () => {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !messages) {
      setIsLoading(false);
      return;
    }

    const uniqueConversations = new Map<string, any>();
    messages.forEach((msg) => {
      if (!uniqueConversations.has(msg.conversation_id)) {
        uniqueConversations.set(msg.conversation_id, msg);
      }
    });

    const formattedData: Conversation[] = Array.from(uniqueConversations.values()).map(
      (latestMsg) => {
        const shortId = latestMsg.conversation_id.substring(0, 4).toUpperCase();

        // Determine Status with DB Priority
        let currentStatus: StatusType = (latestMsg.status as StatusType) || 'unanswered';

        // Safety Fallback for older rows
        if (!latestMsg.status) {
          if (latestMsg.sender === 'bot') currentStatus = 'bot-responded';
          else if (latestMsg.sender === 'owner') currentStatus = 'owner-replied';
          else currentStatus = 'unanswered';
        }

        return {
          id: latestMsg.conversation_id,
          customer: `Shopper-${shortId}`,
          avatar: shortId.charAt(0) || 'S',
          platform: 'Shopee',
          status: currentStatus,
          lastMessage: latestMsg.text,
          time: new Date(latestMsg.created_at).toLocaleTimeString('en-MY', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          unread: currentStatus === 'unanswered' ? 1 : 0,
          intent: 'general_inquiry',
        };
      }
    );

    setConversations(formattedData);

    // Auto-select first if none selected
    setSelectedId((prev) => prev || (formattedData.length > 0 ? formattedData[0].id : null));
    setIsLoading(false);
  }, [supabase]);

  // --- 2. REALTIME SUBSCRIPTION ---
  useEffect(() => {
    // Initial Load
    fetchLiveConversations();

    // Subscribe to any changes on the 'messages' table
    const channel = supabase
      .channel('realtime-inbox-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
        },
        () => {
          console.log('DB Change detected! Refreshing inbox...');
          fetchLiveConversations(); // Trigger auto-refresh
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchLiveConversations]);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-card border border-border shadow-card px-5 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-foreground">Inbox</h1>
            <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
              <span className="w-1 h-1 bg-green-500 rounded-full" /> Live
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {conversations.length} conversations ·{' '}
            {conversations.filter((c) => c.status === 'unanswered').length} awaiting reply
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseAI((v) => !v)}
            className={[
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95',
              useAI
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-muted text-muted-foreground border border-border',
            ].join(' ')}
          >
            {useAI ? <Bot size={15} /> : <MessageSquare size={15} />}
            {useAI ? 'AI Agent' : 'Manual Mode'}
          </button>
        </div>
      </div>

      {/* Split panel */}
      <div
        className="flex gap-0 bg-white rounded-card border border-border shadow-card overflow-hidden"
        style={{ height: 'calc(100vh - 220px)', minHeight: '520px' }}
      >
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="animate-spin" size={24} />
            <p>Connecting to Live Data...</p>
          </div>
        ) : (
          <>
            <ConversationList
              conversations={conversations}
              selectedId={selectedId || ''}
              onSelect={setSelectedId}
              viralSpike={viralSpike}
            />
            {selectedConv ? (
              useAI ? (
                <AIConversationThread conversation={selectedConv} viralSpike={viralSpike} />
              ) : (
                <ConversationThread conversation={selectedConv} viralSpike={viralSpike} />
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare size={48} className="opacity-20 mb-4" />
                <p>No active conversations found.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
