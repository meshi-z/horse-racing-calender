import type { RaceOutput, RaceWinner } from '../update-race-times';
import { australiaRaceMatches, australiaCourseMatches } from './australia-syutsuba';

export interface AustraliaRaceResultItem {
  horseName: string;
  jockeyName?: string;
  time?: string;
  horseNumber?: number;
  finishPosition: number | string;
}

export interface AustraliaMeetingResultItem {
  venue: string;
  date: string; // YYYY-MM-DD
  races: Array<{
    raceNumber: number;
    raceName: string;
    winningTime?: string;
    results: AustraliaRaceResultItem[];
  }>;
}

/**
 * オーストラリア競馬のレース結果データ（JSON/オブジェクト）から、対象重賞レースの勝ち馬情報を抽出する。
 * Issue #190 に準拠し、公式リンク（official_url）は付与せず undefined を保持する。
 */
export function parseAustraliaResultsJson(
  meetings: AustraliaMeetingResultItem[],
  targetRaces: RaceOutput[]
): Map<string, RaceWinner> {
  const resultMap = new Map<string, RaceWinner>();

  for (const targetRace of targetRaces) {
    const enName = targetRace.name.en || '';
    const targetCourseEn = targetRace.course.en || '';

    let matchedMeeting: AustraliaMeetingResultItem | null = null;
    let matchedRace: AustraliaMeetingResultItem['races'][number] | null = null;

    for (const meeting of meetings) {
      if (meeting.date !== targetRace.date) continue;
      if (targetCourseEn && !australiaCourseMatches(targetCourseEn, meeting.venue)) continue;

      for (const rc of meeting.races) {
        if (australiaRaceMatches(enName, rc.raceName)) {
          matchedMeeting = meeting;
          matchedRace = rc;
          break;
        }
      }
      if (matchedRace) break;
    }

    if (!matchedRace || !matchedMeeting) continue;

    // 1着馬を抽出
    const winnerItem = matchedRace.results.find(
      (r) => r.finishPosition === 1 || r.finishPosition === '1'
    );

    if (winnerItem && winnerItem.horseName) {
      const horseNameClean = winnerItem.horseName.trim();
      const jockeyClean = winnerItem.jockeyName?.trim();
      const timeClean = winnerItem.time?.trim() || matchedRace.winningTime?.trim();

      const winner: RaceWinner = {
        name: {
          ja: targetRace.winner?.name?.ja || horseNameClean,
          en: horseNameClean,
        },
        jockey: jockeyClean
          ? {
              ja: targetRace.winner?.jockey?.ja || jockeyClean,
              en: jockeyClean,
            }
          : undefined,
        horse_number: winnerItem.horseNumber,
        time: timeClean,
      };

      resultMap.set(targetRace.id, winner);
    }
  }

  return resultMap;
}
