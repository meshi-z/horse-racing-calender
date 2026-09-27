import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parsePmuResultsJson, parseSportingLifeResultsJson } from '../../scripts/lib/foreign-results';
import type { RaceOutput } from '../../scripts/parse-races';

describe('Official Race Results Integrity Tests', () => {
  it('corrects Prix Maurice de Gheest to official winner Samangan and eliminates dummy Grandir', () => {
    const winnersPath = path.resolve(process.cwd(), 'src/data/race_winners.json');
    const winners = JSON.parse(fs.readFileSync(winnersPath, 'utf8'));

    const racesPath = path.resolve(process.cwd(), 'public/data/races.json');
    const races: RaceOutput[] = JSON.parse(fs.readFileSync(racesPath, 'utf8'));

    // 1. Prix Maurice de Gheest の検証
    const mauriceRace = races.find(
      (r) =>
        r.id.includes('france') &&
        (r.name.fr?.includes('Maurice de Gheest') || r.name.en?.includes('Maurice de Gheest'))
    );
    expect(mauriceRace).toBeDefined();
    expect(mauriceRace?.winner).toBeDefined();
    expect(mauriceRace?.winner?.name.en).toBe('Samangan');
    expect(mauriceRace?.winner?.name.ja).toBe('サマンガン');
    expect(mauriceRace?.winner?.horse_number).toBe(5);

    // 2. 架空の Grandir / グランディール が完全に排除されていること
    expect(mauriceRace?.winner?.name.en).not.toContain('Grandir');
    expect(mauriceRace?.winner?.name.ja).not.toContain('グランディール');

    // 全レースの勝者に Grandir が含まれないこと
    const hasGrandir = Object.values(winners).some(
      (w: any) =>
        w.name?.en === 'Grandir' ||
        w.name?.ja === 'グランディール' ||
        w.name?.fr === 'Grandir'
    );
    expect(hasGrandir).toBe(false);
  });

  it('corrects French, UK, US, HK, JRA, and NAR major race winners from official sources', () => {
    const racesPath = path.resolve(process.cwd(), 'public/data/races.json');
    const races: RaceOutput[] = JSON.parse(fs.readFileSync(racesPath, 'utf8'));

    // France: Prix Jacques le Marois -> Rayif
    const marois = races.find((r) => r.id.includes('france') && r.name.fr?.toLowerCase().includes('jacques le marois'));
    expect(marois?.winner?.name.en).toBe('Rayif');

    // UK: Epsom Derby -> Christmas Day
    const derby = races.find((r) => r.id === '2026-uk-g1-06' || r.name.ja === 'エプソムダービー');
    expect(derby?.winner?.name.en).toBe('Christmas Day');

    // UK: 2000 Guineas -> Bow Echo
    const guineas = races.find((r) => r.id === '2026-uk-g1-01');
    expect(guineas?.winner?.name.en).toBe('Bow Echo');

    // US: Kentucky Derby -> Golden Tempo
    const kyDerby = races.find((r) => r.id.includes('us') && r.name.en === 'Kentucky Derby');
    expect(kyDerby?.winner?.name.en).toBe('Golden Tempo');

    // US: Preakness Stakes -> Napoleon Solo
    const preakness = races.find((r) => r.id.includes('us') && r.name.en === 'Preakness Stakes');
    expect(preakness?.winner?.name.en).toBe('Napoleon Solo');

    // HK: QEII Cup -> Romantic Warrior
    const qe2 = races.find((r) => r.id.includes('hk') && r.name.en === 'FWD QEII Cup');
    expect(qe2?.winner?.name.en).toBe('Romantic Warrior');

    // JRA: Nakayama Kimpai -> カラマティアノス
    const kimpai = races.find((r) => r.id.includes('jra') && r.name.ja.includes('中山金杯'));
    expect(kimpai?.winner?.name.ja).toBe('カラマティアノス');

    // NAR: Kawasaki Milers -> アランバローズ
    const kawasakiMilers = races.find((r) => r.id.includes('nar') && r.name.ja.includes('川崎マイラーズ'));
    expect(kawasakiMilers?.winner?.name.ja).toBe('アランバローズ');

    // NAR: Kimpai -> グリューヴルム
    const ooiKimpai = races.find((r) => r.id.includes('nar') && r.name.ja.includes('金盃'));
    expect(ooiKimpai?.winner?.name.ja).toBe('グリューヴルム');
  });

  it('correctly handles PMU nested array in ordreArrivee and extracts winner', () => {
    const mockPmuData = {
      programme: {
        date: 1722729600000,
        reunions: [
          {
            numOfficiel: 1,
            courses: [
              {
                numOrdre: 7,
                libelle: 'PRIX MAURICE DE GHEEST',
                // PMU API の同着二重配列形式
                ordreArrivee: [[5], [10], [2]],
                participants: [
                  {
                    numPmu: 5,
                    nom: 'SAMANGAN',
                    driver: 'M. BARZALONA',
                    tempsObtenu: "1'16\"20",
                  },
                  {
                    numPmu: 10,
                    nom: 'OTHER HORSE',
                    driver: 'A. POUCHIN',
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const targetRaces: RaceOutput[] = [
      {
        id: '2026-france-g1-08',
        name: { ja: 'モーリス・ド・ゲスト賞', en: 'Prix Maurice de Gheest', fr: 'Prix Maurice de Gheest' },
        date: '2026-08-02',
        grade: 'G1',
        organization: 'france_galop',
        country_code: 'FR',
        start_time: '2026-08-02T13:50:00Z',
        course: { ja: 'ドーヴィル', en: 'Deauville' },
        distance: 1300,
        track_type: 'turf',
      } as any,
    ];

    const results = parsePmuResultsJson(mockPmuData as any, targetRaces);
    const winner = results.get('2026-france-g1-08');

    expect(winner).toBeDefined();
    expect(winner?.name.en).toBe('Samangan');
    expect(winner?.horse_number).toBe(5);
    expect(winner?.time).toBe('1:16.20');
  });

  it('correctly handles Sporting Life top_horses when rides is empty', () => {
    const mockMeetings = [
      {
        course_name: 'Epsom Downs',
        races: [
          {
            name: 'Betfred Derby (Group 1)',
            time: '15:00',
            winning_time: '2m 43.75s',
            rides: [],
            top_horses: [
              {
                name: 'Christmas Day',
                position: 1,
              },
              {
                name: 'Maltese Cross',
                position: 2,
              },
            ],
          },
        ],
      },
    ];

    const targetRaces: RaceOutput[] = [
      {
        id: '2026-uk-g1-06',
        name: { ja: 'エプソムダービー', en: 'Derby Stakes' },
        date: '2026-06-06',
        grade: 'G1',
        organization: 'bha',
        country_code: 'GB',
        start_time: '2026-06-06T14:00:00Z',
        course: { ja: 'エプソム', en: 'Epsom Downs' },
        distance: 2400,
        track_type: 'turf',
      } as any,
    ];

    const results = parseSportingLifeResultsJson(mockMeetings as any, targetRaces);
    const winner = results.get('2026-uk-g1-06');

    expect(winner).toBeDefined();
    expect(winner?.name.en).toBe('Christmas Day');
    expect(winner?.time).toBe('2m 43.75s');
  });
});
