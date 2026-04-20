'use client';

import React, { useState, useEffect } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import { RefreshCw } from 'lucide-react';

interface ActivityItem {
  id: string;
  customer: string;
  avatar: string;
  message: string;
  platform: 'Shopee';
  status: 'bot-responded' | 'owner-replied' | 'unanswered' | 'escalated';
  time: string;
  intent: string;
}

const initialFeed: ActivityItem[] = [
  {
    id: 'act-001',
    customer: 'Nurul_Ain92',
    avatar: 'NA',
    message: 'stk size M ada tak? nak beli 2 helai',
    platform: 'Shopee',
    status: 'bot-responded',
    time: '15:24',
    intent: 'stock_query',
  },
  {
    id: 'act-002',
    customer: 'farahazwan_kl',
    avatar: 'FA',
    message: 'pos ke sabah berapa rm? boleh combine order?',
    platform: 'Shopee',
    status: 'bot-responded',
    time: '15:22',
    intent: 'shipping_cost',
  },
  {
    id: 'act-003',
    customer: 'syafiqah_putrajaya',
    avatar: 'SP',
    message: 'order saya dah berapa hari ni? tracking no?',
    platform: 'Shopee',
    status: 'owner-replied',
    time: '15:19',
    intent: 'order_status',
  },
  {
    id: 'act-004',
    customer: 'AmirulHaziq88',
    avatar: 'AH',
    message: 'ada warna hitam size XL tak? nak belikan bini',
    platform: 'Shopee',
    status: 'unanswered',
    time: '15:18',
    intent: 'stock_query',
  },
  {
    id: 'act-005',
    customer: 'Liyana_Soraya',
    avatar: 'LS',
    message: 'boleh refund tak kalau size tak muat?',
    platform: 'Shopee',
    status: 'escalated',
    time: '15:15',
    intent: 'return_policy',
  },
  {
    id: 'act-006',
    customer: 'norhaslinda_ipoh',
    avatar: 'NI',
    message: 'dress ni boleh hand wash ke? material apa?',
    platform: 'Shopee',
    status: 'bot-responded',
    time: '15:12',
    intent: 'product_inquiry',
  },
  {
    id: 'act-007',
    customer: 'zulaikha_jb',
    avatar: 'ZJ',
    message: 'bila restock size S? dah 3 kali check sold out',
    platform: 'Shopee',
    status: 'escalated',
    time: '15:09',
    intent: 'restock_query',
  },
  {
    id: 'act-008',
    customer: 'PuteriNadia_',
    avatar: 'PN',
    message: 'rm pos sarawak? lebih kurang berapa hari sampai?',
    platform: 'Shopee',
    status: 'bot-responded',
    time: '15:07',
    intent: 'shipping_cost',
  },
];

const intentColors: Record<string, string> = {
  stock_query: 'bg-blue-50 text-blue-600',
  shipping_cost: 'bg-purple-50 text-purple-600',
  order_status: 'bg-teal-50 text-teal-600',
  return_policy: 'bg-red-50 text-red-500',
  product_inquiry: 'bg-amber-50 text-amber-600',
  restock_query: 'bg-orange-50 text-orange-600',
};

const avatarColors = [
  'bg-primary-600',
  'bg-purple-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
];

export default function LiveActivityFeed() {
  const [feed, setFeed] = useState<ActivityItem[]>(initialFeed);
  const [pulse, setPulse] = useState<string | null>(null);

  useEffect(() => {
    // Simulate new incoming message every 12s
    const interval = setInterval(() => {
      const newMsg: ActivityItem = {
        id: `act-new-${Date.now()}`,
        customer: 'Hasniza_KL',
        avatar: 'HK',
        message: 'size L stk ada? nak 1 je',
        platform: 'Shopee',
        status: 'unanswered',
        time: '15:25',
        intent: 'stock_query',
      };
      setFeed((prev) => [newMsg, ...prev.slice(0, 7)]);
      setPulse(newMsg.id);
      setTimeout(() => setPulse(null), 1500);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-card border border-border shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Live Customer Activity</h2>
          <p className="text-xs text-muted-foreground">Real-time incoming messages</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground mono">LIVE</span>
          <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <RefreshCw size={13} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {feed.map((item, idx) => (
          <li
            key={item.id}
            className={[
              'px-5 py-3.5 flex gap-3 hover:bg-muted/40 transition-colors cursor-pointer',
              pulse === item.id ? 'animate-fade-in bg-primary-50' : '',
            ].join(' ')}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                avatarColors[idx % avatarColors.length]
              }`}
            >
              {item.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-xs font-semibold text-foreground mono">{item.customer}</span>
                <span className="text-xs text-muted-foreground bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded mono font-medium">
                  Shopee
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded mono font-medium ${
                    intentColors[item.intent] || 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.intent.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-foreground truncate italic">"{item.message}"</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusBadge status={item.status} />
              <span className="text-xs text-muted-foreground mono">{item.time}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="px-5 py-3 border-t border-border">
        <button className="text-xs text-primary-600 font-medium hover:underline">
          View all in Inbox →
        </button>
      </div>
    </div>
  );
}