import { supabase, isSupabaseConfigured } from './supabaseClient';

/** Email-domain heuristic requested for admin detection. */
export function isAdminEmail(email) {
  return Boolean(email && String(email).toLowerCase().endsWith('@admin.com'));
}

/** Delivery drivers must use @deliver.com emails. */
export function isDeliveryEmail(email) {
  return Boolean(email && String(email).toLowerCase().endsWith('@deliver.com'));
}

/**
 * Admin if profiles.role === 'admin' OR email ends with @admin.com.
 * RLS still enforces profiles.role via is_admin() for writes.
 */
export function isAdminUser(user, profile) {
  if (profile?.role === 'admin') return true;
  if (isAdminEmail(user?.email)) return true;
  return false;
}

/**
 * Delivery if profiles.role === 'delivery' OR email ends with @deliver.com.
 * RLS still enforces profiles.role via is_delivery() for order updates.
 */
export function isDeliveryUser(user, profile) {
  if (profile?.role === 'delivery') return true;
  if (isDeliveryEmail(user?.email)) return true;
  return false;
}

export async function fetchUserProfile(userId) {
  if (!isSupabaseConfigured || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, phone_number')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[adminAuth] profile fetch failed:', error.message);
    return null;
  }
  return data;
}
