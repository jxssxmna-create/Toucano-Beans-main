import { useEffect, useState } from 'react';
import { fetchUserProfile, isAdminUser } from '../lib/adminAuth';
import { isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Optional role switcher. Prefer /admin routing via App + AdminRoute.
 */
export default function RoleRouter({ session, AdminView, DeliveryView, CustomerView }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRole() {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured) {
        if (!cancelled) {
          setRole(isAdminUser(session.user, null) ? 'admin' : 'buyer');
          setLoading(false);
        }
        return;
      }

      try {
        const profile = await fetchUserProfile(session.user.id);
        if (cancelled) return;
        if (isAdminUser(session.user, profile)) {
          setRole('admin');
        } else {
          setRole(profile?.role || 'buyer');
        }
      } catch (err) {
        console.error('Unexpected error fetching role:', err);
        if (!cancelled) setRole('buyer');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRole();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (loading) return <div>Loading dashboard...</div>;

  if (role === 'admin') return <AdminView />;
  if (role === 'delivery') return <DeliveryView />;
  return <CustomerView />;
}
