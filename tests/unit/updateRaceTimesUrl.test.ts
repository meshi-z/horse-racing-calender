import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { updateRaceTimes, type RaceOutput, type RaceTimeFetcher } from '../../scripts/update-race-times';

describe('updateRaceTimes: official_url auto-assignment and rollback protection (Issue #158)', () => {
  it('時刻確定バッチ実行時、出馬表URLが対象レースの official_url に自動設定されること', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'url-test-'));
    const tempRacesPath = path.join(tempDir, 'races.json');

    const sampleRace: RaceOutput = {
      id: '2026-bha-sample-01',
      organization: 'bha',
      country_code: 'GB',
      name: {
        ja: 'コヴェントリーステークス',
        en: 'Coventry Stakes',
      },
      grade: 'G2',
      date: '2026-06-16',
      start_time: '2026-06-16T14:00:00.000Z',
      is_time_confirmed: false,
      course: { ja: 'アスコット', en: 'Ascot' },
      distance: 1207,
      track_type: 'turf',
      sex_constraint: 'none',
      age_constraint: '2yo',
      handicap: { code: 'set_weight', ja: '定量', en: 'Set Weight' },
    };

    fs.writeFileSync(tempRacesPath, JSON.stringify([sampleRace], null, 2), 'utf-8');

    const mockFetcher: RaceTimeFetcher = {
      organization: 'bha',
      getTargetWindowRaces: (races) => races,
      fetchConfirmedTimes: async () => [
        {
          raceName: 'コヴェントリーステークス',
          date: '2026-06-16',
          timeJst: '23:05',
          rawTime: '15:05 BST',
          utcIso: '2026-06-16T14:05:00.000Z',
          sourceUrl: 'https://www.sportinglife.com/racing/racecards/2026-06-16',
        },
      ],
    };

    const result = await updateRaceTimes({
      filePath: tempRacesPath,
      organization: 'bha',
      referenceDate: '2026-06-16',
      fetchers: { bha: mockFetcher },
    });

    expect(result.updatedRaces).toHaveLength(1);
    const saved: RaceOutput[] = JSON.parse(fs.readFileSync(tempRacesPath, 'utf-8'));
    expect(saved[0].is_time_confirmed).toBe(true);
    expect(saved[0].start_time).toBe('2026-06-16T14:05:00.000Z');
    expect(saved[0].official_url).toBe('https://www.sportinglife.com/racing/racecards/2026-06-16');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('既に結果が確定している過去レース（winner保持）の official_url は出馬表URLで巻き戻らないこと（保護ガード）', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'url-protect-test-'));
    const tempRacesPath = path.join(tempDir, 'races.json');

    const finishedRace: RaceOutput = {
      id: '2026-jp-g1-01',
      organization: 'jra',
      country_code: 'JP',
      name: {
        ja: 'フェブラリーステークス',
        en: 'February Stakes',
      },
      grade: 'G1',
      date: '2026-02-22',
      start_time: '2026-02-22T06:40:00.000Z',
      is_time_confirmed: true,
      course: { ja: '東京', en: 'Tokyo' },
      distance: 1600,
      track_type: 'dirt',
      sex_constraint: 'none',
      age_constraint: '4yo_and_up',
      handicap: { code: 'set_weight', ja: '定量', en: 'Set Weight' },
      winner: {
        name: { ja: 'コスタノヴァ', en: 'Costa Nova' },
      },
      official_url: 'https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html', // 確定結果URL
    };

    fs.writeFileSync(tempRacesPath, JSON.stringify([finishedRace], null, 2), 'utf-8');

    // 時刻バッチが出馬表URLを返してきたケース
    const mockFetcher: RaceTimeFetcher = {
      organization: 'jra',
      getTargetWindowRaces: (races) => races,
      fetchConfirmedTimes: async () => [
        {
          raceName: 'フェブラリーステークス',
          date: '2026-02-22',
          timeJst: '15:40',
          rawTime: '15:40発走',
          utcIso: '2026-02-22T06:40:00.000Z',
          sourceUrl: 'https://www.jra.go.jp/keiba/thisweek/2026/0222_1/', // 出馬表URL
        },
      ],
    };

    await updateRaceTimes({
      filePath: tempRacesPath,
      organization: 'jra',
      referenceDate: '2026-02-22',
      fetchers: { jra: mockFetcher },
      force: true,
    });

    const saved: RaceOutput[] = JSON.parse(fs.readFileSync(tempRacesPath, 'utf-8'));
    // 確定結果URLが出馬表URLで上書き（巻き戻し）されていないこと
    expect(saved[0].official_url).toBe('https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('既に時刻確定済みだが official_url が未設定の予定レースに対し、出馬表URLが新規付与されること', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'url-backfill-test-'));
    const tempRacesPath = path.join(tempDir, 'races.json');

    const confirmedRaceWithoutUrl: RaceOutput = {
      id: '2026-france-sample-01',
      organization: 'france_galop',
      country_code: 'FR',
      name: {
        ja: 'イスパーン賞',
        en: "Prix d'Ispahan",
      },
      grade: 'G1',
      date: '2026-05-24',
      start_time: '2026-05-24T13:50:00.000Z',
      is_time_confirmed: true, // 既に確定済み
      course: { ja: 'パリロンシャン', en: 'ParisLongchamp' },
      distance: 1850,
      track_type: 'turf',
      sex_constraint: 'none',
      age_constraint: '4yo_and_up',
      handicap: { code: 'set_weight', ja: '定量', en: 'Set Weight' },
      // official_url 未設定かつ winner なし（発走予定レース）
    };

    fs.writeFileSync(tempRacesPath, JSON.stringify([confirmedRaceWithoutUrl], null, 2), 'utf-8');

    const mockFetcher: RaceTimeFetcher = {
      organization: 'france_galop',
      getTargetWindowRaces: (races) => races,
      fetchConfirmedTimes: async () => [
        {
          raceName: "イスパーン賞",
          date: '2026-05-24',
          timeJst: '22:50',
          rawTime: '15:50 CEST',
          utcIso: '2026-05-24T13:50:00.000Z', // 時刻は同一
          sourceUrl: 'https://www.pmu.fr/turf/24052026/R1/C5',
        },
      ],
    };

    const result = await updateRaceTimes({
      filePath: tempRacesPath,
      organization: 'france_galop',
      referenceDate: '2026-05-24',
      fetchers: { france_galop: mockFetcher },
      force: true,
    });

    expect(result.updatedRaces).toHaveLength(1);
    const saved: RaceOutput[] = JSON.parse(fs.readFileSync(tempRacesPath, 'utf-8'));
    expect(saved[0].official_url).toBe('https://www.pmu.fr/turf/24052026/R1/C5');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
