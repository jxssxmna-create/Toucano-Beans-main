import { supabase, isSupabaseConfigured } from './supabaseClient';

function assertConfigured() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
}

export async function fetchOrders({ userId } = {}) {
  assertConfigured();
  let q = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createOrder(payload) {
  assertConfigured();
  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Increment loyalty stamps by 1; at 6 → reset + voucher. */
export async function applyLoyaltyStamp(userId) {
  assertConfigured();
  if (!userId) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('loyalty_stamps, free_bag_vouchers')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;

  let stamps = Number(profile?.loyalty_stamps || 0) + 1;
  let vouchers = Number(profile?.free_bag_vouchers || 0);
  if (stamps >= 6) {
    stamps = 0;
    vouchers += 1;
  }

  const { data, error: upErr } = await supabase
    .from('profiles')
    .update({ loyalty_stamps: stamps, free_bag_vouchers: vouchers })
    .eq('id', userId)
    .select('loyalty_stamps, free_bag_vouchers')
    .maybeSingle();
  if (upErr) throw upErr;
  return data;
}

export async function fetchProfiles() {
  assertConfigured();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateProfileAdmin(id, updates) {
  assertConfigured();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function fetchSavedAddresses(userId) {
  assertConfigured();
  const { data, error } = await supabase
    .from('saved_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertSavedAddress(row) {
  assertConfigured();
  const { data, error } = await supabase
    .from('saved_addresses')
    .upsert(row)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSavedAddress(id) {
  assertConfigured();
  const { error } = await supabase.from('saved_addresses').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchRecipes() {
  assertConfigured();
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createRecipe(payload) {
  assertConfigured();
  const { data, error } = await supabase
    .from('recipes')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecipe(id) {
  assertConfigured();
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Build monthly sales series per product from order line items.
 * Returns { months: string[], series: [{ productId, name, color, values: number[] }] }
 */
export function buildSalesChartData(orders, monthsBack = 6) {
  const now = new Date();
  const months = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const byProduct = new Map();

  for (const order of orders || []) {
    if (order.status === 'cancelled') continue;
    const created = new Date(order.created_at);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
    const mi = months.indexOf(key);
    if (mi === -1) continue;

    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      const id = item.product_id || item.name;
      if (!id) continue;
      if (!byProduct.has(id)) {
        byProduct.set(id, {
          productId: id,
          name: item.name || String(id),
          values: months.map(() => 0),
        });
      }
      const row = byProduct.get(id);
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      row.values[mi] += qty * price;
    }
  }

  const palette = [
    '#FF5500', '#0f766e', '#1d4ed8', '#a21caf', '#b45309',
    '#be123c', '#065f46', '#4338ca', '#c2410c', '#0e7490',
  ];

  const series = [...byProduct.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s, i) => ({ ...s, color: palette[i % palette.length] }));

  return { months, series };
}

export function flattenSalesRecords(orders) {
  const rows = [];
  for (const order of orders || []) {
    if (order.status === 'cancelled') continue;
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) {
      rows.push({
        id: order.id,
        date: order.created_at,
        customer: order.customer_name,
        product: '—',
        qty: 0,
        revenue: Number(order.total) || 0,
        status: order.status,
      });
      continue;
    }
    for (const item of items) {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      rows.push({
        id: `${order.id}-${item.product_id || item.name}`,
        date: order.created_at,
        customer: order.customer_name,
        product: item.name || 'Item',
        qty,
        revenue: qty * price,
        status: order.status,
      });
    }
  }
  return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
}
