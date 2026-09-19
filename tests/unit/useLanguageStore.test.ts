import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useLanguageStore,
  getInitialLanguage,
  LANGUAGE_STORAGE_KEY,
} from '@/store/useLanguageStore';

describe('useLanguageStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    // ストアを初期化
    useLanguageStore.setState({ language: 'ja' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInitialLanguage', () => {
    it('localStorageに ja が保存されている場合、navigatorにかかわらず ja を返すこと', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ja');
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');

      expect(getInitialLanguage()).toBe('ja');
    });

    it('localStorageに en が保存されている場合、navigatorにかかわらず en を返すこと', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja');

      expect(getInitialLanguage()).toBe('en');
    });

    it('localStorageが未設定かつ navigator.language が ja の場合、ja を返すこと', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja');
      expect(getInitialLanguage()).toBe('ja');
    });

    it('localStorageが未設定かつ navigator.language が ja-JP の場合、ja を返すこと', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');
      expect(getInitialLanguage()).toBe('ja');
    });

    it('localStorageが未設定かつ navigator.language が en-US の場合、en を返すこと', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
      expect(getInitialLanguage()).toBe('en');
    });

    it('localStorageが未設定かつ navigator.language がフランス語など非日本語の場合、英語にフォールバックすること', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
      expect(getInitialLanguage()).toBe('en');
    });

    it('例外発生時（localStorageやnavigatorアクセスエラー等）は en にフォールバックすること', () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('Access denied');
      });
      expect(getInitialLanguage()).toBe('en');
    });
  });

  describe('store actions', () => {
    it('setLanguage で言語が変更され、localStorage と html lang が更新されること', () => {
      const store = useLanguageStore.getState();

      store.setLanguage('en');
      expect(useLanguageStore.getState().language).toBe('en');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
      expect(document.documentElement.lang).toBe('en');

      store.setLanguage('ja');
      expect(useLanguageStore.getState().language).toBe('ja');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ja');
      expect(document.documentElement.lang).toBe('ja');
    });

    it('toggleLanguage で ja と en がトグル切り替えされること', () => {
      const store = useLanguageStore.getState();
      store.setLanguage('ja');

      store.toggleLanguage();
      expect(useLanguageStore.getState().language).toBe('en');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
      expect(document.documentElement.lang).toBe('en');

      store.toggleLanguage();
      expect(useLanguageStore.getState().language).toBe('ja');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ja');
      expect(document.documentElement.lang).toBe('ja');
    });
  });
});
