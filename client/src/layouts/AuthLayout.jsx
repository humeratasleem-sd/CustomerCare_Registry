import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { ROLES } from '../constants';

const AuthLayout = () => {
  const { token, user } = useSelector((state) => state.auth);

  // If already authenticated, redirect to appropriate dashboards
  if (token && user) {
    switch (user.role) {
      case ROLES.ADMIN:
        return <Navigate to="/admin-dashboard" replace />;
      case ROLES.AGENT:
        return <Navigate to="/agent-dashboard" replace />;
      case ROLES.CUSTOMER:
      default:
        return <Navigate to="/customer-dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
