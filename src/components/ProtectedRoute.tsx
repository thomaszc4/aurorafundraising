import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStudent?: boolean;
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin, requireStudent, requireSuperAdmin }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isStudent, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireStudent && !isStudent) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
