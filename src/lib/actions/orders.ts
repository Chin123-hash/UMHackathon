
'use server';

import { createClient } from '@/lib/supabase/server';

export interface DbOrder {
  id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  customer: string | null;
  product_name: string | null;
  tracking_no: string | null;
}

export async function getAllOrders(): Promise<DbOrder[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data || [];
}
