import { describe, it, expect } from 'vitest';
import { loadHkRaceMaster, getHkRaces } from '../../scripts/lib/hk-races';

describe('HK Races Pipeline and Master Data (Issue #110)', () => {
  const rootDir = process.cwd();

  it('hk_race_master.json が正常にロードでき、会場情報と全35の重賞レースが含まれること', () => {
    const master = loadHkRaceMaster(rootDir);
    expect(master.venues).toBeDefined();
    expect(master.venues['Sha Tin']).toEqual({
      ja: 'シャティン',
      en: 'Sha Tin',
      zh: '沙田',
    });
    expect(master.venues['Happy Valley']).toEqual({
      ja: 'ハッピーバレー',
      en: 'Happy Valley',
      zh: '跑馬地',
    });

    expect(master.races).toHaveLength(35);
  });

  it('グレード別のレース数が正確であること (G1: 15, G2: 7, G3: 13)', () => {
    const master = loadHkRaceMaster(rootDir);
    const g1 = master.races.filter((r) => r.grade === 'G1');
    const g2 = master.races.filter((r) => r.grade === 'G2');
    const g3 = master.races.filter((r) => r.grade === 'G3');

    expect(g1).toHaveLength(15);
    expect(g2).toHaveLength(7);
    expect(g3).toHaveLength(13);
  });

  it('全レースが型安全なスキーマ要件を満たしていること', () => {
    const master = loadHkRaceMaster(rootDir);
    const races = getHkRaces(master, new Map());

    for (const r of races) {
      expect(r.id).toMatch(/^2026-hk-(g1|g2|g3)-\d{2}$/);
      expect(r.organization).toBe('hkjc');
      expect(r.country_code).toBe('HK');
      expect(r.name.ja).toBeTruthy();
      expect(r.name.en).toBeTruthy();
      expect(r.name.zh).toBeTruthy();
      expect(r.date).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(r.start_time).toMatch(/^2026-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/);
      expect(typeof r.is_time_confirmed).toBe('boolean');
      expect(r.course.ja).toBeTruthy();
      expect(r.course.en).toBeTruthy();
      expect(r.distance).toBeGreaterThan(0);
      expect(['turf', 'aw']).toContain(r.track_type);
      expect(['none', 'filly_and_mare', 'colt_and_filly']).toContain(r.sex_constraint);
      expect(['2yo', '3yo', '3yo_and_up', '4yo_and_up', '4yo']).toContain(r.age_constraint);
      expect(['weight_for_age', 'special_weight', 'set_weight', 'handicap']).toContain(r.handicap.code);
    }
  });

  it('香港カップ、香港スプリント、QE2世C、香港ダービー等の主要競走の情報が正しく設定されていること', () => {
    const master = loadHkRaceMaster(rootDir);
    const races = getHkRaces(master, new Map());

    // 香港カップ (Hong Kong Cup)
    const hkCup = races.find((r) => r.name.en === 'LONGINES Hong Kong Cup');
    expect(hkCup).toBeDefined();
    expect(hkCup?.name.ja).toBe('香港カップ');
    expect(hkCup?.name.zh).toBe('浪琴香港盃');
    expect(hkCup?.grade).toBe('G1');
    expect(hkCup?.date).toBe('2026-12-13');
    expect(hkCup?.start_time).toBe('2026-12-13T08:40:00.000Z'); // HKT 16:40 -> UTC 08:40
    expect(hkCup?.course.ja).toBe('シャティン');
    expect(hkCup?.distance).toBe(2000);
    expect(hkCup?.track_type).toBe('turf');

    // 香港マイル (Hong Kong Mile)
    const hkMile = races.find((r) => r.name.en === 'LONGINES Hong Kong Mile');
    expect(hkMile).toBeDefined();
    expect(hkMile?.name.ja).toBe('香港マイル');
    expect(hkMile?.date).toBe('2026-12-13');
    expect(hkMile?.distance).toBe(1600);

    // 香港スプリント (Hong Kong Sprint)
    const hkSprint = races.find((r) => r.name.en === 'LONGINES Hong Kong Sprint');
    expect(hkSprint).toBeDefined();
    expect(hkSprint?.name.ja).toBe('香港スプリント');
    expect(hkSprint?.date).toBe('2026-12-13');
    expect(hkSprint?.distance).toBe(1200);

    // 香港ヴァーズ (Hong Kong Vase)
    const hkVase = races.find((r) => r.name.en === 'LONGINES Hong Kong Vase');
    expect(hkVase).toBeDefined();
    expect(hkVase?.name.ja).toBe('香港ヴァーズ');
    expect(hkVase?.date).toBe('2026-12-13');
    expect(hkVase?.distance).toBe(2400);

    // クイーンエリザベス2世カップ (FWD QEII Cup)
    const qeii = races.find((r) => r.name.en === 'FWD QEII Cup');
    expect(qeii).toBeDefined();
    expect(qeii?.name.ja).toBe('クイーンエリザベス2世カップ');
    expect(qeii?.date).toBe('2026-04-26');
    expect(qeii?.distance).toBe(2000);

    // 香港ダービー (BMW Hong Kong Derby)
    const derby = races.find((r) => r.name.en === 'BMW Hong Kong Derby');
    expect(derby).toBeDefined();
    expect(derby?.name.ja).toBe('香港ダービー');
    expect(derby?.name.zh).toBe('寶馬香港打吡大賽');
    expect(derby?.date).toBe('2026-03-22');
    expect(derby?.distance).toBe(2000);

    // 唯一のハッピーバレー重賞 (January Cup)
    const janCup = races.find((r) => r.name.en === 'January Cup');
    expect(janCup).toBeDefined();
    expect(janCup?.course.ja).toBe('ハッピーバレー');
    expect(janCup?.course.zh).toBe('跑馬地');
    expect(janCup?.date).toBe('2026-01-07');
  });

  it('confirmedTimesMap による確定時刻の上書き反映が正常に動作すること', () => {
    const master = loadHkRaceMaster(rootDir);
    const confirmedTimesMap = new Map([
      [
        '2026-hk-g1-15',
        {
          start_time: '2026-12-13T08:45:00.000Z',
          is_time_confirmed: true,
        },
      ],
    ]);

    const races = getHkRaces(master, confirmedTimesMap);
    const cup = races.find((r) => r.id === '2026-hk-g1-15');
    expect(cup?.start_time).toBe('2026-12-13T08:45:00.000Z');
    expect(cup?.is_time_confirmed).toBe(true);
  });
});
