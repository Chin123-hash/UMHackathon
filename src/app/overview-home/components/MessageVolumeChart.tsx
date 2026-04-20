'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const data = [
  { time: '08:00', messages: 8, botHandled: 7 },
  { time: '09:00', messages: 14, botHandled: 13 },
  { time: '10:00', messages: 22, botHandled: 20 },
  { time: '11:00', messages: 18, botHandled: 17 },
  { time: '12:00', messages: 31, botHandled: 28 },
  { time: '13:00', messages: 27, botHandled: 25 },
  { time: '14:00', messages: 54, botHandled: 49 },
  { time: '15:00', messages: 38, botHandled: 35 },
  { time: '15:25', messages: 12, botHandled: 11 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-lg shadow-card px-3 py-2 text-xs">
        <p className="font-semibold text-foreground mono mb-1">{label}</p>
        <p className="text-foreground">
          Total: <span className="font-semibold tabular-nums">{payload[0]?.value}</span>
        </p>
        <p className="text-primary-600">
          Bot handled: <span className="font-semibold tabular-nums">{payload[1]?.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function MessageVolumeChart() {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Message Volume</h2>
          <p className="text-xs text-muted-foreground">Today, hourly breakdown</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary-200 inline-block" />
            Total
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary-600 inline-block" />
            Bot handled
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(211,87%,55%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(211,87%,55%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-bot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(211,87%,40%)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(211,87%,40%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,92%)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'hsl(214,15%,55%)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: 'hsl(214,15%,55%)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x="14:00"
            stroke="hsl(25,95%,53%)"
            strokeDasharray="3 3"
            label={{ value: 'Spike', position: 'top', fontSize: 10, fill: 'hsl(25,95%,53%)' }}
          />
          <Area
            type="monotone"
            dataKey="messages"
            stroke="hsl(211,87%,65%)"
            strokeWidth={1.5}
            fill="url(#grad-total)"
          />
          <Area
            type="monotone"
            dataKey="botHandled"
            stroke="hsl(211,87%,40%)"
            strokeWidth={2}
            fill="url(#grad-bot)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}