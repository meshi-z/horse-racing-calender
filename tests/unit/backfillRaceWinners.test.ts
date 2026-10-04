import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  getPastRacesForBackfill,
  backfillRaceWinners,
  parseArgs,
} from '../../scripts/backfill-race-winners';
import type { RaceOutput } from '../../scripts/parse-races';

describe('backfill-race-winners pipeline', () => {
  const dummyRaces: RaceOutput[] = [
    {
      id: '2026-jra-g3-01',
      organization: 'jra',
      country_code: 'JP',
      name: { ja: '京都金杯', en: 'Kyoto Kimpai' },
      grade: 'G3',
      date: '2026-01-04',
      start_time: '2026-01-04T06:45:00.000Z',
      is_time_confirmed: true,
      course: { ja: '京都', en: 'Kyoto' },
      distance: 1600,
      track_type: 'turf',
      sex_constraint: 'none',
      age_constraint: '4yo_and_up',
      handicap: { code: 'handicap', ja: 'ハンデ', en: 'Handicap' },
    },
    {
      id: '2026-jra-g1-10',
      organization: 'jra',
      country_code: 'JP',
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
      handicap: { code: 'special_weight', ja: '馬齢', en: 'Special Weight' },
      winner: {
        name: { ja: 'ロブチェン', en: 'Lovcen' },
        jockey: { ja: '松山弘平', en: 'Kohei Matsuyama' },
        horse_number: 17,
        time: '2:22.7',
      },
    },
    {
      id: '2026-jra-g1-14',
      organization: 'jra',
      country_code: 'JP',
      name: { ja: '秋華賞', en: 'Shuka Sho' },
      grade: 'G1',
      date: '2026-10-18',
      start_time: '2026-10-18T06:40:00.000Z',
      is_time_confirmed: false,
      course: { ja: '京都', en: 'Kyoto' },
      distance: 2000,
      track_type: 'turf',
      sex_constraint: 'filly_and_mare',
      age_constraint: '3yo',
      handicap: { code: 'special_weight', ja: '馬齢', en: 'Special Weight' },
    },
    {
      id: '2026-nar-local-01',
      organization: 'nar',
      country_code: 'JP',
      name: { ja: '帯広記念', en: 'Obihiro Kinen' },
      grade: 'local_grade',
      date: '2026-01-02',
      start_time: '2026-01-02T08:00:00.000Z',
      is_time_confirmed: true,
      course: { ja: '帯広', en: 'Obihiro' },
      distance: 200,
      track_type: 'banei',
      sex_constraint: 'none',
      age_constraint: '3yo_and_up',
      handicap: { code: 'special_weight', ja: '別定', en: 'Special Weight' },
    },
  ];

  describe('getPastRacesForBackfill', () => {
    it('extracts unconfirmed races before beforeDate and skips future races and existing winners', () => {
      const { targets, alreadyHadWinnerCount, skippedFutureCount } = getPastRacesForBackfill(
        dummyRaces,
        { beforeDate: '2026-09-27' }
      );

      // 2026-jra-g3-01 and 2026-nar-local-01 are targets
      expect(targets).toHaveLength(2);
      expect(targets.map((t) => t.id)).toEqual(['2026-jra-g3-01', '2026-nar-local-01']);

      // 2026-jra-g1-10 already has winner
      expect(alreadyHadWinnerCount).toBe(1);

      // 2026-jra-g1-14 (10-18) is future race
      expect(skippedFutureCount).toBe(1);
    });

    it('supports force flag to include races that already have a winner', () => {
      const { targets, alreadyHadWinnerCount } = getPastRacesForBackfill(dummyRaces, {
        beforeDate: '2026-09-27',
        force: true,
      });

      expect(targets).toHaveLength(3);
      expect(alreadyHadWinnerCount).toBe(0);
      expect(targets.some((t) => t.id === '2026-jra-g1-10')).toBe(true);
    });

    it('filters by organization', () => {
      const { targets } = getPastRacesForBackfill(dummyRaces, {
        beforeDate: '2026-09-27',
        orgFilter: 'nar',
      });

      expect(targets).toHaveLength(1);
      expect(targets[0].id).toBe('2026-nar-local-01');
    });

    it('filters by grade', () => {
      const { targets } = getPastRacesForBackfill(dummyRaces, {
        beforeDate: '2026-09-27',
        gradeFilter: 'G3',
      });

      expect(targets).toHaveLength(1);
      expect(targets[0].id).toBe('2026-jra-g3-01');
    });
  });

  describe('parseArgs', () => {
    it('correctly parses CLI arguments', () => {
      const args = [
        '--date', '2026-09-27',
        '--from', '2026-01-01',
        '--org', 'jra',
        '--grade', 'g3',
        '--limit', '10',
        '--delay', '100',
        '--dry-run',
        '--force',
      ];
      const parsed = parseArgs(args);
      expect(parsed.beforeDate).toBe('2026-09-27');
      expect(parsed.fromDate).toBe('2026-01-01');
      expect(parsed.orgFilter).toBe('jra');
      expect(parsed.gradeFilter).toBe('g3');
      expect(parsed.limit).toBe(10);
      expect(parsed.delayMs).toBe(100);
      expect(parsed.dryRun).toBe(true);
      expect(parsed.force).toBe(true);
    });
  });

  describe('backfillRaceWinners', () => {
    const testRacesPath = path.resolve(__dirname, 'test_races_backfill.json');
    const testWinnersPath = path.resolve(__dirname, 'test_winners_backfill.json');

    beforeEach(() => {
      fs.writeFileSync(testRacesPath, JSON.stringify(dummyRaces, null, 2), 'utf8');
      fs.writeFileSync(
        testWinnersPath,
        JSON.stringify(
          {
            '2026-jra-g1-10': {
              name: { ja: 'ロブチェン', en: 'Lovcen' },
              jockey: { ja: '松山弘平', en: 'Kohei Matsuyama' },
              horse_number: 17,
              time: '2:22.7',
            },
            '2026-jra-g3-01': {
              name: { ja: 'ソウルラッシュ', en: 'Soul Rush' },
              jockey: { ja: '津村明秀', en: 'Akihide Tsumura' },
              horse_number: 2,
              time: '1:33.8',
            },
          },
          null,
          2
        ),
        'utf8'
      );
    });

    afterEach(() => {
      if (fs.existsSync(testRacesPath)) fs.unlinkSync(testRacesPath);
      if (fs.existsSync(testWinnersPath)) fs.unlinkSync(testWinnersPath);
    });

    it('backfills winners from master and persists to both files', async () => {
      const result = await backfillRaceWinners({
        racesPath: testRacesPath,
        winnersMasterPath: testWinnersPath,
        beforeDate: '2026-09-27',
        providers: [], // 単体テストでは外部ネットワークアクセスを行わずマスターから直接解決
      });

      expect(result.updatedCount).toBeGreaterThanOrEqual(1);
      const updatedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(testRacesPath, 'utf8'));
      const kyotoKimpai = updatedRaces.find((r) => r.id === '2026-jra-g3-01');
      expect(kyotoKimpai?.winner).toBeDefined();
      expect(kyotoKimpai?.winner?.name.ja).toBe('ソウルラッシュ');

      // Future race must NOT have winner
      const shukaSho = updatedRaces.find((r) => r.id === '2026-jra-g1-14');
      expect(shukaSho?.winner).toBeUndefined();
    }, 10000);

    it('respects dryRun without writing files', async () => {
      const result = await backfillRaceWinners({
        racesPath: testRacesPath,
        winnersMasterPath: testWinnersPath,
        beforeDate: '2026-09-27',
        dryRun: true,
        providers: [], // 単体テストでは外部ネットワークアクセスを行わずマスターから直接解決
      });

      expect(result.updatedCount).toBeGreaterThanOrEqual(1);
      // File should remain unchanged in dryRun
      const unupdatedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(testRacesPath, 'utf8'));
      const kyotoKimpai = unupdatedRaces.find((r) => r.id === '2026-jra-g3-01');
      expect(kyotoKimpai?.winner).toBeUndefined();
    }, 10000);
  });
});
