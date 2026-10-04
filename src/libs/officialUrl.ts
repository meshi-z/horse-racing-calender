import type { Race, Organization } from '../types/race';
import type { Language } from '../store/useLanguageStore';

/**
 * 公式出馬表・レース情報外部リンク機能の有効化フラグ (Feature Flag)
 * 実在検証済みの公式URL（JRA G1確定結果等）のみにリンクを表示する (Issue #157, #176, #190)
 */
export const ENABLE_OFFICIAL_LINKS = true;

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
  racing_australia: {
    ja: 'Racing Australia 公式サイト',
    en: 'Racing Australia Official',
    fr: 'Site officiel Racing Australia',
    zh: '澳洲賽馬會 (Racing Australia)',
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
 * 1. 一次ソース検証済みの official_url が存在する場合のみそれを返却
 * 2. 存在しないレース（未定・未検証レース）は null を返し、UI側で非表示とする (Issue #157, #176, #190)
 * ※ デッドリンクや誤リンクを防止するため、不確実な動的推測生成は一切行わない
 */
export function getOfficialRaceUrl(race: Race, _language: Language = 'ja'): string | null {
  if (race.official_url && race.official_url.trim() !== '') {
    return race.official_url;
  }
  return null;
}

/**
 * 公式情報ソース名を取得する
 */
export function getOfficialSourceLabel(organization: Organization, language: Language = 'ja'): string {
  const labelMap = OFFICIAL_SOURCE_NAMES[organization] || OFFICIAL_SOURCE_NAMES.overseas;
  return labelMap[language] || labelMap.ja;
}
