import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getTargetPastRacesForResults,
  updateRaceResults,
  JraRaceResultFetcher,
} from '../../scripts/update-race-results';
import { parseJraRaceResultHtml, buildJraRaceWinner } from '../../scripts/lib/jra-results';
import { parseNarRaceResultHtml, buildNarRaceWinner } from '../../scripts/lib/nar-results';
import {
  parsePmuResultsJson,
  parseSportingLifeResultsJson,
  parseHkjcResultHtml,
} from '../../scripts/lib/foreign-results';
import type { RaceOutput } from '../../scripts/parse-races';

describe('update-race-results', () => {
  let tmpDir: string;
  let tmpRacesPath: string;
  let tmpWinnersMasterPath: string;

  const mockRaces: RaceOutput[] = [
    {
      id: '2026-jra-g1-05',
      organization: 'jra',
      name: { ja: '皐月賞', en: 'Satsuki Sho' },
      grade: 'G1',
      date: '2026-04-19',
      start_time: '2026-04-19T06:40:00.000Z', // 15:40 JST
      is_time_confirmed: true,
      course: { ja: '中山', en: 'Nakayama' },
      distance: 2000,
      track_type: 'turf',
      sex_constraint: 'colt_and_filly',
      age_constraint: '3yo',
      handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
    },
    {
      id: '2026-jra-g1-10',
      organization: 'jra',
      name: { ja: '日本ダービー', en: 'Tokyo Yushun' },
      grade: 'G1',
      date: '2026-05-31',
      start_time: '2026-05-31T06:40:00.000Z', // 15:40 JST
      is_time_confirmed: true,
      course: { ja: '東京', en: 'Tokyo' },
      distance: 2400,
      track_type: 'turf',
      sex_constraint: 'colt_and_filly',
      age_constraint: '3yo',
      handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
    },
    {
      id: '2026-jra-g1-sprinters',
      organization: 'jra',
      name: { ja: 'スプリンターズステークス', en: 'Sprinters Stakes' },
      grade: 'G1',
      date: '2026-09-27',
      start_time: '2026-09-27T06:40:00.000Z', // 15:40 JST
      is_time_confirmed: true,
      course: { ja: '中山', en: 'Nakayama' },
      distance: 1200,
      track_type: 'turf',
      sex_constraint: 'none',
      age_constraint: '3yo_and_up',
      handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
    },
  ];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'update-results-test-'));
    tmpRacesPath = path.join(tmpDir, 'races.json');
    tmpWinnersMasterPath = path.join(tmpDir, 'race_winners.json');
    fs.writeFileSync(tmpRacesPath, JSON.stringify(mockRaces, null, 2), 'utf8');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('getTargetPastRacesForResults (当日中・発走直後ターゲット抽出)', () => {
    it('発走後15分以上経過した当日レースがターゲットに含まれること', () => {
      // スプリンターズS: 2026-09-27T06:40:00.000Z (15:40 JST)
      // 基準時刻: 2026-09-27T07:00:00.000Z (16:00 JST, 20分後)
      const targets = getTargetPastRacesForResults(mockRaces, '2026-09-27', {
        refTimeIso: '2026-09-27T07:00:00.000Z',
      });
      expect(targets.some((r) => r.id === '2026-jra-g1-sprinters')).toBe(true);
    });

    it('発走後10分未満（確定前見込み）のレースは除外されること', () => {
      // 基準時刻: 2026-09-27T06:45:00.000Z (15:45 JST, 5分後)
      const targets = getTargetPastRacesForResults(mockRaces, '2026-09-27', {
        refTimeIso: '2026-09-27T06:45:00.000Z',
      });
      expect(targets.some((r) => r.id === '2026-jra-g1-sprinters')).toBe(false);
    });

    it('勝者が既に登録されているレースは除外され、force: true で含められること', () => {
      const racesWithWinner = JSON.parse(JSON.stringify(mockRaces));
      racesWithWinner[2].winner = { name: { ja: 'ピューロマジック', en: 'Puro Majikku' } };

      const targetsWithoutForce = getTargetPastRacesForResults(racesWithWinner, '2026-09-27', {
        refTimeIso: '2026-09-27T07:00:00.000Z',
      });
      expect(targetsWithoutForce.some((r) => r.id === '2026-jra-g1-sprinters')).toBe(false);

      const targetsWithForce = getTargetPastRacesForResults(racesWithWinner, '2026-09-27', {
        refTimeIso: '2026-09-27T07:00:00.000Z',
        force: true,
      });
      expect(targetsWithForce.some((r) => r.id === '2026-jra-g1-sprinters')).toBe(true);
    });
  });

  describe('parseJraRaceResultHtml & buildJraRaceWinner', () => {
    it('JRA公式の着順テーブルHTMLから1着馬情報・タイム・騎手をパースできること', () => {
      const mockHtml = `
        <div class="result_block">
          <h2 class="title">第58回 スプリンターズステークス</h2>
          <table class="race_table">
            <tbody>
              <tr>
                <td class="order">1</td>
                <td class="waku">8</td>
                <td class="num">16</td>
                <td class="horse"><a href="/horse/123">ピューロマジック</a></td>
                <td class="jockey"><a href="/jockey/456">岩田 望来</a></td>
                <td class="time">1:09.2</td>
              </tr>
              <tr>
                <td class="order">2</td>
                <td class="num">1</td>
                <td class="horse">トウシンマカオ</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const parsed = parseJraRaceResultHtml(mockHtml);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].raceName).toBe('スプリンターズステークス');
      expect(parsed[0].winner.horseName).toBe('ピューロマジック');
      expect(parsed[0].winner.horseNumber).toBe(16);
      expect(parsed[0].winner.jockey).toBe('岩田 望来');
      expect(parsed[0].winner.time).toBe('1:09.2');

      const winnerObj = buildJraRaceWinner(parsed[0].winner);
      expect(winnerObj.name.ja).toBe('ピューロマジック');
      expect(winnerObj.name.en).toBeUndefined();
      expect(winnerObj.jockey?.ja).toBe('岩田 望来');
      expect(winnerObj.jockey?.en).toBeUndefined();
      expect(winnerObj.horse_number).toBe(16);
      expect(winnerObj.time).toBe('1:09.2');
    });
  });

  describe('parseNarRaceResultHtml & buildNarRaceWinner', () => {
    it('NAR公式の競走成績HTMLから1着馬情報をパースできること', () => {
      const mockHtml = `
        <div class="racename">第37回 レディスプレリュード(JpnII)</div>
        <table class="race_table">
          <tr>
            <td class="rank">1</td>
            <td class="waku">5</td>
            <td class="num">5</td>
            <td class="horse">グランブリッジ</td>
            <td class="jockey">川田 将雅</td>
            <td class="time">2:14.2</td>
          </tr>
        </table>
      `;

      const parsed = parseNarRaceResultHtml(mockHtml);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].raceName).toBe('レディスプレリュード');
      expect(parsed[0].winner.horseName).toBe('グランブリッジ');
      expect(parsed[0].winner.horseNumber).toBe(5);
      expect(parsed[0].winner.jockey).toBe('川田 将雅');
      expect(parsed[0].winner.time).toBe('2:14.2');

      const winnerObj = buildNarRaceWinner(parsed[0].winner);
      expect(winnerObj.name.ja).toBe('グランブリッジ');
      expect(winnerObj.name.en).toBeUndefined();
      expect(winnerObj.jockey?.ja).toBe('川田 将雅');
      expect(winnerObj.jockey?.en).toBeUndefined();
      expect(winnerObj.horse_number).toBe(5);
      expect(winnerObj.time).toBe('2:14.2');
    });
  });

  describe('parsePmuResultsJson (France Galop)', () => {
    it('PMUの確定ステータスARRIVEEから1着馬を抽出できること', () => {
      const targetRace: RaceOutput = {
        id: '2026-france-g1-arc',
        organization: 'france_galop',
        name: { ja: '凱旋門賞', en: 'Prix de l\'Arc de Triomphe', fr: 'Prix de l\'Arc de Triomphe' },
        grade: 'G1',
        date: '2026-10-04',
        start_time: '2026-10-04T14:05:00.000Z',
        is_time_confirmed: true,
        course: { ja: 'ロンシャン', en: 'ParisLongchamp' },
        distance: 2400,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
      };

      const mockPmuData = {
        programme: {
          date: 1791100800000,
          reunions: [
            {
              courses: [
                {
                  numOrdre: 5,
                  libelle: "QATAR PRIX DE L'ARC DE TRIOMPHE",
                  statutCourant: 'ARRIVEE',
                  ordreArrivee: [12, 5, 8],
                  participants: [
                    {
                      numPmu: 12,
                      nom: 'SOSIE',
                      driver: 'M. GUYON',
                      place: 1,
                      tempsObtenu: '2\'25"12',
                    },
                    {
                      numPmu: 5,
                      nom: 'LOOK DE VEGA',
                      driver: 'C. SOUMILLON',
                      place: 2,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const results = parsePmuResultsJson(mockPmuData, [targetRace]);
      expect(results.has('2026-france-g1-arc')).toBe(true);
      const winner = results.get('2026-france-g1-arc');
      expect(winner?.name.en).toBe('Sosie');
      expect(winner?.jockey?.en).toBe('M. Guyon');
      expect(winner?.horse_number).toBe(12);
      expect(winner?.time).toBe('2:25.12');
    });
  });

  describe('parseSportingLifeResultsJson (UK / Sporting Life)', () => {
    it('Sporting LifeのOfficialレース結果から1着馬を抽出できること', () => {
      const targetRace: RaceOutput = {
        id: '2026-uk-g1-juddmonte',
        organization: 'bha',
        name: { ja: '英国インターナショナルステークス', en: 'Juddmonte International Stakes' },
        grade: 'G1',
        date: '2026-08-19',
        start_time: '2026-08-19T14:35:00.000Z',
        is_time_confirmed: true,
        course: { ja: 'ヨーク', en: 'York' },
        distance: 2050,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
      };

      const mockMeetings = [
        {
          meeting_summary: { course: { name: 'York' } },
          races: [
            {
              name: 'Juddmonte International Stakes (Group 1)',
              course_name: 'York',
              date: '2026-08-19',
              race_stage: 'Official',
              results: [
                {
                  finish_position: 1,
                  cloth_number: 7,
                  horse_name: 'City Of Troy',
                  jockey_name: 'Ryan Moore',
                  official_winning_time: '2:04.32',
                },
                {
                  finish_position: 2,
                  cloth_number: 3,
                  horse_name: 'Calandagan',
                },
              ],
            },
          ],
        },
      ];

      const results = parseSportingLifeResultsJson(mockMeetings, [targetRace]);
      expect(results.has('2026-uk-g1-juddmonte')).toBe(true);
      const winner = results.get('2026-uk-g1-juddmonte');
      expect(winner?.name.en).toBe('City Of Troy');
      expect(winner?.jockey?.en).toBe('Ryan Moore');
      expect(winner?.horse_number).toBe(7);
      expect(winner?.time).toBe('2:04.32');
    });
  });

  describe('parseHkjcResultHtml (HKJC)', () => {
    it('香港HKJCの結果テーブルから1着馬情報をパースできること', () => {
      const mockHtml = `
        <table class="table_bd">
          <tr>
            <td>01</td>
            <td>1</td>
            <td>Romantic Warrior</td>
            <td>J McDonald</td>
            <td>126</td>
            <td>2:00.00</td>
          </tr>
        </table>
      `;

      const parsed = parseHkjcResultHtml(mockHtml);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].winner.horseNameEn).toBe('Romantic Warrior');
      expect(parsed[0].winner.horseNumber).toBe(1);
      expect(parsed[0].winner.jockey).toBe('J McDonald');
      expect(parsed[0].winner.time).toBe('2:00.00');
    });
  });

  describe('updateRaceResults 統合動作と早期終了ガード', () => {
    it('対象レースが存在しない場合は早期終了（Early Exit）し、ファイル保存を行わないこと', async () => {
      const result = await updateRaceResults({
        racesPath: tmpRacesPath,
        winnersMasterPath: tmpWinnersMasterPath,
        refDate: '2026-01-01', // 該当レースなし
      });

      expect(result.totalTargets).toBe(0);
      expect(result.updatedCount).toBe(0);
    });

    it('JraRaceResultFetcher経由で公式リザルトを取得し、races.jsonとrace_winners.jsonに保存されること', async () => {
      const jraFixtureHtml = `
        <div class="result_block">
          <h2 class="title">第58回 スプリンターズステークス</h2>
          <table class="race_table">
            <tr>
              <td class="order">1</td>
              <td class="num">16</td>
              <td class="horse"><a href="...">ピューロマジック</a></td>
              <td class="jockey"><a href="...">岩田 望来</a></td>
              <td class="time">1:09.2</td>
            </tr>
          </table>
        </div>
      `;

      const fetcher = new JraRaceResultFetcher({
        fixtures: {
          '2026-jra-g1-sprinters': jraFixtureHtml,
        },
      });

      const result = await updateRaceResults({
        racesPath: tmpRacesPath,
        winnersMasterPath: tmpWinnersMasterPath,
        refDate: '2026-09-27',
        refTimeIso: '2026-09-27T07:15:00.000Z', // 16:15 JST
        providers: [fetcher],
      });

      expect(result.updatedCount).toBe(1);
      expect(result.updatedRaces[0].winner.name.ja).toBe('ピューロマジック');

      // races.json の検証
      const savedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(tmpRacesPath, 'utf8'));
      const sprinters = savedRaces.find((r) => r.id === '2026-jra-g1-sprinters');
      expect(sprinters?.winner?.name.ja).toBe('ピューロマジック');
      expect(sprinters?.winner?.horse_number).toBe(16);

      // race_winners.json の検証
      const savedWinners = JSON.parse(fs.readFileSync(tmpWinnersMasterPath, 'utf8'));
      expect(savedWinners['2026-jra-g1-sprinters'].name.ja).toBe('ピューロマジック');
      expect(savedWinners['2026-jra-g1-sprinters'].horse_number).toBe(16);
    });
  });
});
