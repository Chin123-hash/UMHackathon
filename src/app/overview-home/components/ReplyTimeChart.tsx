'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const data = [
  { bucket: '0–2s', count: 18 },
  { bucket: '2–4s', count: 62 },
  { bucket: '4–6s', count: 41 },
  { bucket: '6–10s', count: 23 },
  { bucket: '10–15s', count: 11 },
  { bucket: '>15s', count: 5 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-lg shadow-card px-3 py-2 text-xs">
        <p className="font-semibold mono mb-0.5">{label}</p>
        <p className="text-foreground">
          <span className="font-semibold tabular-nums">{payload[0]?.value}</span> messages
        </p>
      </div>
    );
  }
  return null;
};

const getBarColor = (index: number) => {
  if (index <= 1) return 'hsl(142,72%,40%)';
  if (index <= 3) return 'hsl(211,87%,55%)';
  return 'hsl(0,84%,60%)';
};

export default function ReplyTimeChart() {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Reply Time Distribution</h2>
        <p className="text-xs text-muted-foreground">Today — 160 bot responses</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,20%,92%)" vertical={false} />
          <XAxis
            dataKey="bucket"
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(214,15%,55%)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(214,15%,55%)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-reply-${index}`} fill={getBarColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}