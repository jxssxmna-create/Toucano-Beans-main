import { Navigate, useLocation } from 'react-router-dom';
import { isEmployeeProfileComplete, isEmployeeUser } from '../lib/adminAuth';

export default function EmployeeRoute({ session, profile, loading, requireProfile = true, children }) {
  const location = useLocation();

  if (loading || (session && !profile)) {
    return (
      <div className="bg-[#FAF0DF] min-h-screen flex items-center justify-center text-black font-bold">
        Loading employee portal...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location.pathname, openAccount: true }} />;
  }

  if (!isEmployeeUser(session.user, profile)) {
    return <Navigate to="/" replace />;
  }

  if (requireProfile && !isEmployeeProfileComplete(profile)) {
    return <Navigate to="/employee/profile" replace />;
  }

  return children;
}
