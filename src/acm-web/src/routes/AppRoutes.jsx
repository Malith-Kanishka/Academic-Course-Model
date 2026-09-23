import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth_admin/pages/LoginPage';
import AdminUsersPage from '../features/auth_admin/pages/AdminUsersPage';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
                {/* Cleaned up Dashboard Placeholder */}
                <Route path="/" element={
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-2xl font-bold mb-2">Welcome to the ACM Dashboard</h2>
                        <p className="text-gray-600">Select a module from the sidebar to manage the system.</p>
                    </div>
                } />
                <Route path="/users" element={<AdminUsersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}