'use client';

import React from 'react';
import {
  MessageSquare,
  Clock,
  ShoppingCart,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
} from 'lucide-react';
import Link from 'next/link';

interface KpiCardProps {
  title: string;
  value: string;
  sub: string;
  trend?: { value: string; positive: boolean };
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  iconBgClass: string;
  alert?: boolean;
  hero?: boolean;
  href?: string;
  colSpan?: string;
}

function KpiCard({
  title,
  value,
  sub,
  trend,
  icon,
  colorClass,
  iconBgClass,
  alert,
  hero,
  href,
  colSpan = '',
}: KpiCardProps) {
  const content = (
    <div
      className={[
        'bg-white rounded-card border shadow-card hover:shadow-card-hover transition-all duration-200 p-5 flex flex-col gap-3 relative overflow-hidden cursor-pointer',
        alert ? 'border-orange-200 bg-orange-50/40' : 'border-border',
        hero ? 'p-6' : '',
        colSpan,
      ].join(' ')}
    >
      {alert && <div className="absolute top-0 right-0 w-1 h-full bg-accent rounded-r-card" />}
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBgClass}`}>
          <span className={colorClass}>{icon}</span>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium ${
              trend.positive ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {trend.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend.value}
          </div>
        )}
        {alert && <Flame size={14} className="text-accent" />}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 mono">
          {title}
        </p>
        <p
          className={[
            'font-bold tabular-nums text-foreground',
            hero ? 'text-4xl' : 'text-3xl',
          ].join(' ')}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export interface DashboardKpis {
  totalMessages: number;
  botHandled: number;
  activeChats: number;
  ordersToday: number;
  unansweredConversations: number;
  avgReplyTimeSeconds: number;
}

export default function KpiBentoGrid({ data }: { data: DashboardKpis }) {
  // Calculate the bot resolution rate based on today's live message data
  const resolutionRate =
    data.totalMessages > 0 ? ((data.botHandled / data.totalMessages) * 100).toFixed(1) : '0';
  const avgReplyTimeLabel = `${data.avgReplyTimeSeconds.toFixed(1)}s`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
      {/* Main KPI — spans 2 columns on large screens */}
      <div className="xl:col-span-2">
        <KpiCard
          title="Messages Handled Today"
          value={data.totalMessages.toLocaleString()}
          sub={`of ${data.totalMessages} received — ${resolutionRate}% bot resolution rate`}
          trend={{ value: 'Live Updates Active', positive: true }}
          icon={<MessageSquare size={18} />}
          colorClass="text-primary-600"
          bgClass="bg-white"
          iconBgClass="bg-primary-100"
          hero
        />
      </div>

      {/* Avg Reply Time */}
      <KpiCard
        title="Avg Reply Time"
        value={avgReplyTimeLabel}
        sub="Bot response latency — target <5s"
        trend={{
          value: data.avgReplyTimeSeconds <= 5 ? 'Within target' : 'Above target',
          positive: data.avgReplyTimeSeconds <= 5,
        }}
        icon={<Clock size={18} />}
        colorClass="text-green-600"
        bgClass="bg-white"
        iconBgClass="bg-green-50"
      />

      {/* Orders Taken Today */}
      <KpiCard
        title="Orders Taken Today"
        value={data.ordersToday.toString()}
        sub="Confirmed via bot chat & system"
        trend={{ value: 'Live Data', positive: true }}
        icon={<ShoppingCart size={18} />}
        colorClass="text-blue-600"
        bgClass="bg-white"
        iconBgClass="bg-blue-50"
        href="/orders-shipping"
      />

      {/* Unique Customers */}
      <KpiCard
        title="Unique Customers"
        value={data.activeChats.toString()}
        sub="Conversations active today"
        icon={<MessageSquare size={18} />}
        colorClass="text-indigo-600"
        bgClass="bg-white"
        iconBgClass="bg-indigo-50"
        href="/inbox"
      />

      {/* Manual Replies Required — Now using real conversation state logic */}
      <KpiCard
        title="Manual Replies Required"
        value={data.unansweredConversations.toString()}
        sub="Active chats awaiting owner response"
        icon={<CheckCircle2 size={18} />}
        colorClass="text-red-500"
        bgClass="bg-white"
        iconBgClass="bg-red-50"
        alert={data.unansweredConversations > 0}
        href="/inbox"
      />
    </div>
  );
}
