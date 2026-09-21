import { translations } from './i18n';
import type { Language } from '../store/useLanguageStore';

/**
 * 言語設定に応じてPWA関連メタタグ（apple-mobile-web-app-title, application-name）を動的同期
 *
 * 注記:
 * Android (Chrome) の PWA インストール（WebAPK）は外部の WebAPK Minting サーバーが
 * 静的マニフェスト（manifest.webmanifest）および maskable アイコン（icon-maskable.png）を直接取得します。
 * クライアント側で <link rel="manifest"> を Blob URL に差し替えると、外部サーバーから
 * maskable アイコンが取得できなくなり、アプリアイコンに白い余白（フォールバック）が生じるため、
 * マニフェストは静的ファイルのまま保持し、HTMLメタタグのみを動的に同期します。
 */
export function updatePwaMetadata(language: Language): void {
  if (typeof document === 'undefined') return;

  const dict = translations[language] || translations.ja;
  const appName = dict.app.appName;

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
}
