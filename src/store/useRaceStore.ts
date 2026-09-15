import { create } from 'zustand';
import type { FilterState, Race } from '../types/race';

export interface YearMonth {
  year: number;
  month: number;
}

export interface RaceState {
  races: Race[];
  filters: FilterState;
  viewMode: 'timeline' | 'calendar';
  currentYearMonth: YearMonth;

  // Actions
  setRaces: (races: Race[]) => void;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  setViewMode: (mode: 'timeline' | 'calendar') => void;
  setYearMonth: (yearMonth: YearMonth) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  goToCurrentMonth: () => void;
  getFilteredRaces: () => Race[];
}

export const initialFilters: FilterState = {
  searchQuery: '',
  grades: [],
  trackTypes: [],
  sexConstraints: [],
  ageConstraints: [],
  courses: [],
  yearMonth: null,
};

export const getInitialYearMonth = (): YearMonth => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
};

/**
 * フィルタ条件に基づいてレース一覧を絞り込む純粋関数
 */
export const filterRaces = (races: Race[], filters: FilterState): Race[] => {
  return races.filter((race) => {
    // 検索クエリ（日本語名称・英語名称の部分一致・大小文字無視）
    if (filters.searchQuery.trim() !== '') {
      const query = filters.searchQuery.trim().toLowerCase();
      const matchJa = race.name.ja.toLowerCase().includes(query);
      const matchEn = race.name.en.toLowerCase().includes(query);
      if (!matchJa && !matchEn) {
        return false;
      }
    }

    // グレード絞り込み（指定グレードのいずれかに一致）
    if (filters.grades.length > 0 && !filters.grades.includes(race.grade)) {
      return false;
    }

    // トラック種別（芝/ダート/障害）
    if (filters.trackTypes.length > 0 && !filters.trackTypes.includes(race.track_type)) {
      return false;
    }

    // 性別制限
    if (filters.sexConstraints.length > 0 && !filters.sexConstraints.includes(race.sex_constraint)) {
      return false;
    }

    // 年齢制限
    if (filters.ageConstraints.length > 0 && !filters.ageConstraints.includes(race.age_constraint)) {
      return false;
    }

    // 競馬場（日本語・英語いずれかの一致）
    if (filters.courses.length > 0) {
      const matchesCourse = filters.courses.some(
        (c) => c === race.course.ja || c === race.course.en
      );
      if (!matchesCourse) {
        return false;
      }
    }

    // 年月指定絞り込み (race.date: YYYY-MM-DD)
    if (filters.yearMonth !== null) {
      const [yearStr, monthStr] = race.date.split('-');
      const raceYear = parseInt(yearStr, 10);
      const raceMonth = parseInt(monthStr, 10);
      if (raceYear !== filters.yearMonth.year || raceMonth !== filters.yearMonth.month) {
        return false;
      }
    }

    return true;
  });
};

let lastRaces: Race[] | null = null;
let lastFilters: FilterState | null = null;
let lastFilteredResult: Race[] = [];

/**
 * Zustand 用の純粋セレクタ関数（メモ化キャッシュ付き）
 */
export const selectFilteredRaces = (state: RaceState): Race[] => {
  if (state.races === lastRaces && state.filters === lastFilters) {
    return lastFilteredResult;
  }
  lastRaces = state.races;
  lastFilters = state.filters;
  lastFilteredResult = filterRaces(state.races, state.filters);
  return lastFilteredResult;
};

export const VIEW_MODE_STORAGE_KEY = 'horse_racing_calendar_view_mode';

export function getInitialViewMode(): 'timeline' | 'calendar' {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (stored === 'timeline' || stored === 'calendar') {
        return stored;
      }
    }
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;
      return isDesktop ? 'calendar' : 'timeline';
    }
  } catch {
    // localStorageアクセスの制限やエラー時はデフォルトへフォールバック
  }
  return 'timeline';
}

export const useRaceStore = create<RaceState>((set, get) => ({
  races: [],
  filters: initialFilters,
  viewMode: getInitialViewMode(),
  currentYearMonth: getInitialYearMonth(),

  setRaces: (races: Race[]) => set({ races }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),

  resetFilters: () => set({ filters: initialFilters }),

  setViewMode: (viewMode) => {
    set({ viewMode });
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
      }
    } catch {
      // ignore storage error
    }
  },

  setYearMonth: (currentYearMonth) => set({ currentYearMonth }),

  nextMonth: () =>
    set((state) => {
      const { year, month } = state.currentYearMonth;
      if (month === 12) {
        return { currentYearMonth: { year: year + 1, month: 1 } };
      }
      return { currentYearMonth: { year, month: month + 1 } };
    }),

  prevMonth: () =>
    set((state) => {
      const { year, month } = state.currentYearMonth;
      if (month === 1) {
        return { currentYearMonth: { year: year - 1, month: 12 } };
      }
      return { currentYearMonth: { year, month: month - 1 } };
    }),

  goToCurrentMonth: () => set({ currentYearMonth: getInitialYearMonth() }),

  getFilteredRaces: () => filterRaces(get().races, get().filters),
}));
