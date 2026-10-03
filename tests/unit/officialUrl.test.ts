import { describe, it, expect } from 'vitest';
import {
  getOfficialRaceUrl,
  getOfficialSourceLabel,
  resolveNarOfficialUrl,
  resolveHkjcOfficialUrl,
  getNarBabaCode,
  getHkjcCourseCode,
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

describe('officialUrl utility functions (Issue #157)', () => {
  it('ENABLE_OFFICIAL_LINKS が true に有効化されていること', () => {
    expect(ENABLE_OFFICIAL_LINKS).toBe(true);
  });

  it('race.official_url が指定されている場合は最優先でそのURLを返すこと', () => {
    const raceWithUrl: Race = {
      ...mockBaseRace,
      official_url: 'https://www.jra.go.jp/special/february-stakes/2026/',
    };
    expect(getOfficialRaceUrl(raceWithUrl, 'ja')).toBe('https://www.jra.go.jp/special/february-stakes/2026/');
    expect(getOfficialRaceUrl(raceWithUrl, 'en')).toBe('https://www.jra.go.jp/special/february-stakes/2026/');
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

  describe('NAR（地方競馬）動的URL解決', () => {
    it('馬場コードが正確に解決されること', () => {
      expect(getNarBabaCode('大井')).toBe('20');
      expect(getNarBabaCode('船橋競馬場')).toBe('19');
      expect(getNarBabaCode('帯広（ばんえい）')).toBe('3');
      expect(getNarBabaCode(undefined, 'Mombetsu')).toBe('36');
      expect(getNarBabaCode(undefined, 'Unknown')).toBeNull();
    });

    it('未確定（出走予定）レースでは DebaTable の出馬表URLを生成すること', () => {
      const narRace: Race = {
        ...mockBaseRace,
        organization: 'nar',
        course: { ja: '大井', en: 'Oi' },
        date: '2026-06-24',
        race_number: 11,
      };
      const url = getOfficialRaceUrl(narRace, 'ja');
      expect(url).toBe('https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable?k_raceDate=2026%2F06%2F24&k_raceNo=11&k_babaCode=20');
      expect(resolveNarOfficialUrl(narRace)).toBe(url);
    });

    it('確定（結果あり）レースでは RaceMarkTable の結果URLを生成すること', () => {
      const finishedNarRace: Race = {
        ...mockBaseRace,
        organization: 'nar',
        course: { ja: '川崎', en: 'Kawasaki' },
        date: '2026-04-08',
        winner: {
          name: { ja: 'カジノフォンテン', en: 'Casino Fountain' },
        },
      };
      const url = getOfficialRaceUrl(finishedNarRace, 'ja');
      expect(url).toBe('https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceMarkTable?k_raceDate=2026%2F04%2F08&k_babaCode=21');
    });
  });

  describe('HKJC（香港競馬）動的URL解決', () => {
    it('競馬場コードが正確に解決されること', () => {
      expect(getHkjcCourseCode('沙田')).toBe('ST');
      expect(getHkjcCourseCode('シャティン競馬場')).toBe('ST');
      expect(getHkjcCourseCode(undefined, 'Sha Tin')).toBe('ST');
      expect(getHkjcCourseCode('跑馬地')).toBe('HV');
      expect(getHkjcCourseCode(undefined, 'Happy Valley')).toBe('HV');
      expect(getHkjcCourseCode('中山')).toBeNull();
    });

    it('未確定（出走予定）レースでは RaceCard.aspx の出馬表URLを言語別で生成すること', () => {
      const hkRace: Race = {
        ...mockBaseRace,
        organization: 'hkjc',
        country_code: 'HK',
        course: { ja: 'シャティン', en: 'Sha Tin', zh: '沙田' },
        date: '2026-01-01',
        race_number: 8,
      };
      const urlZh = getOfficialRaceUrl(hkRace, 'zh');
      expect(urlZh).toBe('https://racing.hkjc.com/racing/information/Chinese/Racing/RaceCard.aspx?RaceDate=2026%2F01%2F01&Racecourse=ST&RaceNo=8');
      expect(resolveHkjcOfficialUrl(hkRace, 'zh')).toBe(urlZh);

      const urlEn = getOfficialRaceUrl(hkRace, 'en');
      expect(urlEn).toBe('https://racing.hkjc.com/racing/information/English/Racing/RaceCard.aspx?RaceDate=2026%2F01%2F01&Racecourse=ST&RaceNo=8');
      expect(resolveHkjcOfficialUrl(hkRace, 'en')).toBe(urlEn);
    });

    it('確定（結果あり）レースでは LocalResults.aspx の結果URLを生成すること', () => {
      const finishedHkRace: Race = {
        ...mockBaseRace,
        organization: 'hkjc',
        country_code: 'HK',
        course: { ja: 'ハッピーバレー', en: 'Happy Valley', zh: '跑馬地' },
        date: '2026-01-14',
        race_number: 7,
        winner: {
          name: { ja: 'ロマンチックウォリアー', en: 'Romantic Warrior', zh: '浪漫勇士' },
        },
      };
      const urlEn = getOfficialRaceUrl(finishedHkRace, 'en');
      expect(urlEn).toBe('https://racing.hkjc.com/racing/information/English/Racing/LocalResults.aspx?RaceDate=2026%2F01%2F14&Racecourse=HV&RaceNo=7');
    });
  });

  it('getOfficialSourceLabel が各主催者・言語に応じた表示名を返すこと', () => {
    expect(getOfficialSourceLabel('jra', 'ja')).toBe(OFFICIAL_SOURCE_NAMES.jra.ja);
    expect(getOfficialSourceLabel('france_galop', 'fr')).toBe(OFFICIAL_SOURCE_NAMES.france_galop.fr);
    expect(getOfficialSourceLabel('hkjc', 'zh')).toBe(OFFICIAL_SOURCE_NAMES.hkjc.zh);
    expect(getOfficialSourceLabel('nar', 'ja')).toBe(OFFICIAL_SOURCE_NAMES.nar.ja);
  });
});
