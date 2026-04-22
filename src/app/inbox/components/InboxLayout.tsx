'use client';

import React, { useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import ConversationThread from './ConversationThread';
import AIConversationThread from './AIConversationThread';
import { Zap, Bot, MessageSquare, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export interface Conversation {
  id: string;
  customer: string;
  avatar: string;
  platform: 'Shopee';
  status: string;
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

  // Initialize Supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchLiveConversations = async () => {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !messages) {
        console.error('Failed to load conversations:', error);
        setIsLoading(false);
        return;
      }

      // Group by conversation_id
      const uniqueConversations = new Map<string, any>();
      messages.forEach((msg) => {
        if (!uniqueConversations.has(msg.conversation_id)) {
          uniqueConversations.set(msg.conversation_id, msg);
        }
      });

      const formattedData: Conversation[] = Array.from(uniqueConversations.values()).map((latestMsg) => {
        const shortId = latestMsg.conversation_id.substring(0, 4).toUpperCase();
        return {
          id: latestMsg.conversation_id,
          customer: `Shopper-${shortId}`,
          avatar: shortId.charAt(0) || 'S',
          platform: 'Shopee',
          status: latestMsg.sender === 'bot' ? 'bot-responded' : 'unanswered', 
          lastMessage: latestMsg.text,
          time: new Date(latestMsg.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }),
          unread: latestMsg.sender === 'customer' ? 1 : 0,
          intent: 'general_inquiry',
        };
      });

      setConversations(formattedData);
      
      // Auto-select the first conversation if none is selected
      if (!selectedId && formattedData.length > 0) {
        setSelectedId(formattedData[0].id);
      }
      setIsLoading(false);
    };

    fetchLiveConversations();
    const interval = setInterval(fetchLiveConversations, 5000);
    return () => clearInterval(interval);
  }, [supabase, selectedId]);

  const selectedConv = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-card border border-border shadow-card px-5 py-3">
        <div>
          <h1 className="text-base font-semibold text-foreground">Inbox (Live)</h1>
          <p className="text-xs text-muted-foreground">
            {conversations.length} conversations · {conversations.filter((c) => c.unread > 0).length} unread
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseAI((v) => !v)}
            className={[
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95',
              useAI ? 'bg-primary-600 text-white shadow-md' : 'bg-muted text-muted-foreground border border-border',
            ].join(' ')}
          >
            {useAI ? <Bot size={15} /> : <MessageSquare size={15} />}
            {useAI ? 'AI Mode' : 'Static Mode'}
          </button>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex gap-0 bg-white rounded-card border border-border shadow-card overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '520px' }}>
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="animate-spin" size={24} />
            <p>Loading live database...</p>
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
                <AIConversationThread
                  conversation={selectedConv}
                  viralSpike={viralSpike}
                  onEscalate={(id) => console.log('Escalated', id)}
                />
              ) : (
                <ConversationThread
                  conversation={selectedConv}
                  viralSpike={viralSpike}
                  onEscalate={(id) => console.log('Escalated', id)}
                />
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare size={48} className="opacity-20 mb-4" />
                <p>No active conversations found in database.</p>
                <p className="text-sm mt-2">Send a message from the Shopee Mock view to start!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}