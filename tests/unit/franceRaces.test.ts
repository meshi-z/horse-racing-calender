import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { loadFranceRaceMaster, getFranceRaces } from '../../scripts/lib/france-races';
import type { Race } from '../../src/types/race';

describe('France Races Pipeline and Master Data (Issue #65)', () => {
  const rootDir = process.cwd();

  it('france_race_master.json が正常にロードでき、会場情報と121の重賞レース（平地＋障害）が含まれること', () => {
    const master = loadFranceRaceMaster(rootDir);
    expect(master.venues).toBeDefined();
    expect(Object.keys(master.venues).length).toBeGreaterThanOrEqual(11);
    expect(master.venues['ParisLongchamp']).toEqual({
      ja: 'パリロンシャン',
      en: 'ParisLongchamp',
      fr: 'ParisLongchamp',
    });
    expect(master.venues['Chantilly']).toEqual({
      ja: 'シャンティイ',
      en: 'Chantilly',
      fr: 'Chantilly',
    });
    expect(master.venues['Auteuil']).toEqual({
      ja: 'オートゥイユ',
      en: 'Auteuil',
      fr: 'Auteuil',
    });

    expect(master.races).toHaveLength(121);
  });

  it('グレード別のレース数が正確であること (G1: 36, G2: 24, G3: 61)', () => {
    const master = loadFranceRaceMaster(rootDir);
    const g1 = master.races.filter((r) => r.grade === 'G1');
    const g2 = master.races.filter((r) => r.grade === 'G2');
    const g3 = master.races.filter((r) => r.grade === 'G3');

    expect(g1).toHaveLength(36);
    expect(g2).toHaveLength(24);
    expect(g3).toHaveLength(61);
  });

  it('全レースが型安全なスキーマ要件を満たしていること', () => {
    const master = loadFranceRaceMaster(rootDir);
    const races = getFranceRaces(master, new Map());

    for (const r of races) {
      expect(r.id).toMatch(/^2026-france-(g1|g2|g3)-\d{2}$/);
      expect(r.organization).toBe('france_galop');
      expect(r.country_code).toBe('FR');
      expect(r.name.ja).toBeTruthy();
      expect(r.name.en).toBeTruthy();
      expect(r.name.fr).toBeTruthy();
      expect(r.date).toMatch(/^2026-\d{2}-\d{2}$/);
      expect(r.start_time).toMatch(/^2026-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/);
      expect(typeof r.is_time_confirmed).toBe('boolean');
      expect(r.course.ja).toBeTruthy();
      expect(r.course.en).toBeTruthy();
      expect(r.distance).toBeGreaterThan(0);
      expect(['turf', 'aw', 'obstacle']).toContain(r.track_type);
      expect(['none', 'filly_and_mare', 'colt_and_filly']).toContain(r.sex_constraint);
      expect(['2yo', '3yo', '3yo_and_up', '4yo_and_up', '4yo']).toContain(r.age_constraint);
      expect(r.handicap.code).toBe('weight_for_age');
    }

    // 過去レース（<= 2026-09-20）はすべて確定ステータス、未来レースは未確定であること
    const pastRaces = races.filter((r) => r.date <= '2026-09-20');
    const futureRaces = races.filter((r) => r.date > '2026-09-20');
    expect(pastRaces).toHaveLength(92);
    expect(pastRaces.every((r) => r.is_time_confirmed === true)).toBe(true);
    expect(futureRaces).toHaveLength(29);
    expect(futureRaces.every((r) => r.is_time_confirmed === false)).toBe(true);
  });

  it('凱旋門賞をはじめとする主要G1レースの情報が正しく設定されていること', () => {
    const master = loadFranceRaceMaster(rootDir);
    const races = getFranceRaces(master, new Map());

    // 凱旋門賞
    const arc = races.find((r) => r.name.ja === '凱旋門賞');
    expect(arc).toBeDefined();
    expect(arc?.name.en).toBe("Prix de l'Arc de Triomphe");
    expect(arc?.name.fr).toBe("Prix de l'Arc de Triomphe");
    expect(arc?.grade).toBe('G1');
    expect(arc?.date).toBe('2026-10-04');
    expect(arc?.start_time).toBe('2026-10-04T14:05:00.000Z'); // CEST 16:05 -> UTC 14:05
    expect(arc?.course.ja).toBe('パリロンシャン');
    expect(arc?.distance).toBe(2400);
    expect(arc?.track_type).toBe('turf');

    // ジョッケクリュブ賞（仏ダービー）
    const derby = races.find((r) => r.name.ja.includes('仏ダービー'));
    expect(derby).toBeDefined();
    expect(derby?.name.en).toBe('Prix du Jockey Club');
    expect(derby?.grade).toBe('G1');
    expect(derby?.date).toBe('2026-05-31');
    expect(derby?.course.ja).toBe('シャンティイ');
    expect(derby?.distance).toBe(2100);

    // ディアヌ賞（仏オークス）
    const diane = races.find((r) => r.name.ja.includes('仏オークス'));
    expect(diane).toBeDefined();
    expect(diane?.name.en).toBe('Prix de Diane');
    expect(diane?.grade).toBe('G1');
    expect(diane?.date).toBe('2026-06-14');
    expect(diane?.course.ja).toBe('シャンティイ');
    expect(diane?.sex_constraint).toBe('filly_and_mare');

    // ジャック・ル・マロワ賞
    const marois = races.find((r) => r.name.ja === 'ジャック・ル・マロワ賞');
    expect(marois).toBeDefined();
    expect(marois?.grade).toBe('G1');
    expect(marois?.date).toBe('2026-08-16');
    expect(marois?.course.ja).toBe('ドーヴィル');
    expect(marois?.distance).toBe(1600);
  });

  it('馬場種別AW（All Weather）のレースが正しく設定されていること', () => {
    const master = loadFranceRaceMaster(rootDir);
    const races = getFranceRaces(master, new Map());

    const awRaces = races.filter((r) => r.track_type === 'aw');
    expect(awRaces.length).toBeGreaterThanOrEqual(2);
    expect(awRaces.some((r) => r.name.ja === 'ミエスク賞')).toBe(true);
    expect(awRaces.some((r) => r.name.ja === 'トマ・ブリョン賞')).toBe(true);
  });

  it('夏時間（CEST: UTC+2）と冬時間（CET: UTC+1）が正確に start_time に反映されていること', () => {
    const master = loadFranceRaceMaster(rootDir);
    const races = getFranceRaces(master, new Map());

    // 夏時間のレース (2026-10-04, 16:05 CEST -> 14:05 UTC)
    const summerRace = races.find((r) => r.date === '2026-10-04' && r.name.ja === '凱旋門賞');
    expect(summerRace?.start_time).toBe('2026-10-04T14:05:00.000Z');

    // 冬時間のレース (2026-11-11, 15:15 CET -> 14:15 UTC)
    const winterRace = races.find((r) => r.date === '2026-11-11');
    expect(winterRace?.start_time).toBe('2026-11-11T14:15:00.000Z');
  });

  it('パリ大障害、オートゥイユ大ハードル、ラ・エ・ジュグラ賞等のオートゥイユ障害G1競走が正しく設定されていること', () => {
    const master = loadFranceRaceMaster(rootDir);
    const races = getFranceRaces(master, new Map());

    // パリ大障害 (Grand Steeple-Chase de Paris)
    const grandSteeple = races.find((r) => r.name.en === 'Grand Steeple-Chase de Paris');
    expect(grandSteeple).toBeDefined();
    expect(grandSteeple?.name.ja).toBe('パリ大障害');
    expect(grandSteeple?.grade).toBe('G1');
    expect(grandSteeple?.track_type).toBe('obstacle');
    expect(grandSteeple?.course.ja).toBe('オートゥイユ');
    expect(grandSteeple?.course.en).toBe('Auteuil');
    expect(grandSteeple?.distance).toBe(6000);
    expect(grandSteeple?.date).toBe('2026-05-17');

    // オートゥイユ大ハードル (Grande Course de Haies d'Auteuil)
    const grandeCourse = races.find((r) => r.name.en === "Grande Course de Haies d'Auteuil");
    expect(grandeCourse).toBeDefined();
    expect(grandeCourse?.name.ja).toBe('オートゥイユ大ハードル');
    expect(grandeCourse?.grade).toBe('G1');
    expect(grandeCourse?.track_type).toBe('obstacle');
    expect(grandeCourse?.distance).toBe(5100);
    expect(grandeCourse?.date).toBe('2026-06-07');

    // ラ・エ・ジュグラ賞 (Prix La Haye Jousselin)
    const hayeJousselin = races.find((r) => r.name.en === 'Prix La Haye Jousselin');
    expect(hayeJousselin).toBeDefined();
    expect(hayeJousselin?.name.ja).toBe('ラエジュグラ賞');
    expect(hayeJousselin?.grade).toBe('G1');
    expect(hayeJousselin?.track_type).toBe('obstacle');
    expect(hayeJousselin?.distance).toBe(5500);
    expect(hayeJousselin?.date).toBe('2026-11-08');

    // 4歳障害G1 (フェルディナン・デュフォー賞)
    const ferdinand = races.find((r) => r.name.en === 'Prix Ferdinand Dufaure');
    expect(ferdinand).toBeDefined();
    expect(ferdinand?.grade).toBe('G1');
    expect(ferdinand?.track_type).toBe('obstacle');
    expect(ferdinand?.age_constraint).toBe('4yo');
  });

  it('public/data/races.json に全レースが保存され、JRA/NARにJP、FranceにFRが付与されていること', () => {
    const racesPath = path.join(rootDir, 'public', 'data', 'races.json');
    expect(fs.existsSync(racesPath)).toBe(true);
    const races: Race[] = JSON.parse(fs.readFileSync(racesPath, 'utf8'));

    expect(races.length).toBeGreaterThanOrEqual(1263);

    const jraRaces = races.filter((r) => r.organization === 'jra');
    const narRaces = races.filter((r) => r.organization === 'nar');
    const franceRaces = races.filter((r) => r.organization === 'france_galop');

    expect(jraRaces).toHaveLength(140);
    expect(narRaces).toHaveLength(344);
    expect(franceRaces).toHaveLength(121);

    expect(jraRaces.every((r) => r.country_code === 'JP')).toBe(true);
    expect(narRaces.every((r) => r.country_code === 'JP')).toBe(true);
    expect(franceRaces.every((r) => r.country_code === 'FR')).toBe(true);
  });
});
