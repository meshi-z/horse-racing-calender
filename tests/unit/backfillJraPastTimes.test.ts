import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runJraBackfill } from '../../scripts/backfill-jra-past-times';

describe('JRA Past Race Times Backfill', () => {
  let tempDir: string;
  let tempRacesPath: string;
  let tempMasterPath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jra-backfill-test-'));
    tempRacesPath = path.join(tempDir, 'races.json');
    tempMasterPath = path.join(tempDir, 'master.json');

    const initialRaces = [
      {
        id: '2026-jra-g3-01',
        name: { ja: '日刊スポーツ賞中山金杯', en: 'Nikkan Sports Sho Nakayama Kimpai' },
        organization: 'jra',
        grade: 'g3',
        date: '2026-01-04',
        start_time: '2026-01-04T06:40:00.000Z',
        is_time_confirmed: false,
        course: { ja: '中山', en: 'Nakayama' },
      },
      {
        id: '2026-jra-g1-99',
        name: { ja: '有馬記念', en: 'Arima Kinen' },
        organization: 'jra',
        grade: 'g1',
        date: '2026-12-27',
        start_time: '2026-12-27T06:40:00.000Z',
        is_time_confirmed: false,
        course: { ja: '中山', en: 'Nakayama' },
      },
      {
        id: '2026-nar-local-01',
        name: { ja: '川崎記念', en: 'Kawasaki Kinen' },
        organization: 'nar',
        grade: 'jpn1',
        date: '2026-01-04',
        start_time: '2026-01-04T11:05:00.000Z',
        is_time_confirmed: false,
        course: { ja: '川崎', en: 'Kawasaki' },
      },
    ];

    const masterData = {
      '2026-01-04_日刊スポーツ賞中山金杯': {
        id: '2026-jra-g3-01',
        date: '2026-01-04',
        name: '日刊スポーツ賞中山金杯',
        course: '中山',
        grade: 'g3',
        timeJst: '15:45',
      },
    };

    fs.writeFileSync(tempRacesPath, JSON.stringify(initialRaces, null, 2), 'utf8');
    fs.writeFileSync(tempMasterPath, JSON.stringify(masterData, null, 2), 'utf8');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('過去の未確定JRAレースをマスタに基づき確定発走時刻へ更新すること', async () => {
    const result = await runJraBackfill({
      racesFilePath: tempRacesPath,
      masterFilePath: tempMasterPath,
      beforeDate: '2026-01-10',
    });

    expect(result.total).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.failed).toBe(0);

    const savedRaces = JSON.parse(fs.readFileSync(tempRacesPath, 'utf8'));
    const kimpai = savedRaces.find((r: any) => r.id === '2026-jra-g3-01');
    expect(kimpai.is_time_confirmed).toBe(true);
    // 15:45 JST -> 06:45 UTC
    expect(kimpai.start_time).toBe('2026-01-04T06:45:00.000Z');

    // 未来レースや他団体レースは未確定のまま維持されること
    const arima = savedRaces.find((r: any) => r.id === '2026-jra-g1-99');
    expect(arima.is_time_confirmed).toBe(false);

    const nar = savedRaces.find((r: any) => r.id === '2026-nar-local-01');
    expect(nar.is_time_confirmed).toBe(false);
  });

  it('dry-run モード時はファイルに書き込みを行わないこと', async () => {
    const result = await runJraBackfill({
      racesFilePath: tempRacesPath,
      masterFilePath: tempMasterPath,
      beforeDate: '2026-01-10',
      dryRun: true,
    });

    expect(result.updated).toBe(1);

    const savedRaces = JSON.parse(fs.readFileSync(tempRacesPath, 'utf8'));
    const kimpai = savedRaces.find((r: any) => r.id === '2026-jra-g3-01');
    expect(kimpai.is_time_confirmed).toBe(false);
  });
});
