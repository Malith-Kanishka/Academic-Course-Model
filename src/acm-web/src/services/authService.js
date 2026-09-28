import apiClient, { logoutAndRedirect, scheduleTokenRefresh } from './apiClient';
import { useAuthStore } from '../store/authStore';

export const authService = {
    login: async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const { accessToken, refreshToken, user } = response.data ?? {};

        if (accessToken) {
            useAuthStore.getState().setAuth(user, accessToken, refreshToken);
            scheduleTokenRefresh(accessToken);
        }

        return response.data;
    },
    logout: () => {
        logoutAndRedirect();
    }
};
