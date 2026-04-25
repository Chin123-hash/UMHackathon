'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  MessageSquare,
  ShoppingCart,
  Users,
  TrendingUp,
  Award,
  Clock,
  BarChart2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ── Mock data ──────────────────────────────────────────────────────────────────

const intentBreakdown = [
  { intent: 'Stock Query', count: 89, buyIntent: true },
  { intent: 'Shipping Cost', count: 64, buyIntent: true },
  { intent: 'Order Status', count: 41, buyIntent: false },
  { intent: 'Product Inquiry', count: 37, buyIntent: true },
  { intent: 'Restock Query', count: 28, buyIntent: true },
  { intent: 'Return / Refund', count: 19, buyIntent: false },
  { intent: 'Promo / Discount', count: 15, buyIntent: true },
  { intent: 'General Enquiry', count: 11, buyIntent: false },
];

const hourlyVolume = [
  { hour: '09:00', messages: 12, buyIntent: 8 },
  { hour: '10:00', messages: 24, buyIntent: 17 },
  { hour: '11:00', messages: 31, buyIntent: 22 },
  { hour: '12:00', messages: 45, buyIntent: 33 },
  { hour: '13:00', messages: 38, buyIntent: 27 },
  { hour: '14:00', messages: 52, buyIntent: 39 },
  { hour: '15:00', messages: 47, buyIntent: 35 },
  { hour: '16:00', messages: 29, buyIntent: 19 },
];

const topResponders = [
  {
    rank: 1,
    name: 'AI Agent (Bot)',
    type: 'bot',
    avatar: 'AI',
    replies: 218,
    avgResponseTime: '3.2s',
    resolutionRate: '91%',
    color: 'bg-primary-600',
  },
  {
    rank: 2,
    name: 'Siti Nabilah',
    type: 'owner',
    avatar: 'SN',
    replies: 29,
    avgResponseTime: '4m 12s',
    resolutionRate: '100%',
    color: 'bg-purple-500',
  },
  {
    rank: 3,
    name: 'Hasniza (Staff)',
    type: 'staff',
    avatar: 'HZ',
    replies: 14,
    avgResponseTime: '6m 45s',
    resolutionRate: '86%',
    color: 'bg-teal-500',
  },
  {
    rank: 4,
    name: 'Farah (Staff)',
    type: 'staff',
    avatar: 'FA',
    replies: 8,
    avgResponseTime: '9m 02s',
    resolutionRate: '88%',
    color: 'bg-orange-500',
  },
  {
    rank: 5,
    name: 'Amirul (Staff)',
    type: 'staff',
    avatar: 'AM',
    replies: 5,
    avgResponseTime: '11m 30s',
    resolutionRate: '80%',
    color: 'bg-pink-500',
  },
];

const recentBuyIntentMessages = [
  {
    id: 'bi-001',
    customer: 'Nurul_Ain92',
    avatar: 'NA',
    message: 'stk size M ada tak? nak beli 2 helai',
    intent: 'Stock Query',
    converted: true,
    time: '15:24',
  },
  {
    id: 'bi-002',
    customer: 'farahazwan_kl',
    avatar: 'FA',
    message: 'pos ke sabah berapa rm? boleh combine order?',
    intent: 'Shipping Cost',
    converted: true,
    time: '15:22',
  },
  {
    id: 'bi-003',
    customer: 'AmirulHaziq88',
    avatar: 'AH',
    message: 'ada warna hitam size XL tak? nak belikan bini',
    intent: 'Product Inquiry',
    converted: false,
    time: '15:18',
  },
  {
    id: 'bi-004',
    customer: 'PuteriNadia_',
    avatar: 'PN',
    message: 'rm pos sarawak? lebih kurang berapa hari sampai?',
    intent: 'Shipping Cost',
    converted: true,
    time: '15:07',
  },
  {
    id: 'bi-005',
    customer: 'zulaikha_jb',
    avatar: 'ZJ',
    message: 'bila restock size S? dah 3 kali check sold out',
    intent: 'Restock Query',
    converted: false,
    time: '15:09',
  },
  {
    id: 'bi-006',
    customer: 'norhaslinda_ipoh',
    avatar: 'NI',
    message: 'ada diskaun kalau beli 3 helai? nak beli untuk family',
    intent: 'Promo / Discount',
    converted: true,
    time: '14:55',
  },
];

