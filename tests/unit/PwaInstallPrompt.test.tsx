import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PwaInstallPrompt } from '@/components/shared/PwaInstallPrompt';
import { useLanguageStore } from '@/store/useLanguageStore';

describe('PwaInstallPrompt Component', () => {
  const originalMatchMedia = window.matchMedia;
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    localStorage.clear();
    useLanguageStore.setState({ language: 'ja' });

    // デフォルト: 非スタンドアロン
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('スタンドアロンモード（すでにインストール済み）のときはバナーを表示しないこと', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<PwaInstallPrompt />);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('Dismiss済み（14日以内の履歴あり）の場合はバナーを表示しないこと', () => {
    localStorage.setItem('horse_racing_calendar_pwa_prompt_dismissed', String(Date.now() - 1000));

    render(<PwaInstallPrompt />);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('Android/Chromium環境でbeforeinstallpromptイベント発生時にインストールバナーが表示され、ボタン押下でprompt()が呼ばれること', async () => {
    const promptMock = vi.fn().mockResolvedValue(undefined);
    const mockEvent = new Event('beforeinstallprompt') as any;
    mockEvent.prompt = promptMock;
    mockEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });

    render(<PwaInstallPrompt />);

    // イベント発火前は非表示
    expect(screen.queryByRole('region')).toBeNull();

    // beforeinstallprompt イベント発火
    act(() => {
      window.dispatchEvent(mockEvent);
    });

    // バナーが表示される
    expect(screen.getByRole('region', { name: 'アプリをインストール' })).toBeInTheDocument();
    expect(screen.getByText('アプリをインストール')).toBeInTheDocument();
    expect(screen.getByText(/ホーム画面に追加すると、全画面かつオフラインでも快適にレース日程を確認できます。/)).toBeInTheDocument();

    const installBtn = screen.getByRole('button', { name: 'インストール' });
    expect(installBtn).toBeInTheDocument();

    // インストールボタンをクリック
    await act(async () => {
      fireEvent.click(installBtn);
    });

    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  it('iOS Safari環境でホーム画面追加ガイドが表示されること', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });

    render(<PwaInstallPrompt />);

    expect(screen.getByRole('region', { name: 'ホーム画面に追加' })).toBeInTheDocument();
    expect(screen.getByText('ホーム画面に追加')).toBeInTheDocument();
    expect(screen.getByText(/Safariの共有ボタンをタップし、「ホーム画面に追加」を選択するとアプリとしてご利用いただけます。/)).toBeInTheDocument();

    // iOSではブラウザネイティブのインストールボタンは表示されない
    expect(screen.queryByRole('button', { name: 'インストール' })).toBeNull();
  });

  it('閉じるボタン押下でバナーが非表示になり、localStorageにDismiss情報が記録されること', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });

    render(<PwaInstallPrompt />);

    const closeBtn = screen.getByRole('button', { name: 'インストール案内を閉じる' });
    expect(closeBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByRole('region')).toBeNull();
    const stored = localStorage.getItem('horse_racing_calendar_pwa_prompt_dismissed');
    expect(stored).not.toBeNull();
    expect(Number(stored)).toBeGreaterThan(0);
  });

  it('多言語切替時（en / fr）に適切な文言でレンダリングされること', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });

    // 英語
    useLanguageStore.setState({ language: 'en' });
    const { unmount } = render(<PwaInstallPrompt />);
    expect(screen.getByText('Add to Home Screen')).toBeInTheDocument();
    expect(screen.getByText(/Tap the share button in Safari/)).toBeInTheDocument();
    unmount();

    // フランス語
    useLanguageStore.setState({ language: 'fr' });
    render(<PwaInstallPrompt />);
    expect(screen.getByText("Ajouter à l'écran d'accueil")).toBeInTheDocument();
    expect(screen.getByText(/Appuyez sur le bouton Partager dans Safari/)).toBeInTheDocument();
  });
});
