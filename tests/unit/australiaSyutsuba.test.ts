import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  isAustralianSummerTime,
  getAustraliaUtcOffsetHours,
  parseAustraliaTimeToIsoAndJst,
  australiaRaceMatches,
  australiaCourseMatches,
  fetchAustraliaConfirmedRaceTimes,
} from '../../scripts/lib/australia-syutsuba';
import {
  AustraliaRaceTimeFetcher,
  getAustraliaUpcomingWindowRange,
  updateRaceTimes,
  type RaceOutput,
} from '../../scripts/update-race-times';

describe('Australia Syutsuba utility', () => {
  describe('isAustralianSummerTime', () => {
    it('オーストラリア南半球夏時間（AEDT/ACDT）の期間判定が正しく機能すること', () => {
      // 2026年の4月第1日曜日は 2026-04-05
      expect(isAustralianSummerTime('2026-04-04')).toBe(true);
      expect(isAustralianSummerTime('2026-04-05')).toBe(false);

      // 冬季（南半球の冬）
      expect(isAustralianSummerTime('2026-06-15')).toBe(false);
      expect(isAustralianSummerTime('2026-08-20')).toBe(false);

      // 2026年の10月第1日曜日は 2026-10-04
      expect(isAustralianSummerTime('2026-10-03')).toBe(false);
      expect(isAustralianSummerTime('2026-10-04')).toBe(true);
      expect(isAustralianSummerTime('2026-11-03')).toBe(true);
    });
  });

  describe('getAustraliaUtcOffsetHours', () => {
    it('各州および競馬場のタイムゾーン・夏時間オフセットを正しく算出すること', () => {
      // NSW (Randwick): 冬 UTC+10, 夏 UTC+11
      expect(getAustraliaUtcOffsetHours('2026-06-01', 'Royal Randwick')).toBe(10);
      expect(getAustraliaUtcOffsetHours('2026-10-17', 'Royal Randwick')).toBe(11);

      // VIC (Flemington): 冬 UTC+10, 夏 UTC+11
      expect(getAustraliaUtcOffsetHours('2026-06-01', 'Flemington')).toBe(10);
      expect(getAustraliaUtcOffsetHours('2026-11-03', 'Flemington')).toBe(11);

      // QLD (Eagle Farm): 通年夏時間なし UTC+10
      expect(getAustraliaUtcOffsetHours('2026-06-01', 'Eagle Farm')).toBe(10);
      expect(getAustraliaUtcOffsetHours('2026-11-03', 'Eagle Farm')).toBe(10);

      // WA (Ascot): 通年夏時間なし UTC+8
      expect(getAustraliaUtcOffsetHours('2026-06-01', 'Ascot (AUS)')).toBe(8);
      expect(getAustraliaUtcOffsetHours('2026-11-21', 'Ascot (AUS)')).toBe(8);

      // SA (Morphettville): 冬 UTC+9.5, 夏 UTC+10.5
      expect(getAustraliaUtcOffsetHours('2026-06-01', 'Morphettville')).toBe(9.5);
      expect(getAustraliaUtcOffsetHours('2026-11-03', 'Morphettville')).toBe(10.5);
    });
  });

  describe('parseAustraliaTimeToIsoAndJst', () => {
    it('夏時間（AEDT: UTC+11）の現地時刻から UTC ISO と JST 表記を生成すること', () => {
      // 2026-10-17 16:15 AEDT -> 05:15 UTC -> 14:15 JST
      const result = parseAustraliaTimeToIsoAndJst('2026-10-17', '16:15', 'Royal Randwick');
      expect(result.utcIso).toBe('2026-10-17T05:15:00.000Z');
      expect(result.timeJst).toBe('14:15');
      expect(result.rawTime).toBe('14:15 JST');
    });

    it('標準時（AEST: UTC+10）の現地時刻から UTC ISO と JST 表記を生成すること', () => {
      // 2026-06-06 15:40 AEST -> 05:40 UTC -> 14:40 JST
      const result = parseAustraliaTimeToIsoAndJst('2026-06-06', '15:40', 'Eagle Farm');
      expect(result.utcIso).toBe('2026-06-06T05:40:00.000Z');
      expect(result.timeJst).toBe('14:40');
      expect(result.rawTime).toBe('14:40 JST');
    });
  });

  describe('australiaRaceMatches', () => {
    it('冠名付きレース名と正規レース名がマッチすること', () => {
      expect(australiaRaceMatches('The Everest', 'The TAB Everest')).toBe(true);
      expect(australiaRaceMatches('Caulfield Cup', 'Stella Artois Caulfield Cup')).toBe(true);
      expect(australiaRaceMatches('Melbourne Cup', 'Lexus Melbourne Cup')).toBe(true);
      expect(australiaRaceMatches('Golden Slipper Stakes', 'Longines Golden Slipper')).toBe(true);
      expect(australiaRaceMatches('Cox Plate', 'Ladbrokes Cox Plate')).toBe(true);
    });

    it('異なるレース名にはマッチしないこと', () => {
      expect(australiaRaceMatches('The Everest', 'Sydney Cup')).toBe(false);
      expect(australiaRaceMatches('Caulfield Cup', 'Caulfield Guineas')).toBe(false);
    });
  });

  describe('australiaCourseMatches', () => {
    it('競馬場名の正規化照合が正しく機能すること', () => {
      expect(australiaCourseMatches('Royal Randwick', 'Randwick')).toBe(true);
      expect(australiaCourseMatches('Randwick', 'Royal Randwick')).toBe(true);
      expect(australiaCourseMatches('Flemington', 'Flemington')).toBe(true);
      expect(australiaCourseMatches('Rosehill Gardens', 'Rosehill')).toBe(true);
      expect(australiaCourseMatches('Caulfield', 'Flemington')).toBe(false);
    });
  });

  describe('getAustraliaUpcomingWindowRange', () => {
    it('基準日から14日間のウィンドウ範囲を計算すること', () => {
      const range = getAustraliaUpcomingWindowRange('2026-10-10');
      expect(range.startDate).toBe('2026-10-10');
      expect(range.endDate).toBe('2026-10-23');
    });
  });

  describe('AustraliaRaceTimeFetcher & updateRaceTimes 統合', () => {
    it('getTargetWindowRaces で14日間のオーストラリア重賞が抽出されること', () => {
      const fetcher = new AustraliaRaceTimeFetcher();
      const mockRaces: RaceOutput[] = [
        {
          id: '2026-au-g1-58',
          organization: 'racing_australia',
          name: { ja: 'ジ・エベレスト', en: 'The Everest' },
          grade: 'G1',
          date: '2026-10-17',
          start_time: '2026-10-17T05:15:00.000Z',
          is_time_confirmed: false,
          course: { ja: 'ロイヤルランドウィック', en: 'Royal Randwick' },
          distance: 1200,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'weight_for_age', ja: '馬齢', en: 'Weight for Age' },
        },
        {
          id: '2026-au-g1-66',
          organization: 'racing_australia',
          name: { ja: 'メルボルンカップ', en: 'Melbourne Cup' },
          grade: 'G1',
          date: '2026-11-03',
          start_time: '2026-11-03T04:00:00.000Z',
          is_time_confirmed: false,
          course: { ja: 'フレミントン', en: 'Flemington' },
          distance: 3200,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'handicap', ja: 'ハンデ', en: 'Handicap' },
        },
      ];

      // 基準日 2026-10-10 から14日間 -> 10-10〜10-23
      const targets = fetcher.getTargetWindowRaces(mockRaces, '2026-10-10');
      expect(targets).toHaveLength(1);
      expect(targets[0].id).toBe('2026-au-g1-58');
    });

    it('updateRaceTimes でオーストラリア重賞の未確定時刻が確定値へ更新され、official_url は付与されないこと (Issue #190)', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'au-time-test-'));
      const racesPath = path.join(tempDir, 'races.json');

      const initialRaces: RaceOutput[] = [
        {
          id: '2026-au-g1-sample',
          organization: 'racing_australia',
          country_code: 'AU',
          name: { ja: 'ジ・エベレスト', en: 'The Everest' },
          grade: 'G1',
          date: '2026-10-17',
          start_time: '2026-10-17T05:00:00.000Z',
          is_time_confirmed: false,
          course: { ja: 'ロイヤルランドウィック', en: 'Royal Randwick' },
          distance: 1200,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'weight_for_age', ja: '馬齢', en: 'Weight for Age' },
        },
      ];
      fs.writeFileSync(racesPath, JSON.stringify(initialRaces, null, 2), 'utf8');

      const fixture = {
        '2026-10-17': {
          venue: 'Royal Randwick',
          date: '2026-10-17',
          races: [
            {
              raceNumber: 7,
              raceName: 'The TAB Everest',
              postTime: '16:15',
              venue: 'Royal Randwick',
            },
          ],
        },
      };

      const fetcher = new AustraliaRaceTimeFetcher({ fixtures: fixture });

      await updateRaceTimes({
        filePath: racesPath,
        referenceDate: '2026-10-10',
        organization: 'racing_australia',
        fetchers: { racing_australia: fetcher },
      });

      const updatedRaces = JSON.parse(fs.readFileSync(racesPath, 'utf8')) as RaceOutput[];
      expect(updatedRaces).toHaveLength(1);
      const updated = updatedRaces[0];

      expect(updated.is_time_confirmed).toBe(true);
      expect(updated.start_time).toBe('2026-10-17T05:15:00.000Z');
      // Issue #190 に準拠し、公式URLは設定されないこと（undefined）
      expect(updated.official_url).toBeUndefined();

      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('fetchAustraliaConfirmedRaceTimes がフィクスチャから確定時刻を正しく抽出すること', async () => {
      const targetRaces: RaceOutput[] = [
        {
          id: '2026-au-g1-sample-2',
          organization: 'racing_australia',
          country_code: 'AU',
          name: { ja: 'ジ・エベレスト', en: 'The Everest' },
          grade: 'G1',
          date: '2026-10-17',
          start_time: '2026-10-17T05:00:00.000Z',
          is_time_confirmed: false,
          course: { ja: 'ロイヤルランドウィック', en: 'Royal Randwick' },
          distance: 1200,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'weight_for_age', ja: '馬齢', en: 'Weight for Age' },
        },
      ];
      const fixture = {
        '2026-10-17': {
          venue: 'Royal Randwick',
          date: '2026-10-17',
          races: [
            {
              raceNumber: 7,
              raceName: 'The TAB Everest',
              postTime: '16:15',
              venue: 'Royal Randwick',
            },
          ],
        },
      };

      const results = await fetchAustraliaConfirmedRaceTimes({
        targetRaces,
        fixtures: fixture,
      });

      expect(results).toHaveLength(1);
      expect(results[0].raceId).toBe('2026-au-g1-sample-2');
      expect(results[0].timeJst).toBe('14:15');
      expect(results[0].utcIso).toBe('2026-10-17T05:15:00.000Z');
      expect(results[0].sourceUrl).toBeUndefined();
    });
  });
});
