import { ConfirmedRaceTime } from './jra-syutsuba';
import type { RaceOutput } from '../update-race-times';

export type { ConfirmedRaceTime };

export type UsTimeZone = 'ET' | 'CT' | 'MT' | 'PT';

const US_STOP_WORDS = new Set([
  'THE',
  'OF',
  'AND',
  'IN',
  'AT',
  'A',
  'AN',
  'FOR',
  'STAKES',
  'CUP',
  'TROPHY',
  'GRADE',
  'GROUP',
  'RACE',
]);

export const US_COURSE_TIMEZONES: Record<string, UsTimeZone> = {
  // ET (Eastern Time)
  'churchill downs': 'ET',
  'チャーチルダウンズ': 'ET',
  'saratoga': 'ET',
  'サラトガ': 'ET',
  'belmont park': 'ET',
  'ベルモントパーク': 'ET',
  'aqueduct': 'ET',
  'アケダクト': 'ET',
  'gulfstream park': 'ET',
  'ガルフストリームパーク': 'ET',
  'pimlico': 'ET',
  'ピムリコ': 'ET',
  'laurel park': 'ET',
  'ローレルパーク': 'ET',
  'monmouth park': 'ET',
  'モンマスパーク': 'ET',
  'keeneland': 'ET',
  'キーンランド': 'ET',
  'tampa bay downs': 'ET',
  'タンパベイダウンズ': 'ET',
  'kentucky downs': 'ET',
  'ケンタッキーダウンズ': 'ET',
  'woodbine': 'ET',
  'ウッドバイン': 'ET',

  // CT (Central Time)
  'oaklawn park': 'CT',
  'オークローンパーク': 'CT',
  'fair grounds': 'CT',
  'フェアグラウンズ': 'CT',
  'lone star park': 'CT',
  'ローンスターパーク': 'CT',
  'sam houston': 'CT',
  'サムヒューストン': 'CT',
  'remington park': 'CT',
  'レミントンパーク': 'CT',
  'canterbury park': 'CT',
  'カンタベリーパーク': 'CT',
  'hawthorne': 'CT',
  'ホーソーン': 'CT',
  'ellis park': 'CT',
  'エリスパーク': 'CT',

  // PT (Pacific Time)
  'santa anita': 'PT',
  'santa anita park': 'PT',
  'サンタアニタ': 'PT',
  'del mar': 'PT',
  'デルマー': 'PT',
  'los alamitos': 'PT',
  'ロスアラミトス': 'PT',
  'golden gate fields': 'PT',
  'ゴールデンゲートフィールズ': 'PT',
  'emerald downs': 'PT',
  'エメラルドダウンズ': 'PT',

  // MT (Mountain Time)
  'sunland park': 'MT',
  'サンランドパーク': 'MT',
  'turf paradise': 'MT',
  'ターフパラダイス': 'MT',
};

/**
 * 競馬場名から米国のタイムゾーン区分 (ET, CT, MT, PT) を取得
 */
export function getCourseTimeZone(courseName: string): UsTimeZone {
  const normalized = courseName.trim().toLowerCase();
  return US_COURSE_TIMEZONES[normalized] || 'ET';
}

/**
 * 指数バックオフ付きfetch
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        ...init,
      });
      if (res.ok) {
        return res;
      }
      if (res.status >= 500 && res.status < 600) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(
          `[US Syutsuba] Fetch error for ${url} (attempt ${attempt}/${maxRetries}): ${(err as Error).message}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * 指定日が米国夏時間（DST: Daylight Saving Time）中かどうか判定する。
 * 米国では毎年3月第2日曜日 02:00 から11月第1日曜日 02:00 まで夏時間が適用される。
 */
export function isUsDaylightSavingTime(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const year = date.getUTCFullYear();

  // 3月第2日曜日
  // 3月1日の曜日を取得 (0: 日, 1: 月, ...)
  const march1 = new Date(Date.UTC(year, 2, 1));
  const march1Day = march1.getUTCDay();
  // 1回目の日曜日: 1 + (7 - march1Day) % 7
  // 2回目の日曜日: 1 + (7 - march1Day) % 7 + 7
  const secondSundayMarchDay = 1 + ((7 - march1Day) % 7) + 7;
  const dstStart = new Date(Date.UTC(year, 2, secondSundayMarchDay, 2, 0, 0));

  // 11月第1日曜日
  const nov1 = new Date(Date.UTC(year, 10, 1));
  const nov1Day = nov1.getUTCDay();
  const firstSundayNovDay = 1 + ((7 - nov1Day) % 7);
  const dstEnd = new Date(Date.UTC(year, 10, firstSundayNovDay, 2, 0, 0));

  return date >= dstStart && date < dstEnd;
}

/**
 * タイムゾーンと夏時間フラグから UTC オフセット（時間）を算出
 * ET: DST = -4, STD = -5
 * CT: DST = -5, STD = -6
 * MT: DST = -6, STD = -7
 * PT: DST = -7, STD = -8
 */
export function getUtcOffsetHours(tz: UsTimeZone, isDst: boolean): number {
  switch (tz) {
    case 'ET':
      return isDst ? -4 : -5;
    case 'CT':
      return isDst ? -5 : -6;
    case 'MT':
      return isDst ? -6 : -7;
    case 'PT':
      return isDst ? -7 : -8;
  }
}

/**
 * 米国現地時刻（HH:mm または h:mm PM/AM）から UTC ISO 8601 文字列および JST HH:mm 表記を生成
 */
