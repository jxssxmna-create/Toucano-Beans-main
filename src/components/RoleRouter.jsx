import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

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
        console.warn('[Toucano Beans] Role lookup skipped — Supabase is not configured.');
        if (!cancelled) {
          setRole('buyer');
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error.message);
        }

        if (!cancelled) setRole(data?.role || 'buyer');
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
