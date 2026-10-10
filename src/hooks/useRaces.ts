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

import {
  DEFAULT_DATA_URL,
  getYearDataUrl,
  isAvailableYear,
  syncYearToUrl,
} from '../constants/years';
import { showToast } from '../store/useToastStore';
import { useTranslation } from '../libs/i18n';
export { DEFAULT_DATA_URL, getYearDataUrl };

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
  const selectedYear = useRaceStore((state) => state.selectedYear);
  const racesByYear = useRaceStore((state) => state.racesByYear);
  const setRaces = useRaceStore((state) => state.setRaces);
  const addRacesForYear = useRaceStore((state) => state.addRacesForYear);
  const fetchRacesForYear = useRaceStore((state) => state.fetchRacesForYear);
  const setSelectedYear = useRaceStore((state) => state.setSelectedYear);

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return (races.length === 0 && !racesByYear[selectedYear]) || forceRefresh;
  });
  const [error, setError] = useState<Error | null>(null);
  const { t } = useTranslation();

  // 0. URLクエリパラメータのサニタイズ・正規化と不正値通知（例: ?year=2028 や ?year=abc）
  const hasValidatedUrlParamRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location || hasValidatedUrlParamRef.current) {
      return;
    }
    hasValidatedUrlParamRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const rawYearParam = params.get('year');
    if (rawYearParam !== null) {
      const parsed = parseInt(rawYearParam, 10);
      if (!isAvailableYear(parsed)) {
        // 不正な年パラメータが指定された場合はURLをサポート年度（selectedYear）に自動補正
        syncYearToUrl(selectedYear);
        // ユーザーにフォールバックした旨をトースト案内
        showToast(
          t('nav.unsupportedYearNotice', {
            year: rawYearParam,
            fallbackYear: String(selectedYear),
          }),
          'info'
        );
      }
    }
  }, [selectedYear, t]);

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

        // 選択中年度の Shard を取得（ストアのキャッシュ機構を活用）
        await fetchRacesForYear(selectedYear, forceRefresh, { signal: abortController.signal });
        if (isMounted) {
          setIsLoading(false);
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

    if (races.length === 0 || forceRefresh || !racesByYear[selectedYear]) {
      void initialFetch();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [customDataUrl, forceRefresh, selectedYear, fetchRacesForYear, setRaces]);

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
        await fetchRacesForYear(currentYear, false, { signal: abortController.signal });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        fetchingYearsRef.current.delete(currentYear);
      }
    }

    void fetchYearShard();

    return () => {
      abortController.abort();
    };
  }, [currentYear, loadedYears, customDataUrl, races.length, fetchRacesForYear]);

  // 3. ブラウザの「戻る/進む」（popstate）で ?year= が変更されたときの同期
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const yearParam = params.get('year');
      if (yearParam) {
        const parsed = parseInt(yearParam, 10);
        if (isAvailableYear(parsed)) {
          if (parsed !== selectedYear) {
            void setSelectedYear(parsed);
          }
        } else {
          syncYearToUrl(selectedYear);
          showToast(
            t('nav.unsupportedYearNotice', {
              year: yearParam,
              fallbackYear: String(selectedYear),
            }),
            'info'
          );
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedYear, setSelectedYear]);

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
      if (document.visibilityState === 'visible') {
        if (typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker)) {
          void navigator.serviceWorker.getRegistration().then((reg) => {
            void reg?.update();
          });
        }
        void reloadLatestRaces();
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
