"use server";

import { createClient } from "@/lib/supabase/server";

export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  recentOrders: {
    id: string;
    product_name: string;
    quantity: number;
    total_price: number;
    created_at: string;
  }[];
}

export async function getSalesAnalytics(
  days = 30
): Promise<SalesAnalytics | null> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch orders within the time period
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      `
      id,
      product_id,
      quantity,
      total_price,
      status,
      created_at,
      products (name)
    `
    )
    .gte("created_at", startDate.toISOString())
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
    return null;
  }

  if (!orders || orders.length === 0) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      topProducts: [],
      recentOrders: [],
    };
  }

  // Calculate totals
  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total_price),
    0
  );
  const totalOrders = orders.length;
  const avgOrderValue = totalRevenue / totalOrders;

  // Calculate top products
  const productSales = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();

  for (const order of orders) {
    const productName =
      (order.products as { name: string } | null)?.name || "Unknown";
    const existing = productSales.get(productName) || {
      name: productName,
      quantity: 0,
      revenue: 0,
    };
    existing.quantity += order.quantity;
    existing.revenue += Number(order.total_price);
    productSales.set(productName, existing);
  }

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Format recent orders
  const recentOrders = orders.slice(0, 10).map((order) => ({
    id: order.id,
    product_name:
      (order.products as { name: string } | null)?.name || "Unknown",
    quantity: order.quantity,
    total_price: Number(order.total_price),
    created_at: order.created_at,
  }));

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    topProducts,
    recentOrders,
  };
}

export async function getInventorySummary(): Promise<{
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  totalValue: number;
}> {
  const supabase = await createClient();

  const { data: products, error } = await supabase.from("products").select("*");

  if (error || !products) {
    console.error("Error fetching inventory summary:", error);
    return {
      totalProducts: 0,
      totalStock: 0,
      lowStockCount: 0,
      totalValue: 0,
    };
  }

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock < 50).length;
  const totalValue = products.reduce(
    (sum, p) => sum + Number(p.price) * p.stock,
    0
  );

  return {
    totalProducts,
    totalStock,
    lowStockCount,
    totalValue,
  };
}
