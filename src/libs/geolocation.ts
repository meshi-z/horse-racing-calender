import type { FilterState } from '../types/race';

export type UserRegion = 'JP' | 'FR' | 'GB' | 'OTHER';
export type OrganizationFilter = FilterState['organization'];

export const ORGANIZATION_STORAGE_KEY = 'horse_racing_calendar_organization_filter';

export interface GeolocationContext {
  timeZone?: string;
  language?: string;
  languages?: readonly string[];
}

/**
 * 端末のタイムゾーンおよびブラウザ言語から接続元地域を推定する（外部通信なし）
 */
export function detectUserRegion(context?: GeolocationContext): UserRegion {
  try {
    let timeZone = context?.timeZone;
    if (timeZone === undefined && typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
      try {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        // ignore
      }
    }

    let language = context?.language;
    if (language === undefined && typeof navigator !== 'undefined') {
      language = (navigator.languages && navigator.languages[0]) || navigator.language;
    }
    const langLower = (language || '').toLowerCase();

    // 1. 日本 (JP) 判定
    if (timeZone) {
      if (timeZone === 'Asia/Tokyo' || timeZone === 'Japan') {
        return 'JP';
      }
    } else if (langLower.startsWith('ja')) {
      return 'JP';
    }

    // 2. フランス (FR) 判定
    if (timeZone) {
      if (
        timeZone === 'Europe/Paris' ||
        timeZone === 'Indian/Reunion' ||
        timeZone === 'Indian/Mayotte' ||
        timeZone === 'America/Guadeloupe' ||
        timeZone === 'America/Martinique' ||
        timeZone === 'America/Cayenne' ||
        timeZone === 'America/Miquelon' ||
        timeZone === 'Pacific/Noumea' ||
        timeZone === 'Pacific/Tahiti' ||
        timeZone === 'Pacific/Wallis'
      ) {
        return 'FR';
      }
      if (timeZone.startsWith('Europe/') && langLower.startsWith('fr')) {
        return 'FR';
      }
    } else if (langLower.startsWith('fr')) {
      return 'FR';
    }

    // 3. イギリス (GB) 判定
    if (timeZone) {
      if (timeZone === 'Europe/London' || timeZone === 'GB' || timeZone === 'GB-Eire') {
        return 'GB';
      }
      if (timeZone.startsWith('Europe/') && (langLower === 'en-gb' || langLower.startsWith('en-gb-'))) {
        return 'GB';
      }
    } else if (langLower === 'en-gb' || langLower.startsWith('en-gb-')) {
      return 'GB';
    }

    return 'OTHER';
  } catch {
    return 'OTHER';
  }
}

/**
 * 推定された地域に応じたデフォルト主催者フィルター値を返す
 */
export function getDefaultOrganizationForRegion(region: UserRegion): OrganizationFilter {
  switch (region) {
    case 'JP':
      return 'jra';
    case 'FR':
      return 'france_galop';
    case 'GB':
      return 'bha';
    case 'OTHER':
    default:
      return 'all';
  }
}

const VALID_ORGANIZATIONS: ReadonlySet<string> = new Set([
  'all',
  'jra',
  'nar',
  'france_galop',
  'bha',
]);

/**
 * 初期主催者フィルターを決定する
 * 1. localStorage に手動設定が保存されている場合は最優先
 * 2. 未設定の場合は端末の地域（タイムゾーン・ロケール）を自動判定して対応する主催者を返す
 */
export function getInitialOrganization(context?: GeolocationContext): OrganizationFilter {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(ORGANIZATION_STORAGE_KEY);
      if (stored && VALID_ORGANIZATIONS.has(stored)) {
        return stored as OrganizationFilter;
      }
    }
  } catch {
    // localStorage アクセスエラー時は自動判定へ進む
  }

  const region = detectUserRegion(context);
  return getDefaultOrganizationForRegion(region);
}

/**
 * ユーザーが手動で選択した主催者フィルターを localStorage に保存する
 */
export function saveOrganizationPreference(org: OrganizationFilter): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(ORGANIZATION_STORAGE_KEY, org);
    }
  } catch {
    // ignore
  }
}
