import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRaces } from '@/hooks/useRaces';
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

  beforeEach(() => {
    useRaceStore.setState({ races: [] });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('デフォルトで BASE_URL に応じた races.json をフェッチすること', async () => {
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

    const expectedUrl = `${import.meta.env.BASE_URL}data/races.json`;
    expect(fetchMock).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    expect(result.current.races).toEqual([mockRace]);
    expect(result.current.error).toBeNull();
  });

  it('フェッチ失敗時にエラー状態が設定されること', async () => {
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

  it('カスタム dataUrl オプションを指定した場合はその URL がフェッチされること', async () => {
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
          updatedURL: '/data/races.json',
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
});
