'use client';

import React from 'react';
import { Brain, Database, Truck, Send, CheckCircle2, Clock } from 'lucide-react';

export interface TimelineStep {
  id: string;
  label: string;
  detail: string;
  time: string;
  type: 'intent' | 'tool' | 'reply' | 'complete';
  latency?: string; // Now contains real data like "1.52s" or "0.05s"
}

const getIconForType = (type: string, detail: string) => {
  if (type === 'intent') return <Brain size={14} />;
  if (type === 'reply') return <Send size={14} />;
  if (type === 'complete') return <CheckCircle2 size={14} />;
  if (detail.toLowerCase().includes('inventory') || detail.toLowerCase().includes('stock'))
    return <Database size={14} />;
  if (detail.toLowerCase().includes('shipping')) return <Truck size={14} />;
  return <Database size={14} />;
};

export default function AgentTimeline({ data }: { data: TimelineStep[] }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card h-[400px] flex flex-col relative overflow-hidden">
      <div className="p-4 border-b border-border bg-gray-50/50">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Brain size={16} className="text-primary-500" />
          Agent Reasoning Log
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Real-time internal AI states</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 relative">
        {/* The connecting line */}
        <div className="absolute left-[33px] top-6 bottom-6 w-px bg-gray-200" />

        {data.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-10 relative z-10">
            No recent agent activity.
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            {data.map((step) => (
              <div key={step.id} className="flex items-start gap-4 group">
                <div className="w-14 text-right pt-1 shrink-0">
                  <span className="text-[10px] text-muted-foreground mono block">{step.time}</span>
                  {/* Dynamically show real latency, color coded based on speed */}
                  {step.latency && (
                    <span
                      className={`text-[9px] font-semibold ${
                        parseFloat(step.latency) < 0.5
                          ? 'text-green-600'
                          : parseFloat(step.latency) < 2
                            ? 'text-blue-600'
                            : 'text-orange-500'
                      }`}
                    >
                      +{step.latency}
                    </span>
                  )}
                </div>

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-110 ${
                    step.type === 'intent'
                      ? 'bg-purple-100 text-purple-600'
                      : step.type === 'tool'
                        ? 'bg-blue-100 text-blue-600'
                        : step.type === 'reply'
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-green-100 text-green-600'
                  }`}
                >
                  {getIconForType(step.type, step.detail)}
                </div>

                <div className="pt-0.5 pb-2">
                  <p className="text-sm font-semibold text-gray-800">{step.label}</p>
                  <div className="mt-1 bg-gray-50 border border-gray-100 rounded-md p-2 text-xs text-gray-600 font-mono break-all max-w-[200px] sm:max-w-[250px]">
                    {step.detail}
                  </div>
                </div>
              </div>
            ))}

            {/* Waiting state */}
            <div className="flex items-start gap-4 opacity-50">
              <div className="w-14 text-right pt-1 shrink-0"></div>
              <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center">
                <Clock size={12} className="text-gray-400" />
              </div>
              <div className="pt-1.5">
                <p className="text-xs font-medium text-gray-400">Waiting for events...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
