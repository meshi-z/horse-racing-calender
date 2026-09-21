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
      expect(confirmed[0].sourceUrl).toContain('equibase.com');
    });

    it('日付が異なるエントリはマッチしないこと', () => {
      const confirmed = parseEquibaseRacecardsJson(mockEntries, mockTargetRaces, '2026-05-03');
      expect(confirmed).toHaveLength(0);
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
});
