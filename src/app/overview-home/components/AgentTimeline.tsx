'use client';

import React, { useState } from 'react';
import { Brain, Database, Truck, Send, CheckCircle2, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface TimelineStep {
  id: string;
  icon: React.ReactNode;
  label: string;
  detail: string;
  time: string;
  type: 'intent' | 'tool' | 'reply' | 'complete';
  latency?: string;
}

const timelineData: TimelineStep[] = [
  {
    id: 'step-intent',
    icon: <Brain size={14} />,
    label: 'Intent Detected',
    detail: 'stock_query · entities: {size: "M", product: "Baju Kurung Moden"}',
    time: '15:24:31',
    type: 'intent',
    latency: '0.3s',
  },
  {
    id: 'step-inventory',
    icon: <Database size={14} />,
    label: 'Tool Call: Inventory API',
    detail: 'GET /inventory?sku=BKM-001&size=M → stock: 3, reserved: 1',
    time: '15:24:31',
    type: 'tool',
    latency: '0.8s',
  },
  {
    id: 'step-shipping',
    icon: <Truck size={14} />,
    label: 'Tool Call: Shipping API',
    detail: 'GET /shipping?from=KL&to=Sabah → RM 9.90, est 5–7 days',
    time: '15:24:32',
    type: 'tool',
    latency: '1.1s',
  },
  {
    id: 'step-reply',
    icon: <Send size={14} />,
    label: 'Reply Generated',
    detail: '"Ada stok M, tinggal 2 je! 😊 Pos ke Sabah RM9.90, 5–7 hari. Nak proceed?"',
    time: '15:24:33',
    type: 'reply',
    latency: '0.6s',
  },
  {
    id: 'step-sent',
    icon: <CheckCircle2 size={14} />,
    label: 'Message Sent via Shopee API',
    detail: 'Delivered · msgId: SP-4821-KL · lang: ms-MY',
    time: '15:24:33',
    type: 'complete',
    latency: '0.2s',
  },
];

const typeStyles: Record<string, { dot: string; line: string; badge: string }> = {
  intent: { dot: 'bg-purple-500', line: 'bg-purple-100', badge: 'bg-purple-50 text-purple-600' },
  tool: { dot: 'bg-primary-600', line: 'bg-primary-100', badge: 'bg-primary-50 text-primary-600' },
  reply: { dot: 'bg-amber-500', line: 'bg-amber-100', badge: 'bg-amber-50 text-amber-600' },
  complete: { dot: 'bg-green-500', line: 'bg-green-100', badge: 'bg-green-50 text-green-600' },
};

export default function AgentTimeline() {
  const [expanded, setExpanded] = useState<string | null>('step-inventory');

  return (
    <div className="bg-white rounded-card border border-border shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Agent Actions</h2>
          <p className="text-xs text-muted-foreground mono">Nurul_Ain92 · 15:24:31</p>
        </div>
        <span className="badge-bot">Total 3.0s</span>
      </div>

      <div className="px-5 py-4">
        <ul className="space-y-0">
          {timelineData.map((step, idx) => {
            const styles = typeStyles[step.type];
            const isExpanded = expanded === step.id;
            const isLast = idx === timelineData.length - 1;

            return (
              <li key={step.id} className="flex gap-3">
                {/* Dot + line */}
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full ${styles.dot} flex items-center justify-center text-white shrink-0 z-10`}>
                    {step.icon}
                  </div>
                  {!isLast && <div className={`w-0.5 flex-1 ${styles.line} min-h-[16px]`} />}
                </div>

                {/* Content */}
                <div className="flex-1 pb-3 min-w-0">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : step.id)}
                    className="w-full flex items-start justify-between gap-2 text-left group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{step.label}</p>
                      <p className="text-xs text-muted-foreground mono mt-0.5">{step.time}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {step.latency && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground mono">
                          <Clock size={10} />
                          {step.latency}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={12} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={12} className="text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className={`mt-2 p-2 rounded-lg ${styles.badge} text-xs mono leading-relaxed animate-fade-in`}>
                      {step.detail}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="px-5 py-3 border-t border-border">
        <button className="text-xs text-primary-600 font-medium hover:underline">
          View full trace in Logs →
        </button>
      </div>
    </div>
  );
}