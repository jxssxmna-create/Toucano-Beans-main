import { useEffect, useState } from 'react';
import { Navigate, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Storefront from './pages/Storefront';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import CheckoutPage from './pages/Checkout';
import KnowledgeBase from './pages/admin/KnowledgeBase';
import AdminRoute from './components/AdminRoute';
import AIChatbot from './components/AIChatbot';
import DeliveryRoute from './components/DeliveryRoute';
import EmployeeRoute from './components/EmployeeRoute';
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeProfile from './pages/employee/Profile';
import { pathForAuthView, prefixForAuthView, resolveAuthView } from './lib/adminAuth';

const PREVIEW_KEY = 'tb_buyer_preview';
const DASHBOARD_PREFIXES = ['/admin', '/delivery', '/employee'];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading, isAdmin, authEvent, signOut, refreshProfile } = useAuth();
  const [lang, setLang] = useState('en');
  const [hasBootstrappedRoute, setHasBootstrappedRoute] = useState(false);
  const [buyerPreview, setBuyerPreview] = useState(
    () => sessionStorage.getItem(PREVIEW_KEY) === '1' || Boolean(location.state?.buyerPreview)
  );

  useEffect(() => {
    if (location.state?.buyerPreview) {
      sessionStorage.setItem(PREVIEW_KEY, '1');
      setBuyerPreview(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (loading) return;

    const onDashboard = DASHBOARD_PREFIXES.some((p) => location.pathname.startsWith(p));
    const email = session?.user?.email;
    if (!email) {
      setHasBootstrappedRoute(false);
      setBuyerPreview(false);
      sessionStorage.removeItem(PREVIEW_KEY);
      if (onDashboard) {
        navigate('/', { replace: true, state: { openAccount: true } });
      }
      return;
    }

    const view = resolveAuthView(email);
    const target = pathForAuthView(view);
    const ownPrefix = prefixForAuthView(view);
    const onAdmin = location.pathname.startsWith('/admin');
    const onCheckout = location.pathname.startsWith('/checkout');
    const previewOn = sessionStorage.getItem(PREVIEW_KEY) === '1' || buyerPreview;

    if (authEvent === 'SIGNED_IN' || !hasBootstrappedRoute) {
      if (previewOn && view === 'admin-dashboard' && !onAdmin) {
        setHasBootstrappedRoute(true);
        return;
      }
      // Allow checkout without bounce on first restore
      if (onCheckout) {
        setHasBootstrappedRoute(true);
        return;
      }
      const onTarget = ownPrefix
        ? location.pathname.startsWith(ownPrefix)
        : location.pathname === '/';
      if (!onTarget) {
        navigate(target, { replace: true });
      }
      setHasBootstrappedRoute(true);
      return;
    }

    if (onDashboard && !(ownPrefix && location.pathname.startsWith(ownPrefix))) {
      navigate(target, { replace: true });
    }
  }, [loading, session, authEvent, hasBootstrappedRoute, buyerPreview, location.pathname, navigate]);

  async function handleSignOut() {
    try {
      sessionStorage.removeItem(PREVIEW_KEY);
      setBuyerPreview(false);
      await signOut();
    } finally {
      navigate('/', { replace: true });
    }
  }

  function exitBuyerPreview() {
    sessionStorage.removeItem(PREVIEW_KEY);
    setBuyerPreview(false);
    navigate('/admin', { replace: true });
  }

  if (loading) {
    return (
      <div className="bg-[#FAF0DF] min-h-screen flex items-center justify-center text-slate-800 font-serif">
        Loading Toucano Beans...
      </div>
    );
  }

  const showChatbot = !DASHBOARD_PREFIXES.some((p) => location.pathname.startsWith(p));

  return (
    <>
    <Routes>
      <Route
        path="/employee/profile"
        element={
          <EmployeeRoute session={session} profile={profile} loading={loading} requireProfile={false}>
            <EmployeeProfile
              session={session}
              profile={profile}
              lang={lang}
              setLang={setLang}
              onSignOut={handleSignOut}
              refreshProfile={refreshProfile}
            />
          </EmployeeRoute>
        }
      />
      <Route
        path="/employee/dashboard"
        element={
          <EmployeeRoute session={session} profile={profile} loading={loading}>
            <EmployeeDashboard
              session={session}
              profile={profile}
              lang={lang}
              setLang={setLang}
              onSignOut={handleSignOut}
            />
          </EmployeeRoute>
        }
      />
      <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
      <Route
        path="/admin/knowledge"
        element={
          <AdminRoute isAdmin={isAdmin} loading={loading} session={session}>
            <KnowledgeBase lang={lang} setLang={setLang} session={session} onSignOut={handleSignOut} />
          </AdminRoute>
        }
      />
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
        path="/checkout"
        element={
          <CheckoutPage
            session={session}
            profile={profile}
            lang={lang}
            setLang={setLang}
            onSignOut={handleSignOut}
          />
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
            buyerPreview={buyerPreview && isAdmin}
            onExitBuyerPreview={exitBuyerPreview}
          />
        }
      />
    </Routes>
    {showChatbot && <AIChatbot lang={lang} userId={session?.user?.id ?? null} />}
    </>
  );
}
