import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Session refresh window: access tokens are issued with a 35 minute lifetime
// (see ACM.Backend appsettings Jwt:ExpirationMinutes). We proactively refresh
// a little before expiry so an active admin is never dropped mid-session.
const REFRESH_BUFFER_MS = 60 * 1000;
const MIN_REFRESH_DELAY_MS = 5 * 1000;

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let refreshTimer = null;
let refreshInFlight = null;

const decodeJwtExpiryMs = (token) => {
    try {
        const payload = token.split('.')[1];
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
        const json = JSON.parse(atob(padded));
        return typeof json.exp === 'number' ? json.exp * 1000 : null;
    } catch (error) {
        console.error('[Auth Debug] Failed to decode token expiry:', error);
        return null;
    }
};

export function clearScheduledRefresh() {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
}

export function scheduleTokenRefresh(accessToken) {
    clearScheduledRefresh();
    if (!accessToken) return;

    const expiryMs = decodeJwtExpiryMs(accessToken);
    if (!expiryMs) return;

    const delay = Math.max(expiryMs - Date.now() - REFRESH_BUFFER_MS, MIN_REFRESH_DELAY_MS);
    refreshTimer = setTimeout(() => {
        performTokenRefresh().catch(() => {
            // performTokenRefresh already handles logout on failure
        });
    }, delay);
}

export async function performTokenRefresh() {
    if (refreshInFlight) return refreshInFlight;

    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
        logoutAndRedirect();
        return null;
    }

    refreshInFlight = axios
        .post(`${BASE_URL}/auth/refresh`, { refreshToken })
        .then(({ data }) => {
            if (!data?.success || !data?.accessToken) {
                throw new Error(data?.message || 'Token refresh failed');
            }
            useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
            scheduleTokenRefresh(data.accessToken);
            return data.accessToken;
        })
        .catch((error) => {
            console.error('[Auth Debug] Silent session refresh failed:', error);
            logoutAndRedirect();
            return null;
        })
        .finally(() => {
            refreshInFlight = null;
        });

    return refreshInFlight;
}

export function logoutAndRedirect() {
    clearScheduledRefresh();
    const { refreshToken } = useAuthStore.getState();
    useAuthStore.getState().logout();

    if (refreshToken) {
        // Best-effort revoke; do not block navigation on this.
        axios.post(`${BASE_URL}/auth/logout`, { refreshToken }).catch(() => {});
    }

    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}

export function logoutAllAndRedirect() {
    clearScheduledRefresh();
    useAuthStore.getState().logout();

    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}

apiClient.interceptors.request.use((config) => {
    const { token } = useAuthStore.getState();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isLoginEndpoint = originalRequest?.url?.includes('/auth/login');

        // A 401 on the login call itself just means bad credentials - let the
        // caller (LoginPage) show that inline, nothing to refresh or revoke.
        if (error.response?.status === 401 && !isLoginEndpoint) {
            if (originalRequest?._retried) {
                logoutAndRedirect();
                return Promise.reject(error);
            }

            originalRequest._retried = true;
            const newAccessToken = await performTokenRefresh();

            if (newAccessToken) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            }

            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

// Keep the silent-refresh timer alive across page reloads.
const initialToken = useAuthStore.getState().token;
if (initialToken) {
    scheduleTokenRefresh(initialToken);
}

export default apiClient;
