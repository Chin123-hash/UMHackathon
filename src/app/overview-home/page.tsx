import React from 'react';
import AppLayout from '@/components/AppLayout';
import KpiBentoGrid from './components/KpiBentoGrid';
import LiveActivityFeed from './components/LiveActivityFeed';
import AgentTimeline from './components/AgentTimeline';
import MessageVolumeChart from './components/MessageVolumeChart';
import ReplyTimeChart from './components/ReplyTimeChart';
import { getDashboardData } from '@/lib/actions/analytics';

export const dynamic = 'force-dynamic';

export default async function OverviewHomePage() {
  const dashboardData = await getDashboardData();

  const todayStr = new Date().toLocaleDateString('en-MY', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const timeStr = new Date().toLocaleTimeString('en-MY', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <AppLayout breadcrumbs={[{ label: 'Overview' }]}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Operations Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              RachelFashion.my · {todayStr}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mono">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
            Updated {timeStr}
          </div>
        </div>

        {/* KPI Bento Grid */}
        <KpiBentoGrid data={dashboardData.kpis} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3">
            <MessageVolumeChart data={dashboardData.volumeData} />
          </div>
          <div className="xl:col-span-2">
            <ReplyTimeChart data={dashboardData.replyTimeData} />
          </div>
        </div>

        {/* Activity + Timeline row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3">
            <LiveActivityFeed data={dashboardData.liveActivity} />
          </div>
          <div className="xl:col-span-2">
            <AgentTimeline data={dashboardData.timeline} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
