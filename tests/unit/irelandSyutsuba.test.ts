import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  isIrishSummerTime,
  parseIeTimeToIsoAndJst,
  ieRaceMatches,
  ieCourseMatches,
  parseSportingLifeIeRacecardsJson,
  fetchIeConfirmedRaceTimes,
} from '../../scripts/lib/ie-syutsuba';
import type { SportingLifeMeetingItem } from '../../scripts/lib/uk-syutsuba';
import {
  IeRaceTimeFetcher,
  getIeUpcomingWindowRange,
  updateRaceTimes,
  type RaceOutput,
} from '../../scripts/update-race-times';

describe('Ireland Syutsuba utility', () => {
  describe('isIrishSummerTime', () => {
    it('アイルランド夏時間（IST）の期間判定が正しく機能すること', () => {
      // 2026年の3月最終日曜日は 2026-03-29
      expect(isIrishSummerTime('2026-03-28')).toBe(false);
      expect(isIrishSummerTime('2026-03-29')).toBe(true);

      // 夏季
      expect(isIrishSummerTime('2026-06-28')).toBe(true);
      expect(isIrishSummerTime('2026-09-26')).toBe(true);

      // 2026年の10月最終日曜日は 2026-10-25
      expect(isIrishSummerTime('2026-10-24')).toBe(true);
      expect(isIrishSummerTime('2026-10-25')).toBe(false);

      // 冬季
      expect(isIrishSummerTime('2026-01-15')).toBe(false);
      expect(isIrishSummerTime('2026-12-25')).toBe(false);
    });
  });

  describe('parseIeTimeToIsoAndJst', () => {
    it('夏時間（IST: UTC+1）の現地時刻から UTC ISO と JST 表記を生成すること', () => {
      // 2026-06-28 15:40 IST -> 14:40 UTC -> 23:40 JST
      const result = parseIeTimeToIsoAndJst('2026-06-28', '15:40');
      expect(result.utcIso).toBe('2026-06-28T14:40:00.000Z');
      expect(result.timeJst).toBe('23:40');
      expect(result.rawTime).toBe('23:40 JST');
    });

    it('冬時間（GMT: UTC+0）の現地時刻から UTC ISO と JST 表記を生成すること', () => {
      // 2026-11-15 14:15 GMT -> 14:15 UTC -> 23:15 JST
      const result = parseIeTimeToIsoAndJst('2026-11-15', '14:15');
      expect(result.utcIso).toBe('2026-11-15T14:15:00.000Z');
      expect(result.timeJst).toBe('23:15');
      expect(result.rawTime).toBe('23:15 JST');
    });
  });

  describe('ieRaceMatches', () => {
    it('スポンサー冠名や追加表記が含まれていても重賞名が正しく照合できること', () => {
      expect(
        ieRaceMatches(
          'Irish Derby',
          'Dubai Duty Free Irish Derby (Group 1)'
        )
      ).toBe(true);

      expect(
        ieRaceMatches(
          'Irish Champion Stakes',
          'Royal Bahrain Irish Champion Stakes (Group 1)'
        )
      ).toBe(true);

      expect(
        ieRaceMatches(
          'Beresford Stakes',
          'Alan Smurfit Memorial Beresford Stakes (Group 2)'
        )
      ).toBe(true);

      expect(
        ieRaceMatches(
          'Renaissance Stakes',
          'William Hill Renaissance Stakes (Group 3)'
        )
      ).toBe(true);

      expect(
        ieRaceMatches(
          'Tattersalls Gold Cup',
          'Tattersalls Gold Cup (Group 1)'
        )
      ).toBe(true);

      expect(
        ieRaceMatches(
          'Irish Oaks',
          'Matron Stakes'
        )
      ).toBe(false);
    });
  });

  describe('ieCourseMatches', () => {
    it('競馬場名が正しく照合されること', () => {
      expect(ieCourseMatches('Curragh', 'Curragh')).toBe(true);
      expect(ieCourseMatches('Leopardstown', 'Leopardstown')).toBe(true);
      expect(ieCourseMatches('Naas', 'Naas Racecourse')).toBe(true);
      expect(ieCourseMatches('Curragh', 'Dundalk')).toBe(false);
    });
  });

  describe('parseSportingLifeIeRacecardsJson', () => {
    const mockMeetings: SportingLifeMeetingItem[] = [
      {
        meeting_summary: {
          date: '2026-09-26',
          course: {
            name: 'Curragh',
          },
        },
        races: [
          {
            name: 'Alan Smurfit Memorial Beresford Stakes (Group 2)',
            course_name: 'Curragh',
            date: '2026-09-26',
            time: '14:25',
            ride_count: 7,
          },
          {
            name: 'William Hill Renaissance Stakes (Group 3)',
            course_name: 'Curragh',
            date: '2026-09-26',
            time: '15:35',
            ride_count: 9,
          },
        ],
      },
    ];

    const mockTargetRaces: RaceOutput[] = [
      {
        id: '2026-ie-g2-14',
        organization: 'hri',
        country_code: 'IE',
        name: {
          ja: 'ベレスフォードステークス',
          en: 'Beresford Stakes',
        },
        grade: 'G2',
        date: '2026-09-26',
        start_time: '2026-09-26T14:00:00.000Z',
        is_time_confirmed: false,
        course: {
          ja: 'カラ',
          en: 'Curragh',
        },
        distance: 1600,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '2yo',
        handicap: {
          code: 'set_weight',
          ja: '馬齢',
          en: 'Set Weight',
        },
      },
      {
        id: '2026-ie-g3-35',
        organization: 'hri',
        country_code: 'IE',
        name: {
          ja: 'ルネサンスステークス',
          en: 'Renaissance Stakes',
        },
        grade: 'G3',
        date: '2026-09-26',
        start_time: '2026-09-26T14:30:00.000Z',
        is_time_confirmed: false,
        course: {
          ja: 'カラ',
          en: 'Curragh',
        },
        distance: 1200,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: {
          code: 'weight_for_age',
          ja: '定量',
          en: 'Weight for Age',
        },
      },
    ];

    it('Sporting Life レスポンスからアイルランド対象レースを抽出して ConfirmedRaceTime を生成すること', () => {
      const results = parseSportingLifeIeRacecardsJson(mockMeetings, mockTargetRaces, '2026-09-26');
      expect(results).toHaveLength(2);

      expect(results[0].raceId).toBe('2026-ie-g2-14');
      expect(results[0].raceName).toBe('ベレスフォードステークス');
      expect(results[0].date).toBe('2026-09-26');
      // 14:25 IST -> 13:25 UTC -> 22:25 JST
      expect(results[0].utcIso).toBe('2026-09-26T13:25:00.000Z');
      expect(results[0].timeJst).toBe('22:25');

      expect(results[1].raceId).toBe('2026-ie-g3-35');
      expect(results[1].raceName).toBe('ルネサンスステークス');
      // 15:35 IST -> 14:35 UTC -> 23:35 JST
      expect(results[1].utcIso).toBe('2026-09-26T14:35:00.000Z');
      expect(results[1].timeJst).toBe('23:35');
    });
  });

  describe('fetchIeConfirmedRaceTimes', () => {
    it('フィクスチャ注入により正しく確定発走時刻を取得できること', async () => {
      const mockMeetings: SportingLifeMeetingItem[] = [
        {
          meeting_summary: {
            date: '2026-09-27',
            course: { name: 'Curragh' },
          },
          races: [
            {
              name: 'C.L. & M.F. Weld Park Stakes (Fillies Group 3)',
              course_name: 'Curragh',
              date: '2026-09-27',
              time: '14:45',
              ride_count: 8,
            },
          ],
        },
      ];

      const targetRace: RaceOutput = {
        id: '2026-ie-g3-36',
        organization: 'hri',
        country_code: 'IE',
        name: {
          ja: 'ウェルドパークステークス',
          en: 'C.L. & M.F. Weld Park Stakes',
        },
        grade: 'G3',
        date: '2026-09-27',
        start_time: '2026-09-27T14:00:00.000Z',
        is_time_confirmed: false,
        course: {
          ja: 'カラ',
          en: 'Curragh',
        },
        distance: 1400,
        track_type: 'turf',
        sex_constraint: 'filly_and_mare',
        age_constraint: '2yo',
        handicap: {
          code: 'set_weight',
          ja: '馬齢',
          en: 'Set Weight',
        },
      };

      const result = await fetchIeConfirmedRaceTimes({
        targetRaces: [targetRace],
        fixtures: {
          '2026-09-27': mockMeetings,
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].raceId).toBe('2026-ie-g3-36');
      expect(result[0].raceName).toBe('ウェルドパークステークス');
      // 14:45 IST -> 13:45 UTC -> 22:45 JST
      expect(result[0].utcIso).toBe('2026-09-27T13:45:00.000Z');
      expect(result[0].timeJst).toBe('22:45');
    });
  });

  describe('IeRaceTimeFetcher & updateRaceTimes 統合', () => {
    it('getIeUpcomingWindowRange が基準日から7日間の範囲を返すこと', () => {
      const { startDate, endDate } = getIeUpcomingWindowRange('2026-09-26');
      expect(startDate).toBe('2026-09-26');
      expect(endDate).toBe('2026-10-02');
    });

    it('updateRaceTimes でアイルランド重賞の未確定時刻が確定値へ更新されること', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ie-time-test-'));
      const testRacesPath = path.join(tempDir, 'races.json');

      const initialRaces: RaceOutput[] = [
        {
          id: '2026-ie-g2-sample',
          organization: 'hri',
          country_code: 'IE',
          name: {
            ja: 'ベレスフォードステークス',
            en: 'Beresford Stakes',
          },
          grade: 'G2',
          date: '2026-09-26',
          start_time: '2026-09-26T14:00:00.000Z',
          is_time_confirmed: false,
          course: {
            ja: 'カラ',
            en: 'Curragh',
          },
          distance: 1600,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '2yo',
          handicap: {
            code: 'set_weight',
            ja: '馬齢',
            en: 'Set Weight',
          },
        },
      ];

      fs.writeFileSync(testRacesPath, JSON.stringify(initialRaces, null, 2), 'utf-8');

      const mockMeetings: SportingLifeMeetingItem[] = [
        {
          meeting_summary: {
            date: '2026-09-26',
            course: { name: 'Curragh' },
          },
          races: [
            {
              name: 'Alan Smurfit Memorial Beresford Stakes (Group 2)',
              course_name: 'Curragh',
              date: '2026-09-26',
              time: '14:25',
              ride_count: 7,
            },
          ],
        },
      ];

      const fetcher = new IeRaceTimeFetcher({
        fixtures: {
          '2026-09-26': mockMeetings,
        },
      });

      const res = await updateRaceTimes({
        filePath: testRacesPath,
        organization: 'hri',
        referenceDate: '2026-09-26',
        fetchers: {
          hri: fetcher,
        },
      });

      expect(res.updatedRaces).toHaveLength(1);
      expect(res.updatedRaces[0].id).toBe('2026-ie-g2-sample');
      expect(res.updatedRaces[0].newTime).toBe('2026-09-26T13:25:00.000Z');

      const updatedData: RaceOutput[] = JSON.parse(fs.readFileSync(testRacesPath, 'utf-8'));
      expect(updatedData[0].is_time_confirmed).toBe(true);
      expect(updatedData[0].start_time).toBe('2026-09-26T13:25:00.000Z');

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });
});
