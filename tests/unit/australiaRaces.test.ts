import { describe, it, expect } from 'vitest';
import { loadAustraliaRaceMaster, getAustraliaRaces } from '../../scripts/lib/australia-races';

describe('Australia Races Pipeline and Master Data (Issue #193)', () => {
  const rootDir = process.cwd();

  it('australia_race_master.json が正常にロードでき、主要競馬場情報と全74のG1・主要競走が含まれること', () => {
    const master = loadAustraliaRaceMaster(rootDir);
    expect(master.venues).toBeDefined();
    expect(master.venues['Flemington']).toEqual({
      ja: 'フレミントン',
      en: 'Flemington',
      zh: '費明頓',
      fr: 'Flemington',
    });
    expect(master.venues['Royal Randwick']).toEqual({
      ja: 'ロイヤルランドウィック',
      en: 'Royal Randwick',
      zh: '皇家蘭域',
      fr: 'Royal Randwick',
    });
    expect(master.venues['Caulfield']).toEqual({
      ja: 'コーフィールド',
      en: 'Caulfield',
      zh: '考菲爾德',
      fr: 'Caulfield',
    });
    expect(master.venues['Rosehill Gardens']).toEqual({
      ja: 'ローズヒルガーデンズ',
      en: 'Rosehill Gardens',
      zh: '玫瑰崗',
      fr: 'Rosehill Gardens',
    });
    expect(master.venues['Moonee Valley']).toEqual({
      ja: 'ムーニーバレー',
      en: 'Moonee Valley',
      zh: '滿利谷',
      fr: 'Moonee Valley',
    });

    expect(master.races).toHaveLength(74);
  });

  it('全レースが型安全なスキーマ要件を満たしていること', () => {
    const master = loadAustraliaRaceMaster(rootDir);
    const races = getAustraliaRaces(master, new Map());

    for (const r of races) {
      expect(r.id).toMatch(/^2026-au-g1-\d{2}$/);
      expect(r.organization).toBe('racing_australia');
      expect(r.country_code).toBe('AU');
      expect(r.name.ja).toBeTruthy();
      expect(r.name.en).toBeTruthy();
      expect(r.name.zh).toBeTruthy();
      expect(r.date).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(r.start_time).toMatch(/^2026-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/);
      expect(typeof r.is_time_confirmed).toBe('boolean');
      expect(r.course.ja).toBeTruthy();
      expect(r.course.en).toBeTruthy();
      expect(r.distance).toBeGreaterThan(0);
      expect(['turf', 'dirt', 'obstacle', 'banei', 'aw']).toContain(r.track_type);
      expect(['none', 'filly_and_mare', 'colt_and_filly']).toContain(r.sex_constraint);
      expect(['2yo', '3yo', '3yo_and_up', '4yo_and_up', '4yo']).toContain(r.age_constraint);
      expect(['weight_for_age', 'special_weight', 'set_weight', 'handicap']).toContain(r.handicap.code);
    }
  });

  it('主要競走（メルボルンカップ、コックスプレート、コーフィールドカップ、ジ・エベレスト、ゴールデンスリッパー）が含まれること', () => {
    const master = loadAustraliaRaceMaster(rootDir);
    const races = getAustraliaRaces(master, new Map());

    const melbourneCup = races.find((r) => r.name.en === 'Melbourne Cup');
    expect(melbourneCup).toBeDefined();
    expect(melbourneCup?.course.en).toBe('Flemington');
    expect(melbourneCup?.distance).toBe(3200);
    expect(melbourneCup?.date).toBe('2026-11-03');

    const coxPlate = races.find((r) => r.name.en === 'Cox Plate');
    expect(coxPlate).toBeDefined();
    expect(coxPlate?.course.en).toBe('Moonee Valley');
    expect(coxPlate?.distance).toBe(2040);
    expect(coxPlate?.date).toBe('2026-10-24');

    const caulfieldCup = races.find((r) => r.name.en === 'Caulfield Cup');
    expect(caulfieldCup).toBeDefined();
    expect(caulfieldCup?.course.en).toBe('Caulfield');
    expect(caulfieldCup?.distance).toBe(2400);
    expect(caulfieldCup?.date).toBe('2026-10-17');

    const theEverest = races.find((r) => r.name.en === 'The Everest');
    expect(theEverest).toBeDefined();
    expect(theEverest?.course.en).toBe('Royal Randwick');
    expect(theEverest?.distance).toBe(1200);
    expect(theEverest?.date).toBe('2026-10-17');

    const goldenSlipper = races.find((r) => r.name.en === 'Golden Slipper Stakes');
    expect(goldenSlipper).toBeDefined();
    expect(goldenSlipper?.course.en).toBe('Rosehill Gardens');
    expect(goldenSlipper?.distance).toBe(1200);
    expect(goldenSlipper?.age_constraint).toBe('2yo');
  });

  it('confirmedTimesMap が提供された場合、確定時刻が正しくオーバーライドされること', () => {
    const master = loadAustraliaRaceMaster(rootDir);
    const confirmedMap = new Map<string, { start_time: string; is_time_confirmed: boolean }>();
    confirmedMap.set('2026-au-g1-58', {
      start_time: '2026-10-17T05:15:00.000Z',
      is_time_confirmed: true,
    });

    const races = getAustraliaRaces(master, confirmedMap);
    const theEverest = races.find((r) => r.id === '2026-au-g1-58');
    expect(theEverest).toBeDefined();
    expect(theEverest?.start_time).toBe('2026-10-17T05:15:00.000Z');
    expect(theEverest?.is_time_confirmed).toBe(true);
  });
});
