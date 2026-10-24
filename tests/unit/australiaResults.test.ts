import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  parseAustraliaResultsJson,
  parseBreednetStakesResultsHtml,
  type AustraliaMeetingResultItem,
} from '../../scripts/lib/australia-results';
import {
  AustraliaRaceResultFetcher,
  updateRaceResults,
} from '../../scripts/update-race-results';
import type { RaceOutput } from '../../scripts/parse-races';

describe('Australia Results utility', () => {
  describe('parseAustraliaResultsJson', () => {
    it('オーストラリアレース結果から1着馬情報を抽出し、official_url は付与しないこと (Issue #190)', () => {
      const targetRaces: RaceOutput[] = [
        {
          id: '2026-au-g1-sample-1',
          organization: 'racing_australia',
          country_code: 'AU',
          name: { ja: 'ジ・エベレスト', en: 'The Everest' },
          grade: 'G1',
          date: '2026-10-17',
          start_time: '2026-10-17T05:15:00.000Z',
          is_time_confirmed: true,
          course: { ja: 'ロイヤルランドウィック', en: 'Royal Randwick' },
          distance: 1200,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'weight_for_age', ja: '馬齢', en: 'Weight for Age' },
        },
      ];

      const meetings: AustraliaMeetingResultItem[] = [
        {
          venue: 'Royal Randwick',
          date: '2026-10-17',
          races: [
            {
              raceNumber: 7,
              raceName: 'The TAB Everest',
              winningTime: '1:08.50',
              results: [
                {
                  horseName: 'Ka Ying Rising',
                  jockeyName: 'Zac Purton',
                  horseNumber: 1,
                  finishPosition: 1,
                  time: '1:08.50',
                },
                {
                  horseName: 'I Wish I Win',
                  jockeyName: 'Luke Nolen',
                  horseNumber: 2,
                  finishPosition: 2,
                },
              ],
            },
          ],
        },
      ];

      const resultMap = parseAustraliaResultsJson(meetings, targetRaces);
      expect(resultMap.has('2026-au-g1-sample-1')).toBe(true);

      const winner = resultMap.get('2026-au-g1-sample-1')!;
      expect(winner.name.en).toBe('Ka Ying Rising');
      expect(winner.name.ja).toBe('Ka Ying Rising');
      expect(winner.jockey?.en).toBe('Zac Purton');
      expect(winner.horse_number).toBe(1);
      expect(winner.time).toBe('1:08.50');
      // Issue #190 に準拠し、公式URLプロパティは存在しないこと
      expect((winner as any).official_url).toBeUndefined();
    });

    it('異なる日付や異なる競馬場のレースは誤マッチしないこと', () => {
      const targetRaces: RaceOutput[] = [
        {
          id: '2026-au-g1-sample-2',
          organization: 'racing_australia',
          country_code: 'AU',
          name: { ja: 'コーフィールドカップ', en: 'Caulfield Cup' },
          grade: 'G1',
          date: '2026-10-17',
          start_time: '2026-10-17T06:15:00.000Z',
          is_time_confirmed: true,
          course: { ja: 'コーフィールド', en: 'Caulfield' },
          distance: 2400,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'handicap', ja: 'ハンデ', en: 'Handicap' },
        },
      ];

      // Randwick のデータ
      const meetings: AustraliaMeetingResultItem[] = [
        {
          venue: 'Royal Randwick',
          date: '2026-10-17',
          races: [
            {
              raceNumber: 8,
              raceName: 'Sydney Cup',
              results: [
                {
                  horseName: 'Another Horse',
                  finishPosition: 1,
                },
              ],
            },
          ],
        },
      ];

      const resultMap = parseAustraliaResultsJson(meetings, targetRaces);
      expect(resultMap.size).toBe(0);
    });
  });

  describe('parseBreednetStakesResultsHtml', () => {
    it('Breednet Stakes Results HTML からレース結果を正しくパースすること', () => {
      const sampleHtml = `
      <div class="StakesHeader">Australia Oct 10 - Caulfield: Sportsbet Caulfield Guineas Gr1 1600m</div>
      <table class="table">
        <tbody>
          <tr>
            <td class="horsename">1 <b><a href="/horse/warwoven">Warwoven</a></b> (b c 3 Street Boss - War Flower)</td>
            <td class="jockey"><span class="mobile-only">Rdr: </span>Rachel King 57.0kg</td>
          </tr>
        </tbody>
      </table>
      <div class="StakesHeader">Australia Oct 10 - Caulfield: Might And Power Stakes Gr1 2000m</div>
      <table class="table">
        <tbody>
          <tr>
            <td class="horsename">1 <b><a href="/horse/land-legend">Land Legend</a></b> (b g 5 Galileo - Landfall)</td>
            <td class="jockey"><span class="mobile-only">Rdr: </span>Ethan Brown 59.0kg</td>
          </tr>
        </tbody>
      </table>
      `;

      const targetRaces: RaceOutput[] = [
        {
          id: '2026-au-g1-55',
          organization: 'racing_australia',
          country_code: 'AU',
          name: { ja: 'コーフィールドギニー', en: 'Caulfield Guineas' },
          grade: 'G1',
          date: '2026-10-10',
          start_time: '2026-10-10T06:10:00.000Z',
          is_time_confirmed: true,
          course: { ja: 'コーフィールド', en: 'Caulfield' },
          distance: 1600,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo',
          handicap: { code: 'set_weight', ja: '馬齢', en: 'Set Weights' },
        },
        {
          id: '2026-au-g1-56',
          organization: 'racing_australia',
          country_code: 'AU',
          name: { ja: 'マイトアンドパワーステークス', en: 'Might And Power Stakes' },
          grade: 'G1',
          date: '2026-10-10',
          start_time: '2026-10-10T04:55:00.000Z',
          is_time_confirmed: true,
          course: { ja: 'コーフィールド', en: 'Caulfield' },
          distance: 2000,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'weight_for_age', ja: '馬齢', en: 'Weight for Age' },
        },
      ];

      const meetings = parseBreednetStakesResultsHtml(sampleHtml, 2026);
      expect(meetings.length).toBe(1);
      expect(meetings[0].races.length).toBe(2);

      const resultMap = parseAustraliaResultsJson(meetings, targetRaces);
      expect(resultMap.size).toBe(2);

      const r1 = resultMap.get('2026-au-g1-55');
      expect(r1).toBeDefined();
      expect(r1?.name.en).toBe('Warwoven');
      expect(r1?.jockey?.en).toBe('Rachel King');
      expect((r1 as any)?.official_url).toBeUndefined(); // Issue #190: official_url は undefined を維持

      const r2 = resultMap.get('2026-au-g1-56');
      expect(r2).toBeDefined();
      expect(r2?.name.en).toBe('Land Legend');
      expect(r2?.jockey?.en).toBe('Ethan Brown');
    });

    it('Issue #263: アーカイブ一覧形式（stakes-races）のHTMLからレース結果を正しくパースできること', () => {
      const archiveHtml = `
<div class="stakes-location">Oct 17 - Randwick:</div>
<div class="stakes-racename"><b><a href="/stakes-race-results/result.aspx?v=Randwick&d=2026-10-17&race=King+Charles+III+Stakes">King Charles III Stakes</a> Gr1</b> 1609m</div>
<div class="horsename"><a href="/horse/autumn-glow">Autumn Glow</a></div>
<div class="stakes-location">Oct 21 - Geelong:</div>
<div class="stakes-racename"><b><a href="/stakes-race-results/result.aspx?v=Geelong&d=2026-10-21&race=Ladbrokes+Geelong+Cup">Ladbrokes Geelong Cup</a> Gr3</b> 2400m</div>
<div class="horsename"><a href="/horse/point-of-law">Point Of Law</a></div>
`;
      const meetings = parseBreednetStakesResultsHtml(archiveHtml);
      expect(meetings.length).toBe(2);

      const randwick = meetings.find((m) => m.venue === 'Randwick' && m.date === '2026-10-17');
      expect(randwick).toBeDefined();
      expect(randwick?.races[0].raceName).toBe('King Charles III Stakes');
      expect(randwick?.races[0].results[0].horseName).toBe('Autumn Glow');

      const geelong = meetings.find((m) => m.venue === 'Geelong' && m.date === '2026-10-21');
      expect(geelong).toBeDefined();
      expect(geelong?.races[0].raceName).toBe('Ladbrokes Geelong Cup');
      expect(geelong?.races[0].results[0].horseName).toBe('Point Of Law');
    });

    it('Issue #263: スポンサー冠名や改称名（Caulfield Sprint, Harry White Stakes, Sydney Stakes等）で正しく名寄せできること', () => {
      const meetings: AustraliaMeetingResultItem[] = [
        {
          venue: 'Caulfield',
          date: '2026-10-17',
          races: [
            {
              raceNumber: 1,
              raceName: 'Henley Homes Sprint',
              results: [{ horseName: 'Cavalry Girl', jockeyName: 'Craig Williams', finishPosition: 1 }],
            },
            {
              raceNumber: 2,
              raceName: 'Sportsbet Classic',
              results: [{ horseName: 'King Snitz', jockeyName: 'Damian Lane', finishPosition: 1 }],
            },
            {
              raceNumber: 3,
              raceName: 'Sportsbet Harry White Stakes',
              results: [{ horseName: 'War Machine', jockeyName: 'Mark Zahra', finishPosition: 1 }],
            },
          ],
        },
        {
          venue: 'Royal Randwick',
          date: '2026-10-17',
          races: [
            {
              raceNumber: 4,
              raceName: 'Toyota Forklifts Sydney Stakes',
              results: [{ horseName: 'Grafterburners', jockeyName: 'Nash Rawiller', finishPosition: 1 }],
            },
          ],
        },
      ];

      const targetRaces: RaceOutput[] = [
        {
          id: '2026-au-g2-79',
          organization: 'racing_australia',
          name: { ja: 'コーフィールドスプリント', en: 'Caulfield Sprint' },
          date: '2026-10-17',
          course: { ja: 'コーフィールド', en: 'Caulfield' },
          grade: 'G2',
          start_time: '2026-10-17T04:10:00.000Z',
          is_time_confirmed: true,
          distance: 1000,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'handicap', ja: 'ハンデ', en: 'Handicap' },
        },
        {
          id: '2026-au-g3-135',
          organization: 'racing_australia',
          name: { ja: 'ノーマンロビンソンステークス', en: 'Norman Robinson Stakes' },
          date: '2026-10-17',
          course: { ja: 'コーフィールド', en: 'Caulfield' },
          grade: 'G3',
          start_time: '2026-10-17T04:45:00.000Z',
          is_time_confirmed: true,
          distance: 2000,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo',
          handicap: { code: 'set_weight', ja: '馬齢', en: 'Set Weights' },
        },
        {
          id: '2026-au-g3-136',
          organization: 'racing_australia',
          name: { ja: 'MOONGAステークス', en: 'Moonga Stakes' },
          date: '2026-10-17',
          course: { ja: 'コーフィールド', en: 'Caulfield' },
          grade: 'G3',
          start_time: '2026-10-17T05:25:00.000Z',
          is_time_confirmed: true,
          distance: 1400,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '4yo_and_up',
          handicap: { code: 'special_weight', ja: '別定', en: 'Special Weight' },
        },
        {
          id: '2026-au-g3-132',
          organization: 'racing_australia',
          name: { ja: "CITY TATT'S LIGHTNING", en: "City Tatt's Lightning" },
          date: '2026-10-17',
          course: { ja: 'ロイヤルランドウィック', en: 'Royal Randwick' },
          grade: 'G3',
          start_time: '2026-10-17T04:25:00.000Z',
          is_time_confirmed: true,
          distance: 1200,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'weight_for_age', ja: '馬齢', en: 'Weight for Age' },
        },
      ];

      const resultMap = parseAustraliaResultsJson(meetings, targetRaces);
      expect(resultMap.get('2026-au-g2-79')?.name.en).toBe('Cavalry Girl');
      expect(resultMap.get('2026-au-g3-135')?.name.en).toBe('King Snitz');
      expect(resultMap.get('2026-au-g3-136')?.name.en).toBe('War Machine');
      expect(resultMap.get('2026-au-g3-132')?.name.en).toBe('Grafterburners');
    });

    it('別名（Ladies Day Vase vs Evergreen Turf Vase）および日付・競馬場一致で正しく名寄せできること', () => {
      const sampleHtml = `
      <div class="StakesHeader">Australia Oct 10 - Caulfield: Evergreen Turf Vase Gr3 1600m</div>
      <table class="table">
        <tbody>
          <tr>
            <td class="horsename">1 <b><a href="/horse/surfin-bird">Surfin' Bird</a></b></td>
            <td class="jockey"><span class="mobile-only">Rdr: </span>Jordan Childs 56.0kg</td>
          </tr>
        </tbody>
      </table>
      `;

      const targetRaces: RaceOutput[] = [
        {
          id: '2026-au-g3-128',
          organization: 'racing_australia',
          country_code: 'AU',
          name: { ja: 'レディースデイヴェイス', en: 'Ladies Day Vase' },
          grade: 'G3',
          date: '2026-10-10',
          start_time: '2026-10-10T03:45:00.000Z',
          is_time_confirmed: true,
          course: { ja: 'コーフィールド', en: 'Caulfield' },
          distance: 1600,
          track_type: 'turf',
          sex_constraint: 'filly_and_mare',
          age_constraint: '4yo_and_up',
          handicap: { code: 'set_weight', ja: '別定', en: 'Set Weights with Penalties' },
        },
      ];

      const meetings = parseBreednetStakesResultsHtml(sampleHtml, 2026);
      expect(meetings.length).toBe(1);

      const resultMap = parseAustraliaResultsJson(meetings, targetRaces);
      expect(resultMap.size).toBe(1);
      const r = resultMap.get('2026-au-g3-128');
      expect(r?.name.en).toBe("Surfin' Bird");
      expect(r?.jockey?.en).toBe('Jordan Childs');
    });
  });

  describe('AustraliaRaceResultFetcher & updateRaceResults 統合', () => {
    it('getTargetPastRaces でオーストラリアの終了レースが抽出されること', () => {
      const fetcher = new AustraliaRaceResultFetcher();
      const mockRaces: RaceOutput[] = [
        {
          id: '2026-au-g1-past',
          organization: 'racing_australia',
          name: { ja: 'ゴールデンスリッパー', en: 'Golden Slipper Stakes' },
          grade: 'G1',
          date: '2026-03-21',
          start_time: '2026-03-21T05:45:00.000Z',
          is_time_confirmed: true,
          course: { ja: 'ローズヒルガーデンズ', en: 'Rosehill Gardens' },
          distance: 1200,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '2yo',
          handicap: { code: 'set_weight', ja: '馬齢', en: 'Set Weights' },
        },
        {
          id: '2026-au-g1-future',
          organization: 'racing_australia',
          name: { ja: 'メルボルンカップ', en: 'Melbourne Cup' },
          grade: 'G1',
          date: '2026-11-03',
          start_time: '2026-11-03T04:00:00.000Z',
          is_time_confirmed: false,
          course: { ja: 'フレミントン', en: 'Flemington' },
          distance: 3200,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '3yo_and_up',
          handicap: { code: 'handicap', ja: 'ハンデ', en: 'Handicap' },
        },
      ];

      // 基準日 2026-03-21 のレース発走後
      const targets = fetcher.getTargetPastRaces(mockRaces, '2026-03-21', {
        refTimeIso: '2026-03-21T06:30:00.000Z',
      });
      expect(targets).toHaveLength(1);
      expect(targets[0].id).toBe('2026-au-g1-past');
    });

    it('updateRaceResults でオーストラリア重賞の勝者が更新され、official_url は付与されないこと (Issue #190)', async () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'au-result-test-'));
      const racesPath = path.join(tempDir, 'races.json');
      const winnersPath = path.join(tempDir, 'race_winners.json');

      const initialRaces: RaceOutput[] = [
        {
          id: '2026-au-g1-sample',
          organization: 'racing_australia',
          country_code: 'AU',
          name: { ja: 'ゴールデンスリッパー', en: 'Golden Slipper Stakes' },
          grade: 'G1',
          date: '2026-03-21',
          start_time: '2026-03-21T05:45:00.000Z',
          is_time_confirmed: true,
          course: { ja: 'ローズヒルガーデンズ', en: 'Rosehill Gardens' },
          distance: 1200,
          track_type: 'turf',
          sex_constraint: 'none',
          age_constraint: '2yo',
          handicap: { code: 'set_weight', ja: '馬齢', en: 'Set Weights' },
        },
      ];
      fs.writeFileSync(racesPath, JSON.stringify(initialRaces, null, 2), 'utf8');
      fs.writeFileSync(winnersPath, JSON.stringify({}, null, 2), 'utf8');

      const fixtures: Record<string, AustraliaMeetingResultItem[]> = {
        '2026-03-21': [
          {
            venue: 'Rosehill Gardens',
            date: '2026-03-21',
            races: [
              {
                raceNumber: 7,
                raceName: 'Longines Golden Slipper',
                winningTime: '1:09.60',
                results: [
                  {
                    horseName: 'Guest House',
                    jockeyName: 'Zac Lloyd',
                    horseNumber: 4,
                    finishPosition: 1,
                    time: '1:09.60',
                  },
                ],
              },
            ],
          },
        ],
      };

      const fetcher = new AustraliaRaceResultFetcher({ fixtures });

      await updateRaceResults({
        racesPath,
        winnersMasterPath: winnersPath,
        refDate: '2026-03-21',
        refTimeIso: '2026-03-21T07:00:00.000Z',
        orgFilter: 'racing_australia',
        providers: [fetcher],
      });

      const updatedRaces = JSON.parse(fs.readFileSync(racesPath, 'utf8')) as RaceOutput[];
      expect(updatedRaces).toHaveLength(1);
      const updated = updatedRaces[0];

      expect(updated.winner).toBeDefined();
      expect(updated.winner?.name.en).toBe('Guest House');
      expect(updated.winner?.jockey?.en).toBe('Zac Lloyd');
      expect(updated.winner?.horse_number).toBe(4);
      expect(updated.winner?.time).toBe('1:09.60');
      // Issue #190 に準拠し、公式URLは設定されないこと（undefined）
      expect(updated.official_url).toBeUndefined();

      // race_winners.json にも二重保存されていること
      const savedWinners = JSON.parse(fs.readFileSync(winnersPath, 'utf8'));
      expect(savedWinners['2026-au-g1-sample']).toBeDefined();
      expect(savedWinners['2026-au-g1-sample'].name.en).toBe('Guest House');

      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('オーストラリア実本番勝ち馬データ完全性検証 (Data Integrity)', () => {
    it('開催済み主要豪州G1レースに実在の公式勝ち馬が登録されていること', () => {
      const racesPath = path.resolve(process.cwd(), 'public/data/races.json');
      const races: RaceOutput[] = JSON.parse(fs.readFileSync(racesPath, 'utf8'));

      // 1. ゴールデンスリッパー -> Guest House (Zac Lloyd)
      const slipper = races.find((r) => r.id === '2026-au-g1-13');
      expect(slipper).toBeDefined();
      expect(slipper?.winner?.name.en).toBe('Guest House');
      expect(slipper?.winner?.jockey?.en).toBe('Zac Lloyd');

      // 2. ドンカスターマイル -> Sheza Alibi (Jamie Kah)
      const doncaster = races.find((r) => r.id === '2026-au-g1-22');
      expect(doncaster).toBeDefined();
      expect(doncaster?.winner?.name.en).toBe('Sheza Alibi');
      expect(doncaster?.winner?.jockey?.en).toBe('Jamie Kah');

      // 3. クイーンエリザベスS -> Sir Delius (Craig Williams)
      const qeS = races.find((r) => r.id === '2026-au-g1-26');
      expect(qeS).toBeDefined();
      expect(qeS?.winner?.name.en).toBe('Sir Delius');
      expect(qeS?.winner?.jockey?.en).toBe('Craig Williams');

      // 4. オーストラリアンダービー -> Green Spaces (Rachel King)
      const derby = races.find((r) => r.id === '2026-au-g1-24');
      expect(derby).toBeDefined();
      expect(derby?.winner?.name.en).toBe('Green Spaces');
      expect(derby?.winner?.jockey?.en).toBe('Rachel King');

      // 5. エプソムハンデキャップ -> God's Window (Siena Grima)
      const epsom = races.find((r) => r.id === '2026-au-g1-51');
      expect(epsom).toBeDefined();
      expect(epsom?.winner?.name.en).toBe("God's Window");
      expect(epsom?.winner?.jockey?.en).toBe('Siena Grima');

      // 6. ターンブルS -> Cosmic Crusader (William Pike)
      const turnbull = races.find((r) => r.id === '2026-au-g1-54');
      expect(turnbull).toBeDefined();
      expect(turnbull?.winner?.name.en).toBe('Cosmic Crusader');
      expect(turnbull?.winner?.jockey?.en).toBe('William Pike');

      // 7. official_url が一切付与されていないこと (Issue #190)
      const auRaces = races.filter((r) => r.organization === 'racing_australia');
      expect(auRaces.length).toBeGreaterThan(0);
      for (const r of auRaces) {
        expect(r.official_url).toBeUndefined();
      }
    });

    it('未開催の2026-au-g1-01（CF Orr Stakes）および10月以降のレースは勝者が未設定（undefined）として保護されていること (空値原則)', () => {
      const racesPath = path.resolve(process.cwd(), 'public/data/races.json');
      const races: RaceOutput[] = JSON.parse(fs.readFileSync(racesPath, 'utf8'));

      // CF Orr Stakes: 11月に日程変更されており、未開催のため未設定
      const orr = races.find((r) => r.id === '2026-au-g1-01');
      expect(orr).toBeDefined();
      expect(orr?.winner).toBeUndefined();

      // メルボルンカップ (2026-11-03)
      const melb = races.find((r) => r.id === '2026-au-g1-66');
      expect(melb).toBeDefined();
      expect(melb?.winner).toBeUndefined();

      // ジ・エベレスト (2026-10-17 開催済み -> Tempted)
      const everest = races.find((r) => r.id === '2026-au-g1-58');
      expect(everest).toBeDefined();
      expect(everest?.winner?.name.en).toBe('Tempted');
      expect(everest?.winner?.jockey?.en).toBe('C. Schofield');

      // キングチャールズ3世ステークス (2026-10-17 開催済み -> Autumn Glow)
      const kc3 = races.find((r) => r.id === '2026-au-g1-59');
      expect(kc3).toBeDefined();
      expect(kc3?.winner?.name.en).toBe('Autumn Glow');
      expect(kc3?.winner?.jockey?.en).toBe('J. McDonald');

      // コーフィールドカップ (2026-10-17 開催済み -> Kingswood)
      const caulfieldCup = races.find((r) => r.id === '2026-au-g1-60');
      expect(caulfieldCup).toBeDefined();
      expect(caulfieldCup?.winner?.name.en).toBe('Kingswood');
      expect(caulfieldCup?.winner?.jockey?.en).toBe('John Allen');

      // コックスプレート (2026-10-24 本日未開催・未終了)
      const cox = races.find((r) => r.id === '2026-au-g1-61');
      expect(cox).toBeDefined();
      expect(cox?.winner).toBeUndefined();
    });

    it('Issue #203: オーストラリアG2・G3の開催済み重賞レースに確定勝者が正しくバックフィルされ、未開催レースはundefinedを維持すること', () => {
      const racesPath = path.resolve(process.cwd(), 'public/data/races.json');
      const races: RaceOutput[] = JSON.parse(fs.readFileSync(racesPath, 'utf8'));

      // 1. Perth Cup (G2) -> Apulia
      const perthCup = races.find((r) => r.id === '2026-au-g2-01');
      expect(perthCup).toBeDefined();
      expect(perthCup?.winner?.name.en).toBe('Apulia');

      // 2. La Trice Classic (G3) -> Luvnwar
      const laTrice = races.find((r) => r.id === '2026-au-g3-01');
      expect(laTrice).toBeDefined();
      expect(laTrice?.winner?.name.en).toBe('Luvnwar');

      // 3. Gimcrack Stakes (G3, 2026-10-03) -> Shraddha
      const gimcrack = races.find((r) => r.id === '2026-au-g3-123');
      expect(gimcrack).toBeDefined();
      expect(gimcrack?.winner?.name.en).toBe('Shraddha');

      // 4. Rose of Kingston Stakes (G2, 2026-10-03) -> Stylish
      const roseOfKingston = races.find((r) => r.id === '2026-au-g2-70');
      expect(roseOfKingston).toBeDefined();
      expect(roseOfKingston?.winner?.name.en).toBe('Stylish');

      // 5. Golden Pendant (G2, 2026-09-26) -> Lazzura
      const goldenPendant = races.find((r) => r.id === '2026-au-g2-67');
      expect(goldenPendant).toBeDefined();
      expect(goldenPendant?.winner?.name.en).toBe('Lazzura');

      // 6. Issue #246: 2026-10-10 に開催された11重賞レースに確定勝者が正しく反映されていること
      const caulfieldGuineas = races.find((r) => r.id === '2026-au-g1-55');
      expect(caulfieldGuineas?.winner?.name.en).toBe('Warwoven');
      expect(caulfieldGuineas?.winner?.jockey?.en).toBe('Rachel King');

      const mightAndPower = races.find((r) => r.id === '2026-au-g1-56');
      expect(mightAndPower?.winner?.name.en).toBe('Land Legend');
      expect(mightAndPower?.winner?.jockey?.en).toBe('Ethan Brown');

      const toorakHandicap = races.find((r) => r.id === '2026-au-g1-57');
      expect(toorakHandicap?.winner?.name.en).toBe('Lady Shenandoah');
      expect(toorakHandicap?.winner?.jockey?.en).toBe('J B Mc Donald');

      const ladiesDayVase = races.find((r) => r.id === '2026-au-g3-128');
      expect(ladiesDayVase?.winner?.name.en).toBe("Surfin' Bird");
      expect(ladiesDayVase?.winner?.jockey?.en).toBe('Jordan Childs');

      // 7. 空値原則: 未開催の Sandown Stakes (2026-11-28予定) は winner: undefined
      const sandownStakes = races.find((r) => r.id === '2026-au-g3-121');
      expect(sandownStakes).toBeDefined();
      expect(sandownStakes?.winner).toBeUndefined();

      // 8. Issue #263: 2026-10-17 および 2026-10-21 に開催された全重賞に確定勝者・騎手が反映されていること
      const expectedOct17And21 = [
        { id: '2026-au-g2-78', name: 'Tristarc Stakes', winner: 'Shadhavar', jockey: 'Craig Williams' },
        { id: '2026-au-g2-79', name: 'Caulfield Sprint', winner: 'Cavalry Girl', jockey: 'Craig Williams' },
        { id: '2026-au-g3-130', name: 'Atc St. Leger Stakes', winner: 'So You Are', jockey: 'Tommy Berry' },
        { id: '2026-au-g3-131', name: 'The Silver Eagle', winner: 'Apocalyptic', jockey: 'Tommy Berry' },
        { id: '2026-au-g3-132', name: "City Tatt's Lightning", winner: 'Grafterburners', jockey: 'Nash Rawiller' },
        { id: '2026-au-g3-133', name: 'Angst Quality Handicap', winner: 'Unleeshing', jockey: 'Jason Collett' },
        { id: '2026-au-g3-134', name: 'Reginald Allen Quality', winner: 'Beyond The Reef', jockey: 'Dylan Gibbons' },
        { id: '2026-au-g3-135', name: 'Norman Robinson Stakes', winner: 'King Snitz', jockey: 'Damian Lane' },
        { id: '2026-au-g3-136', name: 'Moonga Stakes', winner: 'War Machine', jockey: 'Mark Zahra' },
        { id: '2026-au-g3-137', name: 'Ethereal Stakes', winner: 'Quick Finish', jockey: 'Jye McNeil' },
        { id: '2026-au-g3-138', name: 'Eurythmic Stakes', winner: 'King Of Light', jockey: 'Lucy Fiore' },
        { id: '2026-au-g3-139', name: 'Geelong Cup', winner: 'Point Of Law', jockey: 'Ethan Brown' },
      ];

      for (const exp of expectedOct17And21) {
        const race = races.find((r) => r.id === exp.id);
        expect(race).toBeDefined();
        expect(race?.winner?.name.en).toBe(exp.winner);
        expect(race?.winner?.jockey?.en).toBe(exp.jockey);
      }

      // 9. 空値原則: 10月24日以降の未開催オーストラリア重賞レースはすべて winner: undefined
      const futureAuRaces = races.filter(
        (r) => r.organization === 'racing_australia' && r.date >= '2026-10-24'
      );
      expect(futureAuRaces.length).toBeGreaterThan(0);
      for (const fr of futureAuRaces) {
        expect(fr.winner).toBeUndefined();
      }
    });
  });
});
