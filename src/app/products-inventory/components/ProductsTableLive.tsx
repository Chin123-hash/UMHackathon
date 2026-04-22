"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Search,
  Edit2,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Bot,
  Package,
  RefreshCw,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  size: string | null;
  price: number;
  stock: number;
  created_at: string;
}

type SortKey = "name" | "stock" | "price";
type StockFilter = "all" | "low-stock" | "out-of-stock" | "in-stock";

const stockFilterLabels: Record<StockFilter, string> = {
  all: "All",
  "in-stock": "In Stock",
  "low-stock": "Low Stock",
  "out-of-stock": "Out of Stock",
};

const LOW_STOCK_THRESHOLD = 50;

async function fetchProducts(): Promise<ProductRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching products:", error);
    throw error;
  }

  return data || [];
}

function getStockStatus(
  stock: number
): "in-stock" | "low-stock" | "out-of-stock" {
  if (stock === 0) return "out-of-stock";
  if (stock < LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

export default function ProductsTableLive() {
  const { data: products, error, isLoading } = useSWR("products", fetchProducts);

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = (products || [])
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const status = getStockStatus(p.stock);
      const matchStatus = stockFilter === "all" || status === stockFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "stock") return (a.stock - b.stock) * dir;
      if (sortKey === "price") return (a.price - b.price) * dir;
      return a[sortKey].localeCompare(b[sortKey]) * dir;
    });

  const startEdit = (id: string, currentStock: number) => {
    setEditingId(id);
    setEditValue(String(currentStock));
  };

  const saveEdit = async (id: string) => {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) {
      toast.error("Invalid stock value — enter a number >= 0");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("products")
      .update({ stock: val })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update stock", { description: error.message });
      return;
    }

    mutate("products");
    setEditingId(null);
    toast.success("Stock updated", {
      description: "SKU saved — bot will use updated count.",
    });
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return <ChevronUp size={12} className="text-muted-foreground/40" />;
    return sortDir === "asc" ? (
      <ChevronUp size={12} className="text-primary-600" />
    ) : (
      <ChevronDown size={12} className="text-primary-600" />
    );
  };

  if (error) {
    return (
      <div className="bg-white rounded-card border border-border shadow-card p-8">
        <EmptyState
          icon={Package}
          title="Failed to load products"
          description="There was an error loading the product inventory. Please try again."
          action={{
            label: "Retry",
            onClick: () => mutate("products"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
      {/* Table header controls */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search SKU, product…"
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
                "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors mono",
                stockFilter === f
                  ? "bg-primary-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-border",
              ].join(" ")}
            >
              {stockFilterLabels[f]}
            </button>
          ))}
        </div>
        <button
          onClick={() => mutate("products")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-border transition-colors"
        >
          <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
        <span className="text-xs text-muted-foreground mono ml-auto">
          {filtered.length} of {products?.length || 0} SKUs
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
                onClick={() => handleSort("name")}
              >
                <span className="flex items-center gap-1">
                  Product <SortIcon col="name" />
                </span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono whitespace-nowrap">
                Size
              </th>
              <th
                className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                onClick={() => handleSort("price")}
              >
                <span className="flex items-center justify-end gap-1">
                  Price ($) <SortIcon col="price" />
                </span>
              </th>
              <th
                className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                onClick={() => handleSort("stock")}
              >
                <span className="flex items-center justify-end gap-1">
                  Stock <SortIcon col="stock" />
                </span>
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono whitespace-nowrap">
                Status
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mono whitespace-nowrap">
                Edit Stock
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <RefreshCw
                    size={24}
                    className="animate-spin mx-auto text-muted-foreground"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Loading products...
                  </p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={Package}
                    title="No products match your filter"
                    description="Try adjusting the search or status filter to find your SKUs."
                    action={{
                      label: "Clear Filters",
                      onClick: () => {
                        setSearch("");
                        setStockFilter("all");
                      },
                    }}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const status = getStockStatus(product.stock);
                return (
                  <tr
                    key={product.id}
                    className={[
                      "hover:bg-muted/40 transition-colors",
                      status === "out-of-stock" ? "bg-red-50/40" : "",
                      status === "low-stock" ? "bg-amber-50/30" : "",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3 mono text-xs text-muted-foreground whitespace-nowrap">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[180px] truncate whitespace-nowrap">
                      {product.name}
                    </td>
                    <td className="px-4 py-3">
                      {product.size ? (
                        <span className="px-2 py-0.5 bg-muted rounded mono text-xs font-semibold text-foreground">
                          {product.size}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground whitespace-nowrap">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingId === product.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && saveEdit(product.id)
                            }
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
                              ? "text-red-500"
                              : product.stock < LOW_STOCK_THRESHOLD
                              ? "text-amber-600"
                              : "text-foreground"
                          }`}
                        >
                          {product.stock}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={status} />
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground mono">
          Showing {filtered.length} SKUs ·{" "}
          {(products || []).filter((p) => p.stock === 0).length} out of stock ·{" "}
          {
            (products || []).filter(
              (p) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD
            ).length
          }{" "}
          low stock
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mono">
          <Bot size={12} className="text-primary-600" />
          Live data from Supabase
        </div>
      </div>
    </div>
  );
}
