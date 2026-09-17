import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfflineIndicator } from '@/components/shared/OfflineIndicator';

describe('OfflineIndicator', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('オンライン時はインジケーターが表示されないこと', () => {
    const { container } = render(<OfflineIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it('オフラインイベント受信時にオフライン警告が表示されること', () => {
    render(<OfflineIndicator />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveTextContent('オフライン表示中（キャッシュされたレースデータを表示しています）');
  });

  it('復帰時にオンライン復帰メッセージが表示されること', () => {
    render(<OfflineIndicator />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText(/オフライン表示中/)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.getByText(/オンラインに復帰しました/)).toBeInTheDocument();
  });
});