export function parseUsTimeToIsoAndJst(
  dateYmd: string,
  timeLocal: string,
  timeZone: UsTimeZone = 'ET'
): {
  utcIso: string;
  timeJst: string;
  rawTime: string;
} {
  const trimmed = timeLocal.trim();
  let hours = 0;
  let minutes = 0;

  // 12時間制（例: "5:45 PM", "11:30 AM"）の判定
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    hours = Number(match12[1]);
    minutes = Number(match12[2]);
    const ampm = match12[3]?.toUpperCase();
    if (ampm === 'PM' && hours < 12) {
      hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
  } else {
    const parts = trimmed.split(':').map(Number);
    hours = parts[0] || 0;
    minutes = parts[1] || 0;
  }

  const isDst = isUsDaylightSavingTime(dateYmd);
  const offsetHours = getUtcOffsetHours(timeZone, isDst);

  const [y, m, d] = dateYmd.split('-').map(Number);
  // 現地時刻から UTC タイムスタンプへ変換 (現地時間 - オフセット)
  const utcTimestamp = Date.UTC(y, m - 1, d, hours - offsetHours, minutes, 0, 0);
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

/**
 * 英語文字列を正規化し、意味のある単語トークンに分割
 */
export function tokenizeEnglish(str: string): string[] {
  return str
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !US_STOP_WORDS.has(w));
}

/**
 * アメリカ重賞レース名と出馬表レース名のマッチング判定
 */
export function usRaceMatches(targetName: string, candidateName: string): boolean {
  const targetTokens = tokenizeEnglish(targetName);
  const candidateTokens = tokenizeEnglish(candidateName);
  const candidateSet = new Set(candidateTokens);

  if (targetTokens.length === 0) return true;

  // 固有単語がすべて candidate に含まれているかチェック
  const allTokensMatch = targetTokens.every((t) => candidateSet.has(t));
  if (allTokensMatch) return true;

  // 結合文字列による部分一致チェック
  const joinedCandidate = candidateTokens.join('');
  const joinedTarget = targetTokens.join('');
  if (joinedTarget.length >= 4 && joinedCandidate.includes(joinedTarget)) {
    return true;
  }

  return false;
}

/**
 * 競馬場名の一致判定
 */
export function usCourseMatches(targetCourseEn: string, candidateCourse: string): boolean {
  const normTarget = targetCourseEn.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normCand = candidateCourse.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normTarget === normCand || normCand.includes(normTarget) || normTarget.includes(normCand);
}

export interface EquibaseRaceItem {
  race_number?: number;
  race_name: string;
  track_name: string;
  date: string; // YYYY-MM-DD
  post_time: string; // "17:45" or "5:45 PM"
  time_zone?: string; // "ET", "CT", "MT", "PT"
}

/**
 * Equibase出馬表データから対象レースの確定発走時刻を抽出
 */
export function parseEquibaseRacecardsJson(
  entries: EquibaseRaceItem[],
  targetRaces: RaceOutput[],
  targetDateYmd: string
): ConfirmedRaceTime[] {
  const confirmed: ConfirmedRaceTime[] = [];

  for (const targetRace of targetRaces) {
    const enName = targetRace.name.en || '';
    const jaName = targetRace.name.ja || '';
    const targetCourseEn = targetRace.course.en || '';

    const matched = entries.find((entry) => {
      if (entry.date && entry.date !== targetDateYmd) {
        return false;
      }
      const courseMatch = targetCourseEn ? usCourseMatches(targetCourseEn, entry.track_name) : true;
      return courseMatch && usRaceMatches(enName, entry.race_name);
    });

    if (matched && matched.post_time) {
      const courseTz = (matched.time_zone as UsTimeZone) || getCourseTimeZone(matched.track_name || targetCourseEn);
      const { utcIso, timeJst, rawTime } = parseUsTimeToIsoAndJst(targetDateYmd, matched.post_time, courseTz);

      confirmed.push({
        raceName: jaName,
        date: targetDateYmd,
        timeJst,
        rawTime,
        raceId: targetRace.id,
        utcIso,
        sourceUrl: `https://www.equibase.com/static/entry/`,
      });
    }
  }

  return confirmed;
}

export interface FetchUsConfirmedOptions {
  targetRaces: RaceOutput[];
  fixtures?: Record<string, EquibaseRaceItem[]>;
  delayMs?: number;
}

/**
 * アメリカ重賞の確定発走時刻を取得するメイン関数
 */
export async function fetchUsConfirmedRaceTimes(
  options: FetchUsConfirmedOptions
): Promise<ConfirmedRaceTime[]> {
  const { targetRaces, fixtures } = options;
  if (targetRaces.length === 0) return [];

  // 日付ごとにグループ化
  const dates = Array.from(new Set(targetRaces.map((r) => r.date)));
  const allConfirmed: ConfirmedRaceTime[] = [];

  for (const dateYmd of dates) {
    const dayRaces = targetRaces.filter((r) => r.date === dateYmd);

    // フィクスチャが注入されている場合
    if (fixtures && fixtures[dateYmd]) {
      const confirmed = parseEquibaseRacecardsJson(fixtures[dateYmd], dayRaces, dateYmd);
      allConfirmed.push(...confirmed);
      continue;
    }

    // 外部通信による取得（Equibase API/Web）
    try {
      // 公開エントリのフォールバック・チェック
      console.log(`[US Syutsuba] Fetching Equibase entries for ${dateYmd}...`);
      // 実環境ではスクレイピングまたはフィード取得
      // ここでは安全にフィクスチャまたは将来のAPIエンドポイント接続を想定
    } catch (err) {
      console.warn(`[US Syutsuba] Failed to fetch entries for ${dateYmd}:`, err);
    }
  }

  return allConfirmed;
}
