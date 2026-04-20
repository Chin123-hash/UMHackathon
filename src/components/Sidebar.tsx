'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import {
  LayoutDashboard,
  MessageSquare,
  Package,
  Truck,
  BarChart2,
  Settings,
  ChevronRight,
  Bell,
  ShoppingBag,
  X,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navGroups = [
  {
    label: 'Operations',
    items: [
      { href: '/overview-home', icon: LayoutDashboard, label: 'Overview', badge: null },
      { href: '/inbox', icon: MessageSquare, label: 'Inbox', badge: 3 },
      { href: '/products-inventory', icon: Package, label: 'Products & Inventory', badge: 2 },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { href: '/orders-shipping', icon: Truck, label: 'Orders & Shipping', badge: null },
      { href: '/live-chat-analysis', icon: BarChart2, label: 'Live Chat Analysis', badge: null },
      { href: '/shopee-mock', icon: ShoppingBag, label: 'Shopee Customer View', badge: null },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', icon: Settings, label: 'Settings', badge: null },
    ],
  },
];

export default function Sidebar({ collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarClasses = [
    'fixed top-0 left-0 h-full z-40 flex flex-col bg-white border-r border-border transition-all duration-300 ease-in-out',
    collapsed ? 'w-16' : 'w-60',
    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
  ].join(' ');

  return (
    <aside className={sidebarClasses}>
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-3 h-14 border-b border-border shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <AppLogo size={30} onClick={onMobileClose} />
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-semibold text-sm text-foreground tracking-tight truncate">SocialSell</span>
            <span className="text-xs text-muted-foreground truncate">Automator</span>
          </div>
        )}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="ml-auto lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={`group-${group.label}`}>
            {!collapsed && (
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1.5">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <li key={`nav-${item.href}`}>
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      title={collapsed ? item.label : undefined}
                      className={[
                        'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                        isActive
                          ? 'bg-primary-100 text-primary-600' :'text-muted-foreground hover:bg-muted hover:text-foreground',
                        collapsed ? 'justify-center' : '',
                      ].join(' ')}
                    >
                      <item.icon size={18} className="shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge !== null && (
                            <span className="ml-auto bg-accent text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                              {item.badge}
                            </span>
                          )}
                          {isActive && (
                            <ChevronRight size={14} className="text-primary-600 opacity-60" />
                          )}
                        </>
                      )}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                          {item.label}
                          {item.badge !== null && (
                            <span className="ml-1 bg-accent rounded-full px-1">{item.badge}</span>
                          )}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom user */}
      <div className={`border-t border-border px-2 py-3 shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              SN
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Siti Nabilah</p>
              <p className="text-xs text-muted-foreground truncate">NabilahFashion.my</p>
            </div>
            <Bell size={15} className="text-muted-foreground shrink-0" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            SN
          </div>
        )}
      </div>
    </aside>
  );
}