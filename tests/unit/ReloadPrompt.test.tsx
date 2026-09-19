import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReloadPrompt } from '@/components/shared/ReloadPrompt';
import { useLanguageStore } from '@/store/useLanguageStore';
import * as pwaRegister from 'virtual:pwa-register/react';

describe('ReloadPrompt', () => {
  beforeEach(() => {
    useLanguageStore.setState({ language: 'ja' });
  });

  it('更新やオフライン準備が完了していない時は何もレンダリングされないこと', () => {
    const { container } = render(<ReloadPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('更新が必要な場合、更新ボタンとダイアログが表示されること', () => {
    const updateFn = vi.fn();
    vi.spyOn(pwaRegister, 'useRegisterSW').mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, vi.fn()],
      updateServiceWorker: updateFn,
    });

    render(<ReloadPrompt />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/新しいバージョンが利用可能です/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /更新する/ })).toBeInTheDocument();
  });

  it('英語モードで更新案内とボタンが英語で表示されること', () => {
    useLanguageStore.setState({ language: 'en' });
    const updateFn = vi.fn();
    vi.spyOn(pwaRegister, 'useRegisterSW').mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, vi.fn()],
      updateServiceWorker: updateFn,
    });

    render(<ReloadPrompt />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/New version available. Update now to reflect the latest race schedule?/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Later' })).toBeInTheDocument();
  });
});
