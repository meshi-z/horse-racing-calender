import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import {
  parseNarDateToYmd,
  parseNarTimeToHhMm,
  parseDirtGradeRacelistHtml,
  fetchNarConfirmedRaceTimes,
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
  });
});
