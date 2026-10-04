import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { backfillOfficialResultUrls } from '../../scripts/backfill-official-result-urls';
import type { RaceOutput } from '../../scripts/parse-races';

describe('backfillOfficialResultUrls', () => {
  let tmpDir: string;
  let tmpRacesPath: string;
  let tmpOfficialResultsPath: string;

  const mockRaces: RaceOutput[] = [
    {
      id: '2026-jra-g1-01',
      organization: 'jra',
      name: { ja: 'フェブラリーステークス', en: 'February Stakes' },
      grade: 'G1',
      date: '2026-02-22',
      start_time: '2026-02-22T06:40:00.000Z',
      is_time_confirmed: true,
      course: { ja: '東京', en: 'Tokyo' },
      distance: 1600,
      track_type: 'dirt',
      sex_constraint: 'none',
      age_constraint: '4yo_and_up',
      handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
      winner: {
        name: { ja: 'コスタノヴァ', en: 'Costa Nova' },
      },
    },
    {
      id: '2026-jra-g3-01',
      organization: 'jra',
      name: { ja: '中山金杯', en: 'Nakayama Kimpai' },
      grade: 'G3',
      date: '2026-01-05',
      start_time: '2026-01-05T06:45:00.000Z',
      is_time_confirmed: true,
      course: { ja: '中山', en: 'Nakayama' },
      distance: 2000,
      track_type: 'turf',
      sex_constraint: 'none',
      age_constraint: '4yo_and_up',
      handicap: { code: 'handicap', ja: 'ハンデ', en: 'Handicap' },
      winner: {
        name: { ja: 'カラテ', en: 'Karate' },
      },
      // official_url is undefined, and not in verified official_results_urls.json
    },
  ];

  const mockOfficialResultsUrls: Record<string, string> = {
    '2026-jra-g1-01': 'https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html',
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-test-'));
    tmpRacesPath = path.join(tmpDir, 'races.json');
    tmpOfficialResultsPath = path.join(tmpDir, 'official_results_urls.json');

    fs.writeFileSync(tmpRacesPath, JSON.stringify(mockRaces, null, 2), 'utf8');
    fs.writeFileSync(tmpOfficialResultsPath, JSON.stringify(mockOfficialResultsUrls, null, 2), 'utf8');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('実在検証済み公式URLが存在する確定済みレースにのみ official_url をバックフィルすること', () => {
    const result = backfillOfficialResultUrls({
      racesPath: tmpRacesPath,
      officialResultsPath: tmpOfficialResultsPath,
    });

    expect(result.backfilledCount).toBe(1);
    expect(result.updatedRaces[0].id).toBe('2026-jra-g1-01');
    expect(result.updatedRaces[0].officialUrl).toBe('https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html');

    // ファイル内容の検証
    const savedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(tmpRacesPath, 'utf8'));
    expect(savedRaces[0].official_url).toBe('https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html');
    // 未検証レース（空値原則・一次ソース原則）は undefined のまま保持
    expect(savedRaces[1].official_url).toBeUndefined();
  });

  it('dry-run モード時はファイルを書き換えないこと', () => {
    const result = backfillOfficialResultUrls({
      racesPath: tmpRacesPath,
      officialResultsPath: tmpOfficialResultsPath,
      dryRun: true,
    });

    expect(result.backfilledCount).toBe(1);

    const savedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(tmpRacesPath, 'utf8'));
    expect(savedRaces[0].official_url).toBeUndefined();
  });

  it('すでにURLが最新の場合はスキップされること (Idempotent)', () => {
    // 1回目実行
    backfillOfficialResultUrls({
      racesPath: tmpRacesPath,
      officialResultsPath: tmpOfficialResultsPath,
    });

    // 2回目実行
    const result2 = backfillOfficialResultUrls({
      racesPath: tmpRacesPath,
      officialResultsPath: tmpOfficialResultsPath,
    });

    expect(result2.backfilledCount).toBe(0);
  });

  it('未検証・不確実な official_url が残っている場合はクリーンアップして削除すること (Issue #176)', () => {
    const racesWithUnverifiedUrl: RaceOutput[] = [
      ...mockRaces,
      {
        id: '2026-france-g1-18',
        organization: 'france_galop',
        name: { ja: 'カドラン賞', en: 'Prix du Cadran' },
        grade: 'G1',
        date: '2026-10-03',
        start_time: '2026-10-03T14:00:00.000Z',
        is_time_confirmed: true,
        course: { ja: 'パリロンシャン', en: 'ParisLongchamp' },
        distance: 4000,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '4yo_and_up',
        handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
        official_url: 'https://www.pmu.fr/turf/', // 未検証URL
      },
    ];

    fs.writeFileSync(tmpRacesPath, JSON.stringify(racesWithUnverifiedUrl, null, 2), 'utf8');

    const result = backfillOfficialResultUrls({
      racesPath: tmpRacesPath,
      officialResultsPath: tmpOfficialResultsPath,
    });

    expect(result.backfilledCount).toBe(2);

    const savedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(tmpRacesPath, 'utf8'));
    expect(savedRaces[0].official_url).toBe('https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html');
    expect(savedRaces[2].official_url).toBeUndefined();
  });

  it('実本番マスタ (src/data/official_results_urls.json) のJRA G1スラッグが公式仕様に準拠しデッドリンクを含まないこと (Issue #182)', () => {
    const prodMasterPath = path.join(process.cwd(), 'src', 'data', 'official_results_urls.json');
    const master: Record<string, string> = JSON.parse(fs.readFileSync(prodMasterPath, 'utf8'));

    // 404/403となる旧スラッグが含まれていないこと
    const urls = Object.values(master);
    expect(urls.some((u) => u.includes('/nhk/'))).toBe(false);
    expect(urls.some((u) => u.includes('/vm/'))).toBe(false);
    expect(urls.some((u) => u.includes('/takarazuka/'))).toBe(false);
    expect(urls.some((u) => u.includes('/sprinters/'))).toBe(false);

    // 正しい公式スラッグが登録されていること
    expect(master['2026-jra-g1-07']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/nmc/result/nmc2026.html');
    expect(master['2026-jra-g1-08']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/victoria/result/victoria2026.html');
    expect(master['2026-jra-g1-12']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/takara/result/takara2026.html');
    expect(master['2026-jra-g1-13']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/sprint/result/sprint2026.html');
    expect(master['2026-jra-jg1-01']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/ngj/result/ngj2026.html');
  });

  it('update-race-results の JRA_G1_RESULT_URLS が年間全26レース（秋G1を含む）を網羅していること (Issue #190)', async () => {
    const { JRA_G1_RESULT_URLS } = await import('../../scripts/update-race-results');
    expect(Object.keys(JRA_G1_RESULT_URLS).length).toBe(26);

    // 秋の主要G1が正しい公式スラッグで事前定義されていること
    expect(JRA_G1_RESULT_URLS['2026-jra-g1-14']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/shuka/result/shuka2026.html');
    expect(JRA_G1_RESULT_URLS['2026-jra-g1-15']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/kikka/result/kikka2026.html');
    expect(JRA_G1_RESULT_URLS['2026-jra-g1-16']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/akiten/result/akiten2026.html');
    expect(JRA_G1_RESULT_URLS['2026-jra-g1-19']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/jc/result/jc2026.html');
    expect(JRA_G1_RESULT_URLS['2026-jra-jg1-02']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/daishogai/result/daishogai2026.html');
    expect(JRA_G1_RESULT_URLS['2026-jra-g1-24']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/arima/result/arima2026.html');
  });
});
