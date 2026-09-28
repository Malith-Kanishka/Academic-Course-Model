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

export const useAuthStore = create((set) => ({
  user: storedUser || null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,

  setAuth: (user, token) => {
    const nextUser = user || null;
    const nextToken = token || null;

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

    set({
      user: nextUser,
      token: nextToken,
      isAuthenticated: !!nextToken,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));