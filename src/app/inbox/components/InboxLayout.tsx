'use client';

import React, { useState } from 'react';
import ConversationList from './ConversationList';
import ConversationThread from './ConversationThread';
import { Zap } from 'lucide-react';

export interface Conversation {
  id: string;
  customer: string;
  avatar: string;
  platform: 'Shopee';
  status: 'bot-responded' | 'owner-replied' | 'unanswered' | 'escalated';
  lastMessage: string;
  time: string;
  unread: number;
  intent: string;
}

const initialConversations: Conversation[] = [
  {
    id: 'conv-001',
    customer: 'Nurul_Ain92',
    avatar: 'NA',
    platform: 'Shopee',
    status: 'bot-responded',
    lastMessage: 'Ada stok M, tinggal 2 je! 😊',
    time: '15:24',
    unread: 0,
    intent: 'stock_query',
  },
  {
    id: 'conv-002',
    customer: 'farahazwan_kl',
    avatar: 'FA',
    platform: 'Shopee',
    status: 'unanswered',
    lastMessage: 'pos ke sabah berapa rm? boleh combine?',
    time: '15:22',
    unread: 2,
    intent: 'shipping_cost',
  },
  {
    id: 'conv-003',
    customer: 'syafiqah_putrajaya',
    avatar: 'SP',
    platform: 'Shopee',
    status: 'owner-replied',
    lastMessage: 'Tracking no: MY123456789',
    time: '15:19',
    unread: 0,
    intent: 'order_status',
  },
  {
    id: 'conv-004',
    customer: 'AmirulHaziq88',
    avatar: 'AH',
    platform: 'Shopee',
    status: 'unanswered',
    lastMessage: 'ada warna hitam size XL tak?',
    time: '15:18',
    unread: 1,
    intent: 'stock_query',
  },
  {
    id: 'conv-005',
    customer: 'Liyana_Soraya',
    avatar: 'LS',
    platform: 'Shopee',
    status: 'escalated',
    lastMessage: 'boleh refund tak kalau size tak muat?',
    time: '15:15',
    unread: 1,
    intent: 'return_policy',
  },
  {
    id: 'conv-006',
    customer: 'norhaslinda_ipoh',
    avatar: 'NI',
    platform: 'Shopee',
    status: 'bot-responded',
    lastMessage: 'Boleh hand wash, bahan cotton blend 😊',
    time: '15:12',
    unread: 0,
    intent: 'product_inquiry',
  },
  {
    id: 'conv-007',
    customer: 'zulaikha_jb',
    avatar: 'ZJ',
    platform: 'Shopee',
    status: 'escalated',
    lastMessage: 'bila restock size S? dah 3 kali check',
    time: '15:09',
    unread: 1,
    intent: 'restock_query',
  },
  {
    id: 'conv-008',
    customer: 'PuteriNadia_',
    avatar: 'PN',
    platform: 'Shopee',
    status: 'bot-responded',
    lastMessage: 'Pos Sarawak RM11.90, est 5–8 hari 📦',
    time: '15:07',
    unread: 0,
    intent: 'shipping_cost',
  },
];

const viralSpikeConversations: Conversation[] = [
  {
    id: 'spike-001',
    customer: 'Hafizah_Miri',
    avatar: 'HM',
    platform: 'Shopee',
    status: 'unanswered',
    lastMessage: 'stk m ada?? nak beli sekarang',
    time: '15:25',
    unread: 1,
    intent: 'stock_query',
  },
  {
    id: 'spike-002',
    customer: 'RozitaKuching',
    avatar: 'RK',
    platform: 'Shopee',
    status: 'unanswered',
    lastMessage: 'berapa pos sarawak? urgent ni',
    time: '15:25',
    unread: 1,
    intent: 'shipping_cost',
  },
  {
    id: 'spike-003',
    customer: 'izzatiMY_',
    avatar: 'IM',
    platform: 'Shopee',
    status: 'unanswered',
    lastMessage: 'size L ada warna putih tak?',
    time: '15:25',
    unread: 1,
    intent: 'stock_query',
  },
  {
    id: 'spike-004',
    customer: 'Norzahra_KK',
    avatar: 'NK',
    platform: 'Shopee',
    status: 'unanswered',
    lastMessage: 'ok ke beli 3 helai combine pos?',
    time: '15:25',
    unread: 1,
    intent: 'shipping_cost',
  },
  {
    id: 'spike-005',
    customer: 'sharmila_penang',
    avatar: 'SH',
    platform: 'Shopee',
    status: 'unanswered',
    lastMessage: 'bila restock? dah sold out lagi',
    time: '15:25',
    unread: 1,
    intent: 'restock_query',
  },
];

export default function InboxLayout() {
  const [selectedId, setSelectedId] = useState<string>('conv-001');
  const [viralSpike, setViralSpike] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);

  const handleViralSpike = () => {
    if (!viralSpike) {
      setConversations([...viralSpikeConversations, ...initialConversations]);
    } else {
      setConversations(initialConversations);
    }
    setViralSpike((v) => !v);
  };

  const selectedConv = conversations.find((c) => c.id === selectedId) || conversations[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Viral spike banner */}
      <div className="flex items-center justify-between bg-white rounded-card border border-border shadow-card px-5 py-3">
        <div>
          <h1 className="text-base font-semibold text-foreground">Inbox</h1>
          <p className="text-xs text-muted-foreground">
            {conversations.length} conversations · {conversations.filter((c) => c.unread > 0).length} unread
          </p>
        </div>
        <button
          onClick={handleViralSpike}
          className={[
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95',
            viralSpike
              ? 'bg-accent text-white shadow-md'
              : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100',
          ].join(' ')}
        >
          <Zap size={15} className={viralSpike ? 'animate-pulse' : ''} />
          {viralSpike ? 'Viral Spike ACTIVE — Agent Auto-Responding' : 'Simulate Viral Spike'}
        </button>
      </div>

      {/* Split panel */}
      <div className="flex gap-0 bg-white rounded-card border border-border shadow-card overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '520px' }}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          viralSpike={viralSpike}
        />
        {selectedConv && (
          <ConversationThread
            conversation={selectedConv}
            viralSpike={viralSpike}
            onEscalate={(id) => {
              setConversations((prev) =>
                prev.map((c) => (c.id === id ? { ...c, status: 'escalated' } : c))
              );
            }}
          />
        )}
      </div>
    </div>
  );
}