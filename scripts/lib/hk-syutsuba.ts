import { ConfirmedRaceTime } from './jra-syutsuba';
import type { RaceOutput } from '../update-race-times';

export type { ConfirmedRaceTime };

const HK_STOP_WORDS = new Set([
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
  'VASE',
  'SPRINT',
  'MILE',
  'PLATE',
  'BOWL',
  'PURSE',
  'CHALLENGE',
  'RACE',
  'GROUP',
  'GRADE',
]);

const HK_SPONSORS = [
  'FWD',
  'BOCHK PRIVATE WEALTH',
  'BOCHK PRIVATE BANKING',
  'BOCHK',
  'LONGINES',
  'BMW',
  'CITI',
  'STANDARD CHARTERED',
  'SA SA',
  'HKSAR',
];

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
          Accept: 'application/json, text/html, */*',
          'Accept-Language': 'en-US,en;q=0.9,zh-HK;q=0.8,zh;q=0.7',
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
          `[HK Syutsuba] Fetch error for ${url} (attempt ${attempt}/${maxRetries}): ${(err as Error).message}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

/**
 * 香港現地時刻（HH:mm または HH:mm:ss）から UTC ISO 8601 文字列および JST HH:mm 表記を生成
 * 香港時間 (HKT) は UTC+8 固定（通年夏時間なし、HKT - 8時間 = UTC、JST = HKT + 1時間）
 */
export function parseHkTimeToIsoAndJst(
  dateYmd: string,
  timeLocal: string
): {
  utcIso: string;
  timeJst: string;
  rawTime: string;
} {
  const parts = timeLocal.trim().split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;

  const [y, m, d] = dateYmd.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d, hours - 8, minutes, seconds));

  // JST は UTC+9 (HKT + 1h)
  const jstDate = new Date(utcDate.getTime() + 9 * 3600 * 1000);
  const jstH = String(jstDate.getUTCHours()).padStart(2, '0');
  const jstM = String(jstDate.getUTCMinutes()).padStart(2, '0');

  return {
    utcIso: utcDate.toISOString(),
    timeJst: `${jstH}:${jstM}`,
    rawTime: timeLocal.trim(),
  };
}

const HK_ALIASES: [RegExp, string][] = [
  [/QUEEN\s+ELIZABETH\s+II/g, 'QEII'],
  [/QUEEN\s+ELIZABETH\s+2/g, 'QEII'],
  [/QE2\b/g, 'QEII'],
  [/CHAMPIONS\s*&\s*CHATER/g, 'CHAMPIONS CHATER'],
  [/HONG\s+KONG\s+SPECIAL\s+ADMINISTRATIVE\s+REGION/g, 'HKSAR'],
  [/CHIEF\s+EXECUTIVE\s*S/g, 'CHIEF EXECUTIVE'],
];

/**
 * レース名文字列を正規化（小文字化、記号除去、スポンサー名除去、エイリアス統一）
 */
export function normalizeHkRaceName(name: string): string {
  let normalized = name.toUpperCase();
  for (const sponsor of HK_SPONSORS) {
    normalized = normalized.replace(sponsor, '');
  }
  for (const [pattern, replacement] of HK_ALIASES) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * レース名が一致するか判定（英語名、繁体字中国語名、主要キーワード）
 */
export function hkRaceMatches(
  targetEn: string,
  candidateName: string,
  targetZh?: string
): boolean {
  if (!candidateName) return false;

  // 1. 中国語名が指定されている場合の部分一致・完全一致
  if (targetZh && candidateName.includes(targetZh)) {
    return true;
  }

  // 2. 英語名での正規化一致
  const normTarget = normalizeHkRaceName(targetEn);
  const normCandidate = normalizeHkRaceName(candidateName);

  if (normTarget === normCandidate) return true;
  if (normCandidate.includes(normTarget) || normTarget.includes(normCandidate)) return true;

  // 3. 主要単語トークン一致
  const targetTokens = normTarget.split(' ').filter((t) => t.length > 2 && !HK_STOP_WORDS.has(t));
  const candidateTokens = new Set(
    normCandidate.split(' ').filter((t) => t.length > 2 && !HK_STOP_WORDS.has(t))
  );

  if (targetTokens.length === 0) return false;
  const matchCount = targetTokens.filter((t) => candidateTokens.has(t)).length;
  return matchCount >= Math.min(2, targetTokens.length);
}

/**
 * 競馬場名が一致するか判定（Sha Tin, Happy Valley）
 */
export function hkCourseMatches(targetCourse: string, candidateCourse: string): boolean {
  if (!targetCourse || !candidateCourse) return true;
  const cTarget = targetCourse.toLowerCase();
  const cCand = candidateCourse.toLowerCase();

  if (cTarget.includes('sha tin') || cTarget.includes('シャティン') || cTarget.includes('沙田')) {
    return cCand.includes('sha tin') || cCand.includes('st') || cCand.includes('沙田');
  }
  if (cTarget.includes('happy valley') || cTarget.includes('ハッピーバレー') || cTarget.includes('跑馬地')) {
    return cCand.includes('happy valley') || cCand.includes('hv') || cCand.includes('跑馬地');
  }
  return true;
}

export interface HkjcRaceItem {
  raceNo: number;
  raceName: string;
  raceNameZh?: string;
  time: string; // "14:45" (HKT)
  course?: string;
  distance?: number;
}

/**
 * HKJC出馬表HTMLからレース一覧を抽出
 */
export function parseHkjcHtml(html: string): HkjcRaceItem[] {
  const races: HkjcRaceItem[] = [];

  // パターン1: HKJC 出馬表テーブル行
  // 例: <tr ... class="... font13 ..."> ... <td ...>1</td> ... <td ...>13:00</td> ... <td>Chinese Club Challenge Cup</td>
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    // 時間パターン (HH:mm)
    const timeMatch = rowHtml.match(/\b([012]?\d:[0-5]\d)\b/);
    if (!timeMatch) continue;

    // レース番号
    const noMatch = rowHtml.match(/Race\s*(\d+)/i) || rowHtml.match(/>\s*(\d{1,2})\s*</);
    const raceNo = noMatch ? parseInt(noMatch[1], 10) : races.length + 1;

    // レース名（タグを除去したテキスト群から判定）
    const cellTexts = rowHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .split(/<\/?td[^>]*>/i)
      .map((c) => c.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean);

    // テキストから英語または中文レース名候補を抽出
    const raceName = cellTexts.find(
      (text) =>
        text.length > 3 &&
        !/^\d+$/.test(text) &&
        !/^\d{1,2}:\d{2}$/.test(text) &&
        !/^Race\s*\d+$/i.test(text)
    );

    if (raceName) {
      races.push({
        raceNo,
        raceName,
        time: timeMatch[1],
      });
    }
  }

  return races;
}

/**
 * HKJC の出馬表アイテム群から対象レースの確定発走時刻を抽出
 */
export function parseHkjcRacecards(
  raceItems: HkjcRaceItem[],
  targetRaces: RaceOutput[],
  targetDateYmd: string
): ConfirmedRaceTime[] {
  const confirmed: ConfirmedRaceTime[] = [];

  for (const targetRace of targetRaces) {
    const enName = targetRace.name.en || '';
    const jaName = targetRace.name.ja || '';
    const zhName = (targetRace.name as any).zh || '';
    const targetCourse = targetRace.course.en || targetRace.course.ja || '';

    const matched = raceItems.find((item) => {
      const courseOk = item.course ? hkCourseMatches(targetCourse, item.course) : true;
      if (!courseOk) return false;
      return hkRaceMatches(enName, item.raceName, zhName || item.raceNameZh);
    });

    if (matched && matched.time) {
      const { utcIso, timeJst, rawTime } = parseHkTimeToIsoAndJst(targetDateYmd, matched.time);
      confirmed.push({
        raceName: jaName,
        date: targetDateYmd,
        timeJst,
        rawTime,
        raceId: targetRace.id,
        utcIso,
        sourceUrl: `https://racing.hkjc.com/racing/information/English/Racing/RaceCard.aspx?RaceDate=${targetDateYmd.replace(/-/g, '/')}`,
      });
    }
  }

  return confirmed;
}

