import { describe, it, expect } from 'vitest';
import { loadIrelandRaceMaster, getIrelandRaces } from '../../scripts/lib/ireland-races';

describe('Ireland Races Pipeline and Master Data (Issue #122)', () => {
  const rootDir = process.cwd();

  it('ireland_race_master.json が正常にロードでき、主要会場情報と全67の重賞レースが含まれること', () => {
    const master = loadIrelandRaceMaster(rootDir);
    expect(master.venues).toBeDefined();
    expect(master.venues['Curragh']).toEqual({
      ja: 'カラ',
      en: 'Curragh',
      zh: '卻拉',
      fr: 'Curragh',
    });
    expect(master.venues['Leopardstown']).toEqual({
      ja: 'レパーズタウン',
      en: 'Leopardstown',
      zh: '李奧帕斯敦',
      fr: 'Leopardstown',
    });
    expect(master.venues['Dundalk']).toEqual({
      ja: 'ダンドーク',
      en: 'Dundalk',
      zh: '鄧多克',
      fr: 'Dundalk',
    });

    expect(master.races).toHaveLength(67);
  });

  it('グレード別のレース数が正確であること (G1: 13, G2: 14, G3: 40)', () => {
    const master = loadIrelandRaceMaster(rootDir);
    const g1 = master.races.filter((r) => r.grade === 'G1');
    const g2 = master.races.filter((r) => r.grade === 'G2');
    const g3 = master.races.filter((r) => r.grade === 'G3');

    expect(g1).toHaveLength(13);
    expect(g2).toHaveLength(14);
    expect(g3).toHaveLength(40);
  });

  it('全レースが型安全なスキーマ要件を満たしていること', () => {
    const master = loadIrelandRaceMaster(rootDir);
    const races = getIrelandRaces(master, new Map());

    for (const r of races) {
      expect(r.id).toMatch(/^2026-ie-(g1|g2|g3)-\d{2}$/);
      expect(r.organization).toBe('hri');
      expect(r.country_code).toBe('IE');
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
      expect(['2yo', '3yo', '3yo_and_up', '4yo_and_up']).toContain(r.age_constraint);
      expect(['weight_for_age', 'special_weight', 'set_weight', 'handicap']).toContain(r.handicap.code);
    }
  });

  it('愛ダービー、愛チャンピオンS、愛オークス、タタソールズゴールドC等の主要競走の情報が正しく設定されていること', () => {
    const master = loadIrelandRaceMaster(rootDir);
    const races = getIrelandRaces(master, new Map());

    // アイリッシュダービー (Irish Derby)
    const irishDerby = races.find((r) => r.name.en === 'Irish Derby');
    expect(irishDerby).toBeDefined();
    expect(irishDerby?.name.ja).toBe('アイリッシュダービー');
    expect(irishDerby?.name.zh).toBe('愛爾蘭打吡');
    expect(irishDerby?.grade).toBe('G1');
    expect(irishDerby?.date).toBe('2026-06-28');
    expect(irishDerby?.start_time).toBe('2026-06-28T15:05:00.000Z'); // IST 16:05 (夏時間 UTC+1) -> UTC 15:05
    expect(irishDerby?.course.ja).toBe('カラ');
    expect(irishDerby?.distance).toBe(2400);
    expect(irishDerby?.track_type).toBe('turf');
    expect(irishDerby?.sex_constraint).toBe('colt_and_filly');

    // アイリッシュチャンピオンステークス (Irish Champion Stakes)
    const irishChampion = races.find((r) => r.name.en === 'Irish Champion Stakes');
    expect(irishChampion).toBeDefined();
    expect(irishChampion?.name.ja).toBe('アイリッシュチャンピオンステークス');
    expect(irishChampion?.name.zh).toBe('愛爾蘭冠軍錦標');
    expect(irishChampion?.grade).toBe('G1');
    expect(irishChampion?.date).toBe('2026-09-12');
    expect(irishChampion?.start_time).toBe('2026-09-12T14:25:00.000Z'); // IST 15:25 -> UTC 14:25
    expect(irishChampion?.course.ja).toBe('レパーズタウン');
    expect(irishChampion?.distance).toBe(2000);

    // タタソールズゴールドカップ (Tattersalls Gold Cup)
    const tattersalls = races.find((r) => r.name.en === 'Tattersalls Gold Cup');
    expect(tattersalls).toBeDefined();
    expect(tattersalls?.name.ja).toBe('タタソールズゴールドカップ');
    expect(tattersalls?.date).toBe('2026-05-24');
    expect(tattersalls?.distance).toBe(2100);

    // アイリッシュオークス (Irish Oaks)
    const irishOaks = races.find((r) => r.name.en === 'Irish Oaks');
    expect(irishOaks).toBeDefined();
    expect(irishOaks?.name.ja).toBe('アイリッシュオークス');
    expect(irishOaks?.date).toBe('2026-07-18');
    expect(irishOaks?.distance).toBe(2400);

    // オールウェザー競走: マーキュリーステークス (Mercury Stakes)
    const mercury = races.find((r) => r.name.en === 'Mercury Stakes');
    expect(mercury).toBeDefined();
    expect(mercury?.course.ja).toBe('ダンドーク');
    expect(mercury?.track_type).toBe('aw');
  });

  it('confirmedTimesMap による確定時刻の上書きが正しく機能すること', () => {
    const master = loadIrelandRaceMaster(rootDir);
    const confirmedTimesMap = new Map([
      [
        '2026-ie-g1-05',
        {
          start_time: '2026-06-28T15:20:00.000Z',
          is_time_confirmed: true,
          is_rescheduled: false,
          original_date: '2026-06-28',
        },
      ],
    ]);

    const races = getIrelandRaces(master, confirmedTimesMap);
    const derby = races.find((r) => r.id === '2026-ie-g1-05');
    expect(derby).toBeDefined();
    expect(derby?.start_time).toBe('2026-06-28T15:20:00.000Z');
    expect(derby?.is_time_confirmed).toBe(true);
  });
});
