import type { Race, Organization } from '../types/race';
import type { Language } from '../store/useLanguageStore';

/**
 * 公式出馬表・レース情報外部リンク機能の有効化フラグ (Feature Flag)
 * Phase 1改修（未定時非表示制御 & NAR/HKJC動的URL解決）により再有効化 (Issue #157)
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
  overseas: {
    ja: 'IFHA 公式情報',
    en: 'IFHA Official Info',
    fr: 'Infos officielles IFHA',
    zh: '國際賽馬組織聯盟 (IFHA)',
  },
};

/**
 * NAR地方競馬 全国15場・馬場コードマッピング
 */
export const NAR_BABA_CODES: Record<string, string> = {
  '帯広': '3',
  '門別': '36',
  '盛岡': '10',
  '水沢': '11',
  '浦和': '18',
  '船橋': '19',
  '大井': '20',
  '川崎': '21',
  '金沢': '22',
  '笠松': '23',
  '名古屋': '24',
  '園田': '27',
  '姫路': '28',
  '高知': '31',
  '佐賀': '32',
};

const NAR_BABA_EN_CODES: Record<string, string> = {
  obihiro: '3',
  mombetsu: '36',
  morioka: '10',
  mizusawa: '11',
  urawa: '18',
  funabashi: '19',
  oi: '20',
  kawasaki: '21',
  kanazawa: '22',
  kasamatsu: '23',
  nagoya: '24',
  sonoda: '27',
  himeji: '28',
  kochi: '31',
  saga: '32',
};

/**
 * コース情報からNAR馬場コード（k_babaCode）を解決する
 */
export function getNarBabaCode(courseNameJa?: string, courseNameEn?: string): string | null {
  if (courseNameJa) {
    for (const [name, code] of Object.entries(NAR_BABA_CODES)) {
      if (courseNameJa.includes(name)) return code;
    }
  }
  if (courseNameEn) {
    const lower = courseNameEn.toLowerCase();
    for (const [name, code] of Object.entries(NAR_BABA_EN_CODES)) {
      if (lower.includes(name)) return code;
    }
  }
  return null;
}

/**
 * NAR（地方競馬）の公式出馬表・レース結果URLを動的に解決する
 */
export function resolveNarOfficialUrl(race: Race): string | null {
  const babaCode = getNarBabaCode(race.course?.ja, race.course?.en);
  if (!babaCode || !race.date) return null;

  const raceDate = race.date.replace(/-/g, '/');
  const isFinished = !!race.winner;
  const baseUrl = isFinished
    ? 'https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceMarkTable'
    : 'https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable';

  const params = new URLSearchParams();
  params.set('k_raceDate', raceDate);
  if (race.race_number) {
    params.set('k_raceNo', String(race.race_number));
  }
  params.set('k_babaCode', babaCode);

  return `${baseUrl}?${params.toString()}`;
}

/**
 * コース情報からHKJC競馬場コード（ST / HV）を解決する
 */
export function getHkjcCourseCode(courseJa?: string, courseEn?: string, courseZh?: string): 'ST' | 'HV' | null {
  const combined = `${courseJa || ''} ${courseEn || ''} ${courseZh || ''}`.toLowerCase();
  if (combined.includes('沙田') || combined.includes('シャティン') || combined.includes('sha tin') || combined.includes('st')) {
    return 'ST';
  }
  if (combined.includes('跑馬地') || combined.includes('ハッピーバレー') || combined.includes('happy valley') || combined.includes('hv')) {
    return 'HV';
  }
  return null;
}

/**
 * HKJC（香港競馬）の公式出馬表・レース結果URLを動的に解決する
 */
export function resolveHkjcOfficialUrl(race: Race, language: Language = 'ja'): string | null {
  const courseCode = getHkjcCourseCode(race.course?.ja, race.course?.en, race.course?.zh);
  if (!courseCode || !race.date) return null;

  const raceDate = race.date.replace(/-/g, '/');
  const isFinished = !!race.winner;
  const langParam = language === 'zh' ? 'Chinese' : 'English';
  const scriptName = isFinished ? 'LocalResults.aspx' : 'RaceCard.aspx';

  const params = new URLSearchParams();
  params.set('RaceDate', raceDate);
  params.set('Racecourse', courseCode);
  if (race.race_number) {
    params.set('RaceNo', String(race.race_number));
  }

  return `https://racing.hkjc.com/racing/information/${langParam}/Racing/${scriptName}?${params.toString()}`;
}

/**
 * レースの公式出馬表・レース情報URLを取得する
 * 1. レース固有の official_url があればそれを最優先
 * 2. なければ規則的URLを持つ団体（NAR, HKJC）について動的にURLを解決
 * 3. いずれも解決できない未定レースは null を返し、UI側で非表示とする（Issue #157）
 */
export function getOfficialRaceUrl(race: Race, language: Language = 'ja'): string | null {
  if (race.official_url && race.official_url.trim() !== '') {
    return race.official_url;
  }

  if (race.organization === 'nar') {
    return resolveNarOfficialUrl(race);
  }

  if (race.organization === 'hkjc') {
    return resolveHkjcOfficialUrl(race, language);
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
