import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function RoleRouter({ session, AdminView, DeliveryView, CustomerView }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured) {
        console.warn('[Toucano Beans] Role lookup skipped — Supabase is not configured.');
        setRole('buyer');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error.message);
        }

        setRole(data?.role || 'buyer');
      } catch (err) {
        console.error('Unexpected error fetching role:', err);
        setRole('buyer');
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [session]);

  if (loading) return <div>Loading dashboard...</div>;

  if (role === 'admin') return <AdminView />;
  if (role === 'delivery') return <DeliveryView />;
  return <CustomerView />;
}
