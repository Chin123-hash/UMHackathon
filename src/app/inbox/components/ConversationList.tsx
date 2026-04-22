'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Conversation } from './InboxLayout';
import StatusBadge from '@/components/ui/StatusBadge';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string;
  onSelect: (id: string) => void;
  viralSpike: boolean;
}

const avatarColors = [
  'bg-primary-600', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-rose-500', 'bg-cyan-600',
];

export default function ConversationList({ conversations, selectedId, onSelect, viralSpike }: ConversationListProps) {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) =>
    c.customer.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-72 xl:w-80 shrink-0 flex flex-col border-r border-border bg-white z-10 relative">
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
          />
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.map((conv, idx) => (
          <li
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={[
              'px-4 py-3 cursor-pointer border-b border-border/50 transition-colors',
              selectedId === conv.id ? 'bg-primary-50 border-l-2 border-l-primary-600' : 'hover:bg-muted/50',
            ].join(' ')}
          >
            <div className="flex gap-2.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-semibold text-foreground mono truncate">{conv.customer}</span>
                  <span className="text-xs text-muted-foreground mono shrink-0">{conv.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate italic">{conv.lastMessage}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <StatusBadge status={conv.status as any} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}