import { useEffect, useState, useRef } from 'react';
import type { Race } from '../types/race';
import { useRaceStore } from '../store/useRaceStore';

export interface UseRacesOptions {
  dataUrl?: string;
  forceRefresh?: boolean;
}

export interface UseRacesResult {
  isLoading: boolean;
  error: Error | null;
  races: Race[];
  refreshRaces: () => Promise<boolean>;
}

const baseUrl = import.meta.env.BASE_URL ?? '/';
const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
export const DEFAULT_DATA_URL = `${normalizedBase}data/races.json`;

/**
 * 指定年度の Sharding JSON ファイル URL を生成
 */
export function getYearDataUrl(year: number, customBaseUrl?: string): string {
  const base = customBaseUrl ?? baseUrl;
  const norm = base.endsWith('/') ? base : `${base}/`;
  return `${norm}data/races-${year}.json`;
}

export const BROADCAST_CHANNEL_NAME = 'races-data-updates';

function triggerSwUpdate() {
  if (typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker)) {
    void navigator.serviceWorker.getRegistration().then((reg) => {
      void reg?.update();
    });
  }
}

/**
 * キャッシュをバイパスして最新のレースデータを強制フェッチし、Store を即座に更新する
 * 併せて Service Worker の更新チェックもトリガーする
 */
export async function forceRefreshRaces(dataUrl?: string): Promise<boolean> {
  try {
    const state = useRaceStore.getState();
    const targetUrl = dataUrl ?? DEFAULT_DATA_URL;

    // カスタム dataUrl が指定されている場合はその URL を優先
    if (dataUrl && dataUrl !== DEFAULT_DATA_URL) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      const response = await fetch(`${targetUrl}${separator}t=${Date.now()}`, {
        cache: 'reload',
      });
      if (response.ok) {
        const data = (await response.json()) as Race[];
        useRaceStore.getState().setRaces(data);
        triggerSwUpdate();
        return true;
      }
      return false;
    }

    // デフォルト時: 読み込み済み年度を対象に Sharding ファイルを取得
    const yearsToRefresh =
      state.loadedYears.length > 0
        ? state.loadedYears
        : [state.currentYearMonth.year];

    let allOk = true;
    const fetchedRacesByYear: { year: number; data: Race[] }[] = [];

    for (const year of yearsToRefresh) {
      const shardUrl = getYearDataUrl(year);
      const res = await fetch(`${shardUrl}?t=${Date.now()}`, {
        cache: 'reload',
      });
      if (res.ok) {
        const data = (await res.json()) as Race[];
        fetchedRacesByYear.push({ year, data });
      } else {
        allOk = false;
        break;
      }
    }

    if (allOk && fetchedRacesByYear.length > 0) {
      for (const item of fetchedRacesByYear) {
        useRaceStore.getState().addRacesForYear(item.year, item.data);
      }
      triggerSwUpdate();
      return true;
    }

    // Sharding ファイルの取得に失敗した場合は結合版 races.json へフォールバック
    const separator = DEFAULT_DATA_URL.includes('?') ? '&' : '?';
    const fallbackRes = await fetch(`${DEFAULT_DATA_URL}${separator}t=${Date.now()}`, {
      cache: 'reload',
    });
    if (fallbackRes.ok) {
      const data = (await fallbackRes.json()) as Race[];
      useRaceStore.getState().setRaces(data);
      triggerSwUpdate();
      return true;
    }
  } catch (err) {
    console.error('Failed to force refresh races:', err);
  }
  return false;
}

/**
 * レースデータを非同期取得し、Store に格納する Custom Hook
 * 年度別 Sharding（races-YYYY.json）のオンデマンド読み込みと結合版（races.json）へのフォールバックに対応
 * Workbox BroadcastUpdate によるバックグラウンドキャッシュ更新の自動検知に対応
 */
