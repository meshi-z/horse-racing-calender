import fs from 'node:fs';
import path from 'node:path';
import type { RaceOutput } from '../parse-races';

export interface FranceMasterVenue {
  ja: string;
  en: string;
  fr?: string;
}

export interface FranceMasterRaceItem {
  id: string;
  organization: 'france_galop';
  country_code: 'FR';
  name: {
    ja: string;
    en: string;
    fr?: string;
  };
  grade: 'G1' | 'G2' | 'G3';
  date: string;
  start_time: string;
  is_time_confirmed: boolean;
  is_rescheduled?: boolean;
  original_date?: string;
  course: {
    ja: string;
    en: string;
  };
  distance: number;
  track_type: 'turf' | 'aw';
  sex_constraint: 'none' | 'filly_and_mare' | 'colt_and_filly';
  age_constraint: '2yo' | '3yo' | '3yo_and_up' | '4yo_and_up';
  handicap: {
    code: 'weight_for_age' | 'special_weight' | 'set_weight' | 'handicap';
    ja: string;
    en: string;
  };
}

export interface FranceMasterData {
  venues: Record<string, FranceMasterVenue>;
  races: FranceMasterRaceItem[];
}

/**
 * Loads France race master from src/data/france_race_master.json
 */
export function loadFranceRaceMaster(rootDir: string = process.cwd()): FranceMasterData {
  const masterPath = path.join(rootDir, 'src', 'data', 'france_race_master.json');
  if (!fs.existsSync(masterPath)) {
    throw new Error(`[France Races] Master file not found at: ${masterPath}`);
  }
  const content = fs.readFileSync(masterPath, 'utf8');
  return JSON.parse(content) as FranceMasterData;
}

/**
 * Returns France races ready to merge into racesOutput
 */
export function getFranceRaces(
  masterData: FranceMasterData,
  confirmedTimesMap: Map<string, { start_time: string; is_time_confirmed: boolean; is_rescheduled?: boolean; original_date?: string }>
): RaceOutput[] {
  return masterData.races.map((r) => {
    let startTime = r.start_time;
    let isTimeConfirmed = r.is_time_confirmed;
    let isRescheduled = r.is_rescheduled || false;
    let originalDate = r.original_date || r.date;

    const confirmedInfo = confirmedTimesMap.get(r.id) || confirmedTimesMap.get(`${r.date}_${r.name.ja}`);
    if (confirmedInfo) {
      startTime = confirmedInfo.start_time;
      isTimeConfirmed = confirmedInfo.is_time_confirmed;
      if (confirmedInfo.is_rescheduled !== undefined) {
        isRescheduled = confirmedInfo.is_rescheduled;
      }
      if (confirmedInfo.original_date) {
        originalDate = confirmedInfo.original_date;
      }
    }

    return {
      id: r.id,
      organization: 'france_galop',
      country_code: 'FR',
      name: {
        ja: r.name.ja,
        en: r.name.en,
        fr: r.name.fr,
      },
      grade: r.grade,
      date: r.date,
      start_time: startTime,
      is_time_confirmed: isTimeConfirmed,
      is_rescheduled: isRescheduled,
      original_date: originalDate,
      course: {
        ja: r.course.ja,
        en: r.course.en,
      },
      distance: r.distance,
      track_type: r.track_type,
      sex_constraint: r.sex_constraint,
      age_constraint: r.age_constraint,
      handicap: {
        code: r.handicap.code,
        ja: r.handicap.ja,
        en: r.handicap.en,
      },
    };
  });
}
