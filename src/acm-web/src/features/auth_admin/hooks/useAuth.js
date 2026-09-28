import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import { useAuthStore } from '../../../store/authStore';

export default function useAuth({ loadUsers = false } = {}) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(loadUsers);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const updateUserStatus = useCallback(async (id, isActive) => {
    setError('');
    try {
      await apiClient.post(`/auth/${id}/${isActive ? 'activate' : 'deactivate'}`);
      setUsers((current) => current.map((user) => (user.id === id ? { ...user, isActive } : user)));
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Unable to update user status.');
    }
  }, []);

  useEffect(() => {
    if (!loadUsers) return undefined;
    let active = true;
    const loadUsersFromApi = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/auth');
        const payload = response.data ?? [];
        const records = Array.isArray(payload) ? payload : payload.items ?? [];
        if (active) {
          setUsers(records.map((user) => ({
            ...user,
            id: user.id ?? user.Id,
            email: user.email ?? user.Email ?? '',
            fullName: user.fullName ?? user.FullName ?? `${user.firstName ?? user.FirstName ?? ''} ${user.lastName ?? user.LastName ?? ''}`.trim(),
            role: user.role ?? user.Role,
            department: user.department ?? user.Department ?? 'Computing',
            isActive: user.isActive ?? user.IsActive ?? false,
          })));
        }
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message ?? 'Unable to load users from the API.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadUsersFromApi();
    return () => { active = false; };
  }, [loadUsers]);

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