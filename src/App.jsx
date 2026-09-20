import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Storefront from './pages/Storefront';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import AdminRoute from './components/AdminRoute';
import DeliveryRoute from './components/DeliveryRoute';
import { pathForAuthView, resolveAuthView } from './lib/adminAuth';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading, isAdmin, authEvent, signOut } = useAuth();
  const [lang, setLang] = useState('en');
  const [hasBootstrappedRoute, setHasBootstrappedRoute] = useState(false);

  /**
   * Route by email domain after getSession (load) and after sign-in:
   * @admin.com → admin-dashboard (/admin)
   * @delivery.com → delivery-dashboard (/delivery)
   * else → customer-dashboard (/)
   */
  useEffect(() => {
    if (loading) return;

    const email = session?.user?.email;
    if (!email) {
      setHasBootstrappedRoute(false);
      if (
        location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/delivery')
      ) {
        navigate('/', { replace: true, state: { openAccount: true } });
      }
      return;
    }

    const view = resolveAuthView(email);
    const target = pathForAuthView(view);
    const onAdmin = location.pathname.startsWith('/admin');
    const onDelivery = location.pathname.startsWith('/delivery');

    // Fresh login or first session restore → assigned dashboard
    if (authEvent === 'SIGNED_IN' || !hasBootstrappedRoute) {
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
      setHasBootstrappedRoute(true);
      return;
    }

    // Afterwards: only block wrong protected dashboards
    if (view === 'customer-dashboard' && (onAdmin || onDelivery)) {
      navigate('/', { replace: true });
    } else if (view === 'admin-dashboard' && onDelivery) {
      navigate('/admin', { replace: true });
    } else if (view === 'delivery-dashboard' && onAdmin) {
      navigate('/delivery', { replace: true });
    }
  }, [loading, session, authEvent, hasBootstrappedRoute, location.pathname, navigate]);

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      navigate('/', { replace: true });
    }
  }

  if (loading) {
    return (
      <div
        className="bg-[#fdf0de] min-h-screen flex items-center justify-center text-slate-800"
        style={{
          fontFamily: 'Didot, "Didot LT STD", "Hoefler Text", Garamond, "Times New Roman", serif',
        }}
      >
        Loading Toucano Beans...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <AdminRoute isAdmin={isAdmin} loading={loading} session={session}>
            <AdminDashboard
              lang={lang}
              setLang={setLang}
              session={session}
              onSignOut={handleSignOut}
            />
          </AdminRoute>
        }
      />
      <Route
        path="/delivery/*"
        element={
          <DeliveryRoute session={session} profile={profile} loading={loading}>
            <DeliveryDashboard
              lang={lang}
              setLang={setLang}
              session={session}
              onSignOut={handleSignOut}
            />
          </DeliveryRoute>
        }
      />
      <Route
        path="/*"
        element={
          <Storefront
            session={session}
            profile={profile}
            isAdmin={isAdmin}
            lang={lang}
            setLang={setLang}
            onSignOut={handleSignOut}
            openAccount={Boolean(location.state?.openAccount)}
          />
        }
      />
    </Routes>
  );
}
