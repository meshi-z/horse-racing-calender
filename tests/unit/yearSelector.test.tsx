import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { YearSelector } from '@/components/shared/YearSelector';
import { useRaceStore } from '@/store/useRaceStore';
import { useLanguageStore } from '@/store/useLanguageStore';

describe('YearSelector component', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    useRaceStore.setState({
      selectedYear: 2026,
      availableYears: [2026, 2027],
      racesByYear: { 2026: [], 2027: [] },
      isLoadingYear: false,
    });
    useLanguageStore.setState({ language: 'ja' });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('初期選択年度（日本語: 2026年）が正しく表示されること', () => {
    render(<YearSelector />);
    const trigger = screen.getByTestId('year-selector');
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('2026年')).toBeInTheDocument();
  });

  it('英語・フランス語環境では "2026"、繁体字中国語では "2026年" と表示されること', () => {
    // 英語
    act(() => {
      useLanguageStore.setState({ language: 'en' });
    });
    const { rerender } = render(<YearSelector />);
    expect(screen.getByText('2026')).toBeInTheDocument();

    // フランス語
    act(() => {
      useLanguageStore.setState({ language: 'fr' });
    });
    rerender(<YearSelector />);
    expect(screen.getByText('2026')).toBeInTheDocument();

    // 繁体字中国語
    act(() => {
      useLanguageStore.setState({ language: 'zh' });
    });
    rerender(<YearSelector />);
    expect(screen.getByText('2026年')).toBeInTheDocument();
  });

  it('isLoadingYear が true の場合はセレクターが disabled になること', () => {
    useRaceStore.setState({ isLoadingYear: true });
    render(<YearSelector />);
    const triggerButton = screen.getByRole('combobox');
    expect(triggerButton).toBeDisabled();
  });

  it('年度を変更した際に setSelectedYear が呼び出され Store が更新されること', async () => {
    render(<YearSelector />);
    const triggerButton = screen.getByRole('combobox');

    // SelectTrigger をクリックして展開
    fireEvent.click(triggerButton);

    // 2027年のオプションを待機・選択
    await waitFor(() => {
      const option2027 = screen.getByRole('option', { name: '2027年' });
      expect(option2027).toBeInTheDocument();
      fireEvent.click(option2027);
    });

    expect(useRaceStore.getState().selectedYear).toBe(2027);
  });
});
