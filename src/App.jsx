import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Storefront from './pages/Storefront';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, isAdmin, authEvent, signOut } = useAuth();
  const [lang, setLang] = useState('en');

  // After login, send admins to /admin; keep buyers on storefront
  useEffect(() => {
    if (loading) return;
    if (authEvent !== 'SIGNED_IN') return;
    if (isAdmin) {
      navigate('/admin', { replace: true });
    } else if (location.pathname.startsWith('/admin')) {
      navigate('/', { replace: true });
    }
  }, [authEvent, isAdmin, loading, navigate, location.pathname]);

  // Existing admin session visiting root stays on storefront unless they open Admin
  // Non-admin already on /admin is handled by AdminRoute

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      navigate('/', { replace: true });
    }
  }

  if (loading) {
    return (
      <div className="bg-[#fdf0de] min-h-screen flex items-center justify-center font-sans text-slate-800">
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
        path="/*"
        element={
          <Storefront
            session={session}
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
