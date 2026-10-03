import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useToastStore, showToast } from '@/store/useToastStore';
import { Toaster } from '@/components/ui/toast';

describe('Toast notification system', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it('初期状態では何も表示されないこと', () => {
    const { container } = render(<Toaster />);
    expect(container.firstChild).toBeNull();
  });

  it('showToast を呼び出すと成功トーストが表示され、指定時間後に自動で消えること', () => {
    render(<Toaster />);

    act(() => {
      showToast('レースデータを最新に更新しました', 'success', 3000);
    });

    const toastMessage = screen.getByText('レースデータを最新に更新しました');
    expect(toastMessage).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    // 3秒経過で自動消去
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('レースデータを最新に更新しました')).not.toBeInTheDocument();
  });

  it('エラー通知トーストが表示され、閉じるボタンを押下すると即座に消去されること', () => {
    render(<Toaster />);

    act(() => {
      showToast('データの更新に失敗しました（オフライン）', 'error', 5000);
    });

    expect(screen.getByText('データの更新に失敗しました（オフライン）')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: '閉じる' });
    expect(closeBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByText('データの更新に失敗しました（オフライン）')).not.toBeInTheDocument();
  });

  it('複数のトーストが順次登録・表示できること', () => {
    render(<Toaster />);

    act(() => {
      showToast('通知1', 'info', 2000);
      showToast('通知2', 'success', 4000);
    });

    expect(screen.getByText('通知1')).toBeInTheDocument();
    expect(screen.getByText('通知2')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('通知1')).not.toBeInTheDocument();
    expect(screen.getByText('通知2')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('通知2')).not.toBeInTheDocument();
  });
});
