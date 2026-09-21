import * as React from 'react';

const DISMISS_STORAGE_KEY = 'horse_racing_calendar_pwa_prompt_dismissed';
const DISMISS_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PwaInstallPromptState {
  isStandalone: boolean;
  isDismissed: boolean;
  isInstallable: boolean;
  isIosSafari: boolean;
  canShowPrompt: boolean;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
}

/**
 * 実行環境がスタンドアロン（PWA起動中）かどうかを判定
 */
export function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const isMatchMediaStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  // @ts-expect-error navigator.standalone is iOS Safari specific
  const isNavigatorStandalone = Boolean(window.navigator?.standalone);
  return isMatchMediaStandalone || isNavigatorStandalone;
}

/**
 * iOS Safari ブラウザ環境かどうかを判定
 */
export function checkIsIosSafari(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  const isIos = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
  const isWebKit = /WebKit/i.test(ua);
  const isOtherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);

  return isIos && isWebKit && !isOtherIosBrowser;
}

/**
 * 非表示（Dismiss）期間中かどうかを判定
 */
export function checkIsDismissed(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (isNaN(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

/**
 * PWAインストール促進案内の状態管理フック
 */
export function usePwaInstallPrompt(): PwaInstallPromptState {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(true);
  const [isIosSafari, setIsIosSafari] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone = checkIsStandalone();
    setIsStandalone(standalone);

    const dismissed = checkIsDismissed();
    setIsDismissed(dismissed);

    const iosSafari = checkIsIosSafari();
    setIsIosSafari(iosSafari);

    // スタンドアロンの場合はイベントリッスン不要
    if (standalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismiss = React.useCallback(() => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setIsDismissed(true);
  }, []);

  const promptInstall = React.useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch {
      // ignore
    }
  }, [deferredPrompt]);

  const isInstallable = Boolean(deferredPrompt);
  const canShowPrompt = !isStandalone && !isDismissed && (isInstallable || isIosSafari);

  return {
    isStandalone,
    isDismissed,
    isInstallable,
    isIosSafari,
    canShowPrompt,
    promptInstall,
    dismiss,
  };
}
