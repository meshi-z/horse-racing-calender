import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Data Integrity & Multilingual Winners Audit (Issue #160)', () => {
  const winnersPath = path.resolve('src/data/race_winners.json');
  const racesPath = path.resolve('public/data/races.json');

  const winners: Record<string, any> = JSON.parse(fs.readFileSync(winnersPath, 'utf-8'));
  const races: any[] = JSON.parse(fs.readFileSync(racesPath, 'utf-8'));

  it('NAR（地方競馬・ばんえい競馬）の勝者データに空値原則（Null Value Principle）が適用されていること', () => {
    const narWinnerIds = Object.keys(winners).filter((id) => id.startsWith('2026-nar-'));
    expect(narWinnerIds.length).toBeGreaterThan(0);

    for (const id of narWinnerIds) {
      const winner = winners[id];
      expect(winner.name.ja, `NAR race ${id} must have ja name`).toBeDefined();
      expect(winner.name.en, `NAR race ${id} must NOT have fabricated en name (Null Value Principle)`).toBeUndefined();

      if (winner.jockey) {
        expect(winner.jockey.ja, `NAR race ${id} jockey must have ja name`).toBeDefined();
        expect(winner.jockey.en, `NAR race ${id} jockey must NOT have fabricated en name`).toBeUndefined();
      }
    }
  });

  it('JRA（中央競馬）の勝者データに公式一次ソース以外の推測英名・機械的ローマ字が存在しないこと', () => {
    const jraWinnerIds = Object.keys(winners).filter((id) => id.startsWith('2026-jra-'));
    expect(jraWinnerIds.length).toBeGreaterThan(0);

    for (const id of jraWinnerIds) {
      const winner = winners[id];
      expect(winner.name.ja, `JRA race ${id} must have ja name`).toBeDefined();
      expect(winner.name.en, `JRA race ${id} must NOT have fabricated/romanized en name`).toBeUndefined();

      if (winner.jockey) {
        expect(winner.jockey.ja, `JRA race ${id} jockey must have ja name`).toBeDefined();
        expect(winner.jockey.en, `JRA race ${id} jockey must NOT have fabricated en name`).toBeUndefined();
      }
    }
  });

  it('Issue #160 の直接契機となった銀河賞（2026-nar-local-176）のデータが正確であること', () => {
    const gingaWinner = winners['2026-nar-local-176'];
    expect(gingaWinner).toBeDefined();
    expect(gingaWinner.name.ja).toBe('スターイチバン');
    expect(gingaWinner.name.en).toBeUndefined();
    expect(gingaWinner.jockey?.ja).toBe('阿部優');
    expect(gingaWinner.jockey?.en).toBeUndefined();
    expect(gingaWinner.horse_number).toBe(7);

    // races.json 側も検証
    const gingaRace = races.find((r) => r.id === '2026-nar-local-176');
    expect(gingaRace).toBeDefined();
    expect(gingaRace.winner).toBeDefined();
    expect(gingaRace.winner.name.ja).toBe('スターイチバン');
    expect(gingaRace.winner.name.en).toBeUndefined();
    expect(gingaRace.winner.jockey?.ja).toBe('阿部優');
    expect(gingaRace.winner.jockey?.en).toBeUndefined();
  });

  it('同一の英語馬名が異なる日本語馬名のレースに使い回されていないこと（ダミープール不正の検知）', () => {
    const enNameToJaNames: Record<string, Set<string>> = {};

    for (const winner of Object.values(winners)) {
      const en = winner.name?.en;
      const ja = winner.name?.ja;
      if (!en || !ja) continue;

      if (!enNameToJaNames[en]) {
        enNameToJaNames[en] = new Set();
      }
      enNameToJaNames[en].add(ja);
    }

    const multiAssigned = Object.entries(enNameToJaNames).filter(([_, jaSet]) => jaSet.size > 1);
    expect(multiAssigned, `Found English names assigned to multiple distinct Japanese horses: ${JSON.stringify(multiAssigned)}`).toHaveLength(0);
  });

  it('海外レースを含め、英語フィールドに文字列 "undefined" や漢字が含まれていないこと', () => {
    for (const [id, winner] of Object.entries(winners)) {
      if (winner.name?.en) {
        expect(winner.name.en).not.toBe('undefined');
        // 英数字・記号・ラテン文字のみであることを確認（漢字・全角不可）
        expect(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf]/.test(winner.name.en), `Winner en name contains non-Latin characters in race ${id}: ${winner.name.en}`).toBe(false);
      }
      if (winner.jockey?.en) {
        expect(winner.jockey.en).not.toBe('undefined');
        expect(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef\u4e00-\u9faf]/.test(winner.jockey.en), `Winner en jockey contains non-Latin characters in race ${id}: ${winner.jockey.en}`).toBe(false);
      }
    }
  });

  it('race_winners.json と races.json の勝者データが同期していること', () => {
    for (const race of races) {
      const masterWinner = winners[race.id];
      if (masterWinner) {
        expect(race.winner, `races.json race ${race.id} missing winner`).toBeDefined();
        expect(race.winner.name.ja).toBe(masterWinner.name.ja);
        expect(race.winner.name.en).toBe(masterWinner.name.en);
        if (masterWinner.jockey) {
          expect(race.winner.jockey?.ja).toBe(masterWinner.jockey.ja);
          expect(race.winner.jockey?.en).toBe(masterWinner.jockey.en);
        }
      }
    }
  });
});
