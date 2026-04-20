'use client';

import React, { useState } from 'react';
import { Search, Edit2, Check, X, ChevronUp, ChevronDown, Bot, Package } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  size: 'S' | 'M' | 'L' | 'XL';
  color: string;
  priceRM: number;
  stock: number;
  threshold: number;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  lastBotQuery: string;
  eastMalaysia: boolean;
}

const initialProducts: ProductRow[] = [
  { id: 'prod-001', sku: 'BKM-001-S', name: 'Baju Kurung Moden Pastel', category: 'Baju Kurung', size: 'S', color: 'Dusty Pink', priceRM: 89.90, stock: 0, threshold: 5, stockStatus: 'out-of-stock', lastBotQuery: '15:24:31', eastMalaysia: true },
  { id: 'prod-002', sku: 'BKM-001-M', name: 'Baju Kurung Moden Pastel', category: 'Baju Kurung', size: 'M', color: 'Dusty Pink', priceRM: 89.90, stock: 3, threshold: 5, stockStatus: 'low-stock', lastBotQuery: '15:24:31', eastMalaysia: true },
  { id: 'prod-003', sku: 'BKM-001-L', name: 'Baju Kurung Moden Pastel', category: 'Baju Kurung', size: 'L', color: 'Dusty Pink', priceRM: 89.90, stock: 12, threshold: 5, stockStatus: 'in-stock', lastBotQuery: '15:21:05', eastMalaysia: true },
  { id: 'prod-004', sku: 'BKM-001-XL', name: 'Baju Kurung Moden Pastel', category: 'Baju Kurung', size: 'XL', color: 'Dusty Pink', priceRM: 89.90, stock: 2, threshold: 5, stockStatus: 'low-stock', lastBotQuery: '15:18:44', eastMalaysia: true },
  { id: 'prod-005', sku: 'BBS-003-S', name: 'Blouse Batik Selangor', category: 'Blouse', size: 'S', color: 'Navy Blue', priceRM: 65.00, stock: 8, threshold: 5, stockStatus: 'in-stock', lastBotQuery: '15:12:20', eastMalaysia: false },
  { id: 'prod-006', sku: 'BBS-003-M', name: 'Blouse Batik Selangor', category: 'Blouse', size: 'M', color: 'Navy Blue', priceRM: 65.00, stock: 3, threshold: 8, stockStatus: 'low-stock', lastBotQuery: '15:09:55', eastMalaysia: false },
  { id: 'prod-007', sku: 'BBS-003-L', name: 'Blouse Batik Selangor', category: 'Blouse', size: 'L', color: 'Navy Blue', priceRM: 65.00, stock: 15, threshold: 5, stockStatus: 'in-stock', lastBotQuery: '14:58:30', eastMalaysia: false },
  { id: 'prod-008', sku: 'TKL-005-M', name: 'Tudung Khimar Lace', category: 'Tudung', size: 'M', color: 'Cream White', priceRM: 45.00, stock: 22, threshold: 10, stockStatus: 'in-stock', lastBotQuery: '15:14:12', eastMalaysia: true },
  { id: 'prod-009', sku: 'TKL-005-L', name: 'Tudung Khimar Lace', category: 'Tudung', size: 'L', color: 'Cream White', priceRM: 45.00, stock: 1, threshold: 10, stockStatus: 'low-stock', lastBotQuery: '15:16:44', eastMalaysia: true },
  { id: 'prod-010', sku: 'KBT-007-S', name: 'Kebaya Teluk Belanga', category: 'Kebaya', size: 'S', color: 'Sage Green', priceRM: 120.00, stock: 6, threshold: 3, stockStatus: 'in-stock', lastBotQuery: '14:45:08', eastMalaysia: false },
  { id: 'prod-011', sku: 'KBT-007-M', name: 'Kebaya Teluk Belanga', category: 'Kebaya', size: 'M', color: 'Sage Green', priceRM: 120.00, stock: 9, threshold: 3, stockStatus: 'in-stock', lastBotQuery: '15:02:33', eastMalaysia: false },
  { id: 'prod-012', sku: 'KBT-007-XL', name: 'Kebaya Teluk Belanga', category: 'Kebaya', size: 'XL', color: 'Sage Green', priceRM: 120.00, stock: 4, threshold: 3, stockStatus: 'in-stock', lastBotQuery: '14:38:17', eastMalaysia: false },
];

type SortKey = 'name' | 'stock' | 'priceRM' | 'lastBotQuery';
type StockFilter = 'all' | 'low-stock' | 'out-of-stock' | 'in-stock';

