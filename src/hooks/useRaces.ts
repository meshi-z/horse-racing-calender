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

/**
 * races.json からレースデータを非同期取得し、Store に格納する Custom Hook
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
    // 既にデータが存在し、強制更新でなければスキップ
    if (races.length > 0 && !forceRefresh) {
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();
    let isMounted = true;

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

    void fetchRaces();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [dataUrl, forceRefresh, setRaces, races.length]);

  return {
    isLoading,
    error,
    races,
  };
}
