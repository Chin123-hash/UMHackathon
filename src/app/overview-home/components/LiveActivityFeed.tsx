'use client';

import React from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import type { StatusType } from '@/components/ui/StatusBadge';
import { RefreshCw } from 'lucide-react';

export interface ActivityItem {
  id: string;
  customer: string;
  avatar: string;
  message: string;
  platform: 'Shopee';
  status: StatusType;
  time: string;
  intent: string;
}

export default function LiveActivityFeed({ data }: { data: ActivityItem[] }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card h-[400px] flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between bg-gray-50/50 rounded-t-card">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Live Customer Feed</h3>
          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
            Live
          </span>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-none space-y-1">
        {data.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-10">No recent messages today.</div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="p-3 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer border border-transparent hover:border-border"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {item.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                        {item.customer}
                      </span>
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                        {item.platform}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground mono">{item.time}</span>
                  </div>

                  <p className="text-sm text-gray-700 line-clamp-2 mb-2 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded bg-white">
                      intent: {item.intent}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
