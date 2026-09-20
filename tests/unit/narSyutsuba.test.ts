import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import {
  parseNarDateToYmd,
  parseNarTimeToHhMm,
  parseDirtGradeRacelistHtml,
  fetchNarConfirmedRaceTimes,
  NAR_BABA_CODES,
  cleanNarRaceName,
  parseNarRaceListHtml,
} from '../../scripts/lib/nar-syutsuba';

describe('nar-syutsuba utility', () => {
  describe('parseNarDateToYmd', () => {
    it('全桁年月日からYYYY-MM-DDをパースできること', () => {
      expect(parseNarDateToYmd('2026年9月22日(休火)')).toBe('2026-09-22');
      expect(parseNarDateToYmd('2026年2月11日（祝水）')).toBe('2026-02-11');
    });

    it('月日文字列から基準年を用いてYYYY-MM-DDをパースできること', () => {
      expect(parseNarDateToYmd('2月11日(祝水)', 2026)).toBe('2026-02-11');
      expect(parseNarDateToYmd('10月7日(水)', 2026)).toBe('2026-10-07');
    });

    it('不正な日付文字列の場合はnullを返すこと', () => {
      expect(parseNarDateToYmd('未定')).toBeNull();
      expect(parseNarDateToYmd('')).toBeNull();
    });
  });

  describe('parseNarTimeToHhMm', () => {
    it('発走付き文字列からHH:mmを抽出できること', () => {
      expect(parseNarTimeToHhMm('20:05発走')).toBe('20:05');
      expect(parseNarTimeToHhMm('18:00発走予定')).toBe('18:00');
      expect(parseNarTimeToHhMm('16:35')).toBe('16:35');
      expect(parseNarTimeToHhMm('船橋 左1800m 20:05発走')).toBe('20:05');
      expect(parseNarTimeToHhMm('金沢 右2100m 16:25発走予定')).toBe('16:25');
    });

    it('時刻が含まれない文字列の場合はnullを返すこと', () => {
      expect(parseNarTimeToHhMm('船橋 左1800m')).toBeNull();
      expect(parseNarTimeToHhMm('')).toBeNull();
    });
  });

  describe('parseDirtGradeRacelistHtml', () => {
    const fixturePath = path.resolve(__dirname, '../fixtures/nar_racelist_2026.html');
    const sampleHtml = fs.readFileSync(fixturePath, 'utf-8');

    it('フィクスチャからダートグレード競走の発走予定時刻を正しくパースできること', () => {
      const results = parseDirtGradeRacelistHtml(sampleHtml, 2026);
      expect(results.length).toBeGreaterThan(10);

      // クイーン賞 (2026-02-11, 20:05)
      const queensho = results.find((r) => r.raceName.includes('クイーン賞'));
      expect(queensho).toBeDefined();
      expect(queensho?.date).toBe('2026-02-11');
      expect(queensho?.timeJst).toBe('20:05');

      // 佐賀記念 (2026-02-12, 19:30)
      const sagakinen = results.find((r) => r.raceName.includes('佐賀記念'));
      expect(sagakinen).toBeDefined();
      expect(sagakinen?.date).toBe('2026-02-12');
      expect(sagakinen?.timeJst).toBe('19:30');

      // かしわ記念 (2026-05-05, 20:05)
      const kashiwa = results.find((r) => r.raceName.includes('かしわ記念'));
      expect(kashiwa).toBeDefined();
      expect(kashiwa?.date).toBe('2026-05-05');
      expect(kashiwa?.timeJst).toBe('20:05');

      // 白山大賞典 (2026-09-22, 18:00)
      const hakusan = results.find((r) => r.raceName.includes('白山大賞典'));
      expect(hakusan).toBeDefined();
      expect(hakusan?.date).toBe('2026-09-22');
      expect(hakusan?.timeJst).toBe('18:00');

      // JBCクラシック (2026-11-03, 16:25)
      const jbcClassic = results.find((r) => r.raceName.includes('JBCクラシック'));
      expect(jbcClassic).toBeDefined();
      expect(jbcClassic?.date).toBe('2026-11-03');
      expect(jbcClassic?.timeJst).toBe('16:25');
    });
  });

  describe('NAR_BABA_CODES and cleanNarRaceName', () => {
    it('主要地方競馬場の競馬場コードが正しく定義されていること', () => {
      expect(NAR_BABA_CODES['金沢']).toBe(22);
      expect(NAR_BABA_CODES['大井']).toBe(20);
      expect(NAR_BABA_CODES['船橋']).toBe(19);
      expect(NAR_BABA_CODES['浦和']).toBe(18);
      expect(NAR_BABA_CODES['川崎']).toBe(21);
      expect(NAR_BABA_CODES['帯広']).toBe(3);
      expect(NAR_BABA_CODES['門別']).toBe(36);
      expect(NAR_BABA_CODES['盛岡']).toBe(10);
      expect(NAR_BABA_CODES['園田']).toBe(27);
      expect(NAR_BABA_CODES['高知']).toBe(31);
      expect(NAR_BABA_CODES['佐賀']).toBe(32);
    });

    it('cleanNarRaceNameで格付け表記（JpnIII, S1等）が適切に除去されること', () => {
      expect(cleanNarRaceName('白山大賞典JpnIII')).toBe('白山大賞典');
      expect(cleanNarRaceName('東京盃JpnII')).toBe('東京盃');
      expect(cleanNarRaceName('ゴールドカップS1')).toBe('ゴールドカップ');
      expect(cleanNarRaceName('かしわ記念(JpnI)')).toBe('かしわ記念');
    });
  });

  describe('parseNarRaceListHtml', () => {
    const kanazawaFixturePath = path.resolve(
      __dirname,
      '../fixtures/nar_racelist_kanazawa_20260922.html'
    );
    const sampleHtml = fs.readFileSync(kanazawaFixturePath, 'utf-8');

    it('金沢競馬場出馬表フィクスチャから白山大賞典の発走時刻を正しく抽出できること', () => {
      const results = parseNarRaceListHtml(sampleHtml, '2026-09-22');
      expect(results.length).toBeGreaterThan(5);

      const hakusan = results.find((r) => r.raceName === '白山大賞典');
      expect(hakusan).toBeDefined();
      expect(hakusan?.date).toBe('2026-09-22');
      expect(hakusan?.timeJst).toBe('18:00');
      expect(hakusan?.rawTime).toBe('18:00発走');
      expect(hakusan?.sourceUrl).toContain('DebaTable');
      expect(hakusan?.sourceUrl).toContain('k_babaCode=22');
    });

    it('同一出馬表内の特別競走なども抽出できること', () => {
      const results = parseNarRaceListHtml(sampleHtml, '2026-09-22');
      // 10R: 楽天ポイントが貯まる！楽天競馬特別Ａ１二 (17:20)
      const r10 = results.find((r) => r.timeJst === '17:20');
      expect(r10).toBeDefined();
    });
  });

  describe('fetchNarConfirmedRaceTimes', () => {
    it('ローカルフィクスチャが指定された場合に確実に結果を返すこと', async () => {
      const fixturePath = path.resolve(__dirname, '../fixtures/nar_racelist_2026.html');
      const results = await fetchNarConfirmedRaceTimes({
        year: 2026,
        localFixturePath: fixturePath,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('raceName');
      expect(results[0]).toHaveProperty('timeJst');
      expect(results[0]).toHaveProperty('date');
    });

    it('targetRacesと出馬表フィクスチャが指定された場合に出馬表確定時刻をマージすること', async () => {
      const fixturePath = path.resolve(__dirname, '../fixtures/nar_racelist_2026.html');
      const kanazawaFixture = path.resolve(
        __dirname,
        '../fixtures/nar_racelist_kanazawa_20260922.html'
      );

      const results = await fetchNarConfirmedRaceTimes({
        year: 2026,
        localFixturePath: fixturePath,
        raceListFixtures: {
          '2026-09-22_22': kanazawaFixture,
        },
        targetRaces: [
          {
            date: '2026-09-22',
            course: { ja: '金沢' },
            name: { ja: '白山大賞典' },
          },
        ],
      });

      const hakusan = results.find((r) => r.raceName === '白山大賞典');
      expect(hakusan).toBeDefined();
      expect(hakusan?.date).toBe('2026-09-22');
      expect(hakusan?.timeJst).toBe('18:00');
    });
  });
});

