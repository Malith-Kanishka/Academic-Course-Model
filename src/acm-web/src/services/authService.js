import apiClient from './apiClient';

export const authService = {
    login: async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const token = response.data?.accessToken ?? response.data?.token ?? null;

        if (token) {
            localStorage.setItem('token', token);
        }

        if (response.data?.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
};