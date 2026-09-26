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
});
