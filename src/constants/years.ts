export const AVAILABLE_YEARS = [2026, 2027] as const;

export type AvailableYear = (typeof AVAILABLE_YEARS)[number];

export const DEFAULT_YEAR: AvailableYear = 2026;

const rawBaseUrl = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/';
export const BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;
export const DEFAULT_DATA_URL = `${BASE_URL}data/races.json`;

/**
 * 指定年度の Sharding JSON ファイル URL を生成
 */
export function getYearDataUrl(year: number, customBaseUrl?: string): string {
  const base = customBaseUrl ?? BASE_URL;
  const norm = base.endsWith('/') ? base : `${base}/`;
  return `${norm}data/races-${year}.json`;
}

/**
 * 指定された年がサポートされている利用可能年度かを判定するタイプガード
 */
export function isAvailableYear(year: number): year is AvailableYear {
  return AVAILABLE_YEARS.includes(year as AvailableYear);
}

/**
 * 初回アクセス時の年度判定ロジック
 * 1. URLクエリパラメータ（?year=YYYY）があれば最優先（利用可能年度に含まれる場合）
 * 2. なければ現在日時（システム日時）と AVAILABLE_YEARS を照合
 * 3. 範囲外なら DEFAULT_YEAR (2026) をデフォルトとする
 */
export function resolveInitialYear(
  searchQuery?: string,
  currentDate: Date = new Date()
): AvailableYear {
  if (typeof searchQuery === 'string') {
    const params = new URLSearchParams(searchQuery);
    const yearParam = params.get('year');
    if (yearParam) {
      const parsed = parseInt(yearParam, 10);
      if (isAvailableYear(parsed)) {
        return parsed;
      }
    }
  }

  const currentSystemYear = currentDate.getFullYear();
  if (isAvailableYear(currentSystemYear)) {
    return currentSystemYear;
  }

  return DEFAULT_YEAR;
}

/**
 * 現在のURLのクエリパラメータ ?year=YYYY を同期・更新する
 */
export function syncYearToUrl(year: number): void {
  if (typeof window === 'undefined' || !window.location) return;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('year') !== String(year)) {
      url.searchParams.set('year', String(year));
      window.history.replaceState(null, '', url.toString());
    }
  } catch {
    // ignore
  }
}
