import { ConfirmedRaceTime } from './jra-syutsuba';
import type { RaceOutput } from '../update-race-times';
import type { SportingLifeMeetingItem, SportingLifeRaceItem } from './uk-syutsuba';
import { fetchWithRetry, tokenizeEnglish } from './uk-syutsuba';

export type { ConfirmedRaceTime };

/**
 * 指定日がアイルランド夏時間（IST: Irish Standard Time, UTC+1）中かどうか判定する。
 * アイルランドではイギリス（BST）と同様に毎年3月最終日曜日の01:00 GMTから10月最終日曜日の01:00 GMTまで夏時間（UTC+1）が適用される。
 */
export function isIrishSummerTime(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const year = date.getUTCFullYear();

  // 3月最終日曜日
  const march31 = new Date(Date.UTC(year, 2, 31));
  const lastSundayMarch = new Date(Date.UTC(year, 2, 31 - march31.getUTCDay(), 1, 0, 0));

  // 10月最終日曜日
  const oct31 = new Date(Date.UTC(year, 9, 31));
  const lastSundayOct = new Date(Date.UTC(year, 9, 31 - oct31.getUTCDay(), 1, 0, 0));

  return date >= lastSundayMarch && date < lastSundayOct;
}

/**
 * アイルランド現地時刻（HH:mm または HH:mm:ss）から UTC ISO 8601 文字列および JST HH:mm 表記を生成
 */
export function parseIeTimeToIsoAndJst(
  dateYmd: string,
  timeLocal: string
): {
  utcIso: string;
  timeJst: string;
  rawTime: string;
} {
  const parts = timeLocal.split(':').map(Number);
  const hours = parts[0];
  const minutes = parts[1];
  const seconds = parts.length > 2 ? parts[2] : 0;

  const isIst = isIrishSummerTime(dateYmd);
  // IST は UTC+1、GMT は UTC+0
  const utcOffsetHours = isIst ? 1 : 0;

  const [y, m, d] = dateYmd.split('-').map(Number);
  const utcTimestamp = Date.UTC(y, m - 1, d, hours - utcOffsetHours, minutes, seconds, 0);
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
 * アイルランド重賞レース名とSporting Life出馬表レース名のマッチング判定
 */
export function ieRaceMatches(targetName: string, candidateName: string): boolean {
  const targetTokens = tokenizeEnglish(targetName);
  const candidateTokens = tokenizeEnglish(candidateName);
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
 * 競馬場名の一致判定
 */
export function ieCourseMatches(targetCourseEn: string, candidateCourse: string): boolean {
  const normTarget = targetCourseEn.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normCand = candidateCourse.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normTarget === normCand || normCand.includes(normTarget) || normTarget.includes(normCand);
}

/**
 * Sporting Life の当日 racecards JSON からアイルランド対象レースの確定発走時刻を抽出
 */
export function parseSportingLifeIeRacecardsJson(
  meetings: SportingLifeMeetingItem[],
  targetRaces: RaceOutput[],
  targetDateYmd: string
): ConfirmedRaceTime[] {
  const confirmed: ConfirmedRaceTime[] = [];

  for (const targetRace of targetRaces) {
    const enName = targetRace.name.en || '';
    const jaName = targetRace.name.ja || '';
    const targetCourseEn = targetRace.course.en || '';

    let matchedRace: SportingLifeRaceItem | null = null;

    for (const meeting of meetings) {
      const meetingCourseName = meeting.meeting_summary?.course?.name || '';
      const courseMatch = targetCourseEn ? ieCourseMatches(targetCourseEn, meetingCourseName) : true;

      const races = meeting.races || [];
      for (const rc of races) {
        const rcCourse = rc.course_name || meetingCourseName;
        const currentCourseMatch = courseMatch || (targetCourseEn ? ieCourseMatches(targetCourseEn, rcCourse) : true);

        if (currentCourseMatch && ieRaceMatches(enName, rc.name)) {
          matchedRace = rc;
          break;
        }
      }
      if (matchedRace) break;
    }

    if (matchedRace && matchedRace.time) {
      const { utcIso, timeJst, rawTime } = parseIeTimeToIsoAndJst(targetDateYmd, matchedRace.time);
      confirmed.push({
        raceName: jaName,
        date: targetDateYmd,
        timeJst,
        rawTime,
        raceId: targetRace.id,
        utcIso,
        sourceUrl: `https://www.sportinglife.com/racing/racecards/${targetDateYmd}`,
      });
    }
  }

  return confirmed;
}

export interface FetchIeConfirmedOptions {
  targetRaces: RaceOutput[];
  fixtures?: Record<string, SportingLifeMeetingItem[]>;
  delayMs?: number;
}

/**
 * アイルランド競馬（HRI）の確定発走予定時刻を取得
 */
export async function fetchIeConfirmedRaceTimes(
  options: FetchIeConfirmedOptions
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
    let meetingsData: SportingLifeMeetingItem[] | null = null;

    if (fixtures && fixtures[dateYmd]) {
      meetingsData = fixtures[dateYmd];
    } else {
      const url = `https://www.sportinglife.com/api/horse-racing/racing/racecards/${dateYmd}`;
      try {
        console.log(`[Ireland Syutsuba] Fetching Sporting Life racecards for ${dateYmd}...`);
        const res = await fetchWithRetry(url);
        if (res.ok) {
          meetingsData = (await res.json()) as SportingLifeMeetingItem[];
        } else {
          console.warn(`[Ireland Syutsuba] HTTP ${res.status} when fetching ${url}`);
        }
      } catch (err) {
        console.warn(`[Ireland Syutsuba] Failed to fetch Sporting Life racecards for ${dateYmd}: ${(err as Error).message}`);
      }

      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    if (meetingsData) {
      const confirmedOnDate = parseSportingLifeIeRacecardsJson(meetingsData, racesOnDate, dateYmd);
      allConfirmed.push(...confirmedOnDate);
    }
  }

  return allConfirmed;
}
