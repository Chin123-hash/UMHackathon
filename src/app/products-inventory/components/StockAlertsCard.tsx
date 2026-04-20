'use client';

import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';


interface AlertItem {
  id: string;
  sku: string;
  name: string;
  size: string;
  stock: number;
  threshold: number;
  severity: 'out' | 'low';
}

const alerts: AlertItem[] = [
  { id: 'alert-001', sku: 'BKM-001-S', name: 'Baju Kurung Moden Pastel', size: 'S', stock: 0, threshold: 5, severity: 'out' },
  { id: 'alert-002', sku: 'BKM-001-XL', name: 'Baju Kurung Moden Pastel', size: 'XL', stock: 2, threshold: 5, severity: 'low' },
  { id: 'alert-003', sku: 'BBS-003-M', name: 'Blouse Batik Selangor', size: 'M', stock: 3, threshold: 8, severity: 'low' },
  { id: 'alert-004', sku: 'TKL-005-L', name: 'Tudung Khimar Lace', size: 'L', stock: 1, threshold: 10, severity: 'low' },
];

export default function StockAlertsCard() {
  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-card p-4 flex items-center gap-3">
        <Package size={18} className="text-green-600" />
        <p className="text-sm text-green-700 font-medium">No stock alerts right now. All SKUs are above reorder thresholds. 🎉</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card border border-amber-200 shadow-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 bg-amber-50 border-b border-amber-200">
        <AlertTriangle size={16} className="text-accent shrink-0" />
        <h2 className="text-sm font-semibold text-amber-800">
          Stock Alerts — {alerts.length} SKU{alerts.length !== 1 ? 's' : ''} below threshold
        </h2>
        <span className="ml-auto text-xs text-amber-600 mono">Bot is pausing stock queries for these items</span>
      </div>
      <div className="divide-y divide-border">
        {alerts.map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
            <div className={`w-2 h-2 rounded-full shrink-0 ${item.severity === 'out' ? 'bg-red-500' : 'bg-amber-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground mono">{item.sku} · Size {item.size}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold tabular-nums ${item.stock === 0 ? 'text-red-500' : 'text-amber-600'}`}>
                {item.stock} units
              </p>
              <p className="text-xs text-muted-foreground mono">threshold: {item.threshold}</p>
            </div>
            <span
              className={`shrink-0 ${
                item.severity === 'out' ? 'badge-outofstock' : 'badge-lowstock'
              }`}
            >
              {item.severity === 'out' ? 'Out of Stock' : 'Low Stock'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}