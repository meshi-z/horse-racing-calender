import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadUsRaceMaster, getUsRaces } from '../../scripts/lib/us-races';
import type { Race } from '../../src/types/race';

describe('US Races Pipeline and Master Data (Issue #102)', () => {
  const rootDir = process.cwd();

  it('us_race_master.json が正常にロードでき、会場情報と408の重賞レースが含まれること', () => {
    const master = loadUsRaceMaster(rootDir);
    expect(master.venues).toBeDefined();
    expect(Object.keys(master.venues).length).toBeGreaterThanOrEqual(25);
    expect(master.venues['Churchill Downs']).toEqual({
      ja: 'チャーチルダウンズ',
      en: 'Churchill Downs',
    });
    expect(master.venues['Saratoga']).toEqual({
      ja: 'サラトガ',
      en: 'Saratoga',
    });
    expect(master.venues['Keeneland']).toEqual({
      ja: 'キーンランド',
      en: 'Keeneland',
    });
    expect(master.venues['Del Mar']).toEqual({
      ja: 'デルマー',
      en: 'Del Mar',
    });

    expect(master.races).toHaveLength(408);
  });

  it('グレード別のレース数が正確であること (G1: 92, G2: 133, G3: 183)', () => {
    const master = loadUsRaceMaster(rootDir);
    const g1 = master.races.filter((r) => r.grade === 'G1');
    const g2 = master.races.filter((r) => r.grade === 'G2');
    const g3 = master.races.filter((r) => r.grade === 'G3');

    expect(g1).toHaveLength(92);
    expect(g2).toHaveLength(133);
    expect(g3).toHaveLength(183);
  });

  it('全レースが型安全なスキーマ要件を満たしていること', () => {
    const master = loadUsRaceMaster(rootDir);
    const races = getUsRaces(master, new Map());

    for (const r of races) {
      expect(r.id).toMatch(/^2026-us-(g1|g2|g3)-\d{2,3}$/);
      expect(r.organization).toBe('equibase');
      expect(r.country_code).toBe('US');
      expect(r.name.ja).toBeTruthy();
      expect(r.name.en).toBeTruthy();
      expect(r.date).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(r.start_time).toMatch(/^2026-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/);
      expect(typeof r.is_time_confirmed).toBe('boolean');
      expect(r.course.ja).toBeTruthy();
      expect(r.course.en).toBeTruthy();
      expect(r.distance).toBeGreaterThan(0);
      expect(['dirt', 'turf', 'aw']).toContain(r.track_type);
      expect(['none', 'filly_and_mare', 'colt_and_filly']).toContain(r.sex_constraint);
      expect(['2yo', '3yo', '3yo_and_up', '4yo_and_up']).toContain(r.age_constraint);
      expect(['weight_for_age', 'special_weight', 'set_weight', 'handicap']).toContain(r.handicap.code);

      // 実在する暦日（カレンダー上の日付）であること（Issue #106）
      const [year, month, day] = r.date.split('-').map(Number);
      const dt = new Date(Date.UTC(year, month - 1, day));
      expect(dt.getUTCFullYear()).toBe(year);
      expect(dt.getUTCMonth()).toBe(month - 1);
      expect(dt.getUTCDate()).toBe(day);

      // マークアップやエンティティの混入がないこと
      expect(r.name.en).not.toMatch(/[<>{}\[\]"\\]|&lt;|&gt;/);
      expect(r.name.ja).not.toMatch(/[<>{}\[\]"\\]|&lt;|&gt;/);
    }
  });

  it('三冠競走（ケンタッキーダービー、プリークネスS、ベルモントS）およびBCクラシックの情報が正しく設定されていること', () => {
    const master = loadUsRaceMaster(rootDir);
    const races = getUsRaces(master, new Map());

    // ケンタッキーダービー
    const kd = races.find((r) => r.name.en === 'Kentucky Derby');
    expect(kd).toBeDefined();
    expect(kd?.name.ja).toBe('ケンタッキーダービー');
    expect(kd?.grade).toBe('G1');
    expect(kd?.date).toBe('2026-05-02');
    expect(kd?.course.ja).toBe('チャーチルダウンズ');
    expect(kd?.distance).toBe(2012);
    expect(kd?.track_type).toBe('dirt');

    // プリークネスステークス
    const preakness = races.find((r) => r.name.en === 'Preakness Stakes');
    expect(preakness).toBeDefined();
    expect(preakness?.name.ja).toBe('プリークネスステークス');
    expect(preakness?.grade).toBe('G1');
    expect(preakness?.date).toBe('2026-05-16');
    expect(preakness?.distance).toBe(1911);
    expect(preakness?.track_type).toBe('dirt');

    // ベルモントステークス
    const belmont = races.find((r) => r.name.en === 'Belmont Stakes');
    expect(belmont).toBeDefined();
    expect(belmont?.name.ja).toBe('ベルモントステークス');
    expect(belmont?.grade).toBe('G1');
    expect(belmont?.date).toBe('2026-06-06');
    expect(belmont?.course.ja).toBe('サラトガ');
    expect(belmont?.track_type).toBe('dirt');

    // ブリーダーズカップクラシック
    const bcc = races.find((r) => r.name.en === "Breeders' Cup Classic");
    expect(bcc).toBeDefined();
    expect(bcc?.name.ja).toBe('ブリーダーズカップクラシック');
    expect(bcc?.grade).toBe('G1');
    expect(bcc?.date).toBe('2026-10-31');
    expect(bcc?.course.ja).toBe('キーンランド');
    expect(bcc?.distance).toBe(2012);
    expect(bcc?.track_type).toBe('dirt');
  });

  it('confirmedTimesMap による確定時刻・順延情報の上書き保持が機能すること', () => {
    const master = loadUsRaceMaster(rootDir);
    const confirmedMap = new Map();
    confirmedMap.set('2026-us-g1-01', {
      start_time: '2026-01-24T22:30:00.000Z',
      is_time_confirmed: true,
      is_rescheduled: true,
      original_date: '2026-01-23',
    });

    const races = getUsRaces(master, confirmedMap);
    const target = races.find((r) => r.id === '2026-us-g1-01');
    expect(target).toBeDefined();
    expect(target?.start_time).toBe('2026-01-24T22:30:00.000Z');
    expect(target?.is_time_confirmed).toBe(true);
    expect(target?.is_rescheduled).toBe(true);
    expect(target?.original_date).toBe('2026-01-23');
  });

  it('public/data/races.json にアメリカ重賞が含まれ、日付昇順でソートされていること', () => {
    const publicRacesPath = path.join(rootDir, 'public', 'data', 'races.json');
    expect(fs.existsSync(publicRacesPath)).toBe(true);

    const allRaces: Race[] = JSON.parse(fs.readFileSync(publicRacesPath, 'utf8'));
    const usRaces = allRaces.filter((r) => r.organization === 'equibase');
    expect(usRaces).toHaveLength(408);

    // 全レースがソート順を保っていること
    for (let i = 1; i < allRaces.length; i++) {
      const prev = allRaces[i - 1];
      const curr = allRaces[i];
      expect(curr.date >= prev.date).toBe(true);
    }
  });
});
