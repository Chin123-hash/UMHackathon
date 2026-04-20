import React from 'react';
import AppLayout from '@/components/AppLayout';
import StockAlertsCard from './components/StockAlertsCard';
import ProductsTable from './components/ProductsTable';

export default function ProductsInventoryPage() {
  return (
    <AppLayout breadcrumbs={[{ label: 'Products & Inventory' }]}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Products & Inventory</h1>
            <p className="text-xs text-muted-foreground mt-0.5">NabilahFashion.my · 12 SKUs · Last synced 15:25</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-btn hover:bg-primary-700 transition-colors active:scale-95">
            + Add Product
          </button>
        </div>
        <StockAlertsCard />
        <ProductsTable />
      </div>
    </AppLayout>
  );
}