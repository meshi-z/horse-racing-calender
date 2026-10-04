import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { syncShardedRaceFiles } from '../../scripts/lib/race-sharding';
import type { RaceOutput } from '../../scripts/parse-races';

const mockRaces: RaceOutput[] = [
  {
    id: '2026-jra-g1-01',
    organization: 'jra',
    name: { ja: 'フェブラリーステークス', en: 'February Stakes' },
    grade: 'G1',
    date: '2026-02-22',
    start_time: '15:40',
    is_time_confirmed: false,
    course: { ja: '東京', en: 'Tokyo' },
    distance: 1600,
    track_type: 'dirt',
    sex_constraint: 'none',
    age_constraint: '4yo_and_up',
    handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
  },
  {
    id: '2026-jra-g3-01',
    organization: 'jra',
    name: { ja: '京都金杯', en: 'Kyoto Kimpai' },
    grade: 'G3',
    date: '2026-01-05',
    start_time: '15:45',
    is_time_confirmed: false,
    course: { ja: '京都', en: 'Kyoto' },
    distance: 1600,
    track_type: 'turf',
    sex_constraint: 'none',
    age_constraint: '4yo_and_up',
    handicap: { code: 'handicap', ja: 'ハンデ', en: 'Handicap' },
  },
  {
    id: '2027-jra-g3-01',
    organization: 'jra',
    name: { ja: '中山金杯', en: 'Nakayama Kimpai' },
    grade: 'G3',
    date: '2027-01-05',
    start_time: '15:45',
    is_time_confirmed: false,
    course: { ja: '中山', en: 'Nakayama' },
    distance: 2000,
    track_type: 'turf',
    sex_constraint: 'none',
    age_constraint: '4yo_and_up',
    handicap: { code: 'handicap', ja: 'ハンデ', en: 'Handicap' },
  },
];

describe('syncShardedRaceFiles', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sharding-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('年度ごとに races-YYYY.json, index.json, races.json を同期出力すること', () => {
    const result = syncShardedRaceFiles(mockRaces, tempDir);

    expect(result.index.years).toEqual([2026, 2027]);
    expect(result.index.totalRaces).toBe(3);
    expect(result.index.defaultYear).toBe(2026);
    expect(result.index.yearCounts).toEqual({ 2026: 2, 2027: 1 });

    // ファイルの存在確認
    const shard2026Path = path.join(tempDir, 'races-2026.json');
    const shard2027Path = path.join(tempDir, 'races-2027.json');
    const indexPath = path.join(tempDir, 'index.json');
    const combinedPath = path.join(tempDir, 'races.json');

    expect(fs.existsSync(shard2026Path)).toBe(true);
    expect(fs.existsSync(shard2027Path)).toBe(true);
    expect(fs.existsSync(indexPath)).toBe(true);
    expect(fs.existsSync(combinedPath)).toBe(true);

    // races-2026.json の検証（ソート順: 01-05 が先、02-22 が後）
    const shard2026 = JSON.parse(fs.readFileSync(shard2026Path, 'utf-8'));
    expect(shard2026).toHaveLength(2);
    expect(shard2026[0].id).toBe('2026-jra-g3-01');
    expect(shard2026[1].id).toBe('2026-jra-g1-01');

    // races-2027.json の検証
    const shard2027 = JSON.parse(fs.readFileSync(shard2027Path, 'utf-8'));
    expect(shard2027).toHaveLength(1);
    expect(shard2027[0].id).toBe('2027-jra-g3-01');

    // index.json の検証
    const indexJson = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    expect(indexJson.years).toEqual([2026, 2027]);
    expect(indexJson.yearCounts['2026']).toBe(2);
    expect(indexJson.yearCounts['2027']).toBe(1);

    // races.json（結合版）の検証
    const combined = JSON.parse(fs.readFileSync(combinedPath, 'utf-8'));
    expect(combined).toHaveLength(3);
    expect(combined[0].id).toBe('2026-jra-g3-01');
    expect(combined[1].id).toBe('2026-jra-g1-01');
    expect(combined[2].id).toBe('2027-jra-g3-01');
  });

  it('存在しないディレクトリでも自動作成して出力できること', () => {
    const nestedDir = path.join(tempDir, 'sub', 'data');
    syncShardedRaceFiles(mockRaces, nestedDir);

    expect(fs.existsSync(path.join(nestedDir, 'index.json'))).toBe(true);
    expect(fs.existsSync(path.join(nestedDir, 'races-2026.json'))).toBe(true);
  });
});
