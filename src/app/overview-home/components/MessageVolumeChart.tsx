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

interface VolumeData {
  time: string;
  messages: number;
  botHandled: number;
  ownerHandled: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-lg shadow-card px-3 py-2 text-xs">
        <p className="font-semibold text-foreground mono mb-1">{label}</p>
        <p className="text-foreground">
          Total: <span className="font-semibold tabular-nums">{payload[0]?.value}</span>
        </p>
        <p className="text-primary-600">
          Bot: <span className="font-semibold tabular-nums">{payload[1]?.value}</span>
        </p>
        <p className="text-blue-600">
          Owner: <span className="font-semibold tabular-nums">{payload[2]?.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function MessageVolumeChart({ data }: { data: VolumeData[] }) {
  const currentHour = new Date().getHours().toString().padStart(2, '0') + ':00';

  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Message Volume</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total vs Bot vs Owner across the day
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-muted-foreground">Total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            <span className="text-muted-foreground">Bot Handled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Owner Replied</span>
          </div>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(12, 85%, 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(12, 85%, 55%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOwner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(210, 20%, 94%)" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(215, 16%, 47%)' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(215, 16%, 47%)' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(210, 20%, 90%)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            {data.some(d => d.time === currentHour) && (
              <ReferenceLine x={currentHour} stroke="hsl(215, 16%, 47%)" strokeDasharray="3 3" />
            )}

            <Area
              type="monotone"
              dataKey="messages"
              stroke="hsl(210, 16%, 82%)"
              strokeWidth={2}
              fill="transparent"
              activeDot={{ r: 4, fill: 'hsl(210, 16%, 60%)', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="botHandled"
              stroke="hsl(12, 85%, 55%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorBot)"
              activeDot={{ r: 4, fill: 'hsl(12, 85%, 55%)', strokeWidth: 2, stroke: 'white' }}
            />
            <Area
              type="monotone"
              dataKey="ownerHandled"
              stroke="hsl(221, 83%, 53%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorOwner)"
              activeDot={{ r: 4, fill: 'hsl(221, 83%, 53%)', strokeWidth: 2, stroke: 'white' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}