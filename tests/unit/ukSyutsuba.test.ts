import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  isBritishSummerTime,
  parseUkTimeToIsoAndJst,
  tokenizeEnglish,
  ukRaceMatches,
  ukCourseMatches,
  parseSportingLifeRacecardsJson,
  fetchUkConfirmedRaceTimes,
  type SportingLifeMeetingItem,
} from '../../scripts/lib/uk-syutsuba';
import {
  UkRaceTimeFetcher,
  getUkUpcomingWindowRange,
  updateRaceTimes,
  type RaceOutput,
} from '../../scripts/update-race-times';

describe('UK Syutsuba utility', () => {
  describe('isBritishSummerTime', () => {
    it('英国夏時間（BST）の期間判定が正しく機能すること', () => {
      // 2026年の3月最終日曜日は 2026-03-29
      expect(isBritishSummerTime('2026-03-28')).toBe(false);
      expect(isBritishSummerTime('2026-03-29')).toBe(true);

      // 夏季
      expect(isBritishSummerTime('2026-06-20')).toBe(true);
      expect(isBritishSummerTime('2026-09-19')).toBe(true);

      // 2026年の10月最終日曜日は 2026-10-25
      expect(isBritishSummerTime('2026-10-24')).toBe(true);
      expect(isBritishSummerTime('2026-10-25')).toBe(false);

      // 冬季
      expect(isBritishSummerTime('2026-01-15')).toBe(false);
      expect(isBritishSummerTime('2026-12-25')).toBe(false);
    });
  });

  describe('parseUkTimeToIsoAndJst', () => {
    it('夏時間（BST: UTC+1）の現地時刻から UTC ISO と JST 表記を生成すること', () => {
      // 2026-09-19 12:02 BST -> 11:02 UTC -> 20:02 JST
      const result = parseUkTimeToIsoAndJst('2026-09-19', '12:02');
      expect(result.utcIso).toBe('2026-09-19T11:02:00.000Z');
      expect(result.timeJst).toBe('20:02');
      expect(result.rawTime).toBe('20:02 JST');
    });

    it('冬時間（GMT: UTC+0）の現地時刻から UTC ISO と JST 表記を生成すること', () => {
      // 2026-02-21 14:40 GMT -> 14:40 UTC -> 23:40 JST
      const result = parseUkTimeToIsoAndJst('2026-02-21', '14:40');
      expect(result.utcIso).toBe('2026-02-21T14:40:00.000Z');
      expect(result.timeJst).toBe('23:40');
      expect(result.rawTime).toBe('23:40 JST');
    });
  });

  describe('tokenizeEnglish & ukRaceMatches', () => {
    it('英語文字列が正規化されストップワードが除外されること', () => {
      const tokens = tokenizeEnglish("Dubai Duty Free Mill Reef Stakes (Group 2)");
      expect(tokens).toContain('DUBAI');
      expect(tokens).toContain('DUTY');
      expect(tokens).toContain('FREE');
      expect(tokens).toContain('MILL');
      expect(tokens).toContain('REEF');
      expect(tokens).not.toContain('STAKES');
      expect(tokens).not.toContain('GROUP');
    });

    it('スポンサー冠名や追加表記が含まれていても重賞名が正しく照合できること', () => {
      expect(
        ukRaceMatches(
          'Firth of Clyde Stakes',
          "Ladbrokes 'New Customers Get 50/1 Old Firm Offer' Firth Of Clyde (Fillies' Group 3)"
        )
      ).toBe(true);

      expect(
        ukRaceMatches(
          'World Trophy',
          'Dubai International Airport World Trophy Stakes (Group 3)'
        )
      ).toBe(true);

      expect(
        ukRaceMatches(
          'Mill Reef Stakes',
          'Dubai Duty Free Mill Reef Stakes (Group 2) (In Honour Of Ian Balding)'
        )
      ).toBe(true);

      expect(
        ukRaceMatches(
          'Derby',
          'Betfred Derby (Group 1)'
        )
      ).toBe(true);

      expect(
        ukRaceMatches(
          'Coronation Cup',
          'Queen Elizabeth II Stakes'
        )
      ).toBe(false);
    });
  });

  describe('ukCourseMatches', () => {
    it('競馬場名が正しく照合されること', () => {
      expect(ukCourseMatches('Newbury', 'Newbury')).toBe(true);
      expect(ukCourseMatches('Newmarket', 'Newmarket (Rowley Mile)')).toBe(true);
      expect(ukCourseMatches('Ascot', 'York')).toBe(false);
    });
  });

  describe('parseSportingLifeRacecardsJson', () => {
    const mockMeetings: SportingLifeMeetingItem[] = [
      {
        meeting_summary: {
          date: '2026-09-19',
          course: {
            name: 'Newbury',
          },
        },
        races: [
          {
            name: 'Dubai International Airport World Trophy Stakes (Group 3)',
            course_name: 'Newbury',
            date: '2026-09-19',
            time: '12:02',
            ride_count: 8,
          },
          {
            name: 'Dubai Duty Free Mill Reef Stakes (Group 2) (In Honour Of Ian Balding)',
            course_name: 'Newbury',
            date: '2026-09-19',
            time: '13:12',
            ride_count: 6,
          },
        ],
      },
    ];

    const mockTargetRaces: RaceOutput[] = [
      {
        id: '2026-uk-g3-70',
        organization: 'bha',
        country_code: 'GB',
        name: {
          ja: 'ワールドトロフィー',
          en: 'World Trophy',
        },
        grade: 'G3',
        date: '2026-09-19',
        start_time: '2026-09-19T13:00:00.000Z',
        is_time_confirmed: false,
        course: {
          ja: 'ニューベリー',
          en: 'Newbury',
        },
        distance: 1037,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: {
          code: 'special_weight',
          ja: '別定',
          en: 'Special Weight',
        },
      },
    ];

    it('Sporting Life レスポンスから対象レースを抽出して ConfirmedRaceTime を生成すること', () => {
      const results = parseSportingLifeRacecardsJson(mockMeetings, mockTargetRaces, '2026-09-19');
      expect(results).toHaveLength(1);
      expect(results[0].raceId).toBe('2026-uk-g3-70');
      expect(results[0].raceName).toBe('ワールドトロフィー');
      expect(results[0].date).toBe('2026-09-19');
      // 12:02 BST -> 11:02 UTC
      expect(results[0].utcIso).toBe('2026-09-19T11:02:00.000Z');
      expect(results[0].timeJst).toBe('20:02');
    });
  });

  describe('fetchUkConfirmedRaceTimes', () => {
    it('フィクスチャ注入により正しく確定発走時刻を取得できること', async () => {
      const mockMeetings: SportingLifeMeetingItem[] = [
        {
          meeting_summary: {
            date: '2026-09-19',
            course: { name: 'Ayr' },
          },
          races: [
            {
              name: "Ladbrokes 'New Customers Get 50/1 Old Firm Offer' Firth Of Clyde (Fillies' Group 3)",
              course_name: 'Ayr',
              date: '2026-09-19',
              time: '14:05',
              ride_count: 10,
            },
          ],
        },
      ];

      const targetRace: RaceOutput = {
        id: '2026-uk-g3-71',
        organization: 'bha',
        country_code: 'GB',
        name: {
          ja: 'ファースオブクライドステークス',
          en: 'Firth of Clyde Stakes',
        },
        grade: 'G3',
        date: '2026-09-19',
        start_time: '2026-09-19T13:00:00.000Z',
        is_time_confirmed: false,
        course: {
          ja: 'エアー',
          en: 'Ayr',
        },
        distance: 1207,
        track_type: 'turf',
        sex_constraint: 'filly_and_mare',
        age_constraint: '2yo',
        handicap: {
          code: 'special_weight',
          ja: '別定',
          en: 'Special Weight',
        },
      };

      const results = await fetchUkConfirmedRaceTimes({
        targetRaces: [targetRace],
        fixtures: {
          '2026-09-19': mockMeetings,
        },
      });

      expect(results).toHaveLength(1);
      expect(results[0].raceId).toBe('2026-uk-g3-71');
      // 14:05 BST -> 13:05 UTC -> 22:05 JST
      expect(results[0].utcIso).toBe('2026-09-19T13:05:00.000Z');
      expect(results[0].timeJst).toBe('22:05');
    });
  });

  describe('UkRaceTimeFetcher & updateRaceTimes 統合', () => {
    it('getUkUpcomingWindowRange が基準日から7日間の期間を算出すること', () => {
      const range = getUkUpcomingWindowRange('2026-09-21');
      expect(range.startDate).toBe('2026-09-21');
      expect(range.endDate).toBe('2026-09-27');
    });

    it('updateRaceTimes でイギリス重賞の未確定時刻が確定値へ更新されること', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uk-time-test-'));
      const tempRacesPath = path.join(tempDir, 'races.json');

      const sampleRace: RaceOutput = {
        id: '2026-uk-g2-sample',
        organization: 'bha',
        country_code: 'GB',
        name: {
          ja: 'ミルリーフステークス',
          en: 'Mill Reef Stakes',
        },
        grade: 'G2',
        date: '2026-09-21',
        start_time: '2026-09-21T13:00:00.000Z',
        is_time_confirmed: false,
        course: {
          ja: 'ニューベリー',
          en: 'Newbury',
        },
        distance: 1207,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '2yo',
        handicap: {
          code: 'special_weight',
          ja: '別定',
          en: 'Special Weight',
        },
      };

      fs.writeFileSync(tempRacesPath, JSON.stringify([sampleRace], null, 2), 'utf-8');

      const mockMeetings: SportingLifeMeetingItem[] = [
        {
          meeting_summary: {
            date: '2026-09-21',
            course: { name: 'Newbury' },
          },
          races: [
            {
              name: 'Dubai Duty Free Mill Reef Stakes (Group 2) (In Honour Of Ian Balding)',
              course_name: 'Newbury',
              date: '2026-09-21',
              time: '13:12',
              ride_count: 6,
            },
          ],
        },
      ];

      const fetcher = new UkRaceTimeFetcher({
        fixtures: {
          '2026-09-21': mockMeetings,
        },
      });

      const result = await updateRaceTimes({
        filePath: tempRacesPath,
        organization: 'bha',
        referenceDate: '2026-09-21',
        fetchers: {
          bha: fetcher,
        },
      });

      expect(result.updatedRaces).toHaveLength(1);
      expect(result.updatedRaces[0].id).toBe('2026-uk-g2-sample');
      // 13:12 BST -> 12:12 UTC
      expect(result.updatedRaces[0].newTime).toBe('2026-09-21T12:12:00.000Z');

      const savedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(tempRacesPath, 'utf-8'));
      expect(savedRaces[0].is_time_confirmed).toBe(true);
      expect(savedRaces[0].start_time).toBe('2026-09-21T12:12:00.000Z');

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });
});
