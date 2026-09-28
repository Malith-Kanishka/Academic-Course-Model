import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { scheduleTokenRefresh } from '../../../services/apiClient';
import { useAuthStore } from '../../../store/authStore';

const normalizeUser = (user) => ({
  ...user,
  id: user.id ?? user.Id,
  shortId: user.shortId ?? user.ShortId ?? '',
  email: user.email ?? user.Email ?? '',
  firstName: user.firstName ?? user.FirstName ?? '',
  lastName: user.lastName ?? user.LastName ?? '',
  fullName: user.fullName ?? user.FullName ?? `${user.firstName ?? user.FirstName ?? ''} ${user.lastName ?? user.LastName ?? ''}`.trim(),
  role: user.role ?? user.Role,
  department: user.department ?? user.Department ?? 'Computing',
  isActive: user.isActive ?? user.IsActive ?? false,
});

export default function useAuth({ loadUsers = false, search = '', roleFilter = '' } = {}) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(loadUsers);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const refreshUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      const trimmedSearch = search.trim();
      if (trimmedSearch) params.email = trimmedSearch;
      if (roleFilter && roleFilter !== 'All Roles') params.role = roleFilter;

      const response = await apiClient.get('/auth', { params });
      const payload = response.data ?? [];
      const records = Array.isArray(payload) ? payload : payload.items ?? [];
      setUsers(records.map(normalizeUser));
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Unable to load users from the API.');
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter]);

  const updateUserStatus = useCallback(async (id, isActive) => {
    setActionError('');
    try {
      await apiClient.post(`/auth/${id}/${isActive ? 'activate' : 'deactivate'}`);
      setUsers((current) => current.map((user) => (user.id === id ? { ...user, isActive } : user)));
    } catch (requestError) {
      setActionError(requestError.response?.data?.message ?? 'Unable to update user status.');
      throw requestError;
    }
  }, []);

  const createUser = useCallback(async (payload) => {
    setActionError('');
    try {
      const response = await apiClient.post('/auth/register', payload);
      const created = normalizeUser(response.data);
      setUsers((current) => [created, ...current]);
      return created;
    } catch (requestError) {
      const message = requestError.response?.data?.message
        ?? requestError.response?.data?.errors
        ?? requestError.response?.data
        ?? 'Unable to create user.';
      setActionError(typeof message === 'string' ? message : 'Unable to create user.');
      throw requestError;
    }
  }, []);

  const updateUser = useCallback(async (id, payload) => {
    setActionError('');
    try {
      const response = await apiClient.put(`/auth/${id}`, payload);
      // The server response is the source of truth when it comes back complete, but
      // an empty/partial body (e.g. an older API build returning 204 No Content) must
      // never blank out a row - fall back to what we just submitted, then to what
      // was already on screen, so the table never regresses to empty fields.
      const server = response.data && typeof response.data === 'object' ? normalizeUser(response.data) : null;

      let mergedUser = null;
      setUsers((current) => current.map((user) => {
        if (user.id !== id) return user;
        const firstName = server?.firstName || payload.firstName || user.firstName;
        const lastName = server?.lastName || payload.lastName || user.lastName;
        mergedUser = {
          ...user,
          firstName,
          lastName,
          fullName: server?.fullName || `${firstName} ${lastName}`.trim(),
          role: server?.role || payload.role || user.role,
          email: server?.email || user.email,
          isActive: server ? server.isActive : user.isActive,
        };
        return mergedUser;
      }));
      return mergedUser;
    } catch (requestError) {
      const message = requestError.response?.data?.message ?? 'Unable to update user.';
      setActionError(message);
      throw requestError;
    }
  }, []);

  useEffect(() => {
    if (!loadUsers) return undefined;
    let active = true;

    const timeoutId = setTimeout(async () => {
      if (!active) return;
      await refreshUsers();
    }, search ? 300 : 0);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadUsers, search, roleFilter]);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const token = response.data?.accessToken ?? response.data?.token ?? null;
      const refreshToken = response.data?.refreshToken ?? null;
      const user = response.data?.user ?? response.data ?? null;

      if (!token) {
        throw new Error('Token not returned by API');
      }

      setAuth(user, token, refreshToken);
      scheduleTokenRefresh(token);

      const role = user?.role ?? user?.Role ?? null;
      const normalizedRole = String(role ?? '').toLowerCase();
      const isDepartmentHead =
        role === 0 ||
        normalizedRole === '0' ||
        normalizedRole === 'departmenthead';

      const targetPath = isDepartmentHead ? '/admin/users' : '/curriculum';

      navigate(targetPath, { replace: true });
      return response.data;
    } catch (requestError) {
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
    actionError,
    login,
    createUser,
    updateUser,
    refreshUsers,
    activateUser: (id) => updateUserStatus(id, true),
    deactivateUser: (id) => updateUserStatus(id, false),
  };
}
