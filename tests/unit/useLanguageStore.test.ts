import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useLanguageStore,
  getInitialLanguage,
  getLanguageFromPath,
  updateUrlPathForLanguage,
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

    it('localStorageに fr が保存されている場合、navigatorにかかわらず fr を返すこと', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja');

      expect(getInitialLanguage()).toBe('fr');
    });

    it('localStorageに zh が保存されている場合、navigatorにかかわらず zh を返すこと', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'zh');
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja');

      expect(getInitialLanguage()).toBe('zh');
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

    it('localStorageが未設定かつ navigator.language が fr-FR の場合、fr を返すこと', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR');
      expect(getInitialLanguage()).toBe('fr');
    });

    it('localStorageが未設定かつ navigator.language が zh-HK の場合、zh を返すこと', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('zh-HK');
      expect(getInitialLanguage()).toBe('zh');
    });

    it('localStorageが未設定かつ navigator.language が zh-TW の場合、zh を返すこと', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('zh-TW');
      expect(getInitialLanguage()).toBe('zh');
    });

    it('localStorageが未設定かつ navigator.language がその他の言語（例: de-DE）の場合、英語にフォールバックすること', () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
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

      store.setLanguage('fr');
      expect(useLanguageStore.getState().language).toBe('fr');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
      expect(document.documentElement.lang).toBe('fr');

      store.setLanguage('zh');
      expect(useLanguageStore.getState().language).toBe('zh');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('zh');
      expect(document.documentElement.lang).toBe('zh');

      store.setLanguage('ja');
      expect(useLanguageStore.getState().language).toBe('ja');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ja');
      expect(document.documentElement.lang).toBe('ja');
    });

    it('toggleLanguage で ja -> en -> fr -> zh -> ja がトグル切り替えされること', () => {
      const store = useLanguageStore.getState();
      store.setLanguage('ja');

      store.toggleLanguage();
      expect(useLanguageStore.getState().language).toBe('en');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
      expect(document.documentElement.lang).toBe('en');

      store.toggleLanguage();
      expect(useLanguageStore.getState().language).toBe('fr');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
      expect(document.documentElement.lang).toBe('fr');

      store.toggleLanguage();
      expect(useLanguageStore.getState().language).toBe('zh');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('zh');
      expect(document.documentElement.lang).toBe('zh');

      store.toggleLanguage();
      expect(useLanguageStore.getState().language).toBe('ja');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ja');
      expect(document.documentElement.lang).toBe('ja');
    });

    it('setLanguage で history.replaceState が呼ばれ URL パスが同期されること', () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      const store = useLanguageStore.getState();

      store.setLanguage('en');
      expect(replaceStateSpy).toHaveBeenCalled();
      const lastCall = replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1];
      expect(lastCall[2]).toContain('/en/');
    });

    it('syncUrl: false を指定した場合は history.replaceState が呼ばれないこと', () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      const store = useLanguageStore.getState();

      store.setLanguage('fr', { syncUrl: false });
      expect(replaceStateSpy).not.toHaveBeenCalled();
      expect(useLanguageStore.getState().language).toBe('fr');
    });
  });

  describe('getLanguageFromPath & updateUrlPathForLanguage', () => {
    it('パス名から各言語を正確に判定できること', () => {
      expect(getLanguageFromPath('/ja/')).toBe('ja');
      expect(getLanguageFromPath('/ja')).toBe('ja');
      expect(getLanguageFromPath('/en/')).toBe('en');
      expect(getLanguageFromPath('/fr/')).toBe('fr');
      expect(getLanguageFromPath('/zh/')).toBe('zh');
      expect(getLanguageFromPath('/')).toBeNull();
      expect(getLanguageFromPath('/unknown/')).toBeNull();
    });

    it('サブディレクトリ base (/horse-racing-calender/) がある場合も正確に判定できること', () => {
      const base = '/horse-racing-calender/';
      expect(getLanguageFromPath('/horse-racing-calender/ja/', base)).toBe('ja');
      expect(getLanguageFromPath('/horse-racing-calender/en/', base)).toBe('en');
      expect(getLanguageFromPath('/horse-racing-calender/fr/', base)).toBe('fr');
      expect(getLanguageFromPath('/horse-racing-calender/zh/', base)).toBe('zh');
      expect(getLanguageFromPath('/horse-racing-calender/', base)).toBeNull();
    });

    it('updateUrlPathForLanguage で指定した言語のパスに URL が更新されること', () => {
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        pathname: '/ja/',
        search: '?filter=g1',
        hash: '#top',
      });

      updateUrlPathForLanguage('fr', '/');
      expect(replaceStateSpy).toHaveBeenCalledWith(window.history.state, '', '/fr/?filter=g1#top');
    });

    it('URL パス（/ja/, /en/, /fr/, /zh/）が存在する場合、localStorage や navigator に優先すること (第1優先ルール)', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
      // window.location.pathname をモック
      vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        pathname: '/fr/',
      });

      expect(getInitialLanguage()).toBe('fr');
    });

    it('popstate イベント時にパスの言語とストアが同期されること', () => {
      useLanguageStore.setState({ language: 'ja' });

      vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        pathname: '/en/',
      });

      window.dispatchEvent(new PopStateEvent('popstate'));
      expect(useLanguageStore.getState().language).toBe('en');
    });
  });
});

