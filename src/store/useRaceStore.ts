import { create } from 'zustand';
import {
  AVAILABLE_YEARS,
  DEFAULT_DATA_URL,
  getYearDataUrl,
  resolveInitialYear,
  syncYearToUrl,
} from '../constants/years';
import {
  getInitialOrganizations,
  saveOrganizationsPreference,
} from '../libs/geolocation';
import type { DistanceCategory, FilterState, Organization, Race } from '../types/race';

export interface YearMonth {
  year: number;
  month: number;
}

export interface RaceState {
  races: Race[];
  racesByYear: Record<number, Race[]>;
  selectedYear: number;
  availableYears: readonly number[];
  isLoadingYear: boolean;
  loadedYears: number[];
  filters: FilterState;
  viewMode: 'timeline' | 'calendar';
  currentYearMonth: YearMonth;

  // Actions
  setSelectedYear: (year: number) => Promise<void>;
  fetchRacesForYear: (
    year: number,
    force?: boolean,
    options?: { signal?: AbortSignal }
  ) => Promise<Race[]>;
  setRacesForYear: (year: number, races: Race[]) => void;
  setRaces: (races: Race[]) => void;
  addRacesForYear: (year: number, races: Race[]) => void;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  setViewMode: (mode: 'timeline' | 'calendar') => void;
  setYearMonth: (yearMonth: YearMonth) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  goToCurrentMonth: () => void;
  getFilteredRaces: () => Race[];
}

export const getInitialFilters = (): FilterState => ({
  organizations: getInitialOrganizations(),
  searchQuery: '',
  grades: [],
  trackTypes: [],
  sexConstraints: [],
  ageConstraints: [],
  courses: [],
  distanceCategories: [],
  yearMonth: null,
});

export const initialFilters: FilterState = {
  organizations: [],
  searchQuery: '',
  grades: [],
  trackTypes: [],
  sexConstraints: [],
  ageConstraints: [],
  courses: [],
  distanceCategories: [],
  yearMonth: null,
};

export const getInitialYearMonth = (year?: number): YearMonth => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const targetYear =
    year ??
    resolveInitialYear(typeof window !== 'undefined' ? window.location?.search : '');
  if (targetYear !== currentYear) {
    return {
      year: targetYear,
      month: 1,
    };
  }
  return {
    year: currentYear,
    month: now.getMonth() + 1,
  };
};

/**
 * 距離が指定された距離区分に合致するか判定する関数
 */
export const matchDistanceCategory = (distance: number, category: DistanceCategory): boolean => {
  switch (category) {
    case 'sprint':
      return distance <= 1400;
    case 'mile':
      return distance >= 1401 && distance <= 1700;
    case 'intermediate':
      return distance >= 1701 && distance <= 2200;
    case 'long':
      return distance >= 2300;
    default:
      return false;
  }
};

/**
 * フィルタ条件に基づいてレース一覧を絞り込む純粋関数
 */
