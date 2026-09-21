import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updatePwaMetadata, initPwaManifestCache } from '@/libs/pwaMetadata';

describe('PWA Metadata & Manifest i18n synchronization', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <title>Default Title</title>
      <meta name="apple-mobile-web-app-title" content="Default" />
      <link rel="manifest" href="/manifest.webmanifest" />
    `;
  });

  it('日本語(ja)への切り替えでapple-mobile-web-app-titleとmanifestが正しく更新されること', () => {
    updatePwaMetadata('ja');

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    expect(appleTitleMeta?.getAttribute('content')).toBe('重賞カレンダー');

    const appNameMeta = document.querySelector('meta[name="application-name"]');
    expect(appNameMeta?.getAttribute('content')).toBe('重賞カレンダー');

    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    expect(manifestLink).not.toBeNull();
    // href が blob URL または data URL になっていること
    expect(manifestLink.href.startsWith('blob:') || manifestLink.href.startsWith('data:')).toBe(true);
  });

  it('英語(en)への切り替えでapple-mobile-web-app-titleとmanifestが正しく更新されること', () => {
    updatePwaMetadata('en');

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    expect(appleTitleMeta?.getAttribute('content')).toBe('Graded Races');

    const appNameMeta = document.querySelector('meta[name="application-name"]');
    expect(appNameMeta?.getAttribute('content')).toBe('Graded Races');
  });

  it('フランス語(fr)への切り替えでapple-mobile-web-app-titleとmanifestが正しく更新されること', () => {
    updatePwaMetadata('fr');

    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    expect(appleTitleMeta?.getAttribute('content')).toBe('Courses de Groupe');

    const appNameMeta = document.querySelector('meta[name="application-name"]');
    expect(appNameMeta?.getAttribute('content')).toBe('Courses de Groupe');
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

    const manifestLink = document.querySelector('link[rel="manifest"]');
    expect(manifestLink).not.toBeNull();
  });

  it('initPwaManifestCache が静的マニフェストを取得してキャッシュすること', async () => {
    const mockManifest = {
      name: 'Old Name',
      short_name: 'Old',
      theme_color: '#047B5F',
      icons: [{ src: 'custom-icon.png', sizes: '192x192' }],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockManifest,
    } as Response);

    await initPwaManifestCache('en');

    expect(fetchSpy).toHaveBeenCalled();
    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    expect(appleTitleMeta?.getAttribute('content')).toBe('Graded Races');

    fetchSpy.mockRestore();
  });
});
