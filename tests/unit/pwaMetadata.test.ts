import { describe, it, expect, beforeEach } from 'vitest';
import { updatePwaMetadata } from '@/libs/pwaMetadata';

describe('PWA Metadata i18n synchronization', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <title>Default Title</title>
      <meta name="apple-mobile-web-app-title" content="Default" />
      <link rel="manifest" href="/manifest.webmanifest" />
    `;
  });

  it('日本語(ja)への切り替えでapple-mobile-web-app-titleとapplication-nameが更新され、manifestリンクは静的のまま保持されること', () => {
    updatePwaMetadata('ja');

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    expect(appleTitleMeta?.getAttribute('content')).toBe('重賞カレンダー');

    const appNameMeta = document.querySelector('meta[name="application-name"]');
    expect(appNameMeta?.getAttribute('content')).toBe('重賞カレンダー');

    // WebAPK maskable アイコン取得を保証するため、manifest の href は書き換えない
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    expect(manifestLink.getAttribute('href')).toBe('/manifest.webmanifest');
  });

  it('英語(en)への切り替えでapple-mobile-web-app-titleとapplication-nameが正しく更新されること', () => {
    updatePwaMetadata('en');

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    expect(appleTitleMeta?.getAttribute('content')).toBe('Graded Races');

    const appNameMeta = document.querySelector('meta[name="application-name"]');
    expect(appNameMeta?.getAttribute('content')).toBe('Graded Races');
  });

  it('フランス語(fr)への切り替えでapple-mobile-web-app-titleとapplication-nameが正しく更新されること', () => {
    updatePwaMetadata('fr');

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    expect(appleTitleMeta?.getAttribute('content')).toBe('Courses de Groupe');

    const appNameMeta = document.querySelector('meta[name="application-name"]');
    expect(appNameMeta?.getAttribute('content')).toBe('Courses de Groupe');
  });

  it('繁体字中国語(zh)への切り替えでapple-mobile-web-app-titleとapplication-nameが正しく更新されること', () => {
    updatePwaMetadata('zh');

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    expect(appleTitleMeta?.getAttribute('content')).toBe('分級賽行事曆');

    const appNameMeta = document.querySelector('meta[name="application-name"]');
    expect(appNameMeta?.getAttribute('content')).toBe('分級賽行事曆');
  });

  it('metaタグが存在しない場合でも動的に生成して設定されること', () => {
    document.head.innerHTML = ''; // 完全に空にする

    updatePwaMetadata('en');

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    expect(appleTitleMeta).not.toBeNull();
    expect(appleTitleMeta?.getAttribute('content')).toBe('Graded Races');

    const appNameMeta = document.querySelector('meta[name="application-name"]');
    expect(appNameMeta).not.toBeNull();
    expect(appNameMeta?.getAttribute('content')).toBe('Graded Races');
  });

  describe('index.html inline language initialization script', () => {
    const runInlineScript = (browserLang: string, storedLang: string | null) => {
      document.head.innerHTML = `
        <meta name="apple-mobile-web-app-title" content="Graded Races" />
        <meta name="application-name" content="Graded Races" />
      `;

      // Simulates the inline script in index.html
      const lang = (storedLang || browserLang || '').toLowerCase();
      let title = 'Graded Races';
      if (lang.indexOf('ja') === 0) {
        title = '重賞カレンダー';
      } else if (lang.indexOf('fr') === 0) {
        title = 'Courses de Groupe';
      } else if (lang.indexOf('zh') === 0) {
        title = '分級賽行事曆';
      }
      const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (appleTitleMeta) {
        appleTitleMeta.setAttribute('content', title);
      }
      const appNameMeta = document.querySelector('meta[name="application-name"]');
      if (appNameMeta) {
        appNameMeta.setAttribute('content', title);
      }
    };

    it('日本語端末（ja-JP）では初期アプリアイコン名が「重賞カレンダー」になること', () => {
      runInlineScript('ja-JP', null);
      expect(document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content')).toBe('重賞カレンダー');
      expect(document.querySelector('meta[name="application-name"]')?.getAttribute('content')).toBe('重賞カレンダー');
    });

    it('フランス語端末（fr-FR）では初期アプリアイコン名が「Courses de Groupe」になること', () => {
      runInlineScript('fr-FR', null);
      expect(document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content')).toBe('Courses de Groupe');
      expect(document.querySelector('meta[name="application-name"]')?.getAttribute('content')).toBe('Courses de Groupe');
    });

    it('中国語端末（zh-HK）では初期アプリアイコン名が「分級賽行事曆」になること', () => {
      runInlineScript('zh-HK', null);
      expect(document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content')).toBe('分級賽行事曆');
      expect(document.querySelector('meta[name="application-name"]')?.getAttribute('content')).toBe('分級賽行事曆');
    });

    it('英語端末およびその他の言語圏では初期アプリアイコン名が「Graded Races」になること', () => {
      runInlineScript('en-US', null);
      expect(document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content')).toBe('Graded Races');
      expect(document.querySelector('meta[name="application-name"]')?.getAttribute('content')).toBe('Graded Races');

      runInlineScript('de-DE', null);
      expect(document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content')).toBe('Graded Races');
    });

    it('localStorage に明示的な設定がある場合はそちらが優先されること', () => {
      runInlineScript('en-US', 'ja');
      expect(document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content')).toBe('重賞カレンダー');
    });
  });
});
