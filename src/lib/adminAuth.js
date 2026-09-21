import { supabase, isSupabaseConfigured } from './supabaseClient';

/** Email-domain routing for dashboards. */
export function isAdminEmail(email) {
  return Boolean(email && String(email).toLowerCase().endsWith('@admin.com'));
}

export function isDeliveryEmail(email) {
  const e = String(email || '').toLowerCase();
  // Prefer @delivery.com; keep legacy @deliver.com working
  return e.endsWith('@delivery.com') || e.endsWith('@deliver.com');
}

/**
 * Unified post-auth view from email suffix:
 * - @admin.com → admin-dashboard
 * - @delivery.com → delivery-dashboard
 * - else → customer-dashboard
 */
export function resolveAuthView(email) {
  if (isAdminEmail(email)) return 'admin-dashboard';
  if (isDeliveryEmail(email)) return 'delivery-dashboard';
  return 'customer-dashboard';
}

export function pathForAuthView(view) {
  if (view === 'admin-dashboard') return '/admin';
  if (view === 'delivery-dashboard') return '/delivery';
  return '/';
}

export function isAdminUser(user, profile) {
  if (profile?.role === 'admin') return true;
  if (isAdminEmail(user?.email)) return true;
  return false;
}

export function isDeliveryUser(user, profile) {
  if (profile?.role === 'delivery') return true;
  if (isDeliveryEmail(user?.email)) return true;
  return false;
}

export async function fetchUserProfile(userId) {
  if (!isSupabaseConfigured || !userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, role, phone_number, building_number, street_number, zone_number, google_map_link, vehicle_type, vehicle_plate, loyalty_stamps, free_bag_vouchers'
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[adminAuth] profile fetch failed:', error.message);
    return null;
  }
  return data;
}
