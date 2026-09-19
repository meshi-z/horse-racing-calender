import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  updateRaceTimes,
  getUpcomingWeekendRange,
} from '../../scripts/update-race-times';
import { ConfirmedRaceTime } from '../../scripts/lib/jra-syutsuba';

describe('update-race-times script', () => {
  describe('getUpcomingWeekendRange', () => {
    it('木曜日基準で木〜月曜の範囲を算出できること', () => {
      const range = getUpcomingWeekendRange('2026-09-17'); // 木曜日
      expect(range.startDate).toBe('2026-09-17');
      expect(range.endDate).toBe('2026-09-21');
    });

    it('土曜日基準で直前の木曜〜翌月曜の範囲を算出できること', () => {
      const range = getUpcomingWeekendRange('2026-09-19'); // 土曜日
      expect(range.startDate).toBe('2026-09-17');
      expect(range.endDate).toBe('2026-09-21');
    });

    it('水曜日基準で今週末の木曜〜翌月曜の範囲を算出できること', () => {
      const range = getUpcomingWeekendRange('2026-09-16'); // 水曜日
      expect(range.startDate).toBe('2026-09-17');
      expect(range.endDate).toBe('2026-09-21');
    });
  });

  describe('updateRaceTimes execution', () => {
    let tempDir: string;
    let tempFilePath: string;

    const mockInitialRaces = [
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
    ];

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'races-test-'));
      tempFilePath = path.join(tempDir, 'races.json');
      fs.writeFileSync(tempFilePath, JSON.stringify(mockInitialRaces, null, 2), 'utf-8');
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('確定時刻に一致するレースのstart_timeを更新しis_time_confirmedをtrueにすること', async () => {
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
      expect(result.skippedDueToConfirmed).toBe(false);

      const savedData = JSON.parse(fs.readFileSync(tempFilePath, 'utf-8'));
      const updatedHanshin = savedData.find((r: any) => r.id === '2026-jra-jg3-04');
      expect(updatedHanshin.start_time).toBe('2026-09-19T02:20:00.000Z'); // 11:20 JST -> 02:20 UTC
      expect(updatedHanshin.is_time_confirmed).toBe(true);
      expect(updatedHanshin.name.ja).toBe('阪神ジャンプステークス'); // 他の属性は保持

      const updatedAllComer = savedData.find((r: any) => r.id === '2026-jra-g2-26');
      expect(updatedAllComer.start_time).toBe('2026-09-20T06:45:00.000Z'); // 15:45 JST -> 06:45 UTC
      expect(updatedAllComer.is_time_confirmed).toBe(true);

      const untouched = savedData.find((r: any) => r.id === '2026-jra-g1-08');
      expect(untouched.is_time_confirmed).toBe(false);
    });

    it('当週のレースが全て確定済みの場合は早期終了ガードにより処理をスキップすること', async () => {
      // 阪神ジャンプSとオールカマーを両方 is_time_confirmed: true に設定
      const allConfirmedRaces = mockInitialRaces.map((r) => {
        if (r.date === '2026-09-19' || r.date === '2026-09-20') {
          return { ...r, is_time_confirmed: true };
        }
        return r;
      });
      fs.writeFileSync(tempFilePath, JSON.stringify(allConfirmedRaces, null, 2), 'utf-8');

      const result = await updateRaceTimes({
        filePath: tempFilePath,
        referenceDate: '2026-09-19',
        // confirmedTimes を渡さなくても、早期終了ガードで外部fetchに到達しない
      });

      expect(result.skippedDueToConfirmed).toBe(true);
      expect(result.updatedRaces).toHaveLength(0);
    });

    it('--force オプション指定時は早期終了ガードをバイパスすること', async () => {
      const allConfirmedRaces = mockInitialRaces.map((r) => {
        if (r.date === '2026-09-19' || r.date === '2026-09-20') {
          return { ...r, is_time_confirmed: true };
        }
        return r;
      });
      fs.writeFileSync(tempFilePath, JSON.stringify(allConfirmedRaces, null, 2), 'utf-8');

      const mockConfirmedTimes: ConfirmedRaceTime[] = [
        {
          raceName: '阪神ジャンプステークス',
          date: '2026-09-19',
          timeJst: '11:25', // 5分繰り下げ変更
          rawTime: '11時25分',
        },
      ];

      const result = await updateRaceTimes({
        filePath: tempFilePath,
        referenceDate: '2026-09-19',
        force: true,
        confirmedTimes: mockConfirmedTimes,
      });

      expect(result.skippedDueToConfirmed).toBe(false);
      expect(result.updatedRaces).toHaveLength(1);
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
