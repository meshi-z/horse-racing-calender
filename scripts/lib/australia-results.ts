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
    resultUrl?: string;
    results: AustraliaRaceResultItem[];
  }>;
}

const BREEDNET_MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Breednet (breednet.com.au/stakes-race-results/ および /stakes-races) の HTML から
 * AustraliaMeetingResultItem[] をパースして構造化する。
 */
export function parseBreednetStakesResultsHtml(
  html: string,
  referenceYear: number = 2026
): AustraliaMeetingResultItem[] {
  const meetingsMap = new Map<string, AustraliaMeetingResultItem>();

  // 1. トップページ形式のパース (class="StakesHeader">... Australia Oct 10 - Caulfield: ...)
  const parts = html.split('class="StakesHeader">');
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    const header = p.split('</div>')[0].replace(/<[^>]+>/g, '').trim();

    // 形式例: Australia Oct 10 - Caulfield: Sportsbet Caulfield Guineas Gr1 1600m
    const match = header.match(/^([A-Za-z\s]+)\s+([A-Za-z]{3})\s+(\d{1,2})\s*-\s*([^:]+):\s*(.*)$/);
    if (!match) continue;

    const monStr = match[2].toLowerCase();
    const dayStr = match[3].padStart(2, '0');
    const venue = match[4].trim();
    const raceName = match[5].trim();

    const month = BREEDNET_MONTH_MAP[monStr];
    if (!month) continue;

    const date = `${referenceYear}-${month}-${dayStr}`;

    const horseMatch = p.match(/class="horsename">\s*(\d+)\s*<b><a[^>]*>([^<]+)<\/a>/i);
    const jockeyMatch = p.match(/Rdr:\s*<\/span>\s*([^<]+)/i);

    if (horseMatch) {
      const finishPos = parseInt(horseMatch[1], 10);
      const horseName = horseMatch[2].trim();
      const rawJockey = jockeyMatch ? jockeyMatch[1].trim() : undefined;
      const jockeyName = rawJockey
        ? rawJockey.replace(/\s+\d+(\.\d+)?\s*kg$/i, '').trim()
        : undefined;

      const key = `${date}_${venue}`;
      let meeting = meetingsMap.get(key);
      if (!meeting) {
        meeting = { venue, date, races: [] };
        meetingsMap.set(key, meeting);
      }

      meeting.races.push({
        raceNumber: meeting.races.length + 1,
        raceName,
        results: [
          {
            horseName,
            jockeyName,
            finishPosition: finishPos,
          },
        ],
      });
    }
  }

  // 2. アーカイブ一覧形式のパース (stakes-races: <div class="stakes-location">Oct 17 - Randwick:</div> ...)
  const archiveItemRegex = /<div class="stakes-location">([^<]+)<\/div>\s*<div class="stakes-racename"><b><a href="([^"]+)">([^<]+)<\/a>([^<]*)<\/b>[\s\S]*?<\/div>\s*<div class="horsename"><a[^>]*>([^<]+)<\/a>/g;
  let am;
  while ((am = archiveItemRegex.exec(html)) !== null) {
    const locRaw = am[1].trim(); // e.g. "Oct 17 - Randwick:"
    const link = am[2].trim();
    const raceName = am[3].trim();
    const horseName = am[5].trim();

    const locMatch = locRaw.match(/^([A-Za-z]{3})\s+(\d{1,2})\s*-\s*([^:]+):?$/);
    if (!locMatch) continue;

    const monStr = locMatch[1].toLowerCase();
    const dayStr = locMatch[2].padStart(2, '0');
    const venue = locMatch[3].trim();

    const month = BREEDNET_MONTH_MAP[monStr];
    if (!month) continue;

    const date = `${referenceYear}-${month}-${dayStr}`;
    const key = `${date}_${venue}`;

    let meeting = meetingsMap.get(key);
    if (!meeting) {
      meeting = { venue, date, races: [] };
      meetingsMap.set(key, meeting);
    }

    // 既に同一レース名が登録されているかチェック
    const existing = meeting.races.find((r) => r.raceName === raceName);
    if (!existing) {
      meeting.races.push({
        raceNumber: meeting.races.length + 1,
        raceName,
        resultUrl: link,
        results: [
          {
            horseName,
            finishPosition: 1,
          },
        ],
      });
    }
  }

  return Array.from(meetingsMap.values());
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
