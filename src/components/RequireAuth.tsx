import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen bg-background grain" />;
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  return children;
};

export default RequireAuth;
