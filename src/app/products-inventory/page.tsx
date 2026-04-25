'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import StockAlertsCard from './components/StockAlertsCard';
import ProductsTable from './components/ProductsTable';
import ProductsTableLive from './components/ProductsTableLive';
import { Database, Table2 } from 'lucide-react';

export default function ProductsInventoryPage() {
  const [useLive, setUseLive] = useState(true);

  return (
    <AppLayout breadcrumbs={[{ label: 'Products & Inventory' }]}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Products & Inventory</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              SellerMate Demo · Live Supabase Data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseLive((v) => !v)}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95',
                useLive
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-muted text-muted-foreground border border-border hover:bg-border',
              ].join(' ')}
            >
              {useLive ? <Database size={15} /> : <Table2 size={15} />}
              {useLive ? 'Live Data' : 'Static Data'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-btn hover:bg-primary-700 transition-colors active:scale-95">
              + Add Product
            </button>
          </div>
        </div>
        <StockAlertsCard />
        {useLive ? <ProductsTableLive /> : <ProductsTable />}
      </div>
    </AppLayout>
  );
}
