import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  updateRaceTimes,
  getJraUpcomingWeekendRange,
  RaceTimeFetcher,
  RaceOutput,
} from '../../scripts/update-race-times';
import { ConfirmedRaceTime } from '../../scripts/lib/jra-syutsuba';

describe('update-race-times script (Provider Architecture)', () => {
  describe('getJraUpcomingWeekendRange', () => {
    it('木曜日基準で木〜月曜の範囲を算出できること', () => {
      const range = getJraUpcomingWeekendRange('2026-09-17'); // 木曜日
      expect(range.startDate).toBe('2026-09-17');
      expect(range.endDate).toBe('2026-09-21');
    });

    it('土曜日基準で直前の木曜〜翌月曜の範囲を算出できること', () => {
      const range = getJraUpcomingWeekendRange('2026-09-19'); // 土曜日
      expect(range.startDate).toBe('2026-09-17');
      expect(range.endDate).toBe('2026-09-21');
    });

    it('水曜日基準で今週末の木曜〜翌月曜の範囲を算出できること', () => {
      const range = getJraUpcomingWeekendRange('2026-09-16'); // 水曜日
      expect(range.startDate).toBe('2026-09-17');
      expect(range.endDate).toBe('2026-09-21');
    });
  });

  describe('updateRaceTimes execution with Providers', () => {
    let tempDir: string;
    let tempFilePath: string;

    const mockInitialRaces: RaceOutput[] = [
      {
        id: '2026-jra-jg3-04',
        organization: 'jra',
        name: { ja: '阪神ジャンプステークス', en: 'Hanshin Jump Stakes' },
        grade: 'J.G3',
        date: '2026-09-19',
        start_time: '2026-09-19T04:50:00.000Z', // 推定値 13:50 JST
        is_time_confirmed: false,
        course: { ja: '阪神', en: 'Hanshin' },
        distance: 3140,
        track_type: 'obstacle',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: { code: 'set_weight', ja: '別定', en: 'Set Weight' },
      },
      {
        id: '2026-jra-g2-26',
        organization: 'jra',
        name: { ja: '産経賞オールカマー', en: 'Sankei Sho All Comers' },
        grade: 'G2',
        date: '2026-09-20',
        start_time: '2026-09-20T06:40:00.000Z', // 推定値 15:40 JST
        is_time_confirmed: false,
        course: { ja: '中山', en: 'Nakayama' },
        distance: 2200,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: { code: 'set_weight', ja: '別定', en: 'Set Weight' },
      },
      {
        id: '2026-jra-g1-08',
        organization: 'jra',
        name: { ja: 'スプリンターズステークス', en: 'Sprinters Stakes' },
        grade: 'G1',
        date: '2026-09-27',
        start_time: '2026-09-27T06:40:00.000Z',
        is_time_confirmed: false,
        course: { ja: '中山', en: 'Nakayama' },
        distance: 1200,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
      },
      // 将来の拡張を模したNARレースのモックデータ
      {
        id: '2026-nar-jpn2-01',
        organization: 'nar',
        name: { ja: '東京盃', en: 'Tokyo Hai' },
        grade: 'Jpn2',
        date: '2026-10-07',
        start_time: '2026-10-07T11:10:00.000Z',
        is_time_confirmed: false,
        course: { ja: '大井', en: 'Ohi' },
        distance: 1200,
        track_type: 'dirt',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: { code: 'set_weight', ja: '別定', en: 'Set Weight' },
      },
    ];

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'races-test-'));
      tempFilePath = path.join(tempDir, 'races.json');
      fs.writeFileSync(tempFilePath, JSON.stringify(mockInitialRaces, null, 2), 'utf-8');
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('JRAフェッチャーにより一致するレースのstart_timeを更新しis_time_confirmedをtrueにすること', async () => {
      const mockConfirmedTimes: ConfirmedRaceTime[] = [
        {
          raceName: '阪神ジャンプステークス',
          date: '2026-09-19',
          timeJst: '11:20',
          rawTime: '11時20分',
        },
        {
          raceName: 'オールカマー', // 略称マッチング
          date: '2026-09-20',
          timeJst: '15:45',
          rawTime: '15時45分',
        },
      ];

      const result = await updateRaceTimes({
        filePath: tempFilePath,
        referenceDate: '2026-09-19',
        confirmedTimes: mockConfirmedTimes,
      });

      expect(result.updatedRaces).toHaveLength(2);
      expect(result.orgResults.jra.skippedDueToConfirmed).toBe(false);
      expect(result.orgResults.jra.updatedCount).toBe(2);

      const savedData: RaceOutput[] = JSON.parse(fs.readFileSync(tempFilePath, 'utf-8'));
      const updatedHanshin = savedData.find((r) => r.id === '2026-jra-jg3-04')!;
      expect(updatedHanshin.start_time).toBe('2026-09-19T02:20:00.000Z'); // 11:20 JST -> 02:20 UTC
      expect(updatedHanshin.is_time_confirmed).toBe(true);
      expect(updatedHanshin.name.ja).toBe('阪神ジャンプステークス');

      const updatedAllComer = savedData.find((r) => r.id === '2026-jra-g2-26')!;
      expect(updatedAllComer.start_time).toBe('2026-09-20T06:45:00.000Z'); // 15:45 JST -> 06:45 UTC
      expect(updatedAllComer.is_time_confirmed).toBe(true);

      // NARレースや未来のJRAレースは変更されない
      const untouchedJra = savedData.find((r) => r.id === '2026-jra-g1-08')!;
      expect(untouchedJra.is_time_confirmed).toBe(false);

      const untouchedNar = savedData.find((r) => r.id === '2026-nar-jpn2-01')!;
      expect(untouchedNar.is_time_confirmed).toBe(false);
    });

    it('JRAの当週レースが全て確定済みの場合は早期終了ガードによりJRAフェッチをスキップすること', async () => {
      const allConfirmedRaces = mockInitialRaces.map((r) => {
        if (r.organization === 'jra' && (r.date === '2026-09-19' || r.date === '2026-09-20')) {
          return { ...r, is_time_confirmed: true };
        }
        return r;
      });
      fs.writeFileSync(tempFilePath, JSON.stringify(allConfirmedRaces, null, 2), 'utf-8');

      const mockFetcher: RaceTimeFetcher = {
        organization: 'jra',
        getTargetWindowRaces: (races, refDate) => {
          const { startDate, endDate } = getJraUpcomingWeekendRange(refDate);
          return races.filter((r) => r.organization === 'jra' && r.date >= startDate && r.date <= endDate);
        },
        fetchConfirmedTimes: vi.fn(),
      };

      const result = await updateRaceTimes({
        filePath: tempFilePath,
        referenceDate: '2026-09-19',
        fetchers: { jra: mockFetcher },
      });

      expect(result.orgResults.jra.skippedDueToConfirmed).toBe(true);
      expect(mockFetcher.fetchConfirmedTimes).not.toHaveBeenCalled();
      expect(result.updatedRaces).toHaveLength(0);
    });

    it('--force オプション指定時は早期終了ガードをバイパスすること', async () => {
      const allConfirmedRaces = mockInitialRaces.map((r) => {
        if (r.organization === 'jra' && (r.date === '2026-09-19' || r.date === '2026-09-20')) {
          return { ...r, is_time_confirmed: true };
        }
        return r;
      });
      fs.writeFileSync(tempFilePath, JSON.stringify(allConfirmedRaces, null, 2), 'utf-8');

      const mockConfirmedTimes: ConfirmedRaceTime[] = [
        {
          raceName: '阪神ジャンプステークス',
          date: '2026-09-19',
          timeJst: '11:25',
          rawTime: '11時25分',
        },
      ];

      const result = await updateRaceTimes({
        filePath: tempFilePath,
        referenceDate: '2026-09-19',
        force: true,
        confirmedTimes: mockConfirmedTimes,
      });

      expect(result.orgResults.jra.skippedDueToConfirmed).toBe(false);
      expect(result.updatedRaces).toHaveLength(1);
    });

    it('--org=jra で特定の組織のみを対象に実行できること', async () => {
      const mockNarFetcher: RaceTimeFetcher = {
        organization: 'nar',
        getTargetWindowRaces: vi.fn().mockReturnValue([]),
        fetchConfirmedTimes: vi.fn(),
      };

      const mockJraFetcher: RaceTimeFetcher = {
        organization: 'jra',
        getTargetWindowRaces: vi.fn().mockReturnValue([]),
        fetchConfirmedTimes: vi.fn().mockResolvedValue([]),
      };

      await updateRaceTimes({
        filePath: tempFilePath,
        referenceDate: '2026-09-19',
        organization: 'jra',
        fetchers: {
          jra: mockJraFetcher,
          nar: mockNarFetcher,
        },
      });

      expect(mockJraFetcher.getTargetWindowRaces).toHaveBeenCalled();
      expect(mockNarFetcher.getTargetWindowRaces).not.toHaveBeenCalled();
    });

    it('--dry-run オプション指定時はファイルに書き込みを行わないこと', async () => {
      const originalFileContent = fs.readFileSync(tempFilePath, 'utf-8');

      const mockConfirmedTimes: ConfirmedRaceTime[] = [
        {
          raceName: '阪神ジャンプステークス',
          date: '2026-09-19',
          timeJst: '11:20',
          rawTime: '11時20分',
        },
      ];

      const result = await updateRaceTimes({
        filePath: tempFilePath,
        referenceDate: '2026-09-19',
        dryRun: true,
        confirmedTimes: mockConfirmedTimes,
      });

      expect(result.updatedRaces).toHaveLength(1);
      const afterFileContent = fs.readFileSync(tempFilePath, 'utf-8');
      expect(afterFileContent).toBe(originalFileContent);
    });
  });
});
