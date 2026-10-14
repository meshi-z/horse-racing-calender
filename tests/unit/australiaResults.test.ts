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

      // ジ・エベレスト (2026-10-17)
      const everest = races.find((r) => r.id === '2026-au-g1-58');
      expect(everest).toBeDefined();
      expect(everest?.winner).toBeUndefined();

      // コックスプレート (2026-10-24)
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

      // 8. 空値原則: 10月15日以降の未開催オーストラリア重賞レースはすべて winner: undefined
      const futureAuRaces = races.filter(
        (r) => r.organization === 'racing_australia' && r.date >= '2026-10-15'
      );
      expect(futureAuRaces.length).toBeGreaterThan(0);
      for (const fr of futureAuRaces) {
        expect(fr.winner).toBeUndefined();
      }
    });
  });
});
