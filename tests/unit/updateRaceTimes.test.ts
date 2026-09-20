import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  updateRaceTimes,
  getJraUpcomingWeekendRange,
  getNarUpcomingWindowRange,
  RaceTimeFetcher,
  NarRaceTimeFetcher,
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

  describe('getNarUpcomingWindowRange', () => {
    it('基準日から7日間の範囲を算出できること', () => {
      const range = getNarUpcomingWindowRange('2026-09-20');
      expect(range.startDate).toBe('2026-09-20');
      expect(range.endDate).toBe('2026-09-26');
    });

    it('任意の日数を指定して範囲を算出できること', () => {
      const range = getNarUpcomingWindowRange('2026-09-20', 3);
      expect(range.startDate).toBe('2026-09-20');
      expect(range.endDate).toBe('2026-09-22');
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

    describe('NarRaceTimeFetcher', () => {
      it('organization が nar であり、対象ウィンドウのNARレースを抽出できること', () => {
        const fetcher = new NarRaceTimeFetcher();
        expect(fetcher.organization).toBe('nar');

        const sampleRaces: RaceOutput[] = [
          {
            ...mockInitialRaces[0],
            id: '2026-nar-test-01',
            organization: 'nar',
            date: '2026-09-22',
          },
          {
            ...mockInitialRaces[0],
            id: '2026-nar-test-02',
            organization: 'nar',
            date: '2026-10-30', // ウィンドウ外
          },
        ];

        const targets = fetcher.getTargetWindowRaces(sampleRaces, '2026-09-20');
        expect(targets).toHaveLength(1);
        expect(targets[0].id).toBe('2026-nar-test-01');
      });
    });

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

    it('天候等による代替開催（日程変更）時に新開催日で上書きし、original_dateとis_rescheduledを保持すること', async () => {
      // 2026-09-20（日）予定の「産経賞オールカマー」が 2026-09-21（月・代替開催）に順延されたケース
      const mockConfirmedTimes: ConfirmedRaceTime[] = [
        {
          raceName: '産経賞オールカマー',
          date: '2026-09-21', // 当初予定の2026-09-20から順延
          timeJst: '15:45',
          rawTime: '15時45分',
        },
      ];

      const result = await updateRaceTimes({
        filePath: tempFilePath,
        referenceDate: '2026-09-19',
        confirmedTimes: mockConfirmedTimes,
      });

      // 更新結果のアサート
      const updatedRace = result.updatedRaces.find((r) => r.id === '2026-jra-g2-26');
      expect(updatedRace).toBeDefined();
      expect(updatedRace?.date).toBe('2026-09-21');
      expect(updatedRace?.isRescheduled).toBe(true);
      expect(updatedRace?.originalDate).toBe('2026-09-20');
      // 15:45 JST -> 06:45 UTC (2026-09-21T06:45:00.000Z)
      expect(updatedRace?.newTime).toBe('2026-09-21T06:45:00.000Z');

      // ファイル保存内容のアサート
      const savedData: RaceOutput[] = JSON.parse(fs.readFileSync(tempFilePath, 'utf-8'));
      const savedTarget = savedData.find((r) => r.id === '2026-jra-g2-26');
      expect(savedTarget).toBeDefined();
      expect(savedTarget?.date).toBe('2026-09-21');
      expect(savedTarget?.start_time).toBe('2026-09-21T06:45:00.000Z');
      expect(savedTarget?.is_rescheduled).toBe(true);
      expect(savedTarget?.original_date).toBe('2026-09-20');
      expect(savedTarget?.is_time_confirmed).toBe(true);
    });

    it('NARフェッチャーにより対象ウィンドウ内のNARレースの発走時刻を更新しis_time_confirmedをtrueにすること', async () => {
      const narRaces: RaceOutput[] = [
        ...mockInitialRaces,
        {
          id: '2026-nar-jpn3-05',
          organization: 'nar',
          name: { ja: '白山大賞典', en: 'Hakusan Daishoten' },
          grade: 'Jpn3',
          date: '2026-09-22',
          start_time: '2026-09-22T08:00:00.000Z', // 推定値 17:00 JST
          is_time_confirmed: false,
          course: { ja: '金沢', en: 'Kanazawa' },
          distance: 2100,
          track_type: 'dirt',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'set_weight', ja: '別定', en: 'Set Weight' },
        },
      ];
      fs.writeFileSync(tempFilePath, JSON.stringify(narRaces, null, 2), 'utf-8');

      const mockNarConfirmed: ConfirmedRaceTime[] = [
        {
          raceName: '白山大賞典',
          date: '2026-09-22',
          timeJst: '18:00', // 確定発走時刻 18:00 JST -> 09:00 UTC
          rawTime: '18:00発走',
        },
      ];

      const customFetcher: RaceTimeFetcher = {
        organization: 'nar',
        getTargetWindowRaces(races, refDate) {
          const { startDate, endDate } = getNarUpcomingWindowRange(refDate);
          return races.filter((r) => r.organization === 'nar' && r.date >= startDate && r.date <= endDate);
        },
        async fetchConfirmedTimes() {
          return mockNarConfirmed;
        },
      };

      const result = await updateRaceTimes({
        filePath: tempFilePath,
        referenceDate: '2026-09-20',
        organization: 'nar',
        fetchers: { nar: customFetcher },
      });

      expect(result.updatedRaces).toHaveLength(1);
      expect(result.updatedRaces[0].id).toBe('2026-nar-jpn3-05');
      // 18:00 JST -> 09:00 UTC (2026-09-22T09:00:00.000Z)
      expect(result.updatedRaces[0].newTime).toBe('2026-09-22T09:00:00.000Z');

      const saved: RaceOutput[] = JSON.parse(fs.readFileSync(tempFilePath, 'utf-8'));
      const hakusan = saved.find((r) => r.id === '2026-nar-jpn3-05');
      expect(hakusan?.is_time_confirmed).toBe(true);
      expect(hakusan?.start_time).toBe('2026-09-22T09:00:00.000Z');
    });

    it('NarRaceTimeFetcherの実装を用いて出馬表（RaceList）から確定時刻を正しく更新できること', async () => {
      const narRaces: RaceOutput[] = [
        ...mockInitialRaces,
        {
          id: '2026-nar-jpn3-05',
          organization: 'nar',
          name: { ja: '白山大賞典', en: 'Hakusan Daishoten' },
          grade: 'Jpn3',
          date: '2026-09-22',
          start_time: '2026-09-22T08:00:00.000Z', // 推定値 17:00 JST
          is_time_confirmed: false,
          course: { ja: '金沢', en: 'Kanazawa' },
          distance: 2100,
          track_type: 'dirt',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'set_weight', ja: '別定', en: 'Set Weight' },
        },
      ];
      fs.writeFileSync(tempFilePath, JSON.stringify(narRaces, null, 2), 'utf-8');

      const kanazawaFixture = path.resolve(
        __dirname,
        '../fixtures/nar_racelist_kanazawa_20260922.html'
      );
      const dirtGradeFixture = path.resolve(
        __dirname,
        '../fixtures/nar_racelist_2026.html'
      );

      const realFetcher = new NarRaceTimeFetcher({
        localFixturePath: dirtGradeFixture,
        raceListFixtures: {
          '2026-09-22_22': kanazawaFixture,
        },
      });

      const result = await updateRaceTimes({
        filePath: tempFilePath,
        referenceDate: '2026-09-20',
        organization: 'nar',
        fetchers: { nar: realFetcher },
      });

      expect(result.updatedRaces.length).toBeGreaterThanOrEqual(1);
      const hakusanUpdated = result.updatedRaces.find((r) => r.id === '2026-nar-jpn3-05');
      expect(hakusanUpdated).toBeDefined();
      expect(hakusanUpdated?.newTime).toBe('2026-09-22T09:00:00.000Z');

      const saved: RaceOutput[] = JSON.parse(fs.readFileSync(tempFilePath, 'utf-8'));
      const hakusan = saved.find((r) => r.id === '2026-nar-jpn3-05');
      expect(hakusan?.is_time_confirmed).toBe(true);
      expect(hakusan?.start_time).toBe('2026-09-22T09:00:00.000Z');
    });
  });
});
