import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  tokenizeFrench,
  frenchRaceMatches,
  parsePmuTimestampToIsoAndJst,
  parsePmuProgrammeJson,
  fetchFranceConfirmedRaceTimes,
  PmuProgrammeResponse,
} from '../../scripts/lib/france-syutsuba';
import {
  FranceRaceTimeFetcher,
  getFranceUpcomingWindowRange,
  updateRaceTimes,
  RaceOutput,
} from '../../scripts/update-race-times';

describe('France Syutsuba utility', () => {
  describe('tokenizeFrench', () => {
    it('アクセント記号を除去し大文字・ストップワードを除去したトークンを返すこと', () => {
      const tokens = tokenizeFrench("Prix de l'Arc de Triomphe");
      expect(tokens).toEqual(['PRIX', 'ARC', 'TRIOMPHE']);
    });

    it('Pénélope や Cléopâtre などの記号も正しく正規化すること', () => {
      expect(tokenizeFrench('Prix Pénélope')).toEqual(['PRIX', 'PENELOPE']);
      expect(tokenizeFrench('Prix Cléopâtre')).toEqual(['PRIX', 'CLEOPATRE']);
    });
  });

  describe('frenchRaceMatches', () => {
    it('同一のレース名で真を返すこと', () => {
      expect(frenchRaceMatches("Prix d'Exbury", 'PRIX EXBURY')).toBe(true);
      expect(frenchRaceMatches('Prix Edmond Blanc', 'PRIX EDMOND BLANC')).toBe(true);
    });

    it('スポンサー冠名が付与されたレース名でも真を返すこと', () => {
      expect(frenchRaceMatches('Prix Vermeille', 'QATAR PRIX VERMEILLE')).toBe(true);
      expect(frenchRaceMatches("Prix de l'Arc de Triomphe", "QATAR PRIX DE L'ARC DE TRIOMPHE")).toBe(true);
      expect(frenchRaceMatches('Prix Eclipse', "PRIX ECLIPSE - TATTERSALLS - FONDS EUROPEEN DE L'ELEVAGE")).toBe(true);
    });

    it('異なるレース名では偽を返すこと', () => {
      expect(frenchRaceMatches('Prix Vermeille', "PRIX DU JEU DE L'OIE")).toBe(false);
      expect(frenchRaceMatches('Prix Ganay', 'PRIX D HARCOURT')).toBe(false);
    });
  });

  describe('parsePmuTimestampToIsoAndJst', () => {
    it('ミリ秒タイムスタンプから正確な UTC ISO と JST HH:mm 表記を生成すること', () => {
      // 2026-09-20T13:50:00.000Z (JST: 22:50)
      const ts = Date.parse('2026-09-20T13:50:00.000Z');
      const result = parsePmuTimestampToIsoAndJst(ts);
      expect(result.utcIso).toBe('2026-09-20T13:50:00.000Z');
      expect(result.timeJst).toBe('22:50');
      expect(result.rawTime).toBe('22:50 JST');
    });

    it('深夜JST（翌日未明）でも時刻が正しく計算されること', () => {
      // 2026-09-20T16:15:00.000Z -> JST 01:15 (翌日)
      const ts = Date.parse('2026-09-20T16:15:00.000Z');
      const result = parsePmuTimestampToIsoAndJst(ts);
      expect(result.utcIso).toBe('2026-09-20T16:15:00.000Z');
      expect(result.timeJst).toBe('01:15');
    });
  });

  describe('parsePmuProgrammeJson', () => {
    const mockPmuData: PmuProgrammeResponse = {
      programme: {
        date: 1789862400000,
        reunions: [
          {
            numOfficiel: 1,
            hippodrome: {
              libelleCourt: 'LONGCHAMP',
              libelleLong: 'PARISLONGCHAMP',
            },
            courses: [
              {
                numOrdre: 1,
                libelle: "QATAR PRIX DU PETIT COUVERT",
                heureDepart: Date.parse('2026-09-13T12:36:00.000Z'),
              },
              {
                numOrdre: 4,
                libelle: "QATAR PRIX VERMEILLE",
                heureDepart: Date.parse('2026-09-13T13:50:00.000Z'),
              },
            ],
          },
        ],
      },
    };

    const targetRaces: RaceOutput[] = [
      {
        id: '2026-france-g1-vermeille',
        organization: 'france_galop',
        country_code: 'FR',
        name: {
          ja: 'ヴェルメイユ賞',
          en: 'Prix Vermeille',
          fr: 'Prix Vermeille',
        },
        grade: 'G1',
        date: '2026-09-13',
        start_time: '2026-09-13T13:50:00.000Z',
        is_time_confirmed: false,
        course: { ja: 'パリロンシャン', en: 'ParisLongchamp' },
        distance: 2400,
        track_type: 'turf',
        sex_constraint: 'filly_and_mare',
        age_constraint: '3yo_and_up',
        handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
      },
    ];

    it('PMUレスポンスから対象レースを抽出して ConfirmedRaceTime を生成すること', () => {
      const confirmed = parsePmuProgrammeJson(mockPmuData, targetRaces, '2026-09-13');
      expect(confirmed).toHaveLength(1);
      expect(confirmed[0].raceId).toBe('2026-france-g1-vermeille');
      expect(confirmed[0].raceName).toBe('ヴェルメイユ賞');
      expect(confirmed[0].date).toBe('2026-09-13');
      expect(confirmed[0].utcIso).toBe('2026-09-13T13:50:00.000Z');
      expect(confirmed[0].timeJst).toBe('22:50');
    });
  });

  describe('fetchFranceConfirmedRaceTimes', () => {
    it('フィクスチャ注入により正しく確定発走時刻を取得できること', async () => {
      const targetRace: RaceOutput = {
        id: '2026-france-g1-arc',
        organization: 'france_galop',
        country_code: 'FR',
        name: {
          ja: '凱旋門賞',
          en: 'Prix de l Arc de Triomphe',
          fr: "Prix de l'Arc de Triomphe",
        },
        grade: 'G1',
        date: '2026-10-04',
        start_time: '2026-10-04T14:00:00.000Z',
        is_time_confirmed: false,
        course: { ja: 'パリロンシャン', en: 'ParisLongchamp' },
        distance: 2400,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
      };

      const fixtures: Record<string, PmuProgrammeResponse> = {
        '04102026': {
          programme: {
            reunions: [
              {
                hippodrome: { libelleCourt: 'LONGCHAMP' },
                courses: [
                  {
                    numOrdre: 5,
                    libelle: "QATAR PRIX DE L'ARC DE TRIOMPHE",
                    heureDepart: Date.parse('2026-10-04T14:05:00.000Z'),
                  },
                ],
              },
            ],
          },
        },
      };

      const result = await fetchFranceConfirmedRaceTimes({
        targetRaces: [targetRace],
        fixtures,
        delayMs: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].raceId).toBe('2026-france-g1-arc');
      expect(result[0].utcIso).toBe('2026-10-04T14:05:00.000Z');
      expect(result[0].timeJst).toBe('23:05');
    });
  });

  describe('FranceRaceTimeFetcher & updateRaceTimes 統合', () => {
    let tempDir: string;
    let tempRacesFile: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'france-time-test-'));
      tempRacesFile = path.join(tempDir, 'races.json');
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('getFranceUpcomingWindowRange が基準日から7日間の期間を算出すること', () => {
      const { startDate, endDate } = getFranceUpcomingWindowRange('2026-09-20', 7);
      expect(startDate).toBe('2026-09-20');
      expect(endDate).toBe('2026-09-26');
    });

    it('updateRaceTimes でフランス重賞の未確定時刻が確定値へ更新されること', async () => {
      const initialRaces: RaceOutput[] = [
        {
          id: '2026-france-g3-sample',
          organization: 'france_galop',
          country_code: 'FR',
          name: {
            ja: 'シェーヌ賞',
            en: 'Prix des Chenes',
            fr: 'Prix des Chênes',
          },
          grade: 'G3',
          date: '2026-09-21',
          start_time: '2026-09-21T13:00:00.000Z',
          is_time_confirmed: false,
          course: { ja: 'シャンティイ', en: 'Chantilly' },
          distance: 1600,
          track_type: 'turf',
          sex_constraint: 'colt_and_filly',
          age_constraint: '2yo',
          handicap: { code: 'set_weight', ja: '馬齢', en: 'Special Weight' },
        },
      ];

      fs.writeFileSync(tempRacesFile, JSON.stringify(initialRaces, null, 2), 'utf-8');

      const fixtures: Record<string, PmuProgrammeResponse> = {
        '21092026': {
          programme: {
            reunions: [
              {
                hippodrome: { libelleCourt: 'CHANTILLY' },
                courses: [
                  {
                    numOrdre: 2,
                    libelle: "PRIX DES CHENES - TATTERSALLS",
                    heureDepart: Date.parse('2026-09-21T12:02:00.000Z'),
                  },
                ],
              },
            ],
          },
        },
      };

      const franceFetcher = new FranceRaceTimeFetcher({ fixtures });

      const result = await updateRaceTimes({
        filePath: tempRacesFile,
        referenceDate: '2026-09-21',
        organization: 'france_galop',
        fetchers: { france_galop: franceFetcher },
      });

      expect(result.updatedRaces).toHaveLength(1);
      expect(result.updatedRaces[0].id).toBe('2026-france-g3-sample');
      expect(result.updatedRaces[0].newTime).toBe('2026-09-21T12:02:00.000Z');

      const updatedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(tempRacesFile, 'utf-8'));
      expect(updatedRaces[0].is_time_confirmed).toBe(true);
      expect(updatedRaces[0].start_time).toBe('2026-09-21T12:02:00.000Z');
    });
  });
});
