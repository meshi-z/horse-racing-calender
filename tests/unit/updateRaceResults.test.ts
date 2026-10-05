import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getTargetPastRacesForResults,
  updateRaceResults,
  JraRaceResultFetcher,
} from '../../scripts/update-race-results';
import {
  parseJraRaceResultHtml,
  buildJraRaceWinner,
  parseAccessSTopHtml,
  parseMeetingRacesHtml,
} from '../../scripts/lib/jra-results';
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

    it('JRAデータベース (accessS.html?CNAME=...) の結果テーブルから1着馬情報をパースできること', () => {
      const mockDbHtml = `
        <div class="result_block">
          <h1 class="race_name">毎日王冠</h1>
          <table class="result_table">
            <tr>
              <th>着順</th><th>枠</th><th>馬番</th><th>馬名</th><th>性齢</th><th>負担重量</th><th>騎手名</th><th>タイム</th>
            </tr>
            <tr>
              <td>1</td><td>1</td><td class="num">1</td><td class="horse">セイウンハーデス</td><td>牡7</td><td>57.0</td><td class="jockey">幸 英明</td><td class="time">1:45.5</td>
            </tr>
            <tr>
              <td>2</td><td>7</td><td class="num">13</td><td class="horse">ホウオウビスケッツ</td><td>牡6</td><td>57.0</td><td class="jockey">岩田 康誠</td><td class="time">1:45.5</td>
            </tr>
          </table>
        </div>
      `;

      const parsed = parseJraRaceResultHtml(mockDbHtml);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].winner.horseName).toBe('セイウンハーデス');
      expect(parsed[0].winner.horseNumber).toBe(1);
      expect(parsed[0].winner.jockey).toBe('幸 英明');
      expect(parsed[0].winner.time).toBe('1:45.5');
    });
  });

  describe('parseAccessSTopHtml & parseMeetingRacesHtml (JRA公式DB accessS)', () => {
    it('accessS.html トップから開催日と開催場のCNAME一覧を抽出できること', () => {
      const mockTopHtml = `
        <div class="panel">
          <h3 class="sub_header">10月4日（日曜）</h3>
          <div class="content">
            <a href="#" onclick="return doAction('/JRADB/accessS.html', 'pw01srl10052026040220261004/7D');">4回東京2日</a>
            <a href="#" onclick="return doAction('/JRADB/accessS.html', 'pw01srl10082026040220261004/5B');">4回京都2日</a>
          </div>
        </div>
      `;

      const meetings = parseAccessSTopHtml(mockTopHtml);
      expect(meetings).toHaveLength(2);
      expect(meetings[0].date).toBe('20261004');
      expect(meetings[0].courseJa).toBe('東京');
      expect(meetings[0].cname).toBe('pw01srl10052026040220261004/7D');

      expect(meetings[1].date).toBe('20261004');
      expect(meetings[1].courseJa).toBe('京都');
      expect(meetings[1].cname).toBe('pw01srl10082026040220261004/5B');
    });

    it('開催場全レースHTMLから各レースの成績詳細CNAMEを抽出できること', () => {
      const mockMeetingHtml = `
        <table>
          <tr>
            <th scope="row" class="race_num"><a href="/JRADB/accessS.html?CNAME=pw01sde1005202604021120261004/60"><img alt="11レース" /></a></th>
            <td class="race_name">
              <div class="stakes">毎日王冠<span class="grade_icon">GII</span></div>
            </td>
          </tr>
        </table>
      `;

      const races = parseMeetingRacesHtml(mockMeetingHtml);
      expect(races).toHaveLength(1);
      expect(races[0].raceNumber).toBe(11);
      expect(races[0].raceName).toBe('毎日王冠');
      expect(races[0].detailCname).toBe('pw01sde1005202604021120261004/60');
    });

    it('JraRaceResultFetcherがaccessS.htmlの多層リクエストを解決して勝ち馬を取得できること', async () => {
      const mockTopHtml = `
        <div class="panel">
          <h3 class="sub_header">10月4日（日曜）</h3>
          <div class="content">
            <a href="#" onclick="return doAction('/JRADB/accessS.html', 'pw01srl10052026040220261004/7D');">4回東京2日</a>
          </div>
        </div>
      `;

      const mockMeetingHtml = `
        <table>
          <tr>
            <th scope="row" class="race_num"><a href="/JRADB/accessS.html?CNAME=pw01sde1005202604021120261004/60"><img alt="11レース" /></a></th>
            <td class="race_name">
              <div class="stakes">毎日王冠<span class="grade_icon">GII</span></div>
            </td>
          </tr>
        </table>
      `;

      const mockDetailHtml = `
        <div class="result_block">
          <h1 class="race_name">毎日王冠</h1>
          <table class="result_table">
            <tr>
              <th>着順</th><th>枠</th><th>馬番</th><th>馬名</th><th>性齢</th><th>負担重量</th><th>騎手名</th><th>タイム</th>
            </tr>
            <tr>
              <td>1</td><td>1</td><td class="num">1</td><td class="horse">セイウンハーデス</td><td>牡7</td><td>57.0</td><td class="jockey">幸 英明</td><td class="time">1:45.5</td>
            </tr>
          </table>
        </div>
      `;

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        const body = typeof init?.body === 'string' ? init.body : '';
        if (body.includes('cname=pw01sli00%2FAF') || body.includes('cname=pw01sli00/AF')) {
          return new Response(Buffer.from(mockTopHtml, 'utf-8'));
        }
        if (body.includes('pw01srl10052026040220261004')) {
          return new Response(Buffer.from(mockMeetingHtml, 'utf-8'));
        }
        if (url.includes('pw01sde1005202604021120261004')) {
          return new Response(Buffer.from(mockDetailHtml, 'utf-8'));
        }
        return new Response('Not found', { status: 404 });
      });

      try {
        const fetcher = new JraRaceResultFetcher();
        const targets: RaceOutput[] = [
          {
            id: '2026-jra-g2-29',
            organization: 'jra',
            name: { ja: '毎日王冠', en: 'Mainichi Okan' },
            grade: 'G2',
            date: '2026-10-04',
            start_time: '2026-10-04T06:45:00.000Z',
            is_time_confirmed: true,
            course: { ja: '東京', en: 'Tokyo' },
            distance: 1800,
            track_type: 'turf',
            sex_constraint: 'none',
            age_constraint: '3yo_and_up',
            handicap: { code: 'set_weight', ja: '別定', en: 'Set Weight' },
          },
        ];

        const records = await fetcher.fetchResultRecords(targets);
        expect(records.size).toBe(1);
        const record = records.get('2026-jra-g2-29');
        expect(record).toBeDefined();
        expect(record?.winner.name.ja).toBe('セイウンハーデス');
        expect(record?.winner.jockey?.ja).toBe('幸 英明');
        expect(record?.winner.horse_number).toBe(1);
        expect(record?.winner.time).toBe('1:45.5');
      } finally {
        globalThis.fetch = originalFetch;
      }
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

    it('NarRaceResultFetcher経由で公式リザルトを取得し、空値原則（Null Value Principle）が適用されること (Issue #167)', async () => {
      const narRace: RaceOutput = {
        id: '2026-nar-jpn2-08',
        organization: 'nar',
        country_code: 'JP',
        name: { ja: '日本テレビ盃', en: 'Nippon TV Hai' },
        grade: 'Jpn2',
        date: '2026-09-30',
        start_time: '2026-09-30T11:05:00.000Z',
        is_time_confirmed: true,
        course: { ja: '船橋', en: 'Funabashi' },
        distance: 1800,
        track_type: 'dirt',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: { code: 'set_weight', ja: '別定', en: 'Set Weight' },
      };

      fs.writeFileSync(tmpRacesPath, JSON.stringify([narRace], null, 2), 'utf8');

      const narFixtureHtml = `
        <section class="raceTitle">
          <h3>第７３回 日本テレビ盃（指定交流）JpnII３上オープン</h3>
        </section>
        <table>
          <tr>
            <td class="order">1</td>
            <td class="num">7</td>
            <td class="horse">ミッキーファイト</td>
            <td class="jockey">戸崎圭<span>（JRA）</span></td>
            <td class="time">1:52.1</td>
          </tr>
        </table>
      `;

      const { NarRaceResultFetcher } = await import('../../scripts/update-race-results');
      const fetcher = new NarRaceResultFetcher({
        fixtures: {
          '2026-nar-jpn2-08': narFixtureHtml,
        },
      });

      const result = await updateRaceResults({
        racesPath: tmpRacesPath,
        winnersMasterPath: tmpWinnersMasterPath,
        refDate: '2026-09-30',
        refTimeIso: '2026-09-30T11:30:00.000Z',
        providers: [fetcher],
      });

      expect(result.updatedCount).toBe(1);
      const updated = result.updatedRaces[0].winner;
      expect(updated.name.ja).toBe('ミッキーファイト');
      expect(updated.name.en).toBeUndefined(); // 空値原則 (Null Value Principle)
      expect(updated.jockey?.ja).toBe('戸崎圭太'); // 所属タグ除去 & 正規化
      expect(updated.jockey?.en).toBeUndefined();
      expect(updated.horse_number).toBe(7);
      expect(updated.time).toBe('1:52.1');
    });

    it('HkjcRaceResultFetcher経由で香港公式リザルトを取得し、中国語(zh)馬名および英語(en)馬名が保存されること (Issue #167)', async () => {
      const hkRace: RaceOutput = {
        id: '2026-hk-g1-01',
        organization: 'hkjc',
        country_code: 'HK',
        name: { ja: '香港スプリント', en: 'Hong Kong Sprint', zh: '香港短途錦標' } as any,
        grade: 'G1',
        date: '2026-12-13',
        start_time: '2026-12-13T06:40:00.000Z',
        is_time_confirmed: true,
        course: { ja: '沙田', en: 'Sha Tin' },
        distance: 1200,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
      };

      fs.writeFileSync(tmpRacesPath, JSON.stringify([hkRace], null, 2), 'utf8');

      const hkFixtureHtml = `
        <table class="table_bd">
          <tr>
            <td>01</td>
            <td>1</td>
            <td>Ka Ying Rising</td>
            <td>Z Purton</td>
            <td>126</td>
            <td>1:08.50</td>
          </tr>
        </table>
      `;

      const { HkjcRaceResultFetcher } = await import('../../scripts/update-race-results');
      const fetcher = new HkjcRaceResultFetcher({
        fixtures: {
          '2026-hk-g1-01': hkFixtureHtml,
        },
      });

      const result = await updateRaceResults({
        racesPath: tmpRacesPath,
        winnersMasterPath: tmpWinnersMasterPath,
        refDate: '2026-12-13',
        refTimeIso: '2026-12-13T07:15:00.000Z',
        providers: [fetcher],
      });

      expect(result.updatedCount).toBe(1);
      const updated = result.updatedRaces[0].winner;
      expect(updated.name.en).toBe('Ka Ying Rising');
      expect(updated.name.zh).toBe('香港短途錦標');
      expect(updated.jockey?.en).toBe('Z Purton');
      expect(updated.horse_number).toBe(1);
      expect(updated.time).toBe('1:08.50');
    });

    it('UsRaceResultFetcher経由で米国公式リザルトを取得し、保存されること (Issue #167)', async () => {
      const usRace: RaceOutput = {
        id: '2026-us-g1-62',
        organization: 'equibase',
        country_code: 'US',
        name: { ja: 'ペンシルベニアダービー', en: 'Pennsylvania Derby' },
        grade: 'G1',
        date: '2026-09-19',
        start_time: '2026-09-19T22:10:00.000Z',
        is_time_confirmed: true,
        course: { ja: 'パークスレーシング', en: 'Parx Racing' },
        distance: 1800,
        track_type: 'dirt',
        sex_constraint: 'none',
        age_constraint: '3yo',
        handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
      };

      fs.writeFileSync(tmpRacesPath, JSON.stringify([usRace], null, 2), 'utf8');

      const usFixtureHtml = `
        <table>
          <tr>
            <td>1st</td>
            <td>The Puma</td>
            <td>J. Castellano</td>
          </tr>
        </table>
      `;

      const { UsRaceResultFetcher } = await import('../../scripts/update-race-results');
      const fetcher = new UsRaceResultFetcher({
        fixtures: {
          '2026-us-g1-62': usFixtureHtml,
        },
      });

      const result = await updateRaceResults({
        racesPath: tmpRacesPath,
        winnersMasterPath: tmpWinnersMasterPath,
        refDate: '2026-09-19',
        refTimeIso: '2026-09-19T23:00:00.000Z',
        providers: [fetcher],
      });

      expect(result.updatedCount).toBe(1);
      const updated = result.updatedRaces[0].winner;
      expect(updated.name.en).toBe('The Puma');
    });

    it('JRA G1レース確定時に公式リザルトURLが official_url に設定されること (Issue #159)', async () => {
      const g1Race: RaceOutput = {
        id: '2026-jra-g1-05',
        organization: 'jra',
        name: { ja: '皐月賞', en: 'Satsuki Sho' },
        grade: 'G1',
        date: '2026-04-19',
        start_time: '2026-04-19T06:40:00.000Z',
        is_time_confirmed: true,
        course: { ja: '中山', en: 'Nakayama' },
        distance: 2000,
        track_type: 'turf',
        sex_constraint: 'colt_and_filly',
        age_constraint: '3yo',
        handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
      };

      fs.writeFileSync(tmpRacesPath, JSON.stringify([g1Race], null, 2), 'utf8');

      const satsukiHtml = `
        <div class="result_block">
          <h2 class="title">第86回 皐月賞</h2>
          <table class="race_table">
            <tbody>
              <tr>
                <td class="order">1</td>
                <td class="num">12</td>
                <td class="horse"><a href="/horse/789">ジャスティンパレス</a></td>
                <td class="jockey"><a href="/jockey/101">川田 将雅</a></td>
                <td class="time">1:59.8</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const fetcher = new JraRaceResultFetcher({
        fixtures: {
          '2026-jra-g1-05': satsukiHtml,
        },
      });

      const tmpOfficialResultsPath = path.join(tmpDir, 'official_results_urls.json');

      const result = await updateRaceResults({
        racesPath: tmpRacesPath,
        winnersMasterPath: tmpWinnersMasterPath,
        officialResultsMasterPath: tmpOfficialResultsPath,
        refDate: '2026-04-19',
        refTimeIso: '2026-04-19T07:15:00.000Z',
        providers: [fetcher],
      });

      expect(result.updatedCount).toBe(1);

      const savedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(tmpRacesPath, 'utf8'));
      expect(savedRaces[0].official_url).toBe('https://www.jra.go.jp/datafile/seiseki/g1/satsuki/result/satsuki2026.html');

      // official_results_urls マスタにも保存されていること
      const savedMaster = JSON.parse(fs.readFileSync(tmpOfficialResultsPath, 'utf8'));
      expect(savedMaster['2026-jra-g1-05']).toBe('https://www.jra.go.jp/datafile/seiseki/g1/satsuki/result/satsuki2026.html');
    });

    it('マスタに未登録の一般重賞（G2/G3等）は結果確定時も official_url は undefined を保持すること (Issue #176)', async () => {
      const g2Race: RaceOutput = {
        id: '2026-jra-g2-04',
        organization: 'jra',
        name: { ja: '京都記念', en: 'Kyoto Kinen' },
        grade: 'G2',
        date: '2026-02-15',
        start_time: '2026-02-15T06:35:00.000Z',
        is_time_confirmed: true,
        course: { ja: '京都', en: 'Kyoto' },
        distance: 2200,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '4yo_and_up',
        handicap: { code: 'set_weight', ja: '別定', en: 'Special Weight' },
      };

      fs.writeFileSync(tmpRacesPath, JSON.stringify([g2Race], null, 2), 'utf8');

      const kyotoHtml = `
        <div class="result_block">
          <h2 class="title">第119回 京都記念</h2>
          <table class="race_table">
            <tbody>
              <tr>
                <td class="order">1</td>
                <td class="num">3</td>
                <td class="horse"><a href="/horse/333">プラダリア</a></td>
                <td class="jockey"><a href="/jockey/222">池添 謙一</a></td>
                <td class="time">2:12.1</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const fetcher = new JraRaceResultFetcher({
        fixtures: {
          '2026-jra-g2-04': kyotoHtml,
        },
      });

      const tmpOfficialResultsPath = path.join(tmpDir, 'official_results_urls.json');
      fs.writeFileSync(tmpOfficialResultsPath, JSON.stringify({}, null, 2), 'utf8');

      const result = await updateRaceResults({
        racesPath: tmpRacesPath,
        winnersMasterPath: tmpWinnersMasterPath,
        officialResultsMasterPath: tmpOfficialResultsPath,
        refDate: '2026-02-15',
        refTimeIso: '2026-02-15T07:15:00.000Z',
        providers: [fetcher],
      });

      expect(result.updatedCount).toBe(1);

      const savedRaces: RaceOutput[] = JSON.parse(fs.readFileSync(tmpRacesPath, 'utf8'));
      expect(savedRaces[0].winner?.name.ja).toBe('プラダリア');
      // デッドリンク防止のため、未検証レースは official_url が付与されない
      expect(savedRaces[0].official_url).toBeUndefined();
    });
  });
});
