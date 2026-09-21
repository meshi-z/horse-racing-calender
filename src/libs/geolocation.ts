import type { Organization } from '../types/race';

export type UserRegion = 'JP' | 'FR' | 'GB' | 'US' | 'OTHER';

export const ORGANIZATIONS_STORAGE_KEY = 'horse_racing_calendar_organizations_filter';
export const LEGACY_ORGANIZATION_STORAGE_KEY = 'horse_racing_calendar_organization_filter';

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

    // 4. アメリカ (US) 判定
    const usTimeZones = [
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Phoenix',
      'America/Anchorage',
      'Pacific/Honolulu',
      'America/Detroit',
      'America/Boise',
      'America/Kentucky/Louisville',
      'US/Eastern',
      'US/Central',
      'US/Mountain',
      'US/Pacific',
      'US/Alaska',
      'US/Hawaii',
    ];
    if (timeZone) {
      if (usTimeZones.includes(timeZone) || timeZone.startsWith('US/')) {
        return 'US';
      }
      if (timeZone.startsWith('America/') && (langLower === 'en-us' || langLower.startsWith('en-us-') || langLower === 'en')) {
        return 'US';
      }
    } else if (langLower === 'en-us' || langLower.startsWith('en-us-')) {
      return 'US';
    }

    return 'OTHER';
  } catch {
    return 'OTHER';
  }
}

/**
 * 推定された地域に応じたデフォルト主催者配列を返す
 * - JP: ['jra', 'nar'] (日本国内重賞)
 * - FR: ['france_galop'] (フランス重賞)
 * - GB: ['bha'] (イギリス重賞)
 * - US: ['equibase'] (アメリカ重賞)
 * - OTHER: [] (すべて)
 */
export function getDefaultOrganizationsForRegion(region: UserRegion): Organization[] {
  switch (region) {
    case 'JP':
      return ['jra', 'nar'];
    case 'FR':
      return ['france_galop'];
    case 'GB':
      return ['bha'];
    case 'US':
      return ['equibase'];
    case 'OTHER':
    default:
      return [];
  }
}

const VALID_ORGANIZATIONS: ReadonlySet<string> = new Set([
  'jra',
  'nar',
  'france_galop',
  'bha',
  'equibase',
  'overseas',
]);

/**
 * 初期主催者フィルター配列を決定する
 * 1. localStorage (ORGANIZATIONS_STORAGE_KEY) に手動設定が保存されている場合は最優先
 * 2. 旧キー (LEGACY_ORGANIZATION_STORAGE_KEY) が存在する場合はマイグレーションして復元
 * 3. 未設定の場合は端末の地域（タイムゾーン・ロケール）を自動判定して対応する主催者を返す
 */
export function getInitialOrganizations(context?: GeolocationContext): Organization[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // 1. 新キー (配列JSON)
      const storedJson = window.localStorage.getItem(ORGANIZATIONS_STORAGE_KEY);
      if (storedJson !== null) {
        try {
          const parsed = JSON.parse(storedJson);
          if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string' && VALID_ORGANIZATIONS.has(item))) {
            return parsed as Organization[];
          }
        } catch {
          // JSONパースエラー時はフォールバック
        }
      }

      // 2. 旧キー (単一値文字列) からのマイグレーション
      const legacyStored = window.localStorage.getItem(LEGACY_ORGANIZATION_STORAGE_KEY);
      if (legacyStored !== null) {
        if (legacyStored === 'all') {
          return [];
        }
        if (VALID_ORGANIZATIONS.has(legacyStored)) {
          return [legacyStored as Organization];
        }
      }
    }
  } catch {
    // localStorage アクセスエラー時は自動判定へ進む
  }

  const region = detectUserRegion(context);
  return getDefaultOrganizationsForRegion(region);
}

/**
 * ユーザーが手動で選択した主催者フィルター配列を localStorage に保存する
 */
export function saveOrganizationsPreference(orgs: Organization[]): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(orgs));
    }
  } catch {
    // ignore
  }
}

