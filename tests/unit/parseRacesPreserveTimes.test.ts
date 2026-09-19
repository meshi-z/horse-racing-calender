import { describe, it, expect } from 'vitest';
import { extractConfirmedRaceTimesMap } from '../../scripts/parse-races';

describe('parse-races confirmed race time preservation', () => {
  it('is_time_confirmed が true のレースのみ抽出し、ID および 日付_レース名 をキーとするマップを生成すること', () => {
    const existingRaces = [
      {
        id: '2026-jra-jg3-04',
        name: { ja: '阪神ジャンプステークス' },
        date: '2026-09-19',
        start_time: '2026-09-19T02:20:00.000Z',
        is_time_confirmed: true,
      },
      {
        id: '2026-jra-g2-26',
        name: { ja: '産経賞オールカマー' },
        date: '2026-09-20',
        start_time: '2026-09-20T06:45:00.000Z',
        is_time_confirmed: true,
      },
      {
        id: '2026-jra-g1-10',
        name: { ja: '有馬記念' },
        date: '2026-12-27',
        start_time: '2026-12-27T06:40:00.000Z',
        is_time_confirmed: false,
      },
    ];

    const map = extractConfirmedRaceTimesMap(existingRaces);

    // 有馬記念（未確定）は含まれない
    expect(map.has('2026-jra-g1-10')).toBe(false);
    expect(map.has('2026-12-27_有馬記念')).toBe(false);

    // 阪神ジャンプステークス（確定済み）はIDでも 日付_レース名 でも取得可能
    expect(map.has('2026-jra-jg3-04')).toBe(true);
    expect(map.get('2026-jra-jg3-04')).toEqual({
      start_time: '2026-09-19T02:20:00.000Z',
      is_time_confirmed: true,
    });
    expect(map.has('2026-09-19_阪神ジャンプステークス')).toBe(true);
    expect(map.get('2026-09-19_阪神ジャンプステークス')).toEqual({
      start_time: '2026-09-19T02:20:00.000Z',
      is_time_confirmed: true,
    });

    // 産経賞オールカマーも同様
    expect(map.has('2026-jra-g2-26')).toBe(true);
    expect(map.get('2026-jra-g2-26')?.start_time).toBe('2026-09-20T06:45:00.000Z');
  });

  it('空配列または確定済みレースが存在しない場合は空のマップを返すこと', () => {
    const map = extractConfirmedRaceTimesMap([]);
    expect(map.size).toBe(0);

    const mapUnconfirmed = extractConfirmedRaceTimesMap([
      {
        id: '2026-jra-g1-01',
        name: { ja: 'フェブラリーステークス' },
        date: '2026-02-22',
        start_time: '2026-02-22T06:40:00.000Z',
        is_time_confirmed: false,
      },
    ]);
    expect(mapUnconfirmed.size).toBe(0);
  });
});
