import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const normalizeRole = (value) => {
  if (value === null || value === undefined || value === '') return '';

  const roleKey = String(value).trim().toLowerCase();

  if (roleKey === 'departmenthead' || roleKey === '0') return 'departmenthead';
  if (roleKey === 'lecturer' || roleKey === '1') return 'lecturer';
  if (roleKey === 'teacher' || roleKey === '2') return 'teacher';
  if (roleKey === 'student' || roleKey === '3') return 'student';

  return roleKey;
};

export default function ProtectedRoute({ allowedRoles = [] }) {
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
    const userRole = normalizeRole(activeUser.role ?? activeUser.Role);
    const hasPermission = allowedRoles.some((allowedRole) => normalizeRole(allowedRole) === userRole);

    if (!hasPermission) {
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}