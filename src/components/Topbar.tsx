'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, PanelLeftClose, PanelLeftOpen, Search, Bell, ChevronRight } from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
  onMobileMenuToggle: () => void;
  mobileSidebarOpen: boolean;
  sidebarCollapsed: boolean;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function Topbar({
  onToggleSidebar,
  onMobileMenuToggle,
  mobileSidebarOpen,
  sidebarCollapsed,
  breadcrumbs,
}: TopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-4 gap-3 shrink-0 z-20 sticky top-0">
      {/* Desktop collapse toggle */}
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground"
        title={mobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={`crumb-${i}`}>
              {i > 0 && <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
              {crumb.href && i < breadcrumbs.length - 1 ? (
                <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors truncate">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground truncate">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Search size={14} />
          <span className="hidden sm:inline">Search…</span>
          <kbd className="hidden sm:inline text-xs bg-muted px-1 rounded font-mono">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
        </button>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-700 mono">LIVE</span>
        </div>
      </div>
    </header>
  );
}