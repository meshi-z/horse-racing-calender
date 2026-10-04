import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRaces, getYearDataUrl } from '@/hooks/useRaces';
import { useRaceStore } from '@/store/useRaceStore';
import type { Race } from '@/types/race';

const mockRace: Race = {
  id: '2026-jra-g1-01',
  organization: 'jra',
  name: { ja: 'フェブラリーステークス', en: 'February Stakes' },
  grade: 'G1',
  date: '2026-02-22',
  start_time: '2026-02-22T06:40:00.000Z',
  is_time_confirmed: false,
  course: { ja: '東京', en: 'Tokyo' },
  distance: 1600,
  track_type: 'dirt',
  sex_constraint: 'none',
  age_constraint: '4yo_and_up',
  handicap: { code: 'weight_for_age', ja: '定量', en: 'Weight for Age' },
};

describe('useRaces hook', () => {
  const originalFetch = globalThis.fetch;
  const originalServiceWorker = (globalThis.navigator as any).serviceWorker;

  beforeEach(() => {
    useRaceStore.setState({
      races: [],
      loadedYears: [],
      currentYearMonth: { year: 2026, month: 1 },
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalServiceWorker === undefined) {
      delete (globalThis.navigator as any).serviceWorker;
    } else {
      Object.defineProperty(globalThis.navigator, 'serviceWorker', {
        value: originalServiceWorker,
        writable: true,
        configurable: true,
      });
    }
  });

  it('getYearDataUrl が BASE_URL に基づく正しい年度別 URL を生成すること', () => {
    const url = getYearDataUrl(2027);
    expect(url).toBe(`${import.meta.env.BASE_URL}data/races-2027.json`);
  });

  it('デフォルトで現在の年度に対応する Shard (races-2026.json) をフェッチすること', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockRace],
    });
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useRaces());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const expectedUrl = `${import.meta.env.BASE_URL}data/races-2026.json`;
    expect(fetchMock).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    expect(result.current.races).toEqual([mockRace]);
    expect(result.current.error).toBeNull();
    expect(useRaceStore.getState().loadedYears).toEqual([2026]);
  });

  it('Shard が 404 の場合は結合版 races.json へフォールバックすること', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockRace],
      });
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useRaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${import.meta.env.BASE_URL}data/races-2026.json`,
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${import.meta.env.BASE_URL}data/races.json`,
      expect.any(Object)
    );
    expect(result.current.races).toEqual([mockRace]);
    expect(result.current.error).toBeNull();
  });

  it('Shard およびフォールバックの両方が失敗した場合はエラー状態になること', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useRaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Failed to fetch races: 404 Not Found');
  });

  it('カスタム dataUrl オプションを指定した場合はその URL が直接フェッチされること', async () => {
    const customUrl = '/custom/races.json';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockRace],
    });
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useRaces({ dataUrl: customUrl }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledWith(customUrl, expect.any(Object));
    expect(result.current.races).toEqual([mockRace]);
  });

  it('年度が切り替わった際に未読み込み年度の Shard をオンデマンドフェッチしてマージすること', async () => {
    const race2027: Race = {
      ...mockRace,
      id: '2027-jra-g1-01',
      date: '2027-02-21',
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockRace],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [race2027],
      });
    globalThis.fetch = fetchMock;

    const { result } = renderHook(() => useRaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.races).toEqual([mockRace]);

    // 2027 年に月送り
    act(() => {
      useRaceStore.getState().setYearMonth({ year: 2027, month: 1 });
    });

    await waitFor(() => {
      expect(useRaceStore.getState().loadedYears).toContain(2027);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.BASE_URL}data/races-2027.json`,
      expect.any(Object)
    );
    expect(useRaceStore.getState().races).toHaveLength(2);
  });

  it('BroadcastChannel から CACHE_UPDATED を受信した際に自動で最新データが再フェッチされ Store に反映されること', async () => {
    const initialRace = { ...mockRace, name: { ja: '古いデータ', en: 'Old Race' } };
    const updatedRace = { ...mockRace, name: { ja: '最新データ', en: 'New Race' } };

    // 最初は initialRace を返し、2回目は updatedRace を返す
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [initialRace],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [updatedRace],
      });
    globalThis.fetch = fetchMock;

    // BroadcastChannel のモック
    let channelInstance: any;
    class MockBroadcastChannel {
      name: string;
      onmessage: ((ev: any) => void) | null = null;
      constructor(name: string) {
        this.name = name;
        channelInstance = this;
      }
      close() {}
    }
    // @ts-expect-error mock BroadcastChannel
    globalThis.BroadcastChannel = MockBroadcastChannel;

    const { result } = renderHook(() => useRaces());

    await waitFor(() => {
      expect(result.current.races[0]?.name.ja).toBe('古いデータ');
    });

    // Workbox からの CACHE_UPDATED メッセージ送信をシミュレート
    expect(channelInstance).toBeDefined();
    channelInstance.onmessage?.({
      data: {
        type: 'CACHE_UPDATED',
        meta: 'workbox-broadcast-update',
        payload: {
          cacheName: 'races-data-cache',
          updatedURL: '/data/races-2026.json',
        },
      },
    });

    // 自動再フェッチにより Store のデータが更新されること
    await waitFor(() => {
      expect(useRaceStore.getState().races[0]?.name.ja).toBe('最新データ');
    });
  });

  it('navigator.serviceWorker の message イベントから CACHE_UPDATED を受信した場合も自動更新されること', async () => {
    const initialRace = { ...mockRace, name: { ja: '初期データ', en: 'Initial' } };
    const updatedRace = { ...mockRace, name: { ja: '更新後データ', en: 'Updated' } };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [initialRace],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [updatedRace],
      });
    globalThis.fetch = fetchMock;

    let swMessageHandler: ((ev: any) => void) | null = null;
    const mockServiceWorker = {
      addEventListener: vi.fn((event: string, handler: any) => {
        if (event === 'message') {
          swMessageHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
      getRegistration: vi.fn().mockResolvedValue({ update: vi.fn() }),
    };

    Object.defineProperty(globalThis.navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true,
      configurable: true,
    });

    renderHook(() => useRaces());

    await waitFor(() => {
      expect(useRaceStore.getState().races[0]?.name.ja).toBe('初期データ');
    });

    // SW からのメッセージをシミュレート
    expect(swMessageHandler).toBeDefined();
    if (typeof swMessageHandler === 'function') {
      (swMessageHandler as (ev: any) => void)({
        data: {
          type: 'CACHE_UPDATED',
          meta: 'workbox-broadcast-update',
        },
      });
    }

    await waitFor(() => {
      expect(useRaceStore.getState().races[0]?.name.ja).toBe('更新後データ');
    });
  });

  describe('forceRefreshRaces & refreshRaces', () => {
    it('forceRefreshRaces は cache: "reload" と timestamp クエリを付与してフェッチし、Store と SW を更新して true を返すこと', async () => {
      const refreshedRace = { ...mockRace, name: { ja: '最新再取得レース', en: 'Refreshed Race' } };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [refreshedRace],
      });
      globalThis.fetch = fetchMock;

      const mockSwUpdate = vi.fn().mockResolvedValue(undefined);
      const mockServiceWorker = {
        getRegistration: vi.fn().mockResolvedValue({ update: mockSwUpdate }),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      Object.defineProperty(globalThis.navigator, 'serviceWorker', {
        value: mockServiceWorker,
        writable: true,
        configurable: true,
      });

      const { forceRefreshRaces } = await import('@/hooks/useRaces');
      const result = await forceRefreshRaces();

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/data\/races(-2026)?\.json\?t=\d+/),
        { cache: 'reload' }
      );
      expect(useRaceStore.getState().races[0]?.name.ja).toBe('最新再取得レース');
      expect(mockServiceWorker.getRegistration).toHaveBeenCalled();
      expect(mockSwUpdate).toHaveBeenCalled();
    });

    it('ネットワークエラー時に forceRefreshRaces は false を返し例外を握り潰すこと', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network failure'));
      globalThis.fetch = fetchMock;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { forceRefreshRaces } = await import('@/hooks/useRaces');
      const result = await forceRefreshRaces();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('useRaces hook の refreshRaces を呼び出すと forceRefreshRaces が実行されること', async () => {
      const refreshedRace = { ...mockRace, name: { ja: 'フック経由更新', en: 'Via Hook' } };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [refreshedRace],
      });
      globalThis.fetch = fetchMock;

      const { result } = renderHook(() => useRaces());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let refreshSuccess = false;
      await act(async () => {
        refreshSuccess = await result.current.refreshRaces();
      });
      expect(refreshSuccess).toBe(true);
      expect(useRaceStore.getState().races[0]?.name.ja).toBe('フック経由更新');
    });
  });
});
