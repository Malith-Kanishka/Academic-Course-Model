import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import { useAuthStore } from '../../../store/authStore';

const fallbackUsers = [
  { id: 'ACM-001', email: 'a.fernando@acm.edu', fullName: 'Dr. Anika Fernando', role: 'DepartmentHead', department: 'Computing', isActive: true },
  { id: 'ACM-014', email: 'r.silva@acm.edu', fullName: 'Prof. Ravin Silva', role: 'Lecturer', department: 'Software Engineering', isActive: true },
  { id: 'ACM-027', email: 'n.perera@acm.edu', fullName: 'Dr. Nethmi Perera', role: 'Lecturer', department: 'Data Science', isActive: true },
  { id: 'ACM-103', email: 'amaya.perera@student.acm.edu', fullName: 'Amaya Perera', role: 'Student', department: 'Computing', isActive: true },
  { id: 'ACM-117', email: 'ravin.silva@student.acm.edu', fullName: 'Ravin Silva', role: 'Student', department: 'Computing', isActive: false },
];

export default function useAuth({ loadUsers = false } = {}) {
  const [users, setUsers] = useState(() => (loadUsers ? fallbackUsers : []));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const updateUserStatus = useCallback((id, isActive) => {
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, isActive } : user)));
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const token = response.data?.accessToken ?? response.data?.token ?? null;
      const user = response.data?.user ?? response.data ?? null;

      console.log('[Auth Debug] raw login response', response?.data);
      console.log('[Auth Debug] user payload', user);
      console.log('[Auth Debug] token payload', token);

      if (!token) {
        throw new Error('Token not returned by API');
      }

      setAuth(user, token);

      const role = user?.role ?? user?.Role ?? null;
      const normalizedRole = String(role ?? '').toLowerCase();
      const isDepartmentHead =
        role === 0 ||
        normalizedRole === '0' ||
        normalizedRole === 'departmenthead';

      const targetPath = isDepartmentHead ? '/admin/users' : '/curriculum';

      console.log('[Auth Debug] resolved role', role);
      console.log('[Auth Debug] target path', targetPath);

      navigate(targetPath, { replace: true });
      return response.data;
    } catch (requestError) {
      console.error('[Auth Debug] login failed', requestError);
      const msg =
        requestError?.response?.data?.message ||
        requestError?.message ||
        'Login failed. Please check credentials.';
      setError(msg);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, setAuth]);

  return {
    users,
    isLoading,
    error,
    login,
    activateUser: (id) => updateUserStatus(id, true),
    deactivateUser: (id) => updateUserStatus(id, false),
  };
}