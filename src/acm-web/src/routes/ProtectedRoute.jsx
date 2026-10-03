import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { hasRole } from '../utils/roles';

export default function ProtectedRoute({ allowedRoles = [], redirectTo = '/curriculum' }) {
  const { isAuthenticated, user } = useAuthStore();

  const token = localStorage.getItem('token');
  const storedUserRaw = localStorage.getItem('user');
  const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

  const activeUser = user || storedUser;
  const isAuth = Boolean(isAuthenticated || token);

  if (!isAuth || !activeUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    if (!hasRole(activeUser, allowedRoles)) {
      return <Navigate to={redirectTo} replace state={{ accessDenied: true }} />;
    }
  }

  return <Outlet />;
}