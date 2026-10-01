import { create } from 'zustand';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('[Auth Debug] Failed to parse stored user:', error);
    return null;
  }
};

const storedUser = getStoredUser();
const storedToken = localStorage.getItem('token');
const storedRefreshToken = localStorage.getItem('refreshToken');

export const useAuthStore = create((set, get) => ({
  user: storedUser || null,
  token: storedToken || null,
  refreshToken: storedRefreshToken || null,
  isAuthenticated: !!storedToken,

  setAuth: (user, token, refreshToken) => {
    const nextUser = user || null;
    const nextToken = token || null;
    const nextRefreshToken = refreshToken ?? get().refreshToken ?? null;

    if (nextToken) {
      localStorage.setItem('token', nextToken);
    } else {
      localStorage.removeItem('token');
    }

    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }

    if (nextRefreshToken) {
      localStorage.setItem('refreshToken', nextRefreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }

    set({
      user: nextUser,
      token: nextToken,
      refreshToken: nextRefreshToken,
      isAuthenticated: !!nextToken,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },
}));
