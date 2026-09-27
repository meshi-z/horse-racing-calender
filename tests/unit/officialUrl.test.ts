import { describe, it, expect } from 'vitest';
import {
  getOfficialRaceUrl,
  getOfficialSourceLabel,
  DEFAULT_OFFICIAL_URLS,
  OFFICIAL_SOURCE_NAMES,
} from '@/libs/officialUrl';
import type { Race } from '@/types/race';

const mockBaseRace: Race = {
  id: '2026-jp-g1-01',
  organization: 'jra',
  country_code: 'JP',
  name: {
    ja: 'フェブラリーステークス',
    en: 'February Stakes',
  },
  grade: 'G1',
  date: '2026-02-22',
  start_time: '2026-02-22T06:40:00.000Z',
  is_time_confirmed: true,
  course: {
    ja: '東京競馬場',
    en: 'Tokyo Racecourse',
  },
  distance: 1600,
  track_type: 'dirt',
  sex_constraint: 'none',
  age_constraint: '4yo_and_up',
  handicap: {
    code: 'set_weight',
    ja: '定量',
    en: 'Set Weight',
  },
};

describe('officialUrl utility functions', () => {
  it('race.official_url が指定されている場合は最優先でそのURLを返すこと', () => {
    const raceWithUrl: Race = {
      ...mockBaseRace,
      official_url: 'https://www.jra.go.jp/special/february-stakes/2026/',
    };
    expect(getOfficialRaceUrl(raceWithUrl, 'ja')).toBe('https://www.jra.go.jp/special/february-stakes/2026/');
    expect(getOfficialRaceUrl(raceWithUrl, 'en')).toBe('https://www.jra.go.jp/special/february-stakes/2026/');
  });

  it('official_url が未指定の場合、各組織ごとの公式URLにフォールバックすること', () => {
    // JRA
    expect(getOfficialRaceUrl(mockBaseRace, 'ja')).toBe(DEFAULT_OFFICIAL_URLS.jra.ja);
    expect(getOfficialRaceUrl(mockBaseRace, 'en')).toBe(DEFAULT_OFFICIAL_URLS.jra.en);

    // NAR
    const narRace: Race = { ...mockBaseRace, organization: 'nar' };
    expect(getOfficialRaceUrl(narRace, 'ja')).toBe(DEFAULT_OFFICIAL_URLS.nar.ja);

    // France Galop (言語による出し分け)
    const franceRace: Race = { ...mockBaseRace, organization: 'france_galop', country_code: 'FR' };
    expect(getOfficialRaceUrl(franceRace, 'fr')).toBe('https://www.france-galop.com/fr/courses');
    expect(getOfficialRaceUrl(franceRace, 'en')).toBe('https://www.france-galop.com/en/racing');

    // BHA / Sporting Life
    const bhaRace: Race = { ...mockBaseRace, organization: 'bha', country_code: 'GB' };
    expect(getOfficialRaceUrl(bhaRace, 'en')).toBe('https://www.sportinglife.com/racing/racecards');

    // Equibase (USA)
    const usRace: Race = { ...mockBaseRace, organization: 'equibase', country_code: 'US' };
    expect(getOfficialRaceUrl(usRace, 'en')).toBe('https://www.equibase.com/stats/Entries.cfm');

    // HKJC (言語による出し分け)
    const hkRace: Race = { ...mockBaseRace, organization: 'hkjc', country_code: 'HK' };
    expect(getOfficialRaceUrl(hkRace, 'zh')).toBe(
      'https://racing.hkjc.com/racing/information/Chinese/Racing/RaceCard.aspx'
    );
    expect(getOfficialRaceUrl(hkRace, 'en')).toBe(
      'https://racing.hkjc.com/racing/information/English/Racing/RaceCard.aspx'
    );

    // HRI (Ireland)
    const ieRace: Race = { ...mockBaseRace, organization: 'hri', country_code: 'IE' };
    expect(getOfficialRaceUrl(ieRace, 'en')).toBe('https://www.hri.ie/racing/');
  });

  it('getOfficialSourceLabel が各主催者・言語に応じた表示名を返すこと', () => {
    expect(getOfficialSourceLabel('jra', 'ja')).toBe(OFFICIAL_SOURCE_NAMES.jra.ja);
    expect(getOfficialSourceLabel('france_galop', 'fr')).toBe(OFFICIAL_SOURCE_NAMES.france_galop.fr);
    expect(getOfficialSourceLabel('hkjc', 'zh')).toBe(OFFICIAL_SOURCE_NAMES.hkjc.zh);
  });
});
