/**
 * NAR（地方競馬全国協会）公式スケジュールスクレイパー & パーサー
 * https://www.keiba.go.jp/gradedrace/schedule_2026.html
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { romanizeJapaneseRaceName } from './hepburn.js';
import { fetchWithRetry } from './jra-syutsuba.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

export interface NarVenueMaster {
  ja: string;
  en: string;
  default_time_jst: string;
  is_nighter: boolean;
}

export interface NarRaceMasterData {
  venues: Record<string, NarVenueMaster>;
  races: Record<string, string>;
}

export interface ParsedNarRace {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 例: "水"
  name: {
    ja: string;
    en: string;
  };
  grade: 'G1' | 'Jpn1' | 'Jpn2' | 'Jpn3' | 'S1' | 'S2' | 'S3' | 'local_grade';
  rawGrade: string; // パース前の表記（例: "JpnⅠ", "SⅢ", "BG1", "重賞Ⅰ" 等）
  course: {
    ja: string;
    en: string;
  };
  distance: number;
  track_type: 'turf' | 'dirt' | 'banei';
  sex_constraint: 'filly_and_mare' | 'colt_and_filly' | 'none';
  age_constraint: '2yo' | '3yo' | '3yo_and_up' | '4yo_and_up';
  default_time_jst: string; // 例: "20:05", "16:30", "19:30"
  organization: 'nar';
}

/**
 * nar_race_master.json を同期的に読み込む
 */
export function loadNarRaceMaster(customPath?: string): NarRaceMasterData {
  const masterPath = customPath || path.join(rootDir, 'src', 'data', 'nar_race_master.json');
  if (!fs.existsSync(masterPath)) {
    throw new Error(`nar_race_master.json not found at: ${masterPath}`);
  }
  const raw = fs.readFileSync(masterPath, 'utf8');
  return JSON.parse(raw) as NarRaceMasterData;
}

/**
 * NARの格付け表記を標準グレードコードに正規化
 * 1. ダートグレード: Jpn1, Jpn2, Jpn3（※国際G1の東京大賞典等は G1 を維持）
 * 2. 南関東重賞: S1, S2, S3
 * 3. その他地方重賞: 一律 local_grade
 */
export function normalizeNarGrade(
  rawGrade: string,
  raceName: string,
  liClass: string
): 'G1' | 'Jpn1' | 'Jpn2' | 'Jpn3' | 'S1' | 'S2' | 'S3' | 'local_grade' {
  const trimmed = (rawGrade || '').trim();
  const classes = liClass.split(/\s+/);

  // 東京大賞典など国際G1
  if (trimmed === 'GⅠ' || trimmed === 'GI' || classes.includes('GI') || raceName === '東京大賞典') {
    return 'G1';
  }

  // ダートグレード (Jpn): III -> II -> I の順で厳格に判定
  if (trimmed === 'JpnⅢ' || trimmed === 'JpnIII' || classes.includes('JpnIII')) {
    return 'Jpn3';
  }
  if (trimmed === 'JpnⅡ' || trimmed === 'JpnII' || classes.includes('JpnII')) {
    return 'Jpn2';
  }
  if (trimmed === 'JpnⅠ' || trimmed === 'JpnI' || classes.includes('JpnI')) {
    return 'Jpn1';
  }

  // 南関東重賞 (S): III -> II -> I の順で厳格に判定
  if (trimmed === 'SⅢ' || trimmed === 'SIII' || classes.includes('SIII')) {
    return 'S3';
  }
  if (trimmed === 'SⅡ' || trimmed === 'SII' || classes.includes('SII')) {
    return 'S2';
  }
  if (trimmed === 'SⅠ' || trimmed === 'SI' || classes.includes('SI')) {
    return 'S1';
  }

  // その他地区重賞（BG1〜3, H1〜3, M1〜3, SP1〜3, 重賞1〜3, 無印等）
  return 'local_grade';
}

/**
 * NAR公式の出走条件（馬齢・牝馬限定）を正規化
 */
export function normalizeNarEligibility(
  liClass: string,
  liInner: string
): {
  sex_constraint: 'filly_and_mare' | 'colt_and_filly' | 'none';
  age_constraint: '2yo' | '3yo' | '3yo_and_up' | '4yo_and_up';
} {
  // 性別判定
  const isMare = liClass.includes('mare') || liInner.includes('icon --mare');
  const sex_constraint = isMare ? 'filly_and_mare' : 'none';

  // 馬齢判定
  let age_constraint: '2yo' | '3yo' | '3yo_and_up' | '4yo_and_up' = '3yo_and_up';
  if (liClass.includes('age_2')) {
    age_constraint = '2yo';
  } else if (liClass.includes('age_3-4') || liClass.includes('over3')) {
    age_constraint = '3yo_and_up';
  } else if (liClass.includes('age_3')) {
    age_constraint = '3yo';
  } else if (liClass.includes('age_4') || liClass.includes('age_5')) {
    age_constraint = '4yo_and_up';
  }

  return { sex_constraint, age_constraint };
}

