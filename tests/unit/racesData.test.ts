import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type { Race } from '../../src/types/race';

describe('public/data/races.json integrity check', () => {
  it('races.json が存在し、PRD v1.5.1 の Race 型に準拠していること', () => {
    const filePath = path.resolve(process.cwd(), 'public/data/races.json');
    expect(fs.existsSync(filePath)).toBe(true);

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const races = JSON.parse(rawData) as Race[];

    expect(Array.isArray(races)).toBe(true);
    expect(races.length).toBeGreaterThan(0);

    const validGrades = ['G1', 'G2', 'G3', 'J.G1', 'J.G2', 'J.G3'];
    const validTrackTypes = ['turf', 'dirt', 'obstacle'];
    const validSexConstraints = ['filly_and_mare', 'colt_and_filly', 'none'];
    const validAgeConstraints = ['2yo', '3yo', '3yo_and_up', '4yo_and_up'];
    const validHandicapCodes = ['weight_for_age', 'special_weight', 'set_weight', 'handicap'];

    for (const race of races) {
      expect(typeof race.id).toBe('string');
      expect(race.organization).toBe('jra');
      expect(typeof race.name.ja).toBe('string');
      expect(typeof race.name.en).toBe('string');
      expect(validGrades).toContain(race.grade);
      expect(race.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
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
});
