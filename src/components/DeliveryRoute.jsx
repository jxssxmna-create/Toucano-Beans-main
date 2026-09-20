import { Navigate, useLocation } from 'react-router-dom';
import { isDeliveryUser } from '../lib/adminAuth';

export default function DeliveryRoute({ session, profile, loading, children }) {
  const location = useLocation();
  const allowed = isDeliveryUser(session?.user, profile);

  if (loading) {
    return (
      <div className="bg-[#fdf0de] min-h-screen flex items-center justify-center text-black font-bold">
        Loading delivery portal...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname, openAccount: true }} />;
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}
