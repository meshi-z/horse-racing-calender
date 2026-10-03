import type { RaceOutput, RaceWinner } from '../update-race-times';
import { frenchRaceMatches } from './france-syutsuba';
import { ukRaceMatches, ukCourseMatches } from './uk-syutsuba';

// ==========================================
// 1. France (PMU) レース結果パーサー
// ==========================================

export interface PmuParticipantItem {
  numPmu: number;
  nom: string;
  driver?: string;
  place?: number;
  ordreArrivee?: number;
  statut?: string;
  tempsObtenu?: string; // 例: 2'25"12
}

export interface PmuCourseResultItem {
  numOrdre: number;
  libelle: string;
  statutCourant?: string; // 'ARRIVEE', 'FIN_COURSE', etc.
  ordreArrivee?: any; // [12, 5, 8] または [[5], [10]]
  participants?: PmuParticipantItem[];
  heureDepart?: number;
}

export interface PmuProgrammeResultResponse {
  programme?: {
    date?: number;
    reunions?: Array<{
      courses?: PmuCourseResultItem[];
    }>;
  };
}

export function parsePmuResultsJson(
  data: PmuProgrammeResultResponse,
  targetRaces: RaceOutput[]
): Map<string, RaceWinner> {
  const resultMap = new Map<string, RaceWinner>();
  const reunions = data.programme?.reunions || [];

  for (const targetRace of targetRaces) {
    const frName = (targetRace.name as { fr?: string }).fr || '';
    const enName = targetRace.name.en || '';

    let matchedCourse: PmuCourseResultItem | null = null;

    for (const reunion of reunions) {
      for (const course of reunion.courses || []) {
        const matchesFr = frName ? frenchRaceMatches(frName, course.libelle) : false;
        const matchesEn = enName ? frenchRaceMatches(enName, course.libelle) : false;

        if (matchesFr || matchesEn) {
          matchedCourse = course;
          break;
        }
      }
      if (matchedCourse) break;
    }

    if (!matchedCourse) continue;

    // 着順確定チェック (statutCourant === 'ARRIVEE' / 'FIN_COURSE' または ordreArrivee / participants に1着が存在)
    const isArrivee =
      matchedCourse.statutCourant === 'ARRIVEE' ||
      matchedCourse.statutCourant === 'FIN_COURSE' ||
      (matchedCourse as any).statut === 'ARRIVEE_DEFINITIVE_COMPLETE' ||
      (matchedCourse as any).statut === 'FIN_COURSE' ||
      (matchedCourse.ordreArrivee && matchedCourse.ordreArrivee.length > 0) ||
      (matchedCourse.participants && matchedCourse.participants.some((p) => p.place === 1 || p.ordreArrivee === 1));

    if (!isArrivee) continue;

    // 1着馬の特定 (ordreArrivee は [[5], [10]] のような二重配列の場合がある)
    const raw1st = matchedCourse.ordreArrivee?.[0];
    const winningNum = Array.isArray(raw1st) ? raw1st[0] : raw1st;
    const participants = matchedCourse.participants || [];

    const winningHorse =
      (winningNum !== undefined ? participants.find((p) => p.numPmu === winningNum) : null) ||
      participants.find((p) => p.place === 1 || p.ordreArrivee === 1);

    if (winningHorse && winningHorse.nom) {
      // タイム表記の整形: 2'25"12 -> 2:25.12
      let timeFormatted = winningHorse.tempsObtenu;
      if (timeFormatted) {
        timeFormatted = timeFormatted.replace(/'/g, ':').replace(/"/g, '.');
      }

      // ドライバー名整形: M. GUYON -> M. Guyon
      const jockeyRaw = winningHorse.driver || '';
      const jockeyFormatted = jockeyRaw
        ? jockeyRaw
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ')
        : undefined;

      const horseNameCapitalized = winningHorse.nom
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      resultMap.set(targetRace.id, {
        name: {
          ja: targetRace.winner?.name?.ja || horseNameCapitalized,
          en: horseNameCapitalized,
          fr: horseNameCapitalized,
        },
        jockey: jockeyFormatted
          ? {
              ja: targetRace.winner?.jockey?.ja || jockeyFormatted,
              en: jockeyFormatted,
              fr: jockeyFormatted,
            }
          : undefined,
        horse_number: winningHorse.numPmu,
        time: timeFormatted,
      });
    }
  }

  return resultMap;
}

// ==========================================
// 2. UK / Ireland (Sporting Life) レース結果パーサー
// ==========================================

export interface SportingLifeRideItem {
  finish_position?: number | string;
  cloth_number?: number;
  saddle_cloth_number?: number;
  horse_name?: string;
  jockey_name?: string;
  official_winning_time?: string;
}

export interface SportingLifeResultRaceItem {
  name: string;
  course_name: string;
  date: string;
  time?: string;
  race_stage?: string; // 'Official', 'WeighedIn', etc.
  winning_time?: string;
  rides?: SportingLifeRideItem[];
  results?: SportingLifeRideItem[];
  top_horses?: Array<{ name: string; position: number }>;
}

export interface SportingLifeResultMeetingItem {
  meeting_summary?: {
    course?: {
      name?: string;
    };
  };
  races?: SportingLifeResultRaceItem[];
}

export function parseSportingLifeResultsJson(
  meetings: SportingLifeResultMeetingItem[],
  targetRaces: RaceOutput[]
): Map<string, RaceWinner> {
  const resultMap = new Map<string, RaceWinner>();

  for (const targetRace of targetRaces) {
    const enName = targetRace.name.en || '';
    const targetCourseEn = targetRace.course.en || '';

    let matchedRace: SportingLifeResultRaceItem | null = null;

    for (const meeting of meetings) {
      const meetingCourseName = meeting.meeting_summary?.course?.name || '';
      const courseMatch = targetCourseEn ? ukCourseMatches(targetCourseEn, meetingCourseName) : true;

      for (const rc of meeting.races || []) {
        const rcCourse = rc.course_name || meetingCourseName;
        const currentCourseMatch = courseMatch || (targetCourseEn ? ukCourseMatches(targetCourseEn, rcCourse) : true);

        if (currentCourseMatch && ukRaceMatches(enName, rc.name)) {
          matchedRace = rc;
          break;
        }
      }
      if (matchedRace) break;
    }

    if (!matchedRace) continue;

    // 着順確定チェック
    const rides = matchedRace.results || matchedRace.rides || [];
    const winnerRide = rides.find(
      (r) => r.finish_position === 1 || r.finish_position === '1'
    );

    if (winnerRide && winnerRide.horse_name) {
      const horseNumber = winnerRide.cloth_number ?? winnerRide.saddle_cloth_number;
      const horseName = winnerRide.horse_name.trim();
      const jockey = winnerRide.jockey_name ? winnerRide.jockey_name.trim() : undefined;
      const time = winnerRide.official_winning_time || matchedRace.winning_time;

      resultMap.set(targetRace.id, {
        name: {
          ja: targetRace.winner?.name?.ja || horseName,
          en: horseName,
        },
        jockey: jockey
          ? {
              ja: targetRace.winner?.jockey?.ja || jockey,
              en: jockey,
            }
          : undefined,
        horse_number: horseNumber,
        time: time,
      });
    } else if (matchedRace.top_horses && matchedRace.top_horses.length > 0) {
      const top1 = matchedRace.top_horses.find((h: any) => h.position === 1) || matchedRace.top_horses[0];
      if (top1 && top1.name) {
        const horseName = top1.name.trim();
        resultMap.set(targetRace.id, {
          name: {
            ja: targetRace.winner?.name?.ja || horseName,
            en: horseName,
          },
          time: matchedRace.winning_time,
        });
      }
    }
  }

  return resultMap;
}

// ==========================================
// 3. Hong Kong (HKJC) レース結果パーサー
// ==========================================

export interface HkjcParsedResult {
  raceNo?: number;
  raceNameEn?: string;
  raceNameZh?: string;
  winner: {
    horseNameEn: string;
    horseNameZh?: string;
    horseNumber?: number;
    jockey?: string;
    time?: string;
  };
}

export function parseHkjcResultHtml(html: string): HkjcParsedResult[] {
  const results: HkjcParsedResult[] = [];

  // HKJC 結果テーブルの各行 (<tr ...> ... <td>01</td> ... <td>1</td> ... <td>Romantic Warrior</td> ... </tr>)
  const trMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

  for (const trMatch of trMatches) {
    const row = trMatch[1];

    // 着順 1 または 01
    const rankMatch =
      row.match(/<td[^>]*class=["'][^"']*(?:place|rank)[^"']*["'][^>]*>\s*(?:1|01)\s*<\/td>/i) ||
      row.match(/<td[^>]*>\s*(?:1|01)\s*<\/td>/i);
    if (!rankMatch) continue;

    // 各 td セルを抽出
    const tdMatches = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim()
    );

    if (tdMatches.length >= 4) {
      // 典型的なHKJC構造: [0]=着順(01), [1]=馬番(1), [2]=馬名, [3]=騎手 ... 末尾近くにタイム
      const horseNumber = parseInt(tdMatches[1], 10);
      const horseName = tdMatches[2];
      const jockey = tdMatches[3];

      let time: string | undefined;
      for (const td of tdMatches) {
        if (/^\d{1,2}\.\d{2}\.\d{2}$/.test(td) || /^\d{1,2}:\d{2}\.\d{2}$/.test(td)) {
          time = td.replace(/^(\d{1,2})\.(\d{2})\.(\d{2})$/, '$1:$2.$3');
          break;
        }
      }

      if (horseName) {
        const cleanHorseName = horseName
          .replace(/&nbsp;/gi, ' ')
          .replace(/\s*\([A-Z0-9]+\)\s*$/, '')
          .replace(/\s+/g, ' ')
          .trim();
        const cleanJockey = jockey
          ? jockey.replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()
          : undefined;

        results.push({
          winner: {
            horseNameEn: cleanHorseName,
            horseNumber: !isNaN(horseNumber) ? horseNumber : undefined,
            jockey: cleanJockey,
            time,
          },
        });
        break;
      }
    }
  }

  return results;
}

// ==========================================
// 4. US (Equibase) レース結果パーサー
// ==========================================

export interface EquibaseParsedResult {
  raceName?: string;
  winner: {
    horseName: string;
    horseNumber?: number;
    jockey?: string;
    time?: string;
  };
}

export function parseEquibaseResultHtml(html: string): EquibaseParsedResult[] {
  const results: EquibaseParsedResult[] = [];

  // Equibase チャートテーブル行 (1st place)
  const trMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

  for (const trMatch of trMatches) {
    const row = trMatch[1];
    // 1st place 指標
    if (!row.includes('>1<') && !row.includes('>1st<') && !row.includes('first')) continue;

    const tdMatches = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)).map((m) =>
      m[1].replace(/<[^>]+>/g, '').trim()
    );

    if (tdMatches.length >= 3) {
      // 馬名と騎手を探索
      const horseName = tdMatches.find((t) => t.length > 2 && /^[A-Za-z\s'\-]+$/.test(t));
      if (horseName) {
        results.push({
          winner: {
            horseName,
          },
        });
        break;
      }
    }
  }

  return results;
}
