import { useEffect, useState } from 'react';
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
}

const baseUrl = import.meta.env.BASE_URL ?? '/';
const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
const DEFAULT_DATA_URL = `${normalizedBase}data/races.json`;

export const BROADCAST_CHANNEL_NAME = 'races-data-updates';

/**
 * races.json からレースデータを非同期取得し、Store に格納する Custom Hook
 * Workbox BroadcastUpdate によるバックグラウンドキャッシュ更新の自動検知に対応
 */
export function useRaces(options?: UseRacesOptions): UseRacesResult {
  const dataUrl = options?.dataUrl ?? DEFAULT_DATA_URL;
  const forceRefresh = options?.forceRefresh ?? false;

  const races = useRaceStore((state) => state.races);
  const setRaces = useRaceStore((state) => state.setRaces);

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // 既にデータがあり再取得不要なら初期状態は false
    return races.length === 0 || forceRefresh;
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    async function fetchRaces() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(dataUrl, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch races: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as Race[];

        if (isMounted) {
          setRaces(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // フェッチ中断時はエラーとして扱わない
          return;
        }
        if (isMounted) {
          const formattedError = err instanceof Error ? err : new Error(String(err));
          setError(formattedError);
          setIsLoading(false);
        }
      }
    }

    // 初回フェッチ（データがないか強制更新時）
    if (races.length === 0 || forceRefresh) {
      void fetchRaces();
    } else {
      setIsLoading(false);
    }

    // 最新データへバックグラウンド更新するハンドラ
    const reloadLatestRaces = async () => {
      try {
        const response = await fetch(dataUrl);
        if (response.ok && isMounted) {
          const latestData = (await response.json()) as Race[];
          setRaces(latestData);
        }
      } catch {
        // バックグラウンド更新失敗時は既存の画面データを維持
      }
    };

    // 1. BroadcastChannel による Workbox キャッシュ更新メッセージの購読
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
        // BroadcastChannel 非対応または制限環境
      }
    }

    // 2. navigator.serviceWorker postMessage フォールバックの購読
    const handleSwMessage = (event: MessageEvent) => {
      if (
        event.data?.type === 'CACHE_UPDATED' ||
        event.data?.meta === 'workbox-broadcast-update'
      ) {
        void reloadLatestRaces();
      }
    };

    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    // 3. アプリがフォアグラウンドに復帰した際の Service Worker 更新チェック
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        typeof navigator !== 'undefined' &&
        'serviceWorker' in navigator
      ) {
        void navigator.serviceWorker.getRegistration().then((registration) => {
          void registration?.update();
        });
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isMounted = false;
      abortController.abort();
      if (broadcastChannel) {
        broadcastChannel.close();
      }
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [dataUrl, forceRefresh, setRaces, races.length]);

  return {
    isLoading,
    error,
    races,
  };
}
