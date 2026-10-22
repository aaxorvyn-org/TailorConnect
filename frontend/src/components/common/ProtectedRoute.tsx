import React from 'react';
import { Navigate, useLocation, Link, Outlet } from 'react-router-dom';
import { ShieldAlert, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';
import { Button } from './Button';
import { Card } from './Card';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-9 h-9 text-emerald-400 animate-spin" />
          <p className="text-sm font-medium text-slate-400 animate-pulse">
            Verifying security credentials...
          </p>
        </div>
      </div>
    );
  }

  // Not signed in: redirect to login page with preserved destination
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const userDashboardPath =
      user.role === 'CUSTOMER'
        ? '/dashboard/customer'
        : user.role === 'TAILOR'
        ? '/dashboard/tailor'
        : '/dashboard/admin';

    const roleNameMap: Record<UserRole, string> = {
      CUSTOMER: 'Customer',
      TAILOR: 'Tailor Atelier',
      ADMIN: 'Platform Admin',
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <Card className="max-w-md w-full p-8 text-center space-y-6 border-red-500/20 bg-slate-900/95 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Access Restricted
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              This workspace requires{' '}
              <span className="font-semibold text-amber-300">
                {allowedRoles.map((r) => roleNameMap[r] || r).join(' or ')}
              </span>{' '}
              permissions.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs space-y-1">
            <div className="text-slate-400">
              Signed in as:{' '}
              <span className="font-medium text-slate-200">{user.full_name}</span>
            </div>
            <div className="text-slate-400">
              Active role:{' '}
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                {roleNameMap[user.role] || user.role}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link to={userDashboardPath} className="block w-full">
              <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to My {roleNameMap[user.role] || user.role} Dashboard
              </Button>
            </Link>

            <Button
              variant="outline"
              size="md"
              className="w-full text-slate-400 hover:text-white"
              onClick={async () => {
                await logout();
              }}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign In with Different Account
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
