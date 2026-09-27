import { describe, it, expect } from 'vitest';
import { extractRaceWinnersMap } from '../../scripts/parse-races';

describe('parse-races race winner preservation', () => {
  it('winner を持つレースのみ抽出し、ID および 日付_レース名 をキーとするマップを生成すること', () => {
    const existingRaces = [
      {
        id: '2026-jra-g1-10',
        name: { ja: '日本ダービー' },
        date: '2026-05-31',
        winner: {
          name: { ja: 'ダノンデサイル', en: 'Danon Decile' },
          jockey: { ja: '横山典弘', en: 'Norihiro Yokoyama' },
          horse_number: 5,
          time: '2:24.3',
        },
      },
      {
        id: '2026-jra-g1-24',
        name: { ja: '有馬記念' },
        date: '2026-12-27',
        // winner なし
      },
    ];

    const map = extractRaceWinnersMap(existingRaces);

    // 有馬記念（winner なし）は含まれない
    expect(map.has('2026-jra-g1-24')).toBe(false);
    expect(map.has('2026-12-27_有馬記念')).toBe(false);

    // 日本ダービー（winner あり）はIDでも 日付_レース名 でも取得可能
    expect(map.has('2026-jra-g1-10')).toBe(true);
    expect(map.get('2026-jra-g1-10')?.name.ja).toBe('ダノンデサイル');
    expect(map.has('2026-05-31_日本ダービー')).toBe(true);
    expect(map.get('2026-05-31_日本ダービー')?.name.ja).toBe('ダノンデサイル');
  });

  it('winner が空オブジェクトまたは name を持たない場合は除外されること', () => {
    const invalidRaces = [
      {
        id: '2026-jra-g1-01',
        name: { ja: 'フェブラリーステークス' },
        date: '2026-02-22',
        winner: {} as any,
      },
    ];

    const map = extractRaceWinnersMap(invalidRaces);
    expect(map.has('2026-jra-g1-01')).toBe(false);
  });
});
