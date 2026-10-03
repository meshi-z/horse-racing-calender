import { create } from 'zustand';

export type Language = 'ja' | 'en' | 'fr' | 'zh';

export interface SetLanguageOptions {
  syncUrl?: boolean;
}

export interface LanguageState {
  language: Language;
  setLanguage: (lang: Language, options?: SetLanguageOptions) => void;
  toggleLanguage: () => void;
}

export const LANGUAGE_STORAGE_KEY = 'language';

/**
 * pathname から言語コード（'ja' | 'en' | 'fr' | 'zh'）を抽出する
 * 例:
 * - pathname: '/ja/' or '/ja' -> 'ja'
 * - pathname: '/horse-racing-calender/ja/' -> 'ja'
 * - pathname: '/' -> null
 */
export function getLanguageFromPath(pathname: string, basePath?: string): Language | null {
  const base =
    basePath ??
    (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL
      : '/');
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  let relativePath = pathname;
  if (relativePath.startsWith(normalizedBase)) {
    relativePath = '/' + relativePath.slice(normalizedBase.length);
  }

  const match = relativePath.match(/^\/(ja|en|fr|zh)(?:\/|$)/i);
  if (match) {
    return match[1].toLowerCase() as Language;
  }
  return null;
}

/**
 * 現在のURLパスを指定された言語パスへ history.replaceState で更新する
 * 例:
 * - / -> /ja/
 * - /ja/ -> /en/
 * - /horse-racing-calender/ -> /horse-racing-calender/ja/
 * - /horse-racing-calender/ja/ -> /horse-racing-calender/fr/
 */
export function updateUrlPathForLanguage(lang: Language, basePath?: string): void {
  if (typeof window === 'undefined' || !window.history || !window.location) {
    return;
  }

  const base =
    basePath ??
    (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL
      : '/');
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const pathname = window.location.pathname;

  let relativePath = pathname;
  if (relativePath.startsWith(normalizedBase)) {
    relativePath = '/' + relativePath.slice(normalizedBase.length);
  }

  // 既存の言語セグメント（/ja/, /en/, /fr/, /zh/）を除去した残りのパス
  let remainingPath = relativePath.replace(/^\/(?:ja|en|fr|zh)(?:\/|$)/i, '');
  if (remainingPath.startsWith('/')) {
    remainingPath = remainingPath.slice(1);
  }

  const newPath = `${normalizedBase}${lang}/${remainingPath}`;
  const search = window.location.search || '';
  const hash = window.location.hash || '';
  const newUrl = `${newPath}${search}${hash}`;

  const currentUrl = `${pathname}${search}${hash}`;
  if (currentUrl !== newUrl) {
    window.history.replaceState(window.history.state, '', newUrl);
  }
}

/**
 * 初期言語を判定する (Issue #187 優先順位ルール)
 * 1. 第1優先（最優先）: URLパス（'/ja/', '/en/', '/fr/', '/zh/'）
 * 2. 第2優先: 過去の手動選択履歴（localStorage）
 * 3. 第3優先: 端末ブラウザ設定（navigator.language）
 * 4. 第4優先: 英語デフォルト（'en'）
 */
export function getInitialLanguage(): Language {
  try {
    // 1. 第1優先: URLパス（/ja/, /en/, /fr/, /zh/）
    if (typeof window !== 'undefined' && window.location) {
      const pathLang = getLanguageFromPath(window.location.pathname);
      if (pathLang) {
        return pathLang;
      }
    }

    // 2. 第2優先: 過去の手動選択履歴（localStorage）
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === 'ja' || stored === 'en' || stored === 'fr' || stored === 'zh') {
        return stored;
      }
    }

    // 3. 第3優先: 端末のブラウザ設定（navigator.language）
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
    // 例外発生時は英語にフォールバック
    return 'en';
  }
  return 'en';
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: getInitialLanguage(),

  setLanguage: (language: Language, options: SetLanguageOptions = {}) => {
    const { syncUrl = true } = options;
    set({ language });
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = language;
      }
      if (syncUrl) {
        updateUrlPathForLanguage(language);
      }
    } catch {
      // ignore storage/history error
    }
  },

  toggleLanguage: () => {
    const current = get().language;
    const nextLang: Language =
      current === 'ja' ? 'en' : current === 'en' ? 'fr' : current === 'fr' ? 'zh' : 'ja';
    get().setLanguage(nextLang);
  },
}));

// popstate イベントによるブラウザ「戻る」「進む」時の言語同期
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    const pathLang = getLanguageFromPath(window.location.pathname);
    if (pathLang && pathLang !== useLanguageStore.getState().language) {
      useLanguageStore.getState().setLanguage(pathLang, { syncUrl: false });
    }
  });
}
