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
        expect(race.winner.name.zh).toBe(masterWinner.name.zh);
        if (masterWinner.jockey) {
          expect(race.winner.jockey?.ja).toBe(masterWinner.jockey.ja);
          expect(race.winner.jockey?.en).toBe(masterWinner.jockey.en);
          expect(race.winner.jockey?.zh).toBe(masterWinner.jockey.zh);
        }
      }
    }
  });

  it('香港競馬（HKJC）全24レースの勝者データに公式中文（繁体字・zh）馬名および騎手名が正しく設定されていること (Issue #161)', () => {
    const hkWinnerIds = Object.keys(winners).filter((id) => id.startsWith('2026-hk-'));
    expect(hkWinnerIds.length).toBe(24);

    for (const id of hkWinnerIds) {
      const winner = winners[id];
      expect(winner.name.zh, `HK race ${id} missing name.zh`).toBeDefined();
      expect(winner.name.zh.length).toBeGreaterThan(0);
      expect(winner.jockey?.zh, `HK race ${id} missing jockey.zh`).toBeDefined();
      expect(winner.jockey?.zh.length).toBeGreaterThan(0);

      // races.json 側も検証
      const race = races.find((r) => r.id === id);
      expect(race?.winner?.name?.zh, `races.json HK race ${id} missing name.zh`).toBe(winner.name.zh);
      expect(race?.winner?.jockey?.zh, `races.json HK race ${id} missing jockey.zh`).toBe(winner.jockey?.zh);
    }

    // 代表的な実在G1馬の中文名ピンポイント検証
    expect(winners['2026-hk-g1-01'].name.zh).toBe('嘉應高昇');
    expect(winners['2026-hk-g1-01'].jockey.zh).toBe('潘頓');
    expect(winners['2026-hk-g1-02'].name.zh).toBe('浪漫勇士');
    expect(winners['2026-hk-g1-02'].jockey.zh).toBe('麥道朗');
    expect(winners['2026-hk-g1-07'].name.zh).toBe('駿步騰飛');
    expect(winners['2026-hk-g1-07'].jockey.zh).toBe('布文');
    expect(winners['2026-hk-g2-02'].name.zh).toBe('金鑽貴人');
    expect(winners['2026-hk-g2-02'].jockey.zh).toBe('梁家俊');
    expect(winners['2026-hk-g3-09'].name.zh).toBe('美麗同享');
    expect(winners['2026-hk-g3-09'].jockey.zh).toBe('莫雷拉');
  });

  it('中間ファイル（src/data/france_real_winners.json 等）に架空ダミー馬名の残骸が存在せず、マスターデータと一致していること (Issue #161)', () => {
    const franceRealWinnersPath = path.resolve('src/data/france_real_winners.json');
    if (fs.existsSync(franceRealWinnersPath)) {
      const franceReal = JSON.parse(fs.readFileSync(franceRealWinnersPath, 'utf-8'));
      const rawContent = JSON.stringify(franceReal);
      expect(rawContent.includes('ボリショイ')).toBe(false);
      expect(rawContent.includes('ドゥリダ')).toBe(false);
      expect(rawContent.includes('プシュケ')).toBe(false);
      expect(rawContent.includes('ハヤザーク')).toBe(false);

      // 実在馬名の存在を確認
      expect(franceReal['2026-france-g1-12']?.name?.en).toBe('Samangan');
    }
  });

  describe('アメリカ競馬（Equibase / Sporting Life）の勝ち馬データ真正性および空値原則検証 (Issue #164)', () => {
    it('公式一次ソースで確認された実在勝ち馬が正しく登録されていること', () => {
      // G1
      expect(winners['2026-us-g1-24']?.name?.en).toBe('Tam Tam');
      expect(winners['2026-us-g1-47']?.name?.en).toBe('Survie');
      expect(winners['2026-us-g1-61']?.name?.en).toBe('Bodacious Bay');
      expect(winners['2026-us-g1-62']?.name?.en).toBe('The Puma');

      // G2
      expect(winners['2026-us-g2-89']?.name?.en).toBe('Kathynmarissa');
      expect(winners['2026-us-g2-96']?.name?.en).toBe('Splendora');
      expect(winners['2026-us-g2-98']?.name?.en).toBe('Stradale');
      expect(winners['2026-us-g2-100']?.name?.en).toBe('Listenupshance');
      expect(winners['2026-us-g2-101']?.name?.en).toBe('Super Corredora');

      // G3
      expect(winners['2026-us-g3-09']?.name?.en).toBe('Nafisa');
      expect(winners['2026-us-g3-17']?.name?.en).toBe('Nitrogen');
      expect(winners['2026-us-g3-77']?.name?.en).toBe('Heroic Move');
      expect(winners['2026-us-g3-99']?.name?.en).toBe('Closethegame Sugar');
      expect(winners['2026-us-g3-102']?.name?.en).toBe('Neat');
      expect(winners['2026-us-g3-108']?.name?.en).toBe('Navajo Warrior');
      expect(winners['2026-us-g3-124']?.name?.en).toBe('Rabeeba');
      expect(winners['2026-us-g3-137']?.name?.en).toBe('Shelzawa');
      expect(winners['2026-us-g3-139']?.name?.en).toBe('Silent Tactic');
    });

    it('日程変更・未開催レースにおいて空値原則（Null Value Principle）が厳格に守られ、winnerが未設定であること', () => {
      // 2026年秋・冬へ開催日程が変更されたレース
      const manOWar = races.find((r) => r.id === '2026-us-g2-46');
      expect(manOWar?.winner, 'Man o\' War S must have no winner (scheduled for 2026-11-28)').toBeUndefined();
      expect(winners['2026-us-g2-46']).toBeUndefined();

      const brooklyn = races.find((r) => r.id === '2026-us-g2-59');
      expect(brooklyn?.winner, 'Brooklyn S must have no winner (scheduled for 2026-12-05)').toBeUndefined();
      expect(winners['2026-us-g2-59']).toBeUndefined();

      // 開催延期レース（Delaware H: 2026-10-03 発走前）
      const delawareH = races.find((r) => r.id === '2026-us-g3-138');
      expect(delawareH?.winner, 'Delaware H must have no winner before running').toBeUndefined();
      expect(winners['2026-us-g3-138']).toBeUndefined();

      // 2026年不開催（Cougar II S）
      const cougarII = races.find((r) => r.id === '2026-us-g3-113');
      expect(cougarII?.winner, 'Cougar II S was not run in 2026 and must have no winner').toBeUndefined();
      expect(winners['2026-us-g3-113']).toBeUndefined();
    });
  });

  describe('日本テレビ盃（2026-nar-jpn2-08）の公式確定結果および空値原則検証 (Issue #167)', () => {
    it('日本テレビ盃の勝ち馬（ミッキーファイト）、騎手、着順、タイムが正確に登録され、英語名は未設定であること', () => {
      const winner = winners['2026-nar-jpn2-08'];
      expect(winner).toBeDefined();
      expect(winner.name.ja).toBe('ミッキーファイト');
      expect(winner.name.en, 'NAR winner must not have fabricated en name').toBeUndefined();
      expect(winner.jockey?.ja).toBe('戸崎圭太');
      expect(winner.jockey?.en).toBeUndefined();
      expect(winner.horse_number).toBe(7);
      expect(winner.time).toBe('1:52.1');

      // races.json 側も検証
      const race = races.find((r) => r.id === '2026-nar-jpn2-08');
      expect(race).toBeDefined();
      expect(race?.winner).toBeDefined();
      expect(race?.winner?.name.ja).toBe('ミッキーファイト');
      expect(race?.winner?.name.en).toBeUndefined();
      expect(race?.winner?.jockey?.ja).toBe('戸崎圭太');
      expect(race?.winner?.jockey?.en).toBeUndefined();
      expect(race?.winner?.horse_number).toBe(7);
      expect(race?.winner?.time).toBe('1:52.1');
    });
  });
});
