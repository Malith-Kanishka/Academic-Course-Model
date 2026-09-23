import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../features/auth_admin/pages/LoginPage';
import AdminUsersPage from '../features/auth_admin/pages/AdminUsersPage';
import CurriculumPage from '../features/curriculum/pages/CurriculumPage';
import ApprovalsInboxPage from '../features/approvals_audit/pages/ApprovalsInboxPage';
import SessionArchivePage from '../features/session_monitor/pages/SessionArchivePage';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<Layout />}>
        <Route element={<ProtectedRoute allowedRoles={['DepartmentHead', 0]} />}>
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['DepartmentHead', 'Lecturer', 'Teacher', 'Student', 0, 1, 2, 3]} />}>
          <Route path="/curriculum" element={<CurriculumPage />} />
          <Route path="/approvals" element={<ApprovalsInboxPage />} />
          <Route path="/sessions" element={<SessionArchivePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}