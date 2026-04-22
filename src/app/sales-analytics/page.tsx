"use client";

import React from "react";
import AppLayout from "@/components/AppLayout";
import useSWR from "swr";
import {
  getSalesAnalytics,
  getInventorySummary,
  SalesAnalytics,
} from "@/lib/actions/analytics";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  BarChart3,
  Loader2,
  RefreshCw,
} from "lucide-react";

// Stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: string; positive: boolean };
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.positive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {trend.positive ? "+" : ""}
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
        )}
      </div>
    </div>
  );
}

// Top products chart component
function TopProductsChart({
  products,
}: {
  products: SalesAnalytics["topProducts"];
}) {
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-card border border-border shadow-card p-5">
        <h3 className="text-base font-semibold text-foreground mb-4">
          Top Selling Products
        </h3>
        <p className="text-sm text-muted-foreground">No sales data available</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...products.map((p) => p.revenue));

  return (
    <div className="bg-white rounded-card border border-border shadow-card p-5">
      <h3 className="text-base font-semibold text-foreground mb-4">
        Top Selling Products
      </h3>
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={product.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">
                  #{index + 1}
                </span>
                {product.name}
              </span>
              <span className="text-muted-foreground">
                {product.quantity} sold · RM{product.revenue.toFixed(2)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${(product.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recent orders table component
function RecentOrdersTable({
  orders,
}: {
  orders: SalesAnalytics["recentOrders"];
}) {
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-card border border-border shadow-card p-5">
        <h3 className="text-base font-semibold text-foreground mb-4">
          Recent Orders
        </h3>
        <p className="text-sm text-muted-foreground">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card border border-border shadow-card overflow-hidden">
      <div className="p-5 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">
          Recent Orders
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Order ID
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Product
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Qty
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Total
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 text-sm font-mono text-muted-foreground">
                  {order.id.slice(0, 8)}...
                </td>
                <td className="px-5 py-3 text-sm text-foreground font-medium">
                  {order.product_name}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {order.quantity}
                </td>
                <td className="px-5 py-3 text-sm text-foreground font-medium">
                  RM{order.total_price.toFixed(2)}
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("en-MY", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-card border border-border p-5 h-32"
          >
            <div className="w-10 h-10 bg-muted rounded-lg" />
            <div className="mt-4 space-y-2">
              <div className="h-6 w-24 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-card border border-border p-5 h-64" />
        <div className="bg-white rounded-card border border-border p-5 h-64" />
      </div>
    </div>
  );
}

export default function SalesAnalyticsPage() {
  const {
    data: salesData,
    error: salesError,
    isLoading: salesLoading,
    mutate: mutateSales,
  } = useSWR("sales-analytics", () => getSalesAnalytics(30));

  const {
    data: inventoryData,
    error: inventoryError,
    isLoading: inventoryLoading,
    mutate: mutateInventory,
  } = useSWR("inventory-summary", () => getInventorySummary());

  const isLoading = salesLoading || inventoryLoading;
  const hasError = salesError || inventoryError;

  const handleRefresh = () => {
    mutateSales();
    mutateInventory();
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Sales Analytics" }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Sales Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              SellerMate Demo · Last 30 days · Live Supabase Data
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-btn hover:bg-primary-700 transition-colors active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
        </div>

        {/* Error state */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-card p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500" />
            <p className="text-sm text-red-700">
              Failed to load analytics data. Please try again.
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && <LoadingSkeleton />}

        {/* Content */}
        {!isLoading && !hasError && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={`RM${(salesData?.totalRevenue || 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}`}
                subValue="Last 30 days"
                iconBg="bg-green-500"
              />
              <StatCard
                icon={ShoppingCart}
                label="Total Orders"
                value={String(salesData?.totalOrders || 0)}
                subValue={`Avg RM${(salesData?.avgOrderValue || 0).toFixed(2)} per order`}
                iconBg="bg-blue-500"
              />
              <StatCard
                icon={Package}
                label="Total Products"
                value={String(inventoryData?.totalProducts || 0)}
                subValue={`${inventoryData?.totalStock || 0} items in stock`}
                iconBg="bg-purple-500"
              />
              <StatCard
                icon={TrendingUp}
                label="Inventory Value"
                value={`RM${(inventoryData?.totalValue || 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}`}
                subValue={`${inventoryData?.lowStockCount || 0} low stock alerts`}
                trend={
                  inventoryData?.lowStockCount && inventoryData.lowStockCount > 0
                    ? { value: `${inventoryData.lowStockCount} alerts`, positive: false }
                    : undefined
                }
                iconBg="bg-orange-500"
              />
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TopProductsChart products={salesData?.topProducts || []} />
              <RecentOrdersTable orders={salesData?.recentOrders || []} />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
