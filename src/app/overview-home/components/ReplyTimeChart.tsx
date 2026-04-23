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

interface ReplyTimeData {
  bucket: string;
  count: number;
}

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

export default function ReplyTimeChart({ data }: { data: ReplyTimeData[] }) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5 h-full">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground">Bot Response Latency</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Distribution of reply times</p>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(210, 20%, 94%)" />
            <XAxis
              dataKey="bucket"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(215, 16%, 47%)' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(215, 16%, 47%)' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(210, 20%, 98%)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
