import { Navigate, useLocation } from 'react-router-dom';

export default function AdminRoute({ isAdmin, loading, session, children }) {
  const location = useLocation();

  if (loading) {
    return (
      <div className="bg-[#fdf0de] min-h-screen flex items-center justify-center text-slate-800">
        Loading admin...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname, openAccount: true }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
