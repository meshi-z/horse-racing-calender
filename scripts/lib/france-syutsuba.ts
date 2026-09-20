import { ConfirmedRaceTime } from './jra-syutsuba';
import type { RaceOutput } from '../update-race-times';

export type { ConfirmedRaceTime };

const STOP_WORDS = new Set([
  'DE',
  'DU',
  'D',
  'LA',
  'LE',
  'L',
  'DES',
  'AU',
  'AUX',
  'SUR',
  'EN',
  'ET',
  'UN',
  'UNE',
]);

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
          'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
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
          `[France Syutsuba] Fetch error for ${url} (attempt ${attempt}/${maxRetries}): ${(err as Error).message}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * フランス語文字列を正規化し、意味のある単語トークンに分割
 */
export function tokenizeFrench(str: string): string[] {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // アクセント記号除去
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

/**
 * フランス重賞名とPMU出馬表レース名のマッチング判定
 */
export function frenchRaceMatches(targetName: string, candidateLibelle: string): boolean {
  const targetTokens = tokenizeFrench(targetName);
  const candidateTokens = tokenizeFrench(candidateLibelle);
  const candidateSet = new Set(candidateTokens);

  // 'PRIX' を除いた固有単語を抽出
  const distTokens = targetTokens.filter((t) => t !== 'PRIX');
  if (distTokens.length === 0) {
    return targetTokens.every((t) => candidateSet.has(t));
  }

  // 固有単語がすべて candidate に含まれているかチェック
  const allTokensMatch = distTokens.every((t) => candidateSet.has(t));
  if (allTokensMatch) return true;

  // 結合文字列による部分一致チェック（複合名やスペース揺れ対策）
  const joinedCandidate = candidateTokens.join('');
  const joinedDist = distTokens.join('');
  if (joinedDist.length >= 4 && joinedCandidate.includes(joinedDist)) {
    return true;
  }

  return false;
}

/**
 * PMUミリ秒タイムスタンプから UTC ISO 8601 文字列および JST HH:mm 表記を生成
 */
export function parsePmuTimestampToIsoAndJst(timestampMs: number): {
  utcIso: string;
  timeJst: string;
  rawTime: string;
} {
  const date = new Date(timestampMs);
  const utcIso = date.toISOString();

  // JST は UTC+9
  const jstDate = new Date(timestampMs + 9 * 3600 * 1000);
  const jstHours = String(jstDate.getUTCHours()).padStart(2, '0');
  const jstMinutes = String(jstDate.getUTCMinutes()).padStart(2, '0');
  const timeJst = `${jstHours}:${jstMinutes}`;

  return {
    utcIso,
    timeJst,
    rawTime: `${timeJst} JST`,
  };
}

export interface PmuCourseItem {
  numOrdre: number;
  libelle: string;
  heureDepart: number;
  specialite?: string;
  disciplinesMere?: string;
}

export interface PmuReunionItem {
  numOfficiel?: number;
  hippodrome?: {
    code?: string;
    libelleCourt?: string;
    libelleLong?: string;
  };
  specialite?: string;
  disciplinesMere?: string[];
  courses?: PmuCourseItem[];
}

export interface PmuProgrammeResponse {
  programme?: {
    date?: number;
    reunions?: PmuReunionItem[];
  };
  timestampPMU?: number;
}

/**
 * PMU の当日プログラムJSONから対象レースの確定発走時刻を抽出
 */
export function parsePmuProgrammeJson(
  data: PmuProgrammeResponse,
  targetRaces: RaceOutput[],
  targetDateYmd: string
): ConfirmedRaceTime[] {
  const confirmed: ConfirmedRaceTime[] = [];
  const reunions = data.programme?.reunions || [];

  for (const targetRace of targetRaces) {
    let matchedCourse: PmuCourseItem | null = null;

    const frName = (targetRace.name as { fr?: string }).fr || '';
    const enName = targetRace.name.en || '';
    const jaName = targetRace.name.ja || '';

    for (const reunion of reunions) {
      const courses = reunion.courses || [];
      for (const course of courses) {
        // フランス語名、英語名の双方で照合
        const matchesFr = frName ? frenchRaceMatches(frName, course.libelle) : false;
        const matchesEn = enName ? frenchRaceMatches(enName, course.libelle) : false;

        if (matchesFr || matchesEn) {
          matchedCourse = course;
          break;
        }
      }
      if (matchedCourse) break;
    }

    if (matchedCourse && matchedCourse.heureDepart) {
      const { utcIso, timeJst, rawTime } = parsePmuTimestampToIsoAndJst(matchedCourse.heureDepart);
      confirmed.push({
        raceName: jaName,
        date: targetDateYmd,
        timeJst,
        rawTime,
        raceId: targetRace.id,
        utcIso,
        sourceUrl: `https://www.pmu.fr/turf/`,
      });
    }
  }

  return confirmed;
}

export interface FetchFranceConfirmedOptions {
  targetRaces: RaceOutput[];
  fixtures?: Record<string, PmuProgrammeResponse>;
  delayMs?: number;
}

/**
 * フランス競馬（France Galop）の確定発走予定時刻を取得
 */
export async function fetchFranceConfirmedRaceTimes(
  options: FetchFranceConfirmedOptions
): Promise<ConfirmedRaceTime[]> {
  const { targetRaces, fixtures, delayMs = 300 } = options;
  if (!targetRaces || targetRaces.length === 0) return [];

  // 対象となる日付 (YYYY-MM-DD) の一意な一覧を取得
  const dateMap = new Map<string, RaceOutput[]>();
  for (const r of targetRaces) {
    const list = dateMap.get(r.date) || [];
    list.push(r);
    dateMap.set(r.date, list);
  }

  const allConfirmed: ConfirmedRaceTime[] = [];

  for (const [dateYmd, racesOnDate] of dateMap.entries()) {
    const [y, m, d] = dateYmd.split('-');
    const ddmmyyyy = `${d}${m}${y}`;

    let programmeData: PmuProgrammeResponse | null = null;

    if (fixtures && fixtures[ddmmyyyy]) {
      programmeData = fixtures[ddmmyyyy];
    } else {
      const url = `https://offline.turfinfo.api.pmu.fr/rest/client/7/programme/${ddmmyyyy}`;
      try {
        console.log(`[France Syutsuba] Fetching PMU programme for ${dateYmd} (${ddmmyyyy})...`);
        const res = await fetchWithRetry(url);
        if (res.ok) {
          programmeData = (await res.json()) as PmuProgrammeResponse;
        } else {
          console.warn(`[France Syutsuba] HTTP ${res.status} when fetching ${url}`);
        }
      } catch (err) {
        console.warn(`[France Syutsuba] Failed to fetch PMU programme for ${dateYmd}: ${(err as Error).message}`);
      }

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    if (programmeData) {
      const confirmedOnDate = parsePmuProgrammeJson(programmeData, racesOnDate, dateYmd);
      allConfirmed.push(...confirmedOnDate);
    }
  }

  return allConfirmed;
}