export const filterRaces = (
  races: Race[],
  filters: FilterState,
  selectedYear?: number
): Race[] => {
  return races.filter((race) => {
    // 選択中年度の絞り込み（指定時）
    if (selectedYear !== undefined) {
      const raceYear = parseInt(race.date.slice(0, 4), 10);
      if (raceYear !== selectedYear) {
        return false;
      }
    }

    // 主催者絞り込み（空配列の場合はすべて表示）
    if (filters.organizations && filters.organizations.length > 0) {
      if (!filters.organizations.includes(race.organization)) {
        return false;
      }
    }
    // 検索クエリ（日本語名称・英語名称・フランス語名称・中国語名称の部分一致・大小文字無視）
    if (filters.searchQuery.trim() !== '') {
      const query = filters.searchQuery.trim().toLowerCase();
      const matchJa = race.name.ja.toLowerCase().includes(query);
      const matchEn = race.name.en.toLowerCase().includes(query);
      const matchFr = race.name.fr ? race.name.fr.toLowerCase().includes(query) : false;
      const matchZh = race.name.zh ? race.name.zh.toLowerCase().includes(query) : false;
      if (!matchJa && !matchEn && !matchFr && !matchZh) {
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

    // 競馬場（日本語・英語・フランス語・中国語いずれかの一致）
    if (filters.courses.length > 0) {
      const matchesCourse = filters.courses.some(
        (c) =>
          c === race.course.ja ||
          c === race.course.en ||
          (race.course.fr && c === race.course.fr) ||
          (race.course.zh && c === race.course.zh)
      );
      if (!matchesCourse) {
        return false;
      }
    }

    // 距離区分絞り込み（指定されたいずれかの距離区分に合致）
    if (filters.distanceCategories && filters.distanceCategories.length > 0) {
      const matchesDistance = filters.distanceCategories.some((cat) =>
        matchDistanceCategory(race.distance, cat)
      );
      if (!matchesDistance) {
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
let lastSelectedYear: number | null = null;
let lastFilteredResult: Race[] = [];

/**
 * Zustand 用の純粋セレクタ関数（メモ化キャッシュ付き）
 */
export const selectFilteredRaces = (state: RaceState): Race[] => {
  if (
    state.races === lastRaces &&
    state.filters === lastFilters &&
    state.selectedYear === lastSelectedYear
  ) {
    return lastFilteredResult;
  }
  lastRaces = state.races;
  lastFilters = state.filters;
  lastSelectedYear = state.selectedYear;
  lastFilteredResult = filterRaces(state.races, state.filters, state.selectedYear);
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

const initialSelectedYear = resolveInitialYear(
  typeof window !== 'undefined' ? window.location?.search : ''
);

export const useRaceStore = create<RaceState>((set, get) => ({
  races: [],
  racesByYear: {},
  selectedYear: initialSelectedYear,
  availableYears: AVAILABLE_YEARS,
  isLoadingYear: false,
  loadedYears: [],
  filters: getInitialFilters(),
  viewMode: getInitialViewMode(),
  currentYearMonth: getInitialYearMonth(initialSelectedYear),

  setSelectedYear: async (year: number) => {
    const current = get().selectedYear;
    if (current === year && get().races.length > 0) return;

    syncYearToUrl(year);

    const now = new Date();
    const isCurrentSystemYear = year === now.getFullYear();
    const newYearMonth = isCurrentSystemYear
      ? { year, month: now.getMonth() + 1 }
      : { year, month: 1 };

    const cachedRaces = get().racesByYear[year];
    if (cachedRaces) {
      set({
        selectedYear: year,
        races: cachedRaces,
        currentYearMonth: newYearMonth,
      });
      return;
    }

    set({
      selectedYear: year,
      currentYearMonth: newYearMonth,
    });
    try {
      await get().fetchRacesForYear(year);
    } catch {
      // ネットワーク切断時等も選択年度の状態は保護
    }
  },

  fetchRacesForYear: async (
    year: number,
    force = false,
    options?: { signal?: AbortSignal }
  ): Promise<Race[]> => {
    const state = get();
    if (!force && state.racesByYear[year] && state.loadedYears.includes(year)) {
      return state.racesByYear[year];
    }

    set({ isLoadingYear: true });
    try {
      const shardUrl = getYearDataUrl(year);
      const fetchOptions: RequestInit = {
        signal: options?.signal,
        ...(force ? { cache: 'reload' } : {}),
      };
      const res = await fetch(
        `${shardUrl}${force ? `?t=${Date.now()}` : ''}`,
        fetchOptions
      );
      if (res.ok) {
        const data = (await res.json()) as Race[];
        get().addRacesForYear(year, data);
        return data;
      }

      // Shard が 404 等の場合は結合版 races.json から抽出またはフォールバック
      const fallbackRes = await fetch(
        `${DEFAULT_DATA_URL}${force ? `?t=${Date.now()}` : ''}`,
        fetchOptions
      );
      if (fallbackRes.ok) {
        const allRaces = (await fallbackRes.json()) as Race[];
        get().setRaces(allRaces);
        const yearRaces = allRaces.filter((r) => r.date.startsWith(String(year)));
        return yearRaces;
      }

      throw new Error(
        `Failed to fetch races: ${res.status} ${res.statusText}`
      );
    } finally {
      set({ isLoadingYear: false });
    }
  },

  addRacesForYear: (year: number, newRaces: Race[]) =>
    set((state) => {
      const existingMap = new Map<string, Race>();
      for (const r of state.races) {
        existingMap.set(r.id, r);
      }
      for (const r of newRaces) {
        existingMap.set(r.id, r);
      }
      const merged = Array.from(existingMap.values()).sort((a, b) => {
        return (
          a.date.localeCompare(b.date) ||
          (a.start_time || '').localeCompare(b.start_time || '') ||
          (a.organization || '').localeCompare(b.organization || '') ||
          a.id.localeCompare(b.id)
        );
      });
      const updatedLoadedYears = state.loadedYears.includes(year)
        ? state.loadedYears
        : [...state.loadedYears, year].sort((a, b) => a - b);
      const yearOnlyRaces = merged.filter((r) => r.date.startsWith(String(year)));
      const updatedRacesByYear = {
        ...state.racesByYear,
        [year]: yearOnlyRaces,
      };
      return {
        races: merged,
        racesByYear: updatedRacesByYear,
        loadedYears: updatedLoadedYears,
      };
    }),

  setRacesForYear: (year: number, newRaces: Race[]) => {
    get().addRacesForYear(year, newRaces);
  },

  setRaces: (races: Race[]) => {
    const years = Array.from(
      new Set(
        races
          .map((r) => parseInt(r.date.slice(0, 4), 10))
          .filter((y) => !isNaN(y))
      )
    ).sort((a, b) => a - b);

    const grouped: Record<number, Race[]> = {};
    for (const r of races) {
      const y = parseInt(r.date.slice(0, 4), 10);
      if (!isNaN(y)) {
        if (!grouped[y]) grouped[y] = [];
        grouped[y].push(r);
      }
    }

    set((state) => ({
      races,
      racesByYear: {
        ...state.racesByYear,
        ...grouped,
      },
      loadedYears: Array.from(new Set([...state.loadedYears, ...years])).sort((a, b) => a - b),
    }));
  },

  setFilter: (key, value) => {
    if (key === 'organizations') {
      saveOrganizationsPreference(value as Organization[]);
    }
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    }));
  },

  resetFilters: () => set({ filters: getInitialFilters() }),

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
        const nextYear = year + 1;
        if (state.availableYears.includes(nextYear)) {
          syncYearToUrl(nextYear);
          return {
            selectedYear: nextYear,
            currentYearMonth: { year: nextYear, month: 1 },
          };
        }
        return { currentYearMonth: { year: nextYear, month: 1 } };
      }
      return { currentYearMonth: { year, month: month + 1 } };
    }),

  prevMonth: () =>
    set((state) => {
      const { year, month } = state.currentYearMonth;
      if (month === 1) {
        const prevYear = year - 1;
        if (state.availableYears.includes(prevYear)) {
          syncYearToUrl(prevYear);
          return {
            selectedYear: prevYear,
            currentYearMonth: { year: prevYear, month: 12 },
          };
        }
        return { currentYearMonth: { year: prevYear, month: 12 } };
      }
      return { currentYearMonth: { year, month: month - 1 } };
    }),

  goToCurrentMonth: () => {
    const currentYear = new Date().getFullYear();
    if (get().selectedYear !== currentYear) {
      void get().setSelectedYear(currentYear);
    } else {
      set({ currentYearMonth: getInitialYearMonth() });
    }
  },

  getFilteredRaces: () => filterRaces(get().races, get().filters),
}));
