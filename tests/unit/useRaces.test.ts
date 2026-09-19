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
});
