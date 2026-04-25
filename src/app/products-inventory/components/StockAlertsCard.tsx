'use client';

import React from 'react';
import useSWR from 'swr';
import { AlertTriangle, Package, Loader2, RefreshCw } from 'lucide-react';
import { getProducts, Product } from '@/lib/actions/products'; // ✅ FIXED: Correct function name

// Define a realistic threshold for "Low Stock"
const LOW_STOCK_THRESHOLD = 10;

export default function StockAlertsCard() {
  // ✅ REALISTIC: Fetching live data from Supabase via SWR
  const { data: products, error, isLoading, mutate } = useSWR('stock-alerts', getProducts);

  // ✅ REALISTIC: Filter products where stock is below the threshold
  const alerts = products?.filter((p) => (p.stock || 0) < LOW_STOCK_THRESHOLD) || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-card border border-border p-8 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
        <p className="text-sm text-muted-foreground">Scanning inventory levels...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-card p-4 flex items-center gap-3">
        <AlertTriangle size={18} className="text-red-600" />
        <p className="text-sm text-red-700 font-medium">Failed to sync inventory alerts.</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-full">
            <Package size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-green-800 font-bold">Inventory Healthy</p>
            <p className="text-xs text-green-600">All SKUs are above the reorder threshold.</p>
          </div>
        </div>
        <button
          onClick={() => mutate()}
          className="text-green-600 hover:rotate-180 transition-transform"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card border border-amber-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 bg-amber-50 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <h2 className="text-sm font-bold text-amber-900">
            Stock Critical — {alerts.length} SKU{alerts.length !== 1 ? 's' : ''}
          </h2>
        </div>
        <button
          onClick={() => mutate()}
          className="text-amber-600 hover:text-amber-800 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="divide-y divide-border overflow-y-auto max-h-[400px]">
        {/* ✅ FIXED: Added 'Product' type to 'item' to resolve ts(7006) */}
        {alerts.map((item: Product) => {
          const isOutOfStock = (item.stock || 0) === 0;
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50/30 transition-colors"
            >
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOutOfStock ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                  {item.sku || item.id} · Size {item.size || 'N/A'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-black tabular-nums ${isOutOfStock ? 'text-red-600' : 'text-amber-700'}`}
                >
                  {item.stock} unit{item.stock !== 1 ? 's' : ''}
                </p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {isOutOfStock ? 'Out' : 'Low'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto p-3 bg-gray-50 border-t border-border">
        <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-tighter">
          System automatically pauses AI queries for SKUs with 0 stock.
        </p>
      </div>
    </div>
  );
}