export function useRaces(options?: UseRacesOptions): UseRacesResult {
  const customDataUrl = options?.dataUrl;
  const forceRefresh = options?.forceRefresh ?? false;

  const races = useRaceStore((state) => state.races);
  const loadedYears = useRaceStore((state) => state.loadedYears);
  const currentYear = useRaceStore((state) => state.currentYearMonth.year);
  const setRaces = useRaceStore((state) => state.setRaces);
  const addRacesForYear = useRaceStore((state) => state.addRacesForYear);

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return races.length === 0 || forceRefresh;
  });
  const [error, setError] = useState<Error | null>(null);

  // 1. 初回データ取得またはカスタム dataUrl / forceRefresh 変更時
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    async function initialFetch() {
      setIsLoading(true);
      setError(null);

      try {
        if (customDataUrl) {
          const response = await fetch(customDataUrl, { signal: abortController.signal });
          if (!response.ok) {
            throw new Error(`Failed to fetch races: ${response.status} ${response.statusText}`);
          }
          const data = (await response.json()) as Race[];
          if (isMounted) {
            setRaces(data);
            setIsLoading(false);
          }
          return;
        }

        // 年度別 Shard を試行
        const shardUrl = getYearDataUrl(currentYear);
        const shardRes = await fetch(shardUrl, { signal: abortController.signal });

        if (shardRes.ok) {
          const data = (await shardRes.json()) as Race[];
          if (isMounted) {
            addRacesForYear(currentYear, data);
            setIsLoading(false);
          }
        } else {
          // Shard が見つからない場合は結合版 races.json へフォールバック
          const fallbackRes = await fetch(DEFAULT_DATA_URL, { signal: abortController.signal });
          if (!fallbackRes.ok) {
            throw new Error(`Failed to fetch races: ${fallbackRes.status} ${fallbackRes.statusText}`);
          }
          const data = (await fallbackRes.json()) as Race[];
          if (isMounted) {
            setRaces(data);
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (isMounted) {
          const formattedError = err instanceof Error ? err : new Error(String(err));
          setError(formattedError);
          setIsLoading(false);
        }
      }
    }

    if (races.length === 0 || forceRefresh) {
      void initialFetch();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [customDataUrl, forceRefresh]);

  // 2. カレンダー・タイムラインの年度切り替えに伴うオンデマンド取得
  const fetchingYearsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (customDataUrl || races.length === 0) return;
    if (loadedYears.includes(currentYear)) return;
    if (fetchingYearsRef.current.has(currentYear)) return;

    fetchingYearsRef.current.add(currentYear);
    const abortController = new AbortController();

    async function fetchYearShard() {
      try {
        const shardUrl = getYearDataUrl(currentYear);
        const res = await fetch(shardUrl, { signal: abortController.signal });
        if (res.ok) {
          const data = (await res.json()) as Race[];
          addRacesForYear(currentYear, data);
        } else {
          // 該当年度のデータが存在しない場合（例: 過去年・遠い未来年）は空データで loadedYears に記録し再取得を防ぐ
          addRacesForYear(currentYear, []);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // ネットワーク失敗時は次回再試行できるようフラグ解除
        fetchingYearsRef.current.delete(currentYear);
      }
    }

    void fetchYearShard();

    return () => {
      abortController.abort();
    };
  }, [currentYear, loadedYears, customDataUrl, races.length, addRacesForYear]);

  // 3. バックグラウンドキャッシュ更新（BroadcastChannel / Service Worker / VisibilityChange）
  useEffect(() => {
    let isMounted = true;

    const reloadLatestRaces = async () => {
      try {
        if (customDataUrl) {
          const res = await fetch(customDataUrl);
          if (res.ok && isMounted) {
            const latestData = (await res.json()) as Race[];
            setRaces(latestData);
          }
          return;
        }

        const state = useRaceStore.getState();
        const yearsToReload =
          state.loadedYears.length > 0 ? state.loadedYears : [state.currentYearMonth.year];

        for (const y of yearsToReload) {
          const res = await fetch(getYearDataUrl(y));
          if (res.ok && isMounted) {
            const data = (await res.json()) as Race[];
            addRacesForYear(y, data);
          }
        }
      } catch {
        // バックグラウンド更新失敗時は既存の画面データを維持
      }
    };

    let broadcastChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        broadcastChannel.onmessage = (event) => {
          if (
            event.data?.type === 'CACHE_UPDATED' ||
            event.data?.meta === 'workbox-broadcast-update'
          ) {
            void reloadLatestRaces();
          }
        };
      } catch {
        // ignore
      }
    }

    const handleSwMessage = (event: MessageEvent) => {
      if (
        event.data?.type === 'CACHE_UPDATED' ||
        event.data?.meta === 'workbox-broadcast-update'
      ) {
        void reloadLatestRaces();
      }
    };

    if (typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker)) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        typeof navigator !== 'undefined' &&
        Boolean(navigator.serviceWorker)
      ) {
        void navigator.serviceWorker.getRegistration().then((reg) => {
          void reg?.update();
        });
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isMounted = false;
      if (broadcastChannel) broadcastChannel.close();
      if (typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker)) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [customDataUrl, setRaces, addRacesForYear]);

  const refreshRaces = async (): Promise<boolean> => {
    return forceRefreshRaces(customDataUrl);
  };

  return {
    isLoading,
    error,
    races,
    refreshRaces,
  };
}
