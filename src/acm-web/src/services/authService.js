import apiClient from './apiClient';

export const authService = {
    login: async (email, password) => {
        const response = await apiClient.post('/Auth/login', { email, password });
        if (response.data && response.data.token) {
            localStorage.setItem('accessToken', response.data.token);
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
    }
};