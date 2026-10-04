import { describe, it, expect } from 'vitest';
import {
  getOfficialRaceUrl,
  getOfficialSourceLabel,
  OFFICIAL_SOURCE_NAMES,
  ENABLE_OFFICIAL_LINKS,
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

describe('officialUrl utility functions (Issue #157, #176, #190)', () => {
  it('ENABLE_OFFICIAL_LINKS が true に有効化されていること', () => {
    expect(ENABLE_OFFICIAL_LINKS).toBe(true);
  });

  it('race.official_url が指定されている場合は最優先でそのURLを返すこと', () => {
    const raceWithUrl: Race = {
      ...mockBaseRace,
      official_url: 'https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html',
    };
    expect(getOfficialRaceUrl(raceWithUrl, 'ja')).toBe('https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html');
    expect(getOfficialRaceUrl(raceWithUrl, 'en')).toBe('https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html');
  });

  it('未定レース（JRA等でofficial_url未設定）では null を返し一律フォールバックしないこと', () => {
    expect(getOfficialRaceUrl(mockBaseRace, 'ja')).toBeNull();
    expect(getOfficialRaceUrl(mockBaseRace, 'en')).toBeNull();

    const franceRace: Race = { ...mockBaseRace, organization: 'france_galop', country_code: 'FR' };
    expect(getOfficialRaceUrl(franceRace, 'fr')).toBeNull();

    const bhaRace: Race = { ...mockBaseRace, organization: 'bha', country_code: 'GB' };
    expect(getOfficialRaceUrl(bhaRace, 'en')).toBeNull();

    const usRace: Race = { ...mockBaseRace, organization: 'equibase', country_code: 'US' };
    expect(getOfficialRaceUrl(usRace, 'en')).toBeNull();
  });

  it('NAR（地方競馬）のレースでも official_url 未設定時は常に null を返し推測URLを生成しないこと (Issue #190)', () => {
    const narRace: Race = {
      ...mockBaseRace,
      organization: 'nar',
      course: { ja: '大井', en: 'Oi' },
      date: '2026-06-24',
      race_number: 11,
    };
    expect(getOfficialRaceUrl(narRace, 'ja')).toBeNull();

    const finishedNarRace: Race = {
      ...narRace,
      winner: {
        name: { ja: 'ミッキーファイト', en: 'Mikki Fight' },
      },
    };
    expect(getOfficialRaceUrl(finishedNarRace, 'ja')).toBeNull();
  });

  it('HKJC（香港競馬）のレースでも official_url 未設定時は常に null を返し推測URLを生成しないこと (Issue #190)', () => {
    const hkRace: Race = {
      ...mockBaseRace,
      organization: 'hkjc',
      country_code: 'HK',
      course: { ja: 'シャティン', en: 'Sha Tin', zh: '沙田' },
      date: '2026-01-01',
      race_number: 8,
    };
    expect(getOfficialRaceUrl(hkRace, 'zh')).toBeNull();

    const finishedHkRace: Race = {
      ...hkRace,
      winner: {
        name: { ja: 'ロマンチックウォリアー', en: 'Romantic Warrior', zh: '浪漫勇士' },
      },
    };
    expect(getOfficialRaceUrl(finishedHkRace, 'en')).toBeNull();
  });

  it('getOfficialSourceLabel が各主催者・言語に応じた表示名を返すこと', () => {
    expect(getOfficialSourceLabel('jra', 'ja')).toBe(OFFICIAL_SOURCE_NAMES.jra.ja);
    expect(getOfficialSourceLabel('france_galop', 'fr')).toBe(OFFICIAL_SOURCE_NAMES.france_galop.fr);
    expect(getOfficialSourceLabel('hkjc', 'zh')).toBe(OFFICIAL_SOURCE_NAMES.hkjc.zh);
    expect(getOfficialSourceLabel('nar', 'ja')).toBe(OFFICIAL_SOURCE_NAMES.nar.ja);
  });
});
