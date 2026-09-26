import { create } from 'zustand';

export type Language = 'ja' | 'en' | 'fr' | 'zh';

export interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const LANGUAGE_STORAGE_KEY = 'language';

/**
 * 初期言語を判定する
 * 1. localStorage に設定値（'ja' | 'en' | 'fr' | 'zh'）が存在する場合はそれを採用
 * 2. 未設定時、ブラウザ言語（navigator.language）が日本語環境なら 'ja'、フランス語環境なら 'fr'、中国語環境なら 'zh'
 * 3. それ以外（英語圏およびその他言語圏の海外ユーザー）、または例外発生時は 'en' をデフォルトとする
 */
export function getInitialLanguage(): Language {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'ja' || stored === 'en' || stored === 'fr' || stored === 'zh') {
        return stored;
      }
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ja')) {
        return 'ja';
      }
      if (browserLang.startsWith('fr')) {
        return 'fr';
      }
      if (browserLang.startsWith('zh')) {
        return 'zh';
      }
      return 'en';
    }
  } catch {
    // localStorage / navigator アクセス例外時は海外ユーザーも想定して 'en' にフォールバック
    return 'en';
  }
  return 'en';
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: getInitialLanguage(),

  setLanguage: (language: Language) => {
    set({ language });
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = language;
      }
    } catch {
      // ignore storage error
    }
  },

  toggleLanguage: () => {
    const current = get().language;
    const nextLang: Language = current === 'ja' ? 'en' : current === 'en' ? 'fr' : current === 'fr' ? 'zh' : 'ja';
    get().setLanguage(nextLang);
  },
}));
