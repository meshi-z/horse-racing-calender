import { describe, it, expect, beforeEach } from 'vitest';
import { useRaceStore, filterRaces, selectFilteredRaces } from '../../src/store/useRaceStore';
import type { Race } from '../../src/types/race';

const mockRaces: Race[] = [
  {
    id: '2026-jra-g3-01',
    organization: 'jra',
    name: {
      ja: 'スポーツニッポン賞京都金杯',
      en: 'Kyoto Kimpai',
    },
    grade: 'G3',
    date: '2026-01-04',
    start_time: '2026-01-04T06:45:00.000Z',
    is_time_confirmed: false,
    course: {
      ja: '京都',
      en: 'Kyoto',
    },
    distance: 1600,
    track_type: 'turf',
    sex_constraint: 'none',
    age_constraint: '4yo_and_up',
    handicap: {
      code: 'set_weight',
      ja: '別定',
      en: 'Set Weight',
    },
  },
  {
    id: '2026-jra-g3-02',
    organization: 'jra',
    name: {
      ja: '日刊スポーツ賞中山金杯',
      en: 'Nakayama Kimpai',
    },
    grade: 'G3',
    date: '2026-01-04',
    start_time: '2026-01-04T06:40:00.000Z',
    is_time_confirmed: false,
    course: {
      ja: '中山',
      en: 'Nakayama',
    },
    distance: 2000,
    track_type: 'turf',
    sex_constraint: 'none',
    age_constraint: '4yo_and_up',
    handicap: {
      code: 'handicap',
      ja: 'ハンデ',
      en: 'Handicap',
    },
  },
  {
    id: '2026-jra-g2-01',
    organization: 'jra',
    name: {
      ja: 'アメリカジョッキークラブカップ',
      en: 'American Jockey Club Cup',
    },
    grade: 'G2',
    date: '2026-01-25',
    start_time: '2026-01-25T06:45:00.000Z',
    is_time_confirmed: false,
    course: {
      ja: '中山',
      en: 'Nakayama',
    },
    distance: 2200,
    track_type: 'turf',
    sex_constraint: 'none',
    age_constraint: '4yo_and_up',
    handicap: {
      code: 'set_weight',
      ja: '別定',
      en: 'Set Weight',
    },
  },
  {
    id: '2026-jra-g1-01',
    organization: 'jra',
    name: {
      ja: 'フェブラリーステークス',
      en: 'February Stakes',
    },
    grade: 'G1',
    date: '2026-02-22',
    start_time: '2026-02-22T06:40:00.000Z',
    is_time_confirmed: false,
    course: {
      ja: '東京',
      en: 'Tokyo',
    },
    distance: 1600,
    track_type: 'dirt',
    sex_constraint: 'none',
    age_constraint: '4yo_and_up',
    handicap: {
      code: 'weight_for_age',
      ja: '定量',
      en: 'Weight for Age',
    },
  },
  {
    id: '2026-jra-jg1-01',
    organization: 'jra',
    name: {
      ja: '中山大障害',
      en: 'Nakayama Daishogai',
    },
    grade: 'J.G1',
    date: '2026-12-26',
    start_time: '2026-12-26T05:45:00.000Z',
    is_time_confirmed: false,
    course: {
      ja: '中山',
      en: 'Nakayama',
    },
    distance: 4100,
    track_type: 'obstacle',
    sex_constraint: 'none',
    age_constraint: '3yo_and_up',
    handicap: {
      code: 'weight_for_age',
      ja: '定量',
      en: 'Weight for Age',
    },
  },
];

