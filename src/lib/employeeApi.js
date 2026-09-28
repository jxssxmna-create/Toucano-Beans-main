import { supabase } from './supabaseClient';

export async function fetchEmployeeOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
}

export async function fetchCustomerLoyalty(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase.rpc('employee_customer_loyalty', { p_user_ids: ids });
  if (error) throw error;
  return Object.fromEntries((data || []).map((row) => [row.user_id, row]));
}

export async function setProductStock(productId, inStock) {
  const { error } = await supabase.rpc('set_product_stock', {
    p_product_id: productId,
    p_in_stock: inStock,
  });
  if (error) throw error;
}

/** Swap (productId), change qty, or remove (qty = 0) the item at `index` of a pending order. */
export async function adjustOrderItem({ orderId, index, productId = null, qty = null, note = null }) {
  const { data, error } = await supabase.rpc('employee_adjust_order_item', {
    p_order_id: orderId,
    p_index: index,
    p_product_id: productId,
    p_qty: qty,
    p_note: note,
  });
  if (error) throw error;
  return data;
}

export async function updateEmployeeProfile(userId, { full_name, phone_number }) {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name, phone_number })
    .eq('id', userId);
  if (error) throw error;
}

/** Subscribes to order + product changes; returns an unsubscribe fn. */
export function subscribeEmployeeFeed({ onOrder, onProduct }) {
  const channel = supabase
    .channel('employee-feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) =>
      onOrder?.(payload)
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) =>
      onProduct?.(payload)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
