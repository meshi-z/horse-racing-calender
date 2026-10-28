import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  isUsDaylightSavingTime,
  getCourseTimeZone,
  parseUsTimeToIsoAndJst,
  tokenizeEnglish,
  usRaceMatches,
  usCourseMatches,
  parseEquibaseRacecardsJson,
  parseSportingLifeUsRacecardsJson,
  EquibaseRaceItem,
} from '../../scripts/lib/us-syutsuba';
import {
  UsRaceTimeFetcher,
  getUsUpcomingWindowRange,
  updateRaceTimes,
  RaceOutput,
} from '../../scripts/update-race-times';

describe('US Syutsuba utility', () => {
  describe('isUsDaylightSavingTime', () => {
    it('2026年3月第2日曜日より前は冬時間（標準時: false）を返すこと', () => {
      expect(isUsDaylightSavingTime('2026-01-15')).toBe(false);
      expect(isUsDaylightSavingTime('2026-02-28')).toBe(false);
      expect(isUsDaylightSavingTime('2026-03-01')).toBe(false);
    });

    it('2026年3月第2日曜日（3月8日）から11月第1日曜日（11月1日）までは夏時間（true）を返すこと', () => {
      expect(isUsDaylightSavingTime('2026-03-08')).toBe(true);
      expect(isUsDaylightSavingTime('2026-05-02')).toBe(true); // ケンタッキーダービー
      expect(isUsDaylightSavingTime('2026-06-06')).toBe(true); // ベルモントS
      expect(isUsDaylightSavingTime('2026-08-29')).toBe(true); // トラヴァーズS
      expect(isUsDaylightSavingTime('2026-10-31')).toBe(true);
    });

    it('2026年11月第1日曜日（11月1日）以降は冬時間（標準時: false）を返すこと', () => {
      expect(isUsDaylightSavingTime('2026-11-02')).toBe(false);
      expect(isUsDaylightSavingTime('2026-12-25')).toBe(false);
    });
  });

  describe('getCourseTimeZone', () => {
    it('主要競馬場に応じた米国のタイムゾーン（ET, CT, MT, PT）を返すこと', () => {
      expect(getCourseTimeZone('Churchill Downs')).toBe('ET');
      expect(getCourseTimeZone('チャーチルダウンズ')).toBe('ET');
      expect(getCourseTimeZone('Saratoga')).toBe('ET');
      expect(getCourseTimeZone('Belmont Park')).toBe('ET');
      expect(getCourseTimeZone('Aqueduct')).toBe('ET');
      expect(getCourseTimeZone('Gulfstream Park')).toBe('ET');

      expect(getCourseTimeZone('Oaklawn Park')).toBe('CT');
      expect(getCourseTimeZone('Fair Grounds')).toBe('CT');

      expect(getCourseTimeZone('Sunland Park')).toBe('MT');

      expect(getCourseTimeZone('Santa Anita')).toBe('PT');
      expect(getCourseTimeZone('Del Mar')).toBe('PT');
      expect(getCourseTimeZone('Los Alamitos')).toBe('PT');

      // 未知の競馬場はデフォルト ET
      expect(getCourseTimeZone('Unknown Course')).toBe('ET');
    });
  });

  describe('parseUsTimeToIsoAndJst', () => {
    it('夏時間の東部（EDT: UTC-4）の時刻を正しく UTC および JST に変換すること', () => {
      // 2026-05-02 (ケンタッキーダービー想定 18:57 EDT)
      const res = parseUsTimeToIsoAndJst('2026-05-02', '18:57', 'ET');
      expect(res.utcIso).toBe('2026-05-02T22:57:00.000Z');
      expect(res.timeJst).toBe('07:57'); // 翌日 07:57 JST
      expect(res.rawTime).toBe('07:57 JST');
    });

    it('12時間制（PM/AM）の時刻表記を正しくパースできること', () => {
      const res = parseUsTimeToIsoAndJst('2026-05-02', '6:57 PM', 'ET');
      expect(res.utcIso).toBe('2026-05-02T22:57:00.000Z');
      expect(res.timeJst).toBe('07:57');

      const resAm = parseUsTimeToIsoAndJst('2026-05-02', '11:30 AM', 'ET');
      expect(resAm.utcIso).toBe('2026-05-02T15:30:00.000Z');
      expect(resAm.timeJst).toBe('00:30');
    });

    it('夏時間の太平洋（PDT: UTC-7）の時刻を正しく変換すること', () => {
      // 2026-07-18 (デルマー 17:00 PDT)
      const res = parseUsTimeToIsoAndJst('2026-07-18', '17:00', 'PT');
      expect(res.utcIso).toBe('2026-07-19T00:00:00.000Z');
      expect(res.timeJst).toBe('09:00');
    });

    it('標準時（EST: UTC-5）の時刻を正しく変換すること', () => {
      // 2026-01-24 (ペガサスワールドカップ 17:40 EST)
      const res = parseUsTimeToIsoAndJst('2026-01-24', '17:40', 'ET');
      expect(res.utcIso).toBe('2026-01-24T22:40:00.000Z');
      expect(res.timeJst).toBe('07:40');
    });
  });

  describe('tokenizeEnglish & usRaceMatches & usCourseMatches', () => {
    it('ストップワードを除外し大文字トークンを抽出すること', () => {
      expect(tokenizeEnglish('Kentucky Derby')).toEqual(['KENTUCKY', 'DERBY']);
      expect(tokenizeEnglish('Breeders\' Cup Classic')).toEqual(['BREEDERS', 'CLASSIC']);
      expect(tokenizeEnglish('The Travers Stakes')).toEqual(['TRAVERS']);
    });

    it('公式レース名と出馬表レース名の表記揺れを正しくマッチ判定すること', () => {
      expect(usRaceMatches('Kentucky Derby', '152nd Kentucky Derby presented by Woodford Reserve')).toBe(true);
      expect(usRaceMatches('Preakness Stakes', '151st Preakness Stakes')).toBe(true);
      expect(usRaceMatches('Belmont Stakes', 'Belmont Stakes presented by NYRA Bets')).toBe(true);
      expect(usRaceMatches('Breeders\' Cup Classic', 'Longines Breeders\' Cup Classic')).toBe(true);
      expect(usRaceMatches('Kentucky Derby', 'Kentucky Oaks')).toBe(false);
    });

    it('重要区別ワード（ディファレンシエータ）による同名別レースの誤一致を防止すること', () => {
      // 芝 vs ダート
      expect(usRaceMatches('Pegasus World Cup Invitational Stakes', 'Pegasus World Cup Turf Invitational')).toBe(false);
      expect(usRaceMatches('Pegasus World Cup Turf Invitational', 'Pegasus World Cup Invitational Stakes')).toBe(false);

      // Derby vs Oaks
      expect(usRaceMatches('Santa Anita Derby', 'Santa Anita Oaks')).toBe(false);
      expect(usRaceMatches('Belmont Derby', 'Belmont Oaks')).toBe(false);
      expect(usRaceMatches('Indiana Derby', 'Indiana Oaks')).toBe(false);

      // Classic vs Oaks
      expect(usRaceMatches('Charles Town Classic', 'Charles Town Oaks')).toBe(false);

      // Mile vs Oaks
      expect(usRaceMatches('Del Mar Mile Stakes', 'Del Mar Oaks')).toBe(false);

      // Ladies / Distaff
      expect(usRaceMatches('Kentucky Downs Ladies Turf Stakes', 'Kentucky Turf Cup')).toBe(false);
    });

    it('競馬場名の一致を正しく判定すること', () => {
      expect(usCourseMatches('Churchill Downs', 'Churchill Downs Racetrack')).toBe(true);
      expect(usCourseMatches('Santa Anita Park', 'Santa Anita')).toBe(true);
      expect(usCourseMatches('Saratoga', 'Saratoga Race Course')).toBe(true);
      expect(usCourseMatches('Churchill Downs', 'Del Mar')).toBe(false);
    });
  });

  describe('parseEquibaseRacecardsJson', () => {
    const mockEntries: EquibaseRaceItem[] = [
      {
        race_number: 12,
        race_name: 'Kentucky Derby presented by Woodford Reserve',
        track_name: 'Churchill Downs',
        date: '2026-05-02',
        post_time: '6:57 PM',
        time_zone: 'ET',
      },
      {
        race_number: 10,
        race_name: 'Churchill Distaff Turf Mile Stakes',
        track_name: 'Churchill Downs',
        date: '2026-05-02',
        post_time: '4:31 PM',
        time_zone: 'ET',
      },
    ];

    const mockTargetRaces: RaceOutput[] = [
      {
        id: '2026-us-g1-kentucky-derby',
        organization: 'equibase',
        country_code: 'US',
        name: {
          ja: 'ケンタッキーダービー',
          en: 'Kentucky Derby',
        },
        grade: 'G1',
        date: '2026-05-02',
        start_time: '2026-05-02T22:00:00.000Z',
        is_time_confirmed: false,
        course: {
          ja: 'チャーチルダウンズ',
          en: 'Churchill Downs',
        },
        distance: 2000,
        track_type: 'dirt',
        sex_constraint: 'none',
        age_constraint: '3yo',
        handicap: {
          code: 'set_weight',
          ja: '定量',
          en: 'Weight for Age',
        },
      },
    ];

    it('出馬表エントリから対象レースの発走時刻を正しく抽出すること', () => {
      const confirmed = parseEquibaseRacecardsJson(mockEntries, mockTargetRaces, '2026-05-02');
      expect(confirmed).toHaveLength(1);
      expect(confirmed[0].raceId).toBe('2026-us-g1-kentucky-derby');
      expect(confirmed[0].raceName).toBe('ケンタッキーダービー');
      expect(confirmed[0].timeJst).toBe('07:57');
      expect(confirmed[0].utcIso).toBe('2026-05-02T22:57:00.000Z');
      expect(confirmed[0].sourceUrl).toBeUndefined(); // Issue #190 に準拠
    });

    it('日付が異なるエントリはマッチしないこと', () => {
      const confirmed = parseEquibaseRacecardsJson(mockEntries, mockTargetRaces, '2026-05-03');
      expect(confirmed).toHaveLength(0);
    });
  });

  describe('parseSportingLifeUsRacecardsJson', () => {
    it('Sporting Life の出馬表 JSON（英国時間表記）から北米レースの確定時刻を抽出し正確に変換すること', () => {
      const mockMeetings = [
        {
          meeting_summary: {
            name: 'Keeneland',
            country: {
              code: 'USA',
              name: 'United States',
            },
            course: {
              name: 'Keeneland',
            },
            date: '2026-10-17',
          },
          races: [
            {
              name: 'Perryville Stakes (Grade 3)',
              time: '20:12', // Sporting Life API time is UTC -> 20:12 UTC -> 05:12 JST (+1 day)
              course_name: 'Keeneland',
            },
            {
              name: 'Allowance',
              time: '20:45',
              course_name: 'Keeneland',
            },
          ],
        },
      ];

      const mockTargets: RaceOutput[] = [
        {
          id: '2026-us-g3-perryville',
          organization: 'equibase',
          country_code: 'US',
          name: {
            ja: 'ペリーヴィルステークス',
            en: 'Perryville Stakes',
          },
          grade: 'G3',
          date: '2026-10-17',
          start_time: '2026-10-17T20:00:00.000Z',
          is_time_confirmed: false,
          course: {
            ja: 'キーンランド',
            en: 'Keeneland',
          },
          distance: 1400,
          track_type: 'dirt',
          sex_constraint: 'none',
          age_constraint: '3yo',
          handicap: {
            code: 'special_weight',
            ja: '別定',
            en: 'Special Weight',
          },
        },
      ];

      const confirmed = parseSportingLifeUsRacecardsJson(mockMeetings, mockTargets, '2026-10-17');
      expect(confirmed).toHaveLength(1);
      expect(confirmed[0].raceId).toBe('2026-us-g3-perryville');
      expect(confirmed[0].raceName).toBe('ペリーヴィルステークス');
      expect(confirmed[0].utcIso).toBe('2026-10-17T20:12:00.000Z');
      expect(confirmed[0].timeJst).toBe('05:12');
      expect(confirmed[0].sourceUrl).toBeUndefined();
    });
  });

  describe('UsRaceTimeFetcher & updateRaceTimes 統合', () => {
    let tmpDir: string;
    let tmpRacesPath: string;

    const sampleRaces: RaceOutput[] = [
      {
        id: '2026-us-g1-sample-derby',
        organization: 'equibase',
        country_code: 'US',
        name: {
          ja: 'ケンタッキーダービー',
          en: 'Kentucky Derby',
        },
        grade: 'G1',
        date: '2026-05-02',
        start_time: '2026-05-02T22:00:00.000Z',
        is_time_confirmed: false,
        course: {
          ja: 'チャーチルダウンズ',
          en: 'Churchill Downs',
        },
        distance: 2000,
        track_type: 'dirt',
        sex_constraint: 'none',
        age_constraint: '3yo',
        handicap: {
          code: 'set_weight',
          ja: '定量',
          en: 'Weight for Age',
        },
      },
    ];

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'us-time-test-'));
      tmpRacesPath = path.join(tmpDir, 'races.json');
      fs.writeFileSync(tmpRacesPath, JSON.stringify(sampleRaces, null, 2), 'utf-8');
    });

    afterEach(() => {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('getUsUpcomingWindowRange で基準日から7日間の範囲を算出すること', () => {
      const range = getUsUpcomingWindowRange('2026-05-01', 7);
      expect(range.startDate).toBe('2026-05-01');
      expect(range.endDate).toBe('2026-05-07');
    });

    it('updateRaceTimes でアメリカ重賞の未確定時刻が確定値へ更新されること', async () => {
      const mockFixtures = {
        '2026-05-02': [
          {
            race_number: 12,
            race_name: 'Kentucky Derby',
            track_name: 'Churchill Downs',
            date: '2026-05-02',
            post_time: '6:57 PM',
            time_zone: 'ET',
          },
        ],
      };

      const fetcher = new UsRaceTimeFetcher({ fixtures: mockFixtures });

      const result = await updateRaceTimes({
        filePath: tmpRacesPath,
        referenceDate: '2026-05-01',
        organization: 'equibase',
        fetchers: {
          equibase: fetcher,
        },
      });

      expect(result.updatedRaces).toHaveLength(1);
      expect(result.updatedRaces[0].id).toBe('2026-us-g1-sample-derby');
      expect(result.updatedRaces[0].newTime).toBe('2026-05-02T22:57:00.000Z');

      // 更新されたファイルの確認
      const updatedContent: RaceOutput[] = JSON.parse(fs.readFileSync(tmpRacesPath, 'utf-8'));
      const derby = updatedContent.find((r) => r.id === '2026-us-g1-sample-derby');
      expect(derby?.is_time_confirmed).toBe(true);
      expect(derby?.start_time).toBe('2026-05-02T22:57:00.000Z');
    });
  });

  describe("2026年ブリーダーズカップ全14競走の確定発走予定時刻検証 (Issue #270)", () => {
    const expectedSchedule = {
      // 第1日：2026年10月30日（金）
      '2026-us-g1-78': { nameJa: 'ブリーダーズカップジュヴェナイルターフスプリント', utcTime: '2026-10-30T18:55:00.000Z', localTime: '14:55 EDT', date: '2026-10-30' },
      '2026-us-g1-75': { nameJa: 'ブリーダーズカップジュヴェナイルフィリーズ', utcTime: '2026-10-30T19:35:00.000Z', localTime: '15:35 EDT', date: '2026-10-30' },
      '2026-us-g1-76': { nameJa: 'ブリーダーズカップジュヴェナイルフィリーズターフ', utcTime: '2026-10-30T20:15:00.000Z', localTime: '16:15 EDT', date: '2026-10-30' },
      '2026-us-g1-74': { nameJa: 'ブリーダーズカップジュヴェナイル', utcTime: '2026-10-30T20:55:00.000Z', localTime: '16:55 EDT', date: '2026-10-30' },
      '2026-us-g1-77': { nameJa: 'ブリーダーズカップジュヴェナイルターフ', utcTime: '2026-10-30T21:35:00.000Z', localTime: '17:35 EDT', date: '2026-10-30' },
      // 第2日：2026年10月31日（土）
      '2026-us-g1-82': { nameJa: 'ブリーダーズカップフィリー&メアスプリント', utcTime: '2026-10-31T17:10:00.000Z', localTime: '13:10 EDT', date: '2026-10-31' },
      '2026-us-g1-87': { nameJa: 'ブリーダーズカップターフスプリント', utcTime: '2026-10-31T17:48:00.000Z', localTime: '13:48 EDT', date: '2026-10-31' },
      '2026-us-g1-80': { nameJa: 'ブリーダーズカップダートマイル', utcTime: '2026-10-31T18:26:00.000Z', localTime: '14:26 EDT', date: '2026-10-31' },
      '2026-us-g1-83': { nameJa: 'ブリーダーズカップフィリー&メアターフ', utcTime: '2026-10-31T19:04:00.000Z', localTime: '15:04 EDT', date: '2026-10-31' },
      '2026-us-g1-85': { nameJa: 'ブリーダーズカップスプリント', utcTime: '2026-10-31T19:42:00.000Z', localTime: '15:42 EDT', date: '2026-10-31' },
      '2026-us-g1-84': { nameJa: 'ブリーダーズカップマイル', utcTime: '2026-10-31T20:20:00.000Z', localTime: '16:20 EDT', date: '2026-10-31' },
      '2026-us-g1-81': { nameJa: 'ブリーダーズカップディスタフ', utcTime: '2026-10-31T20:58:00.000Z', localTime: '16:58 EDT', date: '2026-10-31' },
      '2026-us-g1-86': { nameJa: 'ブリーダーズカップターフ', utcTime: '2026-10-31T21:36:00.000Z', localTime: '17:36 EDT', date: '2026-10-31' },
      '2026-us-g1-79': { nameJa: 'ブリーダーズカップクラシック', utcTime: '2026-10-31T22:16:00.000Z', localTime: '18:16 EDT', date: '2026-10-31' },
    };

    it('src/data/us_race_master.json の全14競走が確定時刻かつ is_time_confirmed: true であること', () => {
      const masterPath = path.resolve('src/data/us_race_master.json');
      const master = JSON.parse(fs.readFileSync(masterPath, 'utf-8'));

      for (const [id, expected] of Object.entries(expectedSchedule)) {
        const race = master.races.find((r: any) => r.id === id);
        expect(race, 'Race ' + id + ' must exist in us_race_master.json').toBeDefined();
        expect(race.date).toBe(expected.date);
        expect(race.start_time, 'Race ' + id + ' start_time must match ' + expected.utcTime).toBe(expected.utcTime);
        expect(race.is_time_confirmed, 'Race ' + id + ' is_time_confirmed must be true').toBe(true);
      }
    });

    it('public/data/races-2026.json および public/data/races.json と整合していること', () => {
      const races2026Path = path.resolve('public/data/races-2026.json');
      const racesPath = path.resolve('public/data/races.json');

      const races2026 = JSON.parse(fs.readFileSync(races2026Path, 'utf-8'));
      const races = JSON.parse(fs.readFileSync(racesPath, 'utf-8'));

      for (const [id, expected] of Object.entries(expectedSchedule)) {
        const r2026 = races2026.find((r: any) => r.id === id);
        expect(r2026, 'Race ' + id + ' must exist in races-2026.json').toBeDefined();
        expect(r2026.start_time).toBe(expected.utcTime);
        expect(r2026.is_time_confirmed).toBe(true);

        const rAll = races.find((r: any) => r.id === id);
        expect(rAll, 'Race ' + id + ' must exist in races.json').toBeDefined();
        expect(rAll.start_time).toBe(expected.utcTime);
        expect(rAll.is_time_confirmed).toBe(true);
      }
    });
  });
});
