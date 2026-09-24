import { describe, it, expect } from 'vitest';
import {
  parseHkTimeToIsoAndJst,
  normalizeHkRaceName,
  hkRaceMatches,
  hkCourseMatches,
  parseHkjcHtml,
  parseHkjcRacecards,
  fetchHkConfirmedRaceTimes,
  HkjcRaceItem,
} from '../../scripts/lib/hk-syutsuba';
import {
  getHkUpcomingWindowRange,
  HkRaceTimeFetcher,
  updateRaceTimes,
  RaceOutput,
} from '../../scripts/update-race-times';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('HK Syutsuba utility', () => {
  describe('parseHkTimeToIsoAndJst', () => {
    it('香港現地時刻（HKT: UTC+8）を正確に UTC ISO 8601 文字列および JST HH:mm 表記に変換すること', () => {
      // 16:05 HKT -> 17:05 JST, UTC 08:05
      const result = parseHkTimeToIsoAndJst('2026-04-26', '16:05');
      expect(result.utcIso).toBe('2026-04-26T08:05:00.000Z');
      expect(result.timeJst).toBe('17:05');
      expect(result.rawTime).toBe('16:05');
    });

    it('秒付きの現地時刻を正しく処理できること', () => {
      const result = parseHkTimeToIsoAndJst('2026-01-01', '13:00:00');
      expect(result.utcIso).toBe('2026-01-01T05:00:00.000Z');
      expect(result.timeJst).toBe('14:00');
    });

    it('ナイター開催（跑馬地）の現地時刻を正しく変換できること', () => {
      // 20:50 HKT -> 21:50 JST, UTC 12:50
      const result = parseHkTimeToIsoAndJst('2026-01-07', '20:50');
      expect(result.utcIso).toBe('2026-01-07T12:50:00.000Z');
      expect(result.timeJst).toBe('21:50');
    });
  });

  describe('normalizeHkRaceName', () => {
    it('スポンサー冠名を除去し大文字アルファベットと数字のみに正規化すること', () => {
      expect(normalizeHkRaceName('FWD QEII Cup')).toBe('QEII CUP');
      expect(normalizeHkRaceName('BMW Hong Kong Derby')).toBe('HONG KONG DERBY');
      expect(normalizeHkRaceName('BOCHK Private Wealth Jockey Club Sprint')).toBe('JOCKEY CLUB SPRINT');
      expect(normalizeHkRaceName("Queen's Silver Jubilee Cup")).toBe('QUEEN S SILVER JUBILEE CUP');
    });
  });

  describe('hkRaceMatches', () => {
    it('スポンサー付きの出馬表レース名とターゲットレース名が一致すること', () => {
      expect(
        hkRaceMatches('Queen Elizabeth II Cup', 'FWD QEII Cup')
      ).toBe(true);

      expect(
        hkRaceMatches('Hong Kong Derby', 'BMW Hong Kong Derby')
      ).toBe(true);

      expect(
        hkRaceMatches('Jockey Club Mile', 'BOCHK Private Banking Jockey Club Mile')
      ).toBe(true);
    });

    it('繁体字中国語名での完全・部分一致判定ができること', () => {
      expect(
        hkRaceMatches('Queen Elizabeth II Cup', '第8場 - 富衛保險女皇盃', '富衛保險女皇盃')
      ).toBe(true);

      expect(
        hkRaceMatches('Hong Kong Cup', '香港盃 (G1)', '香港盃')
      ).toBe(true);
    });

    it('無関係なレース名には一致しないこと', () => {
      expect(
        hkRaceMatches('Hong Kong Cup', 'Class 3 Handicap', '香港盃')
      ).toBe(false);
    });
  });

  describe('hkCourseMatches', () => {
    it('シャティン（Sha Tin）の表記ゆれを正しく判定すること', () => {
      expect(hkCourseMatches('Sha Tin', 'Sha Tin')).toBe(true);
      expect(hkCourseMatches('シャティン', 'ST')).toBe(true);
      expect(hkCourseMatches('沙田', 'Sha Tin Racecourse')).toBe(true);
    });

    it('ハッピーバレー（Happy Valley）の表記ゆれを正しく判定すること', () => {
      expect(hkCourseMatches('Happy Valley', 'Happy Valley')).toBe(true);
      expect(hkCourseMatches('ハッピーバレー', 'HV')).toBe(true);
      expect(hkCourseMatches('跑馬地', 'Happy Valley')).toBe(true);
    });

    it('異なる競馬場の場合はfalseを返すこと', () => {
      expect(hkCourseMatches('Sha Tin', 'Happy Valley')).toBe(false);
      expect(hkCourseMatches('ハッピーバレー', 'Sha Tin')).toBe(false);
    });
  });

  describe('parseHkjcHtml', () => {
    it('HKJC出馬表HTMLからレース一覧を抽出できること', () => {
      const mockHtml = `
        <html>
          <body>
            <table class="font13">
              <tr>
                <td>Race 1</td>
                <td>13:00</td>
                <td>Chinese Club Challenge Cup</td>
              </tr>
              <tr>
                <td>Race 7</td>
                <td>16:05</td>
                <td>Bauhinia Sprint Trophy</td>
              </tr>
            </table>
          </body>
        </html>
      `;

      const items = parseHkjcHtml(mockHtml);
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({
        raceNo: 1,
        raceName: 'Chinese Club Challenge Cup',
        time: '13:00',
      });
      expect(items[1]).toEqual({
        raceNo: 7,
        raceName: 'Bauhinia Sprint Trophy',
        time: '16:05',
      });
    });
  });

  describe('parseHkjcRacecards', () => {
    const mockTargetRaces: RaceOutput[] = [
      {
        id: '2026-hk-g1-sample-qeii',
        organization: 'hkjc',
        country_code: 'HK',
        name: {
          ja: 'クイーンエリザベス2世カップ',
          en: 'Queen Elizabeth II Cup',
        },
        grade: 'G1',
        date: '2026-04-26',
        start_time: '2026-04-26T08:00:00.000Z',
        is_time_confirmed: false,
        course: { ja: 'シャティン', en: 'Sha Tin' },
        distance: 2000,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
      },
    ];

    it('出馬表アイテムからターゲットレースの確定時刻を生成すること', () => {
      const raceItems: HkjcRaceItem[] = [
        {
          raceNo: 8,
          raceName: 'FWD QEII Cup',
          raceNameZh: '富衛保險女皇盃',
          time: '16:40', // 16:40 HKT -> 08:40 UTC
          course: 'Sha Tin',
        },
      ];

      const confirmed = parseHkjcRacecards(raceItems, mockTargetRaces, '2026-04-26');
      expect(confirmed).toHaveLength(1);
      expect(confirmed[0].raceId).toBe('2026-hk-g1-sample-qeii');
      expect(confirmed[0].utcIso).toBe('2026-04-26T08:40:00.000Z');
      expect(confirmed[0].timeJst).toBe('17:40');
      expect(confirmed[0].rawTime).toBe('16:40');
    });
  });

  describe('fetchHkConfirmedRaceTimes', () => {
    it('fixtures から対象日の確定発走時刻を正しく取得できること', async () => {
      const sampleRace: RaceOutput = {
        id: '2026-hk-g1-sample-derby',
        organization: 'hkjc',
        country_code: 'HK',
        name: {
          ja: '香港ダービー',
          en: 'Hong Kong Derby',
        },
        grade: 'G1',
        date: '2026-03-22',
        start_time: '2026-03-22T08:00:00.000Z',
        is_time_confirmed: false,
        course: { ja: 'シャティン', en: 'Sha Tin' },
        distance: 2000,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '4yo',
        handicap: { code: 'set_weight', ja: '馬齢', en: 'Set Weight' },
      };

      const fixtures = {
        '2026-03-22': [
          {
            raceNo: 8,
            raceName: 'BMW Hong Kong Derby',
            time: '16:40',
            course: 'Sha Tin',
          },
        ],
      };

      const results = await fetchHkConfirmedRaceTimes({
        targetRaces: [sampleRace],
        fixtures,
      });

      expect(results).toHaveLength(1);
      expect(results[0].raceId).toBe('2026-hk-g1-sample-derby');
      expect(results[0].utcIso).toBe('2026-03-22T08:40:00.000Z');
      expect(results[0].timeJst).toBe('17:40');
    });
  });

  describe('getHkUpcomingWindowRange', () => {
    it('基準日から7日間の範囲を算出すること', () => {
      const { startDate, endDate } = getHkUpcomingWindowRange('2026-09-24');
      expect(startDate).toBe('2026-09-24');
      expect(endDate).toBe('2026-09-30');
    });
  });

  describe('HkRaceTimeFetcher & updateRaceTimes 統合', () => {
    let tmpDir: string;
    let tmpFilePath: string;

    it('updateRaceTimes で香港重賞の未確定時刻が確定値へ更新されること', async () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hk-time-test-'));
      tmpFilePath = path.join(tmpDir, 'races.json');

      const sampleRaces: RaceOutput[] = [
        {
          id: '2026-hk-g3-sample-celebration',
          organization: 'hkjc',
          country_code: 'HK',
          name: {
            ja: 'セレブレーションカップ',
            en: 'Celebration Cup',
          },
          grade: 'G3',
          date: '2026-09-27',
          start_time: '2026-09-27T08:05:00.000Z',
          is_time_confirmed: false,
          course: { ja: 'シャティン', en: 'Sha Tin' },
          distance: 1400,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'handicap', ja: 'ハンデ', en: 'Handicap' },
        },
      ];

      fs.writeFileSync(tmpFilePath, JSON.stringify(sampleRaces, null, 2), 'utf-8');

      const hkFixtures: Record<string, HkjcRaceItem[]> = {
        '2026-09-27': [
          {
            raceNo: 7,
            raceName: 'Celebration Cup (Handicap)',
            time: '16:10', // 16:10 HKT -> 08:10 UTC (17:10 JST)
            course: 'Sha Tin',
          },
        ],
      };

      const customFetcher = new HkRaceTimeFetcher({ fixtures: hkFixtures });

      const result = await updateRaceTimes({
        filePath: tmpFilePath,
        referenceDate: '2026-09-24',
        organization: 'hkjc',
        fetchers: { hkjc: customFetcher },
      });

      expect(result.updatedRaces).toHaveLength(1);
      expect(result.updatedRaces[0].id).toBe('2026-hk-g3-sample-celebration');
      expect(result.updatedRaces[0].newTime).toBe('2026-09-27T08:10:00.000Z');

      const savedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(tmpFilePath, 'utf-8'));
      expect(savedRaces[0].is_time_confirmed).toBe(true);
      expect(savedRaces[0].start_time).toBe('2026-09-27T08:10:00.000Z');

      // クリーンアップ
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  });
});
