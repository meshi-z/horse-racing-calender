import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useRaceStore, filterRaces, selectFilteredRaces, initialFilters } from '../../src/store/useRaceStore';
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
    localStorage.clear();
    // Storeを初期状態にリセット
    useRaceStore.getState().resetFilters();
    useRaceStore.getState().setFilter('organizations', []);
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

    it('フランス語名称の部分一致（"arc"）で該当するレースを取得できること', () => {
      const franceRace: Race = {
        ...mockRaces[0],
        id: '2026-france-g1-01',
        organization: 'france_galop',
        name: {
          ja: '凱旋門賞',
          en: "Prix de l'Arc de Triomphe",
          fr: "Prix de l'Arc de Triomphe",
        },
      };
      useRaceStore.getState().setRaces([...mockRaces, franceRace]);
      useRaceStore.getState().setFilter('searchQuery', 'arc');
      const results = useRaceStore.getState().getFilteredRaces();

      expect(results).toHaveLength(1);
      expect(results[0].name.ja).toBe('凱旋門賞');
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
        organizations: [],
        searchQuery: '',
        grades: ['J.G1'],
        trackTypes: [],
        sexConstraints: [],
        ageConstraints: [],
        courses: [],
        distanceCategories: [],
        yearMonth: null,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2026-jra-jg1-01');
    });

    it('organizations フィルターで単一および複数選択（JRA+NARなど）で正しく絞り込めること', () => {
      const narRace = {
        ...mockRaces[0],
        id: '2026-nar-jpn1-01',
        organization: 'nar' as const,
        grade: 'Jpn1' as const,
      };
      const franceRace = {
        ...mockRaces[0],
        id: '2026-france-g1-01',
        organization: 'france_galop' as const,
        grade: 'G1' as const,
      };
      const ukRace = {
        ...mockRaces[0],
        id: '2026-uk-g1-01',
        organization: 'bha' as const,
        grade: 'G1' as const,
      };
      const mixedRaces = [...mockRaces, narRace, franceRace, ukRace];

      // JRAのみ
      const jraOnly = filterRaces(mixedRaces, {
        ...initialFilters,
        organizations: ['jra'],
      });
      expect(jraOnly.every((r) => r.organization === 'jra')).toBe(true);
      expect(jraOnly).toHaveLength(mockRaces.length);

      // NARのみ
      const narOnly = filterRaces(mixedRaces, {
        ...initialFilters,
        organizations: ['nar'],
      });
      expect(narOnly).toHaveLength(1);
      expect(narOnly[0].id).toBe('2026-nar-jpn1-01');

      // Franceのみ
      const franceOnly = filterRaces(mixedRaces, {
        ...initialFilters,
        organizations: ['france_galop'],
      });
      expect(franceOnly).toHaveLength(1);
      expect(franceOnly[0].id).toBe('2026-france-g1-01');

      // JRA + NAR (日本国内重賞の複数選択)
      const japanRaces = filterRaces(mixedRaces, {
        ...initialFilters,
        organizations: ['jra', 'nar'],
      });
      expect(japanRaces).toHaveLength(mockRaces.length + 1);
      expect(japanRaces.every((r) => r.organization === 'jra' || r.organization === 'nar')).toBe(true);

      // France + UK (欧州重賞の複数選択)
      const europeRaces = filterRaces(mixedRaces, {
        ...initialFilters,
        organizations: ['france_galop', 'bha'],
      });
      expect(europeRaces).toHaveLength(2);
      expect(europeRaces.map((r) => r.id)).toEqual(['2026-france-g1-01', '2026-uk-g1-01']);

      // 空配列（すべて / all）
      const allRaces = filterRaces(mixedRaces, {
        ...initialFilters,
        organizations: [],
      });
      expect(allRaces).toHaveLength(mixedRaces.length);
    });

    describe('距離区分（スプリント/マイル/中距離/長距離）指定絞り込み (Issue #36)', () => {
      it('マイル（1500〜1700m）を指定した場合、京都金杯とフェブラリーSが取得できること', () => {
        useRaceStore.getState().setFilter('distanceCategories', ['mile']);
        const results = useRaceStore.getState().getFilteredRaces();

        expect(results).toHaveLength(2);
        expect(results.map((r) => r.id)).toEqual(['2026-jra-g3-01', '2026-jra-g1-01']);
        expect(results.every((r) => r.distance >= 1401 && r.distance <= 1700)).toBe(true);
      });

      it('中距離（1800〜2200m）を指定した場合、中山金杯とAJCCが取得できること', () => {
        useRaceStore.getState().setFilter('distanceCategories', ['intermediate']);
        const results = useRaceStore.getState().getFilteredRaces();

        expect(results).toHaveLength(2);
        expect(results.map((r) => r.id)).toEqual(['2026-jra-g3-02', '2026-jra-g2-01']);
        expect(results.every((r) => r.distance >= 1701 && r.distance <= 2200)).toBe(true);
      });

      it('長距離（2400m〜）を指定した場合、障害レース（4100m）を含む長距離重賞が取得できること', () => {
        useRaceStore.getState().setFilter('distanceCategories', ['long']);
        const results = useRaceStore.getState().getFilteredRaces();

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('2026-jra-jg1-01');
        expect(results[0].distance).toBe(4100);
      });

      it('マイルと中距離を複数指定した場合、両方の該当レースが取得できること', () => {
        useRaceStore.getState().setFilter('distanceCategories', ['mile', 'intermediate']);
        const results = useRaceStore.getState().getFilteredRaces();

        expect(results).toHaveLength(4);
      });

      it('短距離（〜1400m）の追加レースで正しく絞り込めること', () => {
        const sprintRace: Race = {
          ...mockRaces[0],
          id: '2026-sprint-test',
          distance: 1200,
        };
        useRaceStore.getState().setRaces([...mockRaces, sprintRace]);
        useRaceStore.getState().setFilter('distanceCategories', ['sprint']);

        const results = useRaceStore.getState().getFilteredRaces();
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('2026-sprint-test');
      });
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

    it('年跨ぎの nextMonth (12月 -> 翌年1月) がサポート年度内で正しく計算されること', () => {
      useRaceStore.getState().setYearMonth({ year: 2026, month: 12 });
      useRaceStore.getState().nextMonth();
      expect(useRaceStore.getState().currentYearMonth).toEqual({ year: 2027, month: 1 });
    });

    it('サポート上限（2027年12月）での nextMonth は進行せず上限を保持すること', () => {
      useRaceStore.getState().setYearMonth({ year: 2027, month: 12 });
      useRaceStore.getState().nextMonth();
      expect(useRaceStore.getState().currentYearMonth).toEqual({ year: 2027, month: 12 });
    });

    it('年跨ぎの prevMonth (1月 -> 前年12月) がサポート年度内で正しく計算されること', () => {
      useRaceStore.getState().setYearMonth({ year: 2027, month: 1 });
      useRaceStore.getState().prevMonth();
      expect(useRaceStore.getState().currentYearMonth).toEqual({ year: 2026, month: 12 });
    });

    it('サポート下限（2026年1月）での prevMonth は遡及せず下限を保持すること', () => {
      useRaceStore.getState().setYearMonth({ year: 2026, month: 1 });
      useRaceStore.getState().prevMonth();
      expect(useRaceStore.getState().currentYearMonth).toEqual({ year: 2026, month: 1 });
    });

    it('resetFilters でフィルタが初期化されること', () => {
      useRaceStore.getState().setFilter('searchQuery', 'test');
      useRaceStore.getState().setFilter('grades', ['G1']);
      useRaceStore.getState().setFilter('distanceCategories', ['sprint', 'mile']);
      expect(useRaceStore.getState().filters.searchQuery).toBe('test');

      useRaceStore.getState().resetFilters();
      expect(useRaceStore.getState().filters.searchQuery).toBe('');
      expect(useRaceStore.getState().filters.grades).toEqual([]);
      expect(useRaceStore.getState().filters.distanceCategories).toEqual([]);
    });

    it('主催者フィルタの変更が localStorage に永続化されること', () => {
      useRaceStore.getState().setFilter('organizations', ['france_galop']);
      expect(useRaceStore.getState().filters.organizations).toEqual(['france_galop']);
      expect(localStorage.getItem('horse_racing_calendar_organizations_filter')).toBe(JSON.stringify(['france_galop']));

      useRaceStore.getState().setFilter('organizations', ['jra', 'nar']);
      expect(useRaceStore.getState().filters.organizations).toEqual(['jra', 'nar']);
      expect(localStorage.getItem('horse_racing_calendar_organizations_filter')).toBe(JSON.stringify(['jra', 'nar']));
    });

    it('setRaces で races と loadedYears が更新されること', () => {
      useRaceStore.getState().setRaces(mockRaces);
      expect(useRaceStore.getState().races).toHaveLength(mockRaces.length);
      expect(useRaceStore.getState().loadedYears).toEqual([2026]);
    });

    it('addRacesForYear で別年度のレースが重複排除・ソートされてマージされること', () => {
      useRaceStore.getState().setRaces([mockRaces[0]]); // 2026-01-04
      expect(useRaceStore.getState().loadedYears).toEqual([2026]);

      const race2027: Race = {
        ...mockRaces[0],
        id: '2027-jra-g3-01',
        date: '2027-01-05',
        start_time: '2027-01-05T06:45:00.000Z',
      };

      useRaceStore.getState().addRacesForYear(2027, [race2027]);
      const state = useRaceStore.getState();
      expect(state.loadedYears).toEqual([2026, 2027]);
      expect(state.races).toHaveLength(2);
      expect(state.races[0].id).toBe('2026-jra-g3-01');
      expect(state.races[1].id).toBe('2027-jra-g3-01');

      // 重複IDがある場合は最新データで上書きされること
      const updatedRace2027: Race = {
        ...race2027,
        grade: 'G2',
      };
      useRaceStore.getState().addRacesForYear(2027, [updatedRace2027]);
      expect(useRaceStore.getState().races).toHaveLength(2);
      expect(useRaceStore.getState().races[1].grade).toBe('G2');
    });

    it('オーストラリア重賞の日本語・英語・中国語名およびコースでの絞り込みが機能すること', () => {
      const auRace: Race = {
        id: '2026-au-the-everest',
        organization: 'racing_australia',
        name: {
          ja: 'ジ・エベレスト',
          en: 'The Everest',
          fr: 'The Everest',
          zh: '珠穆朗瑪峰錦標',
        },
        grade: 'G1',
        date: '2026-10-17',
        start_time: '2026-10-17T05:15:00.000Z',
        is_time_confirmed: true,
        course: {
          ja: 'ロイヤルランドウィック',
          en: 'Royal Randwick',
          fr: 'Royal Randwick',
          zh: '皇家蘭域',
        },
        distance: 1200,
        track_type: 'turf',
        sex_constraint: 'none',
        age_constraint: '3yo_and_up',
        handicap: {
          code: 'weight_for_age',
          ja: '定量',
          en: 'Weight for Age',
        },
      };

      const testRaces = [...mockRaces, auRace];

      // 日本語名で検索
      let filtered = filterRaces(testRaces, { ...initialFilters, searchQuery: 'エベレスト' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2026-au-the-everest');

      // 英語名で検索
      filtered = filterRaces(testRaces, { ...initialFilters, searchQuery: 'everest' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2026-au-the-everest');

      // 中国語名で検索
      filtered = filterRaces(testRaces, { ...initialFilters, searchQuery: '珠穆朗瑪峰' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2026-au-the-everest');

      // 主催者フィルタ
      filtered = filterRaces(testRaces, { ...initialFilters, organizations: ['racing_australia'] });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2026-au-the-everest');

      // 競馬場フィルタ (日本語コース名)
      filtered = filterRaces(testRaces, { ...initialFilters, courses: ['ロイヤルランドウィック'] });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2026-au-the-everest');

      // 競馬場フィルタ (英語コース名)
      filtered = filterRaces(testRaces, { ...initialFilters, courses: ['Royal Randwick'] });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2026-au-the-everest');

      // 競馬場フィルタ (中国語コース名)
      filtered = filterRaces(testRaces, { ...initialFilters, courses: ['皇家蘭域'] });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2026-au-the-everest');
    });

    describe('年度切り替え (setSelectedYear) & オンデマンドキャッシュ', () => {
      const originalFetch = globalThis.fetch;

      beforeEach(() => {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => [],
        });
      });

      afterEach(() => {
        globalThis.fetch = originalFetch;
      });

      it('setSelectedYear で年度が切り替わり、キャッシュがある場合は再フェッチせず即座に適用されること', async () => {
        const race2026: Race = mockRaces[0];
        const race2027: Race = {
          ...mockRaces[0],
          id: '2027-jra-g1-01',
          date: '2027-02-21',
        };

        useRaceStore.setState({
          selectedYear: 2026,
          availableYears: [2026, 2027],
          racesByYear: { 2026: [race2026], 2027: [race2027] },
          races: [race2026],
        });

        const fetchSpy = vi.spyOn(globalThis, 'fetch');

        await useRaceStore.getState().setSelectedYear(2027);

        expect(useRaceStore.getState().selectedYear).toBe(2027);
        // キャッシュヒットのため fetch は呼ばれない
        expect(fetchSpy).not.toHaveBeenCalled();
      });

      it('年度切り替え時、カレンダー年月が同期されること（別年度なら1月）', async () => {
        useRaceStore.setState({
          selectedYear: 2026,
          availableYears: [2026, 2027],
          currentYearMonth: { year: 2026, month: 10 },
          racesByYear: { 2027: [] },
        });

        await useRaceStore.getState().setSelectedYear(2027);

        expect(useRaceStore.getState().currentYearMonth).toEqual({
          year: 2027,
          month: 1,
        });
      });

      it('年跨ぎの nextMonth (12月 -> 1月) で selectedYear も翌年に追従すること', () => {
        useRaceStore.setState({
          selectedYear: 2026,
          availableYears: [2026, 2027],
          currentYearMonth: { year: 2026, month: 12 },
        });

        useRaceStore.getState().nextMonth();

        expect(useRaceStore.getState().currentYearMonth).toEqual({
          year: 2027,
          month: 1,
        });
        expect(useRaceStore.getState().selectedYear).toBe(2027);
      });

      it('年跨ぎの prevMonth (1月 -> 12月) で selectedYear も前年に追従すること', () => {
        useRaceStore.setState({
          selectedYear: 2027,
          availableYears: [2026, 2027],
          currentYearMonth: { year: 2027, month: 1 },
        });

        useRaceStore.getState().prevMonth();

        expect(useRaceStore.getState().currentYearMonth).toEqual({
          year: 2026,
          month: 12,
        });
        expect(useRaceStore.getState().selectedYear).toBe(2026);
      });

      it('setYearFromScroll はスクロール再発火なしで selectedYear のみ更新すること', () => {
        useRaceStore.setState({
          selectedYear: 2026,
          currentYearMonth: { year: 2026, month: 10 },
        });

        useRaceStore.getState().setYearFromScroll(2027);

        expect(useRaceStore.getState().selectedYear).toBe(2027);
        // currentYearMonth は変更されないこと
        expect(useRaceStore.getState().currentYearMonth).toEqual({ year: 2026, month: 10 });
      });

      it('selectFilteredRaces は timeline 表示時に全ロード済みレースを返し、calendar 表示時に選択年で絞り込むこと', () => {
        const race2026 = {
          id: '2026-jra-g1-01',
          organization: 'jra',
          name: { ja: '有馬記念' },
          date: '2026-12-27',
          start_time: '2026-12-27T06:25:00.000Z',
          grade: 'G1',
        } as unknown as Race;
        const race2027 = {
          id: '2027-jra-g3-01',
          organization: 'jra',
          name: { ja: '中山金杯' },
          date: '2027-01-05',
          start_time: '2027-01-05T06:45:00.000Z',
          grade: 'G3',
        } as unknown as Race;

        useRaceStore.setState({
          races: [race2026, race2027],
          selectedYear: 2026,
          viewMode: 'timeline',
          filters: { ...useRaceStore.getState().filters },
        });

        // timeline モード: 2026年と2027年が両方含まれること（クロスイヤー表示）
        const timelineRaces = selectFilteredRaces(useRaceStore.getState());
        expect(timelineRaces).toHaveLength(2);

        // calendar モード: selectedYear (2026) で絞り込まれること
        useRaceStore.setState({ viewMode: 'calendar' });
        const calendarRaces = selectFilteredRaces(useRaceStore.getState());
        expect(calendarRaces).toHaveLength(1);
        expect(calendarRaces[0].id).toBe('2026-jra-g1-01');
      });
    });
  });
});


