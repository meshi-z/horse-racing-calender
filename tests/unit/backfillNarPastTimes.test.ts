import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runNarBackfill } from '../../scripts/backfill-nar-past-times';

const SAMPLE_RACELIST_HTML = `
<table class="raceList">
  <tr class="data">
    <td>1R</td>
    <td>14:30</td>
    <td><a href="/KeibaWeb/TodayRaceInfo/DebaTable?k_raceDate=2026%2F01%2F02&k_raceNo=1&k_babaCode=3">3歳C1</a></td>
  </tr>
  <tr class="data">
    <td>8R</td>
    <td>17:00</td>
    <td><a href="/KeibaWeb/TodayRaceInfo/DebaTable?k_raceDate=2026%2F01%2F02&k_raceNo=8&k_babaCode=3">帯広記念４歳以上オープン別定</a></td>
  </tr>
</table>
`;

describe('NAR Past Race Times Backfill', () => {
  let tempDir: string;
  let tempRacesPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nar-backfill-test-'));
    tempRacesPath = path.join(tempDir, 'races.json');

    const initialRaces = [
      {
        id: '2026-nar-local-001',
        name: { ja: '帯広記念', en: 'Obihiro Kinen' },
        organization: 'nar',
        grade: 'local_grade',
        date: '2026-01-02',
        start_time: '2026-01-02T10:30:00.000Z',
        is_time_confirmed: false,
        course: { ja: '帯広', en: 'Obihiro' },
      },
      {
        id: '2026-nar-local-999',
        name: { ja: '未来の重賞', en: 'Future Stakes' },
        organization: 'nar',
        grade: 'local_grade',
        date: '2026-12-30',
        start_time: '2026-12-30T10:30:00.000Z',
        is_time_confirmed: false,
        course: { ja: '帯広', en: 'Obihiro' },
      },
      {
        id: '2026-jra-g1-001',
        name: { ja: '有馬記念', en: 'Arima Kinen' },
        organization: 'jra',
        grade: 'g1',
        date: '2026-01-02',
        start_time: '2026-01-02T06:40:00.000Z',
        is_time_confirmed: false,
        course: { ja: '中山', en: 'Nakayama' },
      },
    ];

    fs.writeFileSync(tempRacesPath, JSON.stringify(initialRaces, null, 2), 'utf8');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('過去の未確定NARレースをスクレイピングして確定発走時刻へ更新すること', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('k_raceDate=2026%2F01%2F02') && urlStr.includes('k_babaCode=3')) {
        return new Response(SAMPLE_RACELIST_HTML, { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });

    const result = await runNarBackfill({
      racesFilePath: tempRacesPath,
      beforeDate: '2026-01-05',
      delayMs: 0,
    });

    expect(result.total).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.failed).toBe(0);

    const savedRaces = JSON.parse(fs.readFileSync(tempRacesPath, 'utf8'));
    const obihiro = savedRaces.find((r: any) => r.id === '2026-nar-local-001');
    expect(obihiro.is_time_confirmed).toBe(true);
    // 17:00 JST -> 08:00 UTC
    expect(obihiro.start_time).toBe('2026-01-02T08:00:00.000Z');

    // 未来レースやJRAレースは未確定のまま保持されること
    const future = savedRaces.find((r: any) => r.id === '2026-nar-local-999');
    expect(future.is_time_confirmed).toBe(false);

    const jra = savedRaces.find((r: any) => r.id === '2026-jra-g1-001');
    expect(jra.is_time_confirmed).toBe(false);
  });

  it('dry-run モード時はファイルに書き込みを行わないこと', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(SAMPLE_RACELIST_HTML, { status: 200 });
    });

    const result = await runNarBackfill({
      racesFilePath: tempRacesPath,
      beforeDate: '2026-01-05',
      delayMs: 0,
      dryRun: true,
    });

    expect(result.updated).toBe(1);

    const savedRaces = JSON.parse(fs.readFileSync(tempRacesPath, 'utf8'));
    const obihiro = savedRaces.find((r: any) => r.id === '2026-nar-local-001');
    expect(obihiro.is_time_confirmed).toBe(false);
  });
});
