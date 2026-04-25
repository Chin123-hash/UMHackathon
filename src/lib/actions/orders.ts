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
  destination: string | null;
  courier_name: string | null;
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

export async function createOrder(orderData: Partial<DbOrder>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        product_id: orderData.product_id,
        quantity: orderData.quantity,
        total_price: orderData.total_price,
        status: orderData.status || 'pending',
        customer: orderData.customer,
        product_name: orderData.product_name,
        destination: orderData.destination,
      },
    ])
    .select();

  if (error) {
    console.error('Error creating order:', error);
    return { success: false, error };
  }

  return { success: true, data: data[0] };
}

export async function updateOrderCourier(orderId: string, courierName: string, trackingNo: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .update({
      courier_name: courierName,
      tracking_no: trackingNo,
      status: 'shipped',
    })
    .eq('id', orderId)
    .select();

  if (error) {
    console.error('Error updating order courier:', error);
    return { success: false, error };
  }

  return { success: true, data: data[0] };
}
