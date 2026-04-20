import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'SocialSell Automator — AI Agent Dashboard for Shopee SMEs',
  description:
    'Monitor your AI customer service agent handling Shopee DMs, track stock alerts, orders, and escalations — built for Malaysian SMEs.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}
</body>
    </html>
  );
}