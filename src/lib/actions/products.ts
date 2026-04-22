"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Product {
  id: string;
  sku: string;
  name: string;
  size: string | null;
  price: number;
  stock: number;
  created_at: string;
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data || [];
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  return data;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error searching products:", error);
    return [];
  }

  return data || [];
}

export async function updateProductStock(
  id: string,
  newStock: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", id);

  if (error) {
    console.error("Error updating product stock:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/products-inventory");
  return { success: true };
}

export async function createProduct(product: {
  sku: string;
  name: string;
  size?: string;
  price: number;
  stock: number;
}): Promise<{ success: boolean; data?: Product; error?: string }> {
  const supabase = await createClient();
  const id = `prod_${Date.now()}`;

  const { data, error } = await supabase
    .from("products")
    .insert([{ id, ...product }])
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/products-inventory");
  return { success: true, data };
}

export async function getLowStockProducts(threshold = 50): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .lt("stock", threshold)
    .order("stock", { ascending: true });

  if (error) {
    console.error("Error fetching low stock products:", error);
    return [];
  }

  return data || [];
}