const avatarColors = [
  'bg-primary-600',
  'bg-purple-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-indigo-500',
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  iconBg: string;
  iconColor: string;
  trend?: { value: string; up: boolean };
}) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${trend.up ? 'text-green-600' : 'text-red-500'}`}
          >
            {trend.up ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {trend.value}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 mono">
          {label}
        </p>
        <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LiveChatAnalysisPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const totalMessages = intentBreakdown.reduce((s, i) => s + i.count, 0);
  const buyIntentMessages = intentBreakdown
    .filter((i) => i.buyIntent)
    .reduce((s, i) => s + i.count, 0);
  const conversionRate = Math.round((buyIntentMessages / totalMessages) * 100);

  return (
    <AppLayout breadcrumbs={[{ label: 'Commerce' }, { label: 'Live Chat Analysis' }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Live Chat Analysis</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              RachelFashion.my · Today, 20 Apr 2026
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mono">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
              LIVE
            </div>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={<MessageSquare size={18} />}
            label="Total Chat Messages"
            value={totalMessages.toLocaleString()}
            sub="All incoming messages today"
            iconBg="bg-primary-100"
            iconColor="text-primary-600"
            trend={{ value: '+18% vs yesterday', up: true }}
          />
          <StatCard
            icon={<ShoppingCart size={18} />}
            label="Buy-Intent Messages"
            value={buyIntentMessages.toLocaleString()}
            sub="Stock, shipping, product queries"
            iconBg="bg-green-50"
            iconColor="text-green-600"
            trend={{ value: '+22% vs yesterday', up: true }}
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Intent-to-Order Rate"
            value={`${conversionRate}%`}
            sub="Buy-intent chats that placed order"
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
            trend={{ value: '+4% vs yesterday', up: true }}
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Avg First Response"
            value="3.4s"
            sub="Bot handles 91% of first replies"
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            trend={{ value: '-0.8s vs yesterday', up: true }}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Hourly Volume Chart */}
          <div className="xl:col-span-3 bg-white rounded-card border border-border shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Hourly Chat Volume</h2>
                <p className="text-xs text-muted-foreground">
                  Total messages vs buy-intent messages
                </p>
              </div>
              <BarChart2 size={16} className="text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyVolume} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="messages" name="All Messages" fill="#e0e7ff" radius={[3, 3, 0, 0]} />
                <Bar dataKey="buyIntent" name="Buy Intent" fill="#4f46e5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-200 inline-block" />
                <span className="text-xs text-muted-foreground">All Messages</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
                <span className="text-xs text-muted-foreground">Buy Intent</span>
              </div>
            </div>
          </div>

          {/* Intent Breakdown */}
          <div className="xl:col-span-2 bg-white rounded-card border border-border shadow-card p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-foreground">Intent Breakdown</h2>
              <p className="text-xs text-muted-foreground">What customers are asking about</p>
            </div>
            <div className="space-y-2.5">
              {intentBreakdown.map((item) => {
                const pct = Math.round((item.count / totalMessages) * 100);
                return (
                  <div key={item.intent}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">{item.intent}</span>
                        {item.buyIntent && (
                          <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-1 py-0.5 rounded mono font-medium">
                            buy
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mono">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.buyIntent ? 'bg-primary-500' : 'bg-muted-foreground/40'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top 5 Responders + Buy-Intent Feed */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Top 5 Responders */}
          <div className="xl:col-span-2 bg-white rounded-card border border-border shadow-card">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Top 5 Responders</h2>
                <p className="text-xs text-muted-foreground">By total replies today</p>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {topResponders.map((r) => (
                <li key={r.rank} className="px-5 py-3.5 flex items-center gap-3">
                  <span
                    className={`text-xs font-bold mono w-5 text-center ${r.rank === 1 ? 'text-amber-500' : 'text-muted-foreground'}`}
                  >
                    #{r.rank}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${r.color}`}
                  >
                    {r.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate">{r.name}</span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded mono font-medium ${
                          r.type === 'bot'
                            ? 'bg-primary-50 text-primary-600'
                            : r.type === 'owner'
                              ? 'bg-purple-50 text-purple-600'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {r.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        Avg: {r.avgResponseTime}
                      </span>
                      <span className="text-xs text-green-600 font-medium">
                        {r.resolutionRate} resolved
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold tabular-nums text-foreground">{r.replies}</p>
                    <p className="text-xs text-muted-foreground">replies</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Buy-Intent Messages Feed */}
          <div className="xl:col-span-3 bg-white rounded-card border border-border shadow-card">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-green-600" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Buy-Intent Messages</h2>
                  <p className="text-xs text-muted-foreground">
                    Customers showing purchase signals
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground mono">LIVE</span>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {recentBuyIntentMessages.map((msg, idx) => (
                <li
                  key={msg.id}
                  className="px-5 py-3.5 flex gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColors[idx % avatarColors.length]}`}
                  >
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-semibold text-foreground mono">
                        {msg.customer}
                      </span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mono font-medium">
                        {msg.intent}
                      </span>
                      {msg.converted ? (
                        <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded mono font-medium">
                          ✓ Ordered
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded mono font-medium">
                          Browsing
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground italic truncate">"{msg.message}"</p>
                  </div>
                  <span className="text-xs text-muted-foreground mono shrink-0">{msg.time}</span>
                </li>
              ))}
            </ul>
            <div className="px-5 py-3 border-t border-border">
              <button className="text-xs text-primary-600 font-medium hover:underline">
                View all buy-intent chats in Inbox →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
