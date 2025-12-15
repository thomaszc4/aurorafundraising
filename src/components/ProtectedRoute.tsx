import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStudent?: boolean;
  requireSuperAdmin?: boolean;
  requireIndividual?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin, requireStudent, requireSuperAdmin, requireIndividual }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isStudent, isSuperAdmin, isIndividual, isOrgAdmin } = useAuth();

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

  console.log('ProtectedRoute Check:', { path: window.location.pathname, user: !!user, roles: { isAdmin, isStudent, isSuperAdmin, isIndividual } });

  if (requireSuperAdmin && !isSuperAdmin) {
    console.log('Redirecting: Required SuperAdmin');
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin && !isSuperAdmin && !isOrgAdmin) {
    console.log('Redirecting: Required Admin');
    return <Navigate to="/" replace />;
  }

  if (requireStudent && !isStudent) {
    console.log('Redirecting: Required Student');
    return <Navigate to="/" replace />;
  }

  if (requireIndividual && !isIndividual) {
    console.log('Redirecting: Required Individual');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
