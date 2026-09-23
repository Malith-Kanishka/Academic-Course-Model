import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import { useAuthStore } from '../../../store/authStore';

export default function useAuth({ loadUsers = false } = {}) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(loadUsers);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

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
  };
}