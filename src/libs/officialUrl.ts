import type { Race, Organization } from '../types/race';
import type { Language } from '../store/useLanguageStore';

/**
 * 公式出馬表・レース情報外部リンク機能の有効化フラグ (Feature Flag)
 * 仕様見直し・改修期間中のため一時的に無効化 (false) (Issue #155)
 */
export const ENABLE_OFFICIAL_LINKS = false;

/**
 * 主催者ごとのデフォルト公式情報・出馬表URLマッピング
 */
export const DEFAULT_OFFICIAL_URLS: Record<Organization, Record<Language, string>> = {
  jra: {
    ja: 'https://www.jra.go.jp/keiba/thisweek/',
    en: 'https://japanracing.jp/',
    fr: 'https://japanracing.jp/',
    zh: 'https://japanracing.jp/',
  },
  nar: {
    ja: 'https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList',
    en: 'https://www.keiba.go.jp/dirtgraderace/en/',
    fr: 'https://www.keiba.go.jp/dirtgraderace/en/',
    zh: 'https://www.keiba.go.jp/dirtgraderace/en/',
  },
  france_galop: {
    ja: 'https://www.france-galop.com/en/racing',
    en: 'https://www.france-galop.com/en/racing',
    fr: 'https://www.france-galop.com/fr/courses',
    zh: 'https://www.france-galop.com/en/racing',
  },
  bha: {
    ja: 'https://www.sportinglife.com/racing/racecards',
    en: 'https://www.sportinglife.com/racing/racecards',
    fr: 'https://www.sportinglife.com/racing/racecards',
    zh: 'https://www.sportinglife.com/racing/racecards',
  },
  equibase: {
    ja: 'https://www.equibase.com/stats/Entries.cfm',
    en: 'https://www.equibase.com/stats/Entries.cfm',
    fr: 'https://www.equibase.com/stats/Entries.cfm',
    zh: 'https://www.equibase.com/stats/Entries.cfm',
  },
  hkjc: {
    ja: 'https://racing.hkjc.com/racing/information/Chinese/Racing/RaceCard.aspx',
    en: 'https://racing.hkjc.com/racing/information/English/Racing/RaceCard.aspx',
    fr: 'https://racing.hkjc.com/racing/information/English/Racing/RaceCard.aspx',
    zh: 'https://racing.hkjc.com/racing/information/Chinese/Racing/RaceCard.aspx',
  },
  hri: {
    ja: 'https://www.hri.ie/racing/',
    en: 'https://www.hri.ie/racing/',
    fr: 'https://www.hri.ie/racing/',
    zh: 'https://www.hri.ie/racing/',
  },
  overseas: {
    ja: 'https://www.ifhaonline.org/',
    en: 'https://www.ifhaonline.org/',
    fr: 'https://www.ifhaonline.org/',
    zh: 'https://www.ifhaonline.org/',
  },
};

/**
 * 主催者ごとの公式ソース表示名
 */
export const OFFICIAL_SOURCE_NAMES: Record<Organization, Record<Language, string>> = {
  jra: {
    ja: 'JRA 公式サイト',
    en: 'JRA Official',
    fr: 'Site officiel JRA',
    zh: 'JRA 官方網站',
  },
  nar: {
    ja: '地方競馬情報サイト (NAR)',
    en: 'NAR Official Site',
    fr: 'Site officiel NAR',
    zh: 'NAR 地方競馬官方網站',
  },
  france_galop: {
    ja: 'France Galop 公式サイト',
    en: 'France Galop Official',
    fr: 'France Galop Officiel',
    zh: 'France Galop 官方網站',
  },
  bha: {
    ja: 'Sporting Life / BHA 公式出馬表',
    en: 'Sporting Life / BHA Racecards',
    fr: 'Partants Sporting Life / BHA',
    zh: 'Sporting Life / BHA 官方排位表',
  },
  equibase: {
    ja: 'Equibase 公式出馬表',
    en: 'Equibase Race Entries',
    fr: 'Entrées Equibase',
    zh: 'Equibase 官方排位表',
  },
  hkjc: {
    ja: 'HKJC 香港ジョッキークラブ公式排位表',
    en: 'HKJC Official Race Card',
    fr: 'Programme officiel HKJC',
    zh: '香港賽馬會官方排位表',
  },
  hri: {
    ja: 'HRI アイルランド競馬公式サイト',
    en: 'Horse Racing Ireland (HRI)',
    fr: 'Horse Racing Ireland (HRI)',
    zh: '愛爾蘭賽馬會 (HRI)',
  },
  overseas: {
    ja: 'IFHA 公式情報',
    en: 'IFHA Official Info',
    fr: 'Infos officielles IFHA',
    zh: '國際賽馬組織聯盟 (IFHA)',
  },
};

/**
 * レースの公式出馬表・レース情報URLを取得する
 * 1. レース固有の official_url があればそれを優先
 * 2. なければ主催者・言語に応じた公式出馬表・ポータルURLにフォールバック
 */
export function getOfficialRaceUrl(race: Race, language: Language = 'ja'): string {
  if (race.official_url && race.official_url.trim() !== '') {
    return race.official_url;
  }
  const orgMap = DEFAULT_OFFICIAL_URLS[race.organization] || DEFAULT_OFFICIAL_URLS.overseas;
  return orgMap[language] || orgMap.ja;
}

/**
 * 公式情報ソース名を取得する
 */
export function getOfficialSourceLabel(organization: Organization, language: Language = 'ja'): string {
  const labelMap = OFFICIAL_SOURCE_NAMES[organization] || OFFICIAL_SOURCE_NAMES.overseas;
  return labelMap[language] || labelMap.ja;
}
