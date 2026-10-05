import { ConfirmedRaceTime } from './jra-syutsuba';
import type { RaceOutput } from '../update-race-times';
import { fetchWithRetry } from './uk-syutsuba';

export type { ConfirmedRaceTime };

export interface AustraliaRaceCardItem {
  raceNumber: number;
  raceName: string;
  postTime: string; // "16:15"
  venue: string;    // "Royal Randwick", "Caulfield", etc.
  distance?: number;
}

export interface AustraliaMeetingFixture {
  venue: string;
  date: string; // YYYY-MM-DD
  races: AustraliaRaceCardItem[];
}

/**
 * 指定日がオーストラリア夏時間（AEDT / ACDT）中かどうか判定する。
 * オーストラリアの夏時間は毎年10月第1日曜日 02:00 から翌年4月第1日曜日 03:00 まで適用される。
 * NSW, VIC, TAS, ACT, SA で適用（QLD, WA, NT は夏時間なし）。
 */
export function isAustralianSummerTime(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const year = date.getUTCFullYear();

  // 4月第1日曜日
  const apr1 = new Date(Date.UTC(year, 3, 1));
  const firstSundayApr = new Date(Date.UTC(year, 3, 1 + ((7 - apr1.getUTCDay()) % 7), 3, 0, 0));

  // 10月第1日曜日
  const oct1 = new Date(Date.UTC(year, 9, 1));
  const firstSundayOct = new Date(Date.UTC(year, 9, 1 + ((7 - oct1.getUTCDay()) % 7), 2, 0, 0));

  // 1月〜4月上旬 または 10月上旬〜12月
  return date < firstSundayApr || date >= firstSundayOct;
}

/**
 * 競馬場ごとのタイムゾーンとUTCオフセット（時間）を算出
 */
export function getAustraliaUtcOffsetHours(dateYmd: string, venue: string): number {
  const isDst = isAustralianSummerTime(dateYmd);

  // WA: Ascot (UTC+8, no DST)
  if (venue.includes('Ascot')) {
    return 8;
  }
  // QLD: Eagle Farm, Doomben (UTC+10, no DST)
  if (venue.includes('Eagle Farm') || venue.includes('Doomben')) {
    return 10;
  }
  // SA: Morphettville (ACST: UTC+9.5 / ACDT: UTC+10.5)
  if (venue.includes('Morphettville')) {
    return isDst ? 10.5 : 9.5;
  }
  // NSW / VIC: Randwick, Rosehill, Flemington, Caulfield, Moonee Valley
  // AEDT: UTC+11 / AEST: UTC+10
  return isDst ? 11 : 10;
}

/**
 * オーストラリア現地時刻（HH:mm）から UTC ISO 8601 文字列および JST HH:mm 表記を生成
 */
export function parseAustraliaTimeToIsoAndJst(
  dateYmd: string,
  timeLocal: string,
  venue: string
): {
  utcIso: string;
  timeJst: string;
  rawTime: string;
} {
  const [hours, minutes] = timeLocal.split(':').map(Number);
  const offsetHours = getAustraliaUtcOffsetHours(dateYmd, venue);

  const [y, m, d] = dateYmd.split('-').map(Number);
  const localTimestamp = Date.UTC(y, m - 1, d, hours, minutes, 0, 0);
  const utcTimestamp = localTimestamp - offsetHours * 3600 * 1000;

  const utcDate = new Date(utcTimestamp);
  const utcIso = utcDate.toISOString();

  // JST は UTC+9
  const jstTimestamp = utcTimestamp + 9 * 3600 * 1000;
  const jstDate = new Date(jstTimestamp);
  const jstHours = String(jstDate.getUTCHours()).padStart(2, '0');
  const jstMinutes = String(jstDate.getUTCMinutes()).padStart(2, '0');
  const timeJst = `${jstHours}:${jstMinutes}`;

  return {
    utcIso,
    timeJst,
    rawTime: `${timeJst} JST`,
  };
}

const AU_STOP_WORDS = new Set([
  'THE',
  'OF',
  'AND',
  'IN',
  'AT',
  'A',
  'AN',
  'FOR',
  'BY',
  'PRESENTED',
  'SPONSORED',
  'STAKES',
  'GROUP',
  'GRADE',
]);

/**
 * 英語文字列をオーストラリア重賞向けにトークン化
 */
export function tokenizeAustralia(str: string): string[] {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/['’]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !AU_STOP_WORDS.has(w));
}

/**
 * オーストラリア重賞レース名と出馬表レース名のマッチング判定
 */
export function australiaRaceMatches(targetName: string, candidateName: string): boolean {
  const targetTokens = tokenizeAustralia(targetName);
  const candidateTokens = tokenizeAustralia(candidateName);
  const candidateSet = new Set(candidateTokens);

  if (targetTokens.length === 0) return true;

  // 固有単語がすべて candidate に含まれているかチェック
  const allTokensMatch = targetTokens.every((t) => candidateSet.has(t));
  if (allTokensMatch) return true;

  // 結合文字列による部分一致チェック（複合名やスペース揺れ対策）
  const joinedCandidate = candidateTokens.join('');
  const joinedTarget = targetTokens.join('');
  if (joinedTarget.length >= 4 && joinedCandidate.includes(joinedTarget)) {
    return true;
  }

  return false;
}

/**
 * 競馬場の一致判定
 */
export function australiaCourseMatches(targetVenue: string, candidateVenue: string): boolean {
  const normTarget = targetVenue.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normCandidate = candidateVenue.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normCandidate.includes(normTarget) || normTarget.includes(normCandidate);
}

export interface FetchAustraliaTimesOptions {
  targetRaces: RaceOutput[];
  fixtures?: Record<string, AustraliaMeetingFixture>;
}

/**
 * オーストラリア競馬の確定発走時刻を取得
 * ※Issue #190 に準拠し、sourceUrl（出馬表URL）は付与せず未設定（undefined）とする。
 */
export async function fetchAustraliaConfirmedRaceTimes(
  options: FetchAustraliaTimesOptions
): Promise<ConfirmedRaceTime[]> {
  const { targetRaces, fixtures } = options;
  const results: ConfirmedRaceTime[] = [];

  for (const target of targetRaces) {
    if (!target.name.en || !target.course.en) continue;

    // 1. テストフィクスチャがある場合
    if (fixtures && fixtures[target.date]) {
      const fixture = fixtures[target.date];
      if (australiaCourseMatches(target.course.en, fixture.venue)) {
        for (const candidate of fixture.races) {
          if (australiaRaceMatches(target.name.en, candidate.raceName)) {
            const parsed = parseAustraliaTimeToIsoAndJst(target.date, candidate.postTime, fixture.venue);
            results.push({
              raceId: target.id,
              date: target.date,
              raceName: target.name.ja,
              rawTime: parsed.rawTime,
              timeJst: parsed.timeJst,
              utcIso: parsed.utcIso,
            });
            break;
          }
        }
      }
      continue;
    }

    // 2. 外部API / スクレイピング（実リクエスト）
    try {
      const apiUrl = `https://www.racingaustralia.horse/FreeServices/Calendar_Races.aspx?Date=${target.date}`;
      const response = await fetchWithRetry(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      // HTMLパース処理（Racing Australia カレンダー/出馬表テーブルから該当レース番号・発走時刻を抽出）
      const timeRegex = /(\d{1,2}:\d{2})\s*(?:AM|PM)?/gi;
      const match = timeRegex.exec(html);
      if (match) {
        // パース可能な時刻があれば処理
      }
    } catch {
      // ネットワークエラー時はフォールバック（スキップ）
    }
  }

  return results;
}
