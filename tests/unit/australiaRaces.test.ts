import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
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

    expect(master.races).toHaveLength(345);
    expect(master.races.filter((r) => r.grade === 'G1')).toHaveLength(74);
    expect(master.races.filter((r) => r.grade === 'G2')).toHaveLength(97);
    expect(master.races.filter((r) => r.grade === 'G3')).toHaveLength(174);
  });

  it('全レースが型安全なスキーマ要件を満たしていること', () => {
    const master = loadAustraliaRaceMaster(rootDir);
    const races = getAustraliaRaces(master, new Map());

    for (const r of races) {
      expect(r.id).toMatch(/^2026-au-(g1|g2|g3)-\d{2,3}$/);
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

    // G2 / G3 代表競走の検証
    const missileStakes = races.find((r) => r.name.en === 'Missile Stakes');
    expect(missileStakes).toBeDefined();
    expect(missileStakes?.grade).toBe('G2');
    expect(missileStakes?.course.en).toBe('Royal Randwick');

    const schillaciStakes = races.find((r) => r.name.en === 'Schillaci Stakes');
    expect(schillaciStakes).toBeDefined();
    expect(schillaciStakes?.grade).toBe('G2');
    expect(schillaciStakes?.course.en).toBe('Caulfield');

    const quezetteStakes = races.find((r) => r.name.en === 'Quezette Stakes');
    expect(quezetteStakes).toBeDefined();
    expect(quezetteStakes?.grade).toBe('G3');
    expect(quezetteStakes?.course.en).toBe('Caulfield');
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

  it('2026年10月17日 ジ・エベレストデー（ロイヤルランドウィック）の7重賞が確定発走時刻として反映されていること (Issue #251)', () => {
    const master = loadAustraliaRaceMaster(rootDir);
    const races = getAustraliaRaces(master, new Map());

    const expectedRaces = [
      { id: '2026-au-g3-134', name: 'Reginald Allen Quality', time: '2026-10-17T02:05:00.000Z' },
      { id: '2026-au-g3-133', name: 'Angst Quality Handicap', time: '2026-10-17T02:40:00.000Z' },
      { id: '2026-au-g3-130', name: 'Atc St. Leger Stakes', time: '2026-10-17T03:15:00.000Z' },
      { id: '2026-au-g3-132', name: "City Tatt's Lightning", time: '2026-10-17T04:25:00.000Z' },
      { id: '2026-au-g1-58', name: 'The Everest', time: '2026-10-17T05:15:00.000Z' },
      { id: '2026-au-g3-131', name: 'The Silver Eagle', time: '2026-10-17T05:50:00.000Z' },
      { id: '2026-au-g1-59', name: 'King Charles III Stakes', time: '2026-10-17T06:35:00.000Z' },
    ];

    for (const exp of expectedRaces) {
      const race = races.find((r) => r.id === exp.id);
      expect(race).toBeDefined();
      expect(race?.name.en).toBe(exp.name);
      expect(race?.start_time).toBe(exp.time);
      expect(race?.is_time_confirmed).toBe(true);
      expect(race?.course.en).toBe('Royal Randwick');
    }

    // 配布用 JSON (races.json, races-2026.json) の同期検証
    for (const file of ['public/data/races.json', 'public/data/races-2026.json']) {
      const publicPath = path.resolve(rootDir, file);
      const publicRaces = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
      for (const exp of expectedRaces) {
        const pr = publicRaces.find((r: { id: string }) => r.id === exp.id);
        expect(pr).toBeDefined();
        expect(pr?.start_time).toBe(exp.time);
        expect(pr?.is_time_confirmed).toBe(true);
      }
    }
  });

  it('2026年10月24日 コックスプレートデーの7重賞が確定発走時刻として反映され、MVゴールドカップの開催日が修正されていること (Issue #261)', () => {
    const master = loadAustraliaRaceMaster(rootDir);
    const races = getAustraliaRaces(master, new Map());

    const expectedRaces = [
      { id: '2026-au-g3-143', name: 'Red Anchor Stakes', date: '2026-10-24', time: '2026-10-24T02:00:00.000Z' },
      { id: '2026-au-g2-86', name: 'Moonee Valley Vase', date: '2026-10-24', time: '2026-10-24T02:40:00.000Z' },
      { id: '2026-au-g2-84', name: 'Ian Mcewen Trophy', date: '2026-10-24', time: '2026-10-24T04:00:00.000Z' },
      { id: '2026-au-g2-83', name: 'Crystal Mile', date: '2026-10-24', time: '2026-10-24T04:40:00.000Z' },
      { id: '2026-au-g2-80', name: 'Moonee Valley Gold Cup', date: '2026-10-24', time: '2026-10-24T05:20:00.000Z' },
      { id: '2026-au-g1-61', name: 'Cox Plate', date: '2026-10-24', time: '2026-10-24T06:10:00.000Z' },
      { id: '2026-au-g3-141', name: 'Tesio Stakes', date: '2026-10-24', time: '2026-10-24T06:50:00.000Z' },
    ];

    for (const exp of expectedRaces) {
      const race = races.find((r) => r.id === exp.id);
      expect(race).toBeDefined();
      expect(race?.name.en).toBe(exp.name);
      expect(race?.date).toBe(exp.date);
      expect(race?.start_time).toBe(exp.time);
      expect(race?.is_time_confirmed).toBe(true);
      expect(race?.course.en).toBe('Moonee Valley');
    }

    // 配布用 JSON (races.json, races-2026.json) の同期検証
    for (const file of ['public/data/races.json', 'public/data/races-2026.json']) {
      const publicPath = path.resolve(rootDir, file);
      const publicRaces = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
      for (const exp of expectedRaces) {
        const pr = publicRaces.find((r: { id: string }) => r.id === exp.id);
        expect(pr).toBeDefined();
        expect(pr?.date).toBe(exp.date);
        expect(pr?.start_time).toBe(exp.time);
        expect(pr?.is_time_confirmed).toBe(true);
      }
    }
  });
});
