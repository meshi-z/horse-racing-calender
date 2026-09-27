import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getRecentPastRaces,
  parseArgs,
  updateRaceResults,
  type RaceResultFetcher,
} from '../../scripts/update-race-results';
import type { RaceOutput, RaceWinner } from '../../scripts/parse-races';

describe('update-race-results', () => {
  let tmpDir: string;
  let tmpRacesPath: string;
  let tmpWinnersMasterPath: string;

  const mockRaces: RaceOutput[] = [
    {
      id: '2026-jra-g1-05',
      organization: 'jra',
      name: { ja: '皐月賞', en: 'Satsuki Sho' },
      grade: 'G1',
      date: '2026-04-19',
      start_time: '2026-04-19T06:40:00.000Z',
      is_time_confirmed: true,
      course: { ja: '中山', en: 'Nakayama' },
      distance: 2000,
      track_type: 'turf',
      sex_constraint: 'colt_and_filly',
      age_constraint: '3yo',
      handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
    },
    {
      id: '2026-jra-g1-10',
      organization: 'jra',
      name: { ja: '日本ダービー', en: 'Tokyo Yushun' },
      grade: 'G1',
      date: '2026-05-31',
      start_time: '2026-05-31T06:40:00.000Z',
      is_time_confirmed: true,
      course: { ja: '東京', en: 'Tokyo' },
      distance: 2400,
      track_type: 'turf',
      sex_constraint: 'colt_and_filly',
      age_constraint: '3yo',
      handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
    },
  ];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'update-results-test-'));
    tmpRacesPath = path.join(tmpDir, 'races.json');
    tmpWinnersMasterPath = path.join(tmpDir, 'race_winners.json');
    fs.writeFileSync(tmpRacesPath, JSON.stringify(mockRaces, null, 2), 'utf8');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('getRecentPastRaces', () => {
    it('基準日以前かつ指定日数以内のレースのみを抽出すること', () => {
      const pastRaces = getRecentPastRaces(mockRaces, '2026-06-01', 7);
      expect(pastRaces).toHaveLength(1);
      expect(pastRaces[0].id).toBe('2026-jra-g1-10');
    });

    it('基準日より未来のレースは抽出されないこと', () => {
      const pastRaces = getRecentPastRaces(mockRaces, '2026-04-10', 7);
      expect(pastRaces).toHaveLength(0);
    });
  });

  describe('parseArgs', () => {
    it('CLIオプションを正しくパースすること', () => {
      const args = parseArgs(['--date', '2026-06-01', '--org', 'JRA', '--dry-run', '--force']);
      expect(args.refDate).toBe('2026-06-01');
      expect(args.orgFilter).toBe('jra');
      expect(args.dryRun).toBe(true);
      expect(args.force).toBe(true);
    });
  });

  describe('updateRaceResults', () => {
    it('プロバイダーから取得した勝ち馬情報が反映され保存されること', async () => {
      const mockWinner: RaceWinner = {
        name: { ja: 'ダノンデサイル', en: 'Danon Decile' },
        jockey: { ja: '横山典弘', en: 'Norihiro Yokoyama' },
        horse_number: 5,
        time: '2:24.3',
      };

      const mockProvider: RaceResultFetcher = {
        organization: 'jra',
        getTargetPastRaces(races) {
          return races.filter((r) => r.id === '2026-jra-g1-10');
        },
        async fetchResults() {
          const map = new Map<string, RaceWinner>();
          map.set('2026-jra-g1-10', mockWinner);
          return map;
        },
      };

      const result = await updateRaceResults({
        racesPath: tmpRacesPath,
        winnersMasterPath: tmpWinnersMasterPath,
        refDate: '2026-06-01',
        providers: [mockProvider],
      });

      expect(result.updatedCount).toBe(1);
      expect(result.updatedRaces[0].winner.name.ja).toBe('ダノンデサイル');

      // 保存された races.json を確認
      const savedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(tmpRacesPath, 'utf8'));
      const derby = savedRaces.find((r) => r.id === '2026-jra-g1-10');
      expect(derby?.winner?.name.ja).toBe('ダノンデサイル');

      // 保存された race_winners.json を確認
      const savedWinners = JSON.parse(fs.readFileSync(tmpWinnersMasterPath, 'utf8'));
      expect(savedWinners['2026-jra-g1-10'].name.ja).toBe('ダノンデサイル');
    });

    it('dryRunがtrueの場合はファイルが書き換わらないこと', async () => {
      const mockWinner: RaceWinner = {
        name: { ja: 'ダノンデサイル', en: 'Danon Decile' },
      };

      const mockProvider: RaceResultFetcher = {
        organization: 'jra',
        getTargetPastRaces(races) {
          return races.filter((r) => r.id === '2026-jra-g1-10');
        },
        async fetchResults() {
          const map = new Map<string, RaceWinner>();
          map.set('2026-jra-g1-10', mockWinner);
          return map;
        },
      };

      const result = await updateRaceResults({
        racesPath: tmpRacesPath,
        winnersMasterPath: tmpWinnersMasterPath,
        refDate: '2026-06-01',
        dryRun: true,
        providers: [mockProvider],
      });

      expect(result.updatedCount).toBe(1);

      // ファイルが変更されていないことを確認
      const savedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(tmpRacesPath, 'utf8'));
      const derby = savedRaces.find((r) => r.id === '2026-jra-g1-10');
      expect(derby?.winner).toBeUndefined();
    });
  });
});