/**
 * NARコース文字列から馬場種別と距離を抽出
 */
export function normalizeNarCourse(
  courseText: string,
  areaText: string
): {
  track_type: 'turf' | 'dirt' | 'banei';
  distance: number;
} {
  // 帯広・ばんえい競馬
  if (areaText === '帯広' || areaText.includes('ばんえい')) {
    return {
      track_type: 'banei',
      distance: 200,
    };
  }

  const isTurf = courseText.includes('芝');
  const track_type: 'turf' | 'dirt' = isTurf ? 'turf' : 'dirt';

  const numMatch = courseText.match(/(\d+)/);
  const distance = numMatch ? parseInt(numMatch[1], 10) : 1600;

  return { track_type, distance };
}

/**
 * NAR公式年間スケジュールHTMLをパースして全レース情報を抽出
 */
export function parseNarScheduleHtml(
  html: string,
  year = 2026,
  masterData?: NarRaceMasterData
): ParsedNarRace[] {
  const master = masterData || loadNarRaceMaster();
  const races: ParsedNarRace[] = [];

  // <li> 要素の抽出
  const liRegex = /<li class="([^"]*?)">([\s\S]*?)<\/li>/g;
  let m: RegExpExecArray | null;

  while ((m = liRegex.exec(html)) !== null) {
    const liClass = m[1];
    const liInner = m[2];

    // 日付 (例: "1/2")
    const dateMatch = liInner.match(/<p class="date">(.*?)<\/p>/);
    if (!dateMatch) continue;
    const rawDate = dateMatch[1].trim();
    const dateParts = rawDate.split('/');
    if (dateParts.length !== 2) continue;

    const month = dateParts[0].padStart(2, '0');
    const day = dateParts[1].padStart(2, '0');
    const date = `${year}-${month}-${day}`;

    // 曜日
    const dayMatch = liInner.match(/<p class="dayoftheweek">(.*?)<\/p>/);
    const dayOfWeek = dayMatch ? dayMatch[1].trim() : '';

    // レース名
    const nameMatch = liInner.match(/<p class="name">(.*?)<\/p>/);
    if (!nameMatch) continue;
    const nameJa = nameMatch[1].trim();

    // 競馬場
    const areaMatch = liInner.match(/<p class="area">(.*?)<\/p>/);
    const areaJa = areaMatch ? areaMatch[1].trim() : '';
    const venueInfo = master.venues[areaJa];
    const areaEn = venueInfo ? venueInfo.en : areaJa;
    const default_time_jst = venueInfo ? venueInfo.default_time_jst : '16:30';

    // 英語レース名（マスター優先、未登録時はヘボン式ローマ字フォールバック）
    const nameEn = master.races[nameJa] || romanizeJapaneseRaceName(nameJa);

    // グレード
    const gradeMatch = liInner.match(/<div class="class">\s*(?:<p class="icon [^"]*">(.*?)<\/p>)?\s*<\/div>/);
    const rawGrade = gradeMatch && gradeMatch[1] ? gradeMatch[1].trim() : '';
    const grade = normalizeNarGrade(rawGrade, nameJa, liClass);

    // コース・馬場種別・距離
    const courseMatch = liInner.match(/<p class="course">(.*?)<\/p>/);
    const rawCourse = courseMatch ? courseMatch[1].trim() : '';
    const { track_type, distance } = normalizeNarCourse(rawCourse, areaJa);

    // 出走条件
    const { sex_constraint, age_constraint } = normalizeNarEligibility(liClass, liInner);

    races.push({
      date,
      dayOfWeek,
      name: {
        ja: nameJa,
        en: nameEn,
      },
      grade,
      rawGrade,
      course: {
        ja: areaJa,
        en: areaEn,
      },
      distance,
      track_type,
      sex_constraint,
      age_constraint,
      default_time_jst,
      organization: 'nar',
    });
  }

  // 日付順・同日の場合はグレード順にソート
  return races.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * NAR公式サイトからスケジュールHTMLを取得
 */
export async function fetchNarScheduleHtml(year = 2026): Promise<string> {
  const url = `https://www.keiba.go.jp/gradedrace/schedule_${year}.html`;
  const res = await fetchWithRetry(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch NAR schedule from ${url}: HTTP ${res.status}`);
  }

  const buf = await res.arrayBuffer();
  return new TextDecoder('utf-8').decode(buf);
}