describe('useRaceStore & filterRaces', () => {
  beforeEach(() => {
    // Storeを初期状態にリセット
    useRaceStore.getState().resetFilters();
    useRaceStore.getState().setRaces(mockRaces);
    useRaceStore.getState().setViewMode('timeline');
    useRaceStore.getState().setYearMonth({ year: 2026, month: 1 });
  });

  describe('グレード（G1/G2/G3）指定絞り込み', () => {
    it('G1 を指定した場合、G1 レースのみ取得できること', () => {
      useRaceStore.getState().setFilter('grades', ['G1']);
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2026-jra-g1-01');
      expect(results[0].name.ja).toBe('フェブラリーステークス');
    });

    it('G2 と G3 を指定した場合、G2 および G3 のレースが取得できること', () => {
      useRaceStore.getState().setFilter('grades', ['G2', 'G3']);
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(3);
      expect(results.map((r) => r.id)).toEqual([
        '2026-jra-g3-01',
        '2026-jra-g3-02',
        '2026-jra-g2-01',
      ]);
    });

    it('グレード指定が空配列の場合は全レースが対象となること', () => {
      useRaceStore.getState().setFilter('grades', []);
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(5);
    });
  });

  describe('日本語・英語名称キーワード検索 (name.ja, name.en)', () => {
    it('日本語名称の部分一致で絞り込みできること', () => {
      useRaceStore.getState().setFilter('searchQuery', '金杯');
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name.ja)).toContain('スポーツニッポン賞京都金杯');
      expect(results.map((r) => r.name.ja)).toContain('日刊スポーツ賞中山金杯');
    });

    it('英語名称（小文字検索）で大文字小文字を無視して一致すること', () => {
      useRaceStore.getState().setFilter('searchQuery', 'february');
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(1);
      expect(results[0].name.en).toBe('February Stakes');
    });

    it('英語名称の部分一致（"kimpai"）で該当するレースを取得できること', () => {
      useRaceStore.getState().setFilter('searchQuery', 'kimpai');
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(2);
    });

    it('前後の空白を除去して検索できること', () => {
      useRaceStore.getState().setFilter('searchQuery', '   Cup   ');
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(1);
      expect(results[0].name.en).toBe('American Jockey Club Cup');
    });

    it('合致しないキーワードの場合は空配列を返すこと', () => {
      useRaceStore.getState().setFilter('searchQuery', '有馬記念');
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(0);
    });
  });

  describe('年月指定（dateの月指定）絞り込み', () => {
    it('2026年1月を指定した場合、1月のレースのみ取得できること', () => {
      useRaceStore.getState().setFilter('yearMonth', { year: 2026, month: 1 });
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.date.startsWith('2026-01'))).toBe(true);
    });

    it('2026年2月を指定した場合、2月のレースのみ取得できること', () => {
      useRaceStore.getState().setFilter('yearMonth', { year: 2026, month: 2 });
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(1);
      expect(results[0].name.ja).toBe('フェブラリーステークス');
    });

    it('yearMonth が null の場合は年月での除外を行わないこと', () => {
      useRaceStore.getState().setFilter('yearMonth', null);
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(5);
    });
  });

  describe('複数条件の AND 検索', () => {
    it('グレード G3 かつ 競馬場 "中山" かつ 2026年1月 の AND 検索ができること', () => {
      useRaceStore.getState().setFilter('grades', ['G3']);
      useRaceStore.getState().setFilter('courses', ['中山']);
      useRaceStore.getState().setFilter('yearMonth', { year: 2026, month: 1 });

      const results = useRaceStore.getState().getFilteredRaces();
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2026-jra-g3-02');
      expect(results[0].name.ja).toBe('日刊スポーツ賞中山金杯');
    });

    it('キーワード "杯" かつ コース "Kyoto"（英語指定）で絞り込めること', () => {
      useRaceStore.getState().setFilter('searchQuery', '杯');
      useRaceStore.getState().setFilter('courses', ['Kyoto']);

      const results = useRaceStore.getState().getFilteredRaces();
      expect(results).toHaveLength(1);
      expect(results[0].name.ja).toBe('スポーツニッポン賞京都金杯');
    });

    it('障害レース (obstacle) かつ 12月 の AND 検索ができること', () => {
      useRaceStore.getState().setFilter('trackTypes', ['obstacle']);
      useRaceStore.getState().setFilter('yearMonth', { year: 2026, month: 12 });

      const results = useRaceStore.getState().getFilteredRaces();
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2026-jra-jg1-01');
    });

    it('条件を満たすレースが存在しない場合は空配列を返すこと', () => {
      useRaceStore.getState().setFilter('grades', ['G1']);
      useRaceStore.getState().setFilter('trackTypes', ['turf']); // モックのG1はdirtのみ

      const results = useRaceStore.getState().getFilteredRaces();
      expect(results).toHaveLength(0);
    });
  });

  describe('純粋セレクタ selectFilteredRaces および filterRaces のテスト', () => {
    it('state を渡して正しくフィルタリング結果を返すこと', () => {
      const state = useRaceStore.getState();
      const filtered = selectFilteredRaces({
        ...state,
        filters: {
          ...state.filters,
          grades: ['G1'],
        },
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].grade).toBe('G1');
    });

    it('filterRaces を直接呼び出してフィルタリングできること', () => {
      const filtered = filterRaces(mockRaces, {
        searchQuery: '',
        grades: ['J.G1'],
        trackTypes: [],
        sexConstraints: [],
        ageConstraints: [],
        courses: [],
        yearMonth: null,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2026-jra-jg1-01');
    });
  });

  describe('ビュー状態および月送りアクション', () => {
    it('表示モードの切り替えができること', () => {
      expect(useRaceStore.getState().viewMode).toBe('timeline');
      useRaceStore.getState().setViewMode('calendar');
      expect(useRaceStore.getState().viewMode).toBe('calendar');
    });

    it('通常の月送り (nextMonth / prevMonth) が動作すること', () => {
      useRaceStore.getState().setYearMonth({ year: 2026, month: 5 });

      useRaceStore.getState().nextMonth();
      expect(useRaceStore.getState().currentYearMonth).toEqual({ year: 2026, month: 6 });

      useRaceStore.getState().prevMonth();
      expect(useRaceStore.getState().currentYearMonth).toEqual({ year: 2026, month: 5 });
    });

    it('年跨ぎの nextMonth (12月 -> 翌年1月) が正しく計算されること', () => {
      useRaceStore.getState().setYearMonth({ year: 2026, month: 12 });
      useRaceStore.getState().nextMonth();
      expect(useRaceStore.getState().currentYearMonth).toEqual({ year: 2027, month: 1 });
    });

    it('年跨ぎの prevMonth (1月 -> 前年12月) が正しく計算されること', () => {
      useRaceStore.getState().setYearMonth({ year: 2026, month: 1 });
      useRaceStore.getState().prevMonth();
      expect(useRaceStore.getState().currentYearMonth).toEqual({ year: 2025, month: 12 });
    });

    it('resetFilters でフィルタが初期化されること', () => {
      useRaceStore.getState().setFilter('searchQuery', 'test');
      useRaceStore.getState().setFilter('grades', ['G1']);
      expect(useRaceStore.getState().filters.searchQuery).toBe('test');

      useRaceStore.getState().resetFilters();
      expect(useRaceStore.getState().filters.searchQuery).toBe('');
      expect(useRaceStore.getState().filters.grades).toEqual([]);
    });
  });
});
