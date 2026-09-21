import { usePwaInstallPrompt } from '@/hooks/usePwaInstallPrompt';
import { useTranslation } from '@/libs/i18n';
import { Button } from '@/components/ui/button';
import { Download, Share, X, Smartphone } from 'lucide-react';

export interface PwaInstallPromptProps {
  className?: string;
}

/**
 * PWAインストール促進案内（Androidインストールバナー & iOSホーム画面追加ガイド）
 */
export function PwaInstallPrompt({ className }: PwaInstallPromptProps) {
  const { t } = useTranslation();
  const {
    canShowPrompt,
    isInstallable,
    isIosSafari,
    promptInstall,
    dismiss,
  } = usePwaInstallPrompt();

  if (!canShowPrompt) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label={isIosSafari ? t('pwaPrompt.iosTitle') : t('pwaPrompt.title')}
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-40 rounded-xl border bg-card/95 backdrop-blur-sm p-4 shadow-xl text-card-foreground border-primary/20 animate-in fade-in slide-in-from-bottom-5 duration-300 ${className ?? ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
          {isIosSafari ? (
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Download className="h-5 w-5" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {isIosSafari ? t('pwaPrompt.iosTitle') : t('pwaPrompt.title')}
            </h2>
            <button
              type="button"
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground rounded-md p-1 -mr-1 transition-colors"
              aria-label={t('pwaPrompt.dismissAria')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {isIosSafari ? (
              <span>
                {t('pwaPrompt.iosDesc')}
                <span className="inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-muted text-[11px] font-medium align-middle">
                  <Share className="h-3 w-3 mr-0.5" aria-hidden="true" />
                  共有
                </span>
              </span>
            ) : (
              t('pwaPrompt.androidDesc')
            )}
          </p>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground"
              onClick={dismiss}
            >
              {t('pwaPrompt.dismiss')}
            </Button>

            {isInstallable && (
              <Button
                size="sm"
                className="h-7 text-xs px-3 gap-1.5 font-medium shadow-sm"
                onClick={promptInstall}
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                {t('pwaPrompt.installButton')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
