import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Race } from '../../src/types/race';

describe('public/data/races.json integrity check', () => {
  it('races.json が存在し、PRD v1.19.0 の Race 型に準拠していること', () => {
    const filePath = path.resolve(process.cwd(), 'public/data/races.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const races = JSON.parse(rawData) as Race[];

    expect(Array.isArray(races)).toBe(true);
    expect(races.length).toBeGreaterThan(0);

    const validOrganizations = ['jra', 'nar', 'france_galop', 'bha', 'equibase'];
    const validGrades = [
      'G1', 'G2', 'G3', 'J.G1', 'J.G2', 'J.G3',
      'Jpn1', 'Jpn2', 'Jpn3', 'S1', 'S2', 'S3', 'local_grade'
    ];
    const validTrackTypes = ['turf', 'dirt', 'obstacle', 'banei', 'aw'];
    const validSexConstraints = ['filly_and_mare', 'colt_and_filly', 'none'];
    const validAgeConstraints = ['2yo', '3yo', '3yo_and_up', '4yo_and_up'];
    const validHandicapCodes = ['weight_for_age', 'special_weight', 'set_weight', 'handicap'];
    const validCountryCodes = ['JP', 'FR', 'GB', 'US'];

    for (const race of races) {
      expect(typeof race.id).toBe('string');
      expect(validOrganizations).toContain(race.organization);
      expect(validCountryCodes).toContain(race.country_code);
      expect(typeof race.name.ja).toBe('string');
      expect(typeof race.name.en).toBe('string');
      expect(race.name.en).not.toMatch(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/);
      expect(race.name.en).not.toBe(race.name.ja);
      expect(validGrades).toContain(race.grade);
      expect(race.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const [y, m, d] = race.date.split('-').map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      expect(dateObj.getUTCFullYear()).toBe(y);
      expect(dateObj.getUTCMonth()).toBe(m - 1);
      expect(dateObj.getUTCDate()).toBe(d);

      expect(typeof race.start_time).toBe('string');
      expect(typeof race.is_time_confirmed).toBe('boolean');
      expect(typeof race.course.ja).toBe('string');
      expect(typeof race.course.en).toBe('string');
      expect(typeof race.distance).toBe('number');
      expect(validTrackTypes).toContain(race.track_type);
      expect(validSexConstraints).toContain(race.sex_constraint);
      expect(validAgeConstraints).toContain(race.age_constraint);
      expect(validHandicapCodes).toContain(race.handicap.code);
      expect(typeof race.handicap.ja).toBe('string');
      expect(typeof race.handicap.en).toBe('string');
    }
  });

  it('全レースの英語名 (name.en) に日本語文字が含まれず、正しく英語化されていること', () => {
    const filePath = path.resolve(process.cwd(), 'public/data/races.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const races = JSON.parse(rawData) as Race[];

    for (const race of races) {
      expect(race.name.en).not.toMatch(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/);
      expect(race.name.en.trim().length).toBeGreaterThan(0);
      expect(race.name.en).not.toBe(race.name.ja);
    }
  });

  it('JRA重賞、NAR重賞（ばんえい含む）、フランス重賞が正しく統合されていること', () => {
    const filePath = path.resolve(process.cwd(), 'public/data/races.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const races = JSON.parse(rawData) as Race[];

    const jraRaces = races.filter((r) => r.organization === 'jra');
    const narRaces = races.filter((r) => r.organization === 'nar');
    const franceRaces = races.filter((r) => r.organization === 'france_galop');

    expect(jraRaces.length).toBe(140);
    expect(narRaces.length).toBe(344);
    expect(franceRaces.length).toBe(113);

    // ばんえい競馬の検証
    const baneiRaces = races.filter((r) => r.track_type === 'banei');
    expect(baneiRaces.length).toBe(27);
    for (const r of baneiRaces) {
      expect(r.course.ja).toBe('帯広');
      expect(r.course.en).toBe('Obihiro');
      expect(r.distance).toBe(200);
      expect(r.organization).toBe('nar');
    }

    // ダートグレード競走の検証
    const jpnRaces = races.filter((r) => ['Jpn1', 'Jpn2', 'Jpn3'].includes(r.grade));
    expect(jpnRaces.length).toBeGreaterThan(40);

    // 南関東重賞の検証
    const sRaces = races.filter((r) => ['S1', 'S2', 'S3'].includes(r.grade));
    expect(sRaces.length).toBeGreaterThan(40);
  });
});
