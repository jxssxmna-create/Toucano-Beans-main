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

export function isEmployeeEmail(email) {
  return Boolean(email && String(email).toLowerCase().endsWith('@toucano.com'));
}

/**
 * Unified post-auth view from email suffix:
 * - @admin.com → admin-dashboard
 * - @delivery.com → delivery-dashboard
 * - @toucano.com → employee-dashboard
 * - else → customer-dashboard
 */
export function resolveAuthView(email) {
  if (isAdminEmail(email)) return 'admin-dashboard';
  if (isDeliveryEmail(email)) return 'delivery-dashboard';
  if (isEmployeeEmail(email)) return 'employee-dashboard';
  return 'customer-dashboard';
}

export function pathForAuthView(view) {
  if (view === 'admin-dashboard') return '/admin';
  if (view === 'delivery-dashboard') return '/delivery';
  if (view === 'employee-dashboard') return '/employee/dashboard';
  return '/';
}

/** Route prefix a view "owns" — any path under it counts as being on the right dashboard. */
export function prefixForAuthView(view) {
  if (view === 'admin-dashboard') return '/admin';
  if (view === 'delivery-dashboard') return '/delivery';
  if (view === 'employee-dashboard') return '/employee';
  return null;
}

export function isEmployeeUser(user, profile) {
  if (profile?.role === 'employee') return true;
  if (isEmployeeEmail(user?.email)) return true;
  return false;
}

export function isEmployeeProfileComplete(profile) {
  return Boolean(profile?.full_name?.trim() && profile?.phone_number?.trim());
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
