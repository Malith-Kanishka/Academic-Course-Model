import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../../services/apiClient';

export default function useAuth({ loadUsers = false } = {}) {
	const [users, setUsers] = useState([]);
	const [isLoading, setIsLoading] = useState(loadUsers);
	const [error, setError] = useState('');

	const fetchUsers = useCallback(async () => {
		setIsLoading(true);
		setError('');

		try {
			const response = await apiClient.get('/auth');
			setUsers(response.data);
			return response.data;
		} catch (requestError) {
			setError(requestError.response?.data?.message || 'Unable to load users.');
			throw requestError;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const setUserStatus = useCallback(async (id, isActive) => {
		await apiClient.post(`/auth/${id}/${isActive ? 'activate' : 'deactivate'}`);
		setUsers((currentUsers) => currentUsers.map((user) => (
			user.id === id ? { ...user, isActive } : user
		)));
	}, []);

	const updateProfile = useCallback(async (id, profile) => {
		await apiClient.put(`/auth/${id}`, profile);
		setUsers((currentUsers) => currentUsers.map((user) => (
			user.id === id ? { ...user, ...profile } : user
		)));
	}, []);

	useEffect(() => {
		if (!loadUsers) return undefined;

		let isMounted = true;
		apiClient.get('/auth')
			.then((response) => {
				if (isMounted) setUsers(response.data);
			})
			.catch((requestError) => {
				if (isMounted) {
					setError(requestError.response?.data?.message || 'Unable to load users.');
				}
			})
			.finally(() => {
				if (isMounted) setIsLoading(false);
			});

		return () => {
			isMounted = false;
		};
	}, [loadUsers]);

	return {
		users,
		isLoading,
		error,
		fetchUsers,
		deactivateUser: (id) => setUserStatus(id, false),
		activateUser: (id) => setUserStatus(id, true),
		updateProfile,
	};
}
