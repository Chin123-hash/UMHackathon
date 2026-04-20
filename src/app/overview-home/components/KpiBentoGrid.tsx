'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Clock,
  ShoppingCart,
  AlertTriangle,
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
  bgClass,
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
      {alert && (
        <div className="absolute top-0 right-0 w-1 h-full bg-accent rounded-r-card" />
      )}
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

export default function KpiBentoGrid() {
  // Simulate live counter incrementing
  const [messagesHandled, setMessagesHandled] = useState(247);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessagesHandled((v) => v + Math.floor(Math.random() * 2));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Bento plan: 6 cards → grid-cols-3 × 2 rows
  // Row 1: hero (Messages Handled, spans 2 cols) + Avg Reply Time (1 col)
  // Row 2: Orders Tracked + Stock Alerts + Bot Resolution Rate + Escalations (but 4 in 3-col = row2: 3 items, row3: 1 item)
  // Better: grid-cols-4 → row1: hero spans 2 + 2 regular; row2: 4 regular
  // Actually 6 cards: grid-cols-3 × 2 rows, hero spans 2 cols in row 1, giving 3+3 visual balance
  // Final: grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3
  // Hero spans 2 cols at xl+

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
      {/* Hero card — spans 2 cols on xl+ */}
      <div className="xl:col-span-2">
        <KpiCard
          title="Messages Handled Today"
          value={messagesHandled.toLocaleString()}
          sub="of 268 received — 92.2% bot resolution rate"
          trend={{ value: '+18% vs yesterday', positive: true }}
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
        value="3.4s"
        sub="Bot response latency — target &lt;5s"
        trend={{ value: '-0.8s vs yesterday', positive: true }}
        icon={<Clock size={18} />}
        colorClass="text-green-600"
        bgClass="bg-white"
        iconBgClass="bg-green-50"
      />

      {/* Orders Tracked */}
      <KpiCard
        title="Orders Tracked Today"
        value="41"
        sub="Tracking updates sent via bot"
        trend={{ value: '+7 vs yesterday', positive: true }}
        icon={<ShoppingCart size={18} />}
        colorClass="text-blue-600"
        bgClass="bg-white"
        iconBgClass="bg-blue-50"
        href="/orders-shipping"
      />

      {/* Stock Alerts — ALERT STATE */}
      <KpiCard
        title="Stock Alerts"
        value="4"
        sub="SKUs below reorder threshold"
        icon={<AlertTriangle size={18} />}
        colorClass="text-accent"
        bgClass="bg-white"
        iconBgClass="bg-orange-50"
        alert
        href="/products-inventory"
      />

      {/* Escalations Today */}
      <KpiCard
        title="Escalations Today"
        value="6"
        sub="Forwarded to owner for manual reply"
        trend={{ value: '+2 vs yesterday', positive: false }}
        icon={<CheckCircle2 size={18} />}
        colorClass="text-red-500"
        bgClass="bg-white"
        iconBgClass="bg-red-50"
        href="/inbox"
      />
    </div>
  );
}