export interface FetchHkConfirmedOptions {
  targetRaces: RaceOutput[];
  fixtures?: Record<string, HkjcRaceItem[] | string>; // アイテム配列またはHTML
  delayMs?: number;
}

/**
 * 香港競馬（HKJC）の確定発走予定時刻を取得
 */
export async function fetchHkConfirmedRaceTimes(
  options: FetchHkConfirmedOptions
): Promise<ConfirmedRaceTime[]> {
  const { targetRaces, fixtures, delayMs = 300 } = options;
  if (!targetRaces || targetRaces.length === 0) return [];

  const dateMap = new Map<string, RaceOutput[]>();
  for (const r of targetRaces) {
    const list = dateMap.get(r.date) || [];
    list.push(r);
    dateMap.set(r.date, list);
  }

  const allConfirmed: ConfirmedRaceTime[] = [];

  for (const [dateYmd, racesOnDate] of dateMap.entries()) {
    let raceItems: HkjcRaceItem[] | null = null;

    if (fixtures && fixtures[dateYmd]) {
      const fixtureData = fixtures[dateYmd];
      if (typeof fixtureData === 'string') {
        raceItems = parseHkjcHtml(fixtureData);
      } else {
        raceItems = fixtureData;
      }
    } else {
      const urlDate = dateYmd.replace(/-/g, '/');
      const url = `https://racing.hkjc.com/racing/information/English/Racing/RaceCard.aspx?RaceDate=${urlDate}`;
      try {
        console.log(`[HK Syutsuba] Fetching HKJC racecard for ${dateYmd}...`);
        const res = await fetchWithRetry(url);
        if (res.ok) {
          const text = await res.text();
          raceItems = parseHkjcHtml(text);
        } else {
          console.warn(`[HK Syutsuba] HTTP ${res.status} when fetching ${url}`);
        }
      } catch (err) {
        console.warn(`[HK Syutsuba] Failed to fetch HKJC racecard for ${dateYmd}: ${(err as Error).message}`);
      }

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    if (raceItems && raceItems.length > 0) {
      const confirmedOnDate = parseHkjcRacecards(raceItems, racesOnDate, dateYmd);
      allConfirmed.push(...confirmedOnDate);
    }
  }

  return allConfirmed;
}
