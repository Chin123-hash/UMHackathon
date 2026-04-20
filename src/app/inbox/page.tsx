import React from 'react';
import AppLayout from '@/components/AppLayout';
import InboxLayout from './components/InboxLayout';

export default function InboxPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Inbox' }]}>
      <InboxLayout />
    </AppLayout>
  );
}