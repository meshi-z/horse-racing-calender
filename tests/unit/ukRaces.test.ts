import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadUkRaceMaster, getUkRaces } from '../../scripts/lib/uk-races';
import type { Race } from '../../src/types/race';

describe('UK Races Pipeline and Master Data (Issue #84)', () => {
  const rootDir = process.cwd();

  it('uk_race_master.json が正常にロードでき、会場情報と190の重賞レース（平地＋障害）が含まれること', () => {
    const master = loadUkRaceMaster(rootDir);
    expect(master.venues).toBeDefined();
    expect(Object.keys(master.venues).length).toBeGreaterThanOrEqual(17);
    expect(master.venues['Ascot']).toEqual({
      ja: 'アスコット',
      en: 'Ascot',
    });
    expect(master.venues['Newmarket']).toEqual({
      ja: 'ニューマーケット',
      en: 'Newmarket',
    });
    expect(master.venues['Epsom']).toEqual({
      ja: 'エプソム',
      en: 'Epsom',
    });
    expect(master.venues['Cheltenham']).toEqual({
      ja: 'チェルトナム',
      en: 'Cheltenham',
    });
    expect(master.venues['Aintree']).toEqual({
      ja: 'エイントリー',
      en: 'Aintree'
    });

    expect(master.races).toHaveLength(190);
  });

  it('グレード別のレース数が正確であること (G1: 71, G2: 47, G3: 72)', () => {
    const master = loadUkRaceMaster(rootDir);
    const g1 = master.races.filter((r) => r.grade === 'G1');
    const g2 = master.races.filter((r) => r.grade === 'G2');
    const g3 = master.races.filter((r) => r.grade === 'G3');

    expect(g1).toHaveLength(71);
    expect(g2).toHaveLength(47);
    expect(g3).toHaveLength(72);
  });

  it('全レースが型安全なスキーマ要件を満たしていること', () => {
    const master = loadUkRaceMaster(rootDir);
    const races = getUkRaces(master, new Map());

    for (const r of races) {
      expect(r.id).toMatch(/^2026-uk-(g1|g2|g3)-\d{2}$/);
      expect(r.organization).toBe('bha');
      expect(r.country_code).toBe('GB');
      expect(r.name.ja).toBeTruthy();
      expect(r.name.en).toBeTruthy();
      expect(r.date).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(r.start_time).toMatch(/^2026-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/);
      expect(typeof r.is_time_confirmed).toBe('boolean');
      expect(r.course.ja).toBeTruthy();
      expect(r.course.en).toBeTruthy();
      expect(r.distance).toBeGreaterThan(0);
      expect(['turf', 'aw', 'obstacle']).toContain(r.track_type);
      expect(['none', 'filly_and_mare', 'colt_and_filly']).toContain(r.sex_constraint);
      expect(['2yo', '3yo', '3yo_and_up', '4yo_and_up', '4yo']).toContain(r.age_constraint);
      expect(['weight_for_age', 'special_weight', 'set_weight', 'handicap']).toContain(r.handicap.code);
    }
  });

  it('2000ギニー、エプソムダービー、キングジョージをはじめとする主要G1レースの情報が正しく設定されていること', () => {
    const master = loadUkRaceMaster(rootDir);
    const races = getUkRaces(master, new Map());

    // 2000ギニー
    const guineas2000 = races.find((r) => r.name.en === '2000 Guineas Stakes');
    expect(guineas2000).toBeDefined();
    expect(guineas2000?.name.ja).toBe('2000ギニー');
    expect(guineas2000?.grade).toBe('G1');
    expect(guineas2000?.date).toBe('2026-05-02');
    expect(guineas2000?.start_time).toBe('2026-05-02T13:35:00.000Z'); // BST 14:35 -> UTC 13:35
    expect(guineas2000?.course.ja).toBe('ニューマーケット');
    expect(guineas2000?.distance).toBe(1609);
    expect(guineas2000?.track_type).toBe('turf');

    // 1000ギニー
    const guineas1000 = races.find((r) => r.name.en === '1000 Guineas Stakes');
    expect(guineas1000).toBeDefined();
    expect(guineas1000?.name.ja).toBe('1000ギニー');
    expect(guineas1000?.grade).toBe('G1');
    expect(guineas1000?.date).toBe('2026-05-03');

    // エプソムダービー
    const derby = races.find((r) => r.name.en === 'Derby Stakes');
    expect(derby).toBeDefined();
    expect(derby?.name.ja).toBe('エプソムダービー');
    expect(derby?.grade).toBe('G1');
    expect(derby?.date).toBe('2026-06-06');
    expect(derby?.course.ja).toBe('エプソム');
    expect(derby?.distance).toBe(2414);

    // キングジョージ6世&クイーンエリザベスステークス
    const kg = races.find((r) => r.name.en === 'King George VI and Queen Elizabeth Stakes');
    expect(kg).toBeDefined();
    expect(kg?.name.ja).toBe('キングジョージ6世&クイーンエリザベスステークス');
    expect(kg?.grade).toBe('G1');
    expect(kg?.date).toBe('2026-07-25');
    expect(kg?.course.ja).toBe('アスコット');
    expect(kg?.distance).toBe(2414);

    // セントレジャー
    const stLeger = races.find((r) => r.name.en === 'St Leger Stakes');
    expect(stLeger).toBeDefined();
    expect(stLeger?.name.ja).toBe('セントレジャーステークス');
    expect(stLeger?.grade).toBe('G1');
    expect(stLeger?.date).toBe('2026-09-12');
    expect(stLeger?.course.ja).toBe('ドンカスター');
  });

  it('チェルトナムゴールドカップ、グランドナショナル、キングジョージ6世チェイス等の主要障害重賞が正しく設定されていること', () => {
    const master = loadUkRaceMaster(rootDir);
    const races = getUkRaces(master, new Map());

    // チェルトナムゴールドカップ
    const goldCup = races.find((r) => r.name.en === 'Cheltenham Gold Cup');
    expect(goldCup).toBeDefined();
    expect(goldCup?.name.ja).toBe('チェルトナムゴールドカップ');
    expect(goldCup?.grade).toBe('G1');
    expect(goldCup?.track_type).toBe('obstacle');
    expect(goldCup?.course.ja).toBe('チェルトナム');
    expect(goldCup?.course.en).toBe('Cheltenham');
    expect(goldCup?.date).toBe('2026-03-13');
    expect(goldCup?.distance).toBe(5331);

    // チャンピオンハードル
    const champHurdle = races.find((r) => r.name.en === 'Champion Hurdle');
    expect(champHurdle).toBeDefined();
    expect(champHurdle?.grade).toBe('G1');
    expect(champHurdle?.track_type).toBe('obstacle');

    // クイーンマザーチャンピオンチェイス
    const qmChase = races.find((r) => r.name.en === 'Queen Mother Champion Chase');
    expect(qmChase).toBeDefined();
    expect(qmChase?.grade).toBe('G1');

    // グランドナショナル
    const gn = races.find((r) => r.name.en === 'Grand National');
    expect(gn).toBeDefined();
    expect(gn?.name.ja).toBe('グランドナショナル');
    expect(gn?.grade).toBe('G3');
    expect(gn?.track_type).toBe('obstacle');
    expect(gn?.course.ja).toBe('エイントリー');
    expect(gn?.date).toBe('2026-04-11');
    expect(gn?.distance).toBe(6858);
    expect(gn?.handicap.code).toBe('handicap');

    // キングジョージ6世チェイス
    const kingGeorgeChase = races.find((r) => r.name.en === 'King George VI Chase');
    expect(kingGeorgeChase).toBeDefined();
    expect(kingGeorgeChase?.name.ja).toBe('キングジョージ6世チェイス');
    expect(kingGeorgeChase?.grade).toBe('G1');
    expect(kingGeorgeChase?.track_type).toBe('obstacle');
    expect(kingGeorgeChase?.course.ja).toBe('ケンプトン');
    expect(kingGeorgeChase?.date).toBe('2026-12-26');
  });

  it('confirmedTimesMap による確定時刻・順延情報の上書き保持が機能すること', () => {
    const master = loadUkRaceMaster(rootDir);
    const confirmedMap = new Map();
    confirmedMap.set('2026-uk-g1-01', {
      start_time: '2026-05-02T13:40:00.000Z',
      is_time_confirmed: true,
      is_rescheduled: true,
      original_date: '2026-05-01',
    });

    const races = getUkRaces(master, confirmedMap);
    const target = races.find((r) => r.id === '2026-uk-g1-01');
    expect(target).toBeDefined();
    expect(target?.start_time).toBe('2026-05-02T13:40:00.000Z');
    expect(target?.is_time_confirmed).toBe(true);
    expect(target?.is_rescheduled).toBe(true);
    expect(target?.original_date).toBe('2026-05-01');
  });

  it('public/data/races.json にイギリス重賞が含まれ、日付昇順でソートされていること', () => {
    const publicRacesPath = path.join(rootDir, 'public', 'data', 'races.json');
    expect(fs.existsSync(publicRacesPath)).toBe(true);

    const allRaces: Race[] = JSON.parse(fs.readFileSync(publicRacesPath, 'utf8'));
    const ukRaces = allRaces.filter((r) => r.organization === 'bha');
    expect(ukRaces).toHaveLength(190);

    // 全レースがソート順を保っていること
    for (let i = 1; i < allRaces.length; i++) {
      const prev = allRaces[i - 1];
      const curr = allRaces[i];
      expect(curr.date >= prev.date).toBe(true);
    }
  });
});
