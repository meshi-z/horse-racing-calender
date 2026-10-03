import type { Language } from '@/store/useLanguageStore';

/**
 * 指定された言語に対応する正規化URLパスを生成する
 * 例:
 * - base = '/' -> '/ja/', '/en/', '/fr/', '/zh/'
 * - base = '/horse-racing-calender/' -> '/horse-racing-calender/ja/', ...
 */
export function getLocalizedPath(language: Language, basePath = import.meta.env.BASE_URL || '/'): string {
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${normalizedBase}${language}/`;
}

/**
 * シェア用・URLコピー用の完全なURL文字列を生成する
 */
export function getShareUrl(language: Language, currentUrl?: string): string {
  if (currentUrl) {
    try {
      const parsed = new URL(currentUrl);
      const basePath = import.meta.env.BASE_URL || '/';
      const localizedPath = getLocalizedPath(language, basePath);
      parsed.pathname = localizedPath;
      return parsed.toString();
    } catch {
      // URLパース失敗時はフォールバック
    }
  }

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const basePath = import.meta.env.BASE_URL || '/';
    const localizedPath = getLocalizedPath(language, basePath);
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    return `${origin}${localizedPath}${search}${hash}`;
  }

  // SSR / テスト環境用フォールバック
  const basePath = import.meta.env.BASE_URL || '/';
  return `https://meshi-z.github.io${getLocalizedPath(language, basePath)}`;
}
