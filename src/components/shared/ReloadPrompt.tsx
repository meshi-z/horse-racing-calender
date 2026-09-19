import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { useTranslation } from '@/libs/i18n';

/**
 * PWAのオフライン準備完了および新しいバージョン検知時の更新案内コンポーネント
 */
export function ReloadPrompt() {
  const { t } = useTranslation();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('SW Registered:', r);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border bg-card p-4 shadow-lg text-card-foreground flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs">
          {offlineReady ? (
            <span>{t('pwa.ready')}</span>
          ) : (
            <span>{t('pwa.updateAvailable')}</span>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          className="text-muted-foreground hover:text-foreground rounded-sm p-0.5"
          aria-label={t('pwa.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {needRefresh && (
        <div className="flex justify-end gap-2 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2.5"
            onClick={close}
          >
            {t('pwa.later')}
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs px-2.5 gap-1"
            onClick={() => void updateServiceWorker(true)}
          >
            <RefreshCw className="h-3 w-3" />
            {t('pwa.update')}
          </Button>
        </div>
      )}
    </div>
  );
}
