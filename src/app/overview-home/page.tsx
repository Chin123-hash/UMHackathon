import React from 'react';
import AppLayout from '@/components/AppLayout';
import KpiBentoGrid from './components/KpiBentoGrid';
import LiveActivityFeed from './components/LiveActivityFeed';
import AgentTimeline from './components/AgentTimeline';
import MessageVolumeChart from './components/MessageVolumeChart';
import ReplyTimeChart from './components/ReplyTimeChart';

export default function OverviewHomePage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Overview' }]}>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Operations Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              NabilahFashion.my · Shopee Malaysia · Mon, 20 Apr 2026
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mono">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
            Updated 15:25:02
          </div>
        </div>

        {/* KPI Bento Grid */}
        <KpiBentoGrid />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3">
            <MessageVolumeChart />
          </div>
          <div className="xl:col-span-2">
            <ReplyTimeChart />
          </div>
        </div>

        {/* Activity + Timeline row */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3">
            <LiveActivityFeed />
          </div>
          <div className="xl:col-span-2">
            <AgentTimeline />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}