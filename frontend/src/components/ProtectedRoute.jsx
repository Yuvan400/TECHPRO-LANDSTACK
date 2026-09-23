import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const isStaffTarget = allowedRoles.some(r => ['ADMIN', 'DEPARTMENT_SUPERVISOR', 'FIELD_OFFICER'].includes(r));
    return <Navigate to={isStaffTarget ? '/staff/login' : '/login'} state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to proper portal based on user actual role
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'DEPARTMENT_SUPERVISOR') return <Navigate to="/supervisor" replace />;
    if (user.role === 'FIELD_OFFICER') return <Navigate to="/field" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
