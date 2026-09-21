import { translations } from './i18n';
import type { Language } from '../store/useLanguageStore';

let cachedManifest: Record<string, any> | null = null;
let currentManifestBlobUrl: string | null = null;

/**
 * フォールバック用の基本マニフェスト定義（vite.config.tsと同期）
 */
function getFallbackManifest(name: string, shortName: string): Record<string, any> {
  return {
    name,
    short_name: shortName,
    description: 'JRA・NAR・欧州重賞レースのスケジュールを閲覧・管理するオフライン対応カレンダー',
    theme_color: '#047B5F',
    background_color: '#FFFFFF',
    display: 'standalone',
    orientation: 'portrait-primary',
    icons: [
      {
        src: 'icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}

/**
 * Web App Manifestを動的に更新（Blob URL または Data URL）
 */
export function updateWebManifest(shortName: string, fullName: string): void {
  if (typeof document === 'undefined') return;

  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }

  const baseManifest = cachedManifest || getFallbackManifest(fullName, shortName);
  const updatedManifest = {
    ...baseManifest,
    name: fullName,
    short_name: shortName,
  };

  const jsonStr = JSON.stringify(updatedManifest);

  try {
    if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
      const blob = new Blob([jsonStr], { type: 'application/manifest+json' });
      if (currentManifestBlobUrl && URL.revokeObjectURL) {
        URL.revokeObjectURL(currentManifestBlobUrl);
      }
      currentManifestBlobUrl = URL.createObjectURL(blob);
      manifestLink.href = currentManifestBlobUrl;
      return;
    }
  } catch {
    // Blob URL 生成失敗時は Data URL にフォールバック
  }

  manifestLink.href = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(jsonStr)}`;
}

/**
 * 言語設定に応じてPWA関連メタタグおよびWeb App Manifestを動的同期
 */
export function updatePwaMetadata(language: Language): void {
  if (typeof document === 'undefined') return;

  const dict = translations[language] || translations.ja;
  const appName = dict.app.appName;
  const appFullName = dict.app.appFullName;

  // 1. apple-mobile-web-app-title (iOS Safari ホーム画面追加時のデフォルト名称)
  let appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
  if (!appleTitleMeta) {
    appleTitleMeta = document.createElement('meta');
    appleTitleMeta.name = 'apple-mobile-web-app-title';
    document.head.appendChild(appleTitleMeta);
  }
  appleTitleMeta.content = appName;

  // 2. application-name (標準ブラウザ・Webアプリ名称)
  let appNameMeta = document.querySelector('meta[name="application-name"]') as HTMLMetaElement | null;
  if (!appNameMeta) {
    appNameMeta = document.createElement('meta');
    appNameMeta.name = 'application-name';
    document.head.appendChild(appNameMeta);
  }
  appNameMeta.content = appName;

  // 3. Web App Manifest (Android Chrome等 PWAインストール時の名称)
  updateWebManifest(appName, appFullName);
}

/**
 * 起動時に静的マニフェストファイルをフェッチしてキャッシュ
 */
export async function initPwaManifestCache(currentLanguage: Language): Promise<void> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;

  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
  if (manifestLink && manifestLink.href && !manifestLink.href.startsWith('blob:') && !manifestLink.href.startsWith('data:')) {
    try {
      const res = await fetch(manifestLink.href);
      if (res.ok) {
        cachedManifest = await res.json();
        // キャッシュ取得後に最新言語で再同期
        updatePwaMetadata(currentLanguage);
      }
    } catch {
      // オフライン時等はフォールバックが使用されるため無視
    }
  }
}
