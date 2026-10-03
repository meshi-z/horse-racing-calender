import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { updateRaceTimes, type RaceOutput, type RaceTimeFetcher } from '../../scripts/update-race-times';

describe('updateRaceTimes: time confirmation without leaking ephemeral URLs (Issue #158, #176)', () => {
  it('時刻確定バッチ実行時、確定発走時刻のみが更新され一時的な出馬表URLは保存されないこと', async () => {
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
    // デッドリンク防止のため、一時的な出馬表URLは保存されない
    expect(saved[0].official_url).toBeUndefined();

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('既に検証済み公式結果URLを持つレースの official_url は時刻更新時も保護・維持されること', async () => {
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
          sourceUrl: 'https://www.jra.go.jp/keiba/thisweek/2026/0222_1/',
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
    // 確定結果URLが維持されていること
    expect(saved[0].official_url).toBe('https://www.jra.go.jp/datafile/seiseki/g1/feb/result/feb2026.html');

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