const stockFilterLabels: Record<StockFilter, string> = {
  all: 'All',
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

export default function ProductsTable() {
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.color.toLowerCase().includes(search.toLowerCase());
      const matchStatus = stockFilter === 'all' || p.stockStatus === stockFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'stock') return (a.stock - b.stock) * dir;
      if (sortKey === 'priceRM') return (a.priceRM - b.priceRM) * dir;
      return a[sortKey].localeCompare(b[sortKey]) * dir;
    });

  const startEdit = (id: string, currentStock: number) => {
    setEditingId(id);
    setEditValue(String(currentStock));
  };

  const saveEdit = (id: string) => {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) {
      toast.error('Invalid stock value — enter a number ≥ 0');
      return;
    }
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        let newStatus: ProductRow['stockStatus'] = 'in-stock';
        if (val === 0) newStatus = 'out-of-stock';
        else if (val < p.threshold) newStatus = 'low-stock';
        return { ...p, stock: val, stockStatus: newStatus };
      })
    );
    setEditingId(null);
    toast.success('Stock updated', { description: `SKU saved — bot will use updated count.` });
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp size={12} className="text-muted-foreground/40" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="text-primary-600" />
    ) : (
      <ChevronDown size={12} className="text-primary-600" />
    );
  };

  const toast = {
    error: (message: string) => console.error(message),
    success: (message: string, options?: { description?: string }) => console.log(message, options?.description ?? ''),
  };

  return (
    <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
      {/* Table header controls */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search SKU, product, colour…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(stockFilterLabels) as StockFilter[]).map((f) => (
            <button
              key={`sf-${f}`}
              onClick={() => setStockFilter(f)}
              className={[
                'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors mono',
                stockFilter === f
                  ? 'bg-primary-600 text-white' :'bg-muted text-muted-foreground hover:bg-border',
              ].join(' ')}
            >
              {stockFilterLabels[f]}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground mono ml-auto">
          {filtered.length} of {products.length} SKUs
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono whitespace-nowrap">
                SKU
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                onClick={() => handleSort('name')}
              >
                <span className="flex items-center gap-1">
                  Product <SortIcon col="name" />
                </span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono whitespace-nowrap">
                Size
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono whitespace-nowrap">
                Colour
              </th>
              <th
                className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                onClick={() => handleSort('priceRM')}
              >
                <span className="flex items-center justify-end gap-1">
                  Price (RM) <SortIcon col="priceRM" />
                </span>
              </th>
              <th
                className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                onClick={() => handleSort('stock')}
              >
                <span className="flex items-center justify-end gap-1">
                  Stock <SortIcon col="stock" />
                </span>
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono whitespace-nowrap">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono whitespace-nowrap">
                East MY
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                onClick={() => handleSort('lastBotQuery')}
              >
                <span className="flex items-center gap-1">
                  Last Bot Query <SortIcon col="lastBotQuery" />
                </span>
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono whitespace-nowrap">
                Edit Stock
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <EmptyState
                    icon={Package}
                    title="No products match your filter"
                    description="Try adjusting the search or status filter to find your SKUs."
                    action={{ label: 'Clear Filters', onClick: () => { setSearch(''); setStockFilter('all'); } }}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr
                  key={product.id}
                  className={[
                    'hover:bg-muted/40 transition-colors',
                    product.stockStatus === 'out-of-stock' ? 'bg-red-50/40' : '',
                    product.stockStatus === 'low-stock' ? 'bg-amber-50/30' : '',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 mono text-xs text-muted-foreground whitespace-nowrap">
                    {product.sku}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate whitespace-nowrap">
                    {product.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-muted rounded mono text-xs font-semibold text-foreground">
                      {product.size}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {product.color}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground whitespace-nowrap">
                    RM {product.priceRM.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === product.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(product.id)}
                          className="w-16 px-2 py-1 text-xs text-right border border-primary-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-600/30 mono tabular-nums"
                          autoFocus
                          min={0}
                        />
                        <button
                          onClick={() => saveEdit(product.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`font-bold tabular-nums mono text-sm ${
                          product.stock === 0
                            ? 'text-red-500'
                            : product.stock < product.threshold
                            ? 'text-amber-600' :'text-foreground'
                        }`}
                      >
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <StatusBadge status={product.stockStatus} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {product.eastMalaysia ? (
                      <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded mono font-medium">
                        SB/SK
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mono">
                      <Bot size={11} className="text-primary-600" />
                      {product.lastBotQuery}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId !== product.id && (
                      <button
                        onClick={() => startEdit(product.id, product.stock)}
                        className="p-1.5 text-muted-foreground hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit stock count"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground mono">
          Showing {filtered.length} SKUs · {products.filter((p) => p.stockStatus === 'out-of-stock').length} out of stock · {products.filter((p) => p.stockStatus === 'low-stock').length} low stock
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mono">
          <Bot size={12} className="text-primary-600" />
          Bot queries stock data in real-time via Inventory API
        </div>
      </div>
    </div>
  );
}