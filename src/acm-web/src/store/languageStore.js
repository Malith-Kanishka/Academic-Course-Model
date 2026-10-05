import { create } from 'zustand';

const getStoredLanguage = () => {
  try {
    return localStorage.getItem('acm-language') === 'si' ? 'si' : 'en';
  } catch {
    return 'en';
  }
};

export const useLanguageStore = create((set) => ({
  language: getStoredLanguage(),
  setLanguage: (language) => {
    const nextLanguage = language === 'si' ? 'si' : 'en';
    try {
      localStorage.setItem('acm-language', nextLanguage);
    } catch {
      // Keep the in-memory language setting when storage is unavailable.
    }
    set({ language: nextLanguage });
  },
}));