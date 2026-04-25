'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { AlertTriangle, Package, Loader2, RefreshCw, Search, X, Factory } from 'lucide-react';
import { getProducts, Product } from '@/lib/actions/products';
import { getSupplierRecommendations } from '@/lib/actions/analytics';
import { toast } from 'sonner';

// Define a realistic threshold for "Low Stock"
const LOW_STOCK_THRESHOLD = 30;

function SupplierModal({ product, onClose }: { product: Product, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await getSupplierRecommendations(product.name);
      setSuggestions(res);
    } catch (err) {
      toast.error("Failed to fetch supplier data.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSuppliers();
  }, [product.name]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-primary-600 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Factory size={18} />
            <h3 className="font-semibold text-sm">AI Supplier Sourcing</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin text-primary-600" size={32} />
              <p className="text-sm text-muted-foreground animate-pulse">AI is searching suitable suppliers for "{product.name}"...</p>
            </div>
          ) : suggestions ? (
            <div className="space-y-4">
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                <p className="text-xs font-bold text-primary-700 uppercase tracking-widest mb-1">AI Recommendation</p>
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap prose prose-sm prose-primary max-w-none">
                  {suggestions}
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center py-8">
               <p className="text-sm text-muted-foreground">No supplier data found.</p>
             </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StockAlertsCard() {
  const { data: products, error, isLoading, mutate } = useSWR('stock-alerts', getProducts);
  const [sourcingProduct, setSourcingProduct] = useState<Product | null>(null);

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
      <div className="bg-green-50 border border-green-200 rounded-card p-5 flex items-center justify-between shadow-sm">
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
    <div className="bg-white rounded-card border border-amber-200 shadow-sm overflow-hidden h-full flex flex-col relative">
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

      <div className="divide-y divide-border overflow-y-auto max-h-[500px]">
        {alerts.map((item: Product) => {
          const isOutOfStock = (item.stock || 0) === 0;
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50/30 transition-colors group"
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
              
              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={() => setSourcingProduct(item)}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-[11px] font-bold hover:bg-primary-100 transition-all border border-primary-200"
                >
                  <Search size={12} />
                  Find Supplier
                </button>
                
                <div className="text-right">
                  <p className={`text-sm font-black tabular-nums ${isOutOfStock ? 'text-red-600' : 'text-amber-700'}`}>
                    {item.stock} unit{item.stock !== 1 ? 's' : ''}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isOutOfStock ? 'Out' : 'Low'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto p-3 bg-gray-50 border-t border-border">
        <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-tighter">
          Use the search button to find suitable suppliers for low items.
        </p>
      </div>

      {sourcingProduct && (
        <SupplierModal 
          product={sourcingProduct} 
          onClose={() => setSourcingProduct(null)} 
        />
      )}
    </div>
  );
}
