'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function AppLayout({ children, breadcrumbs }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{
          marginLeft: 0,
        }}
      >
        <Topbar
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          onMobileMenuToggle={() => setMobileSidebarOpen((v) => !v)}
          mobileSidebarOpen={mobileSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          breadcrumbs={breadcrumbs}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 xl:px-8 2xl:px-10 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}