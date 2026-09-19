import * as React from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/libs/utils';
import { useTranslation } from '@/libs/i18n';

export interface OfflineIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * オフライン状態およびオンライン復帰をユーザーに通知するインジケーターコンポーネント
 */
export function OfflineIndicator({ className, ...props }: OfflineIndicatorProps) {
  const { t } = useTranslation();
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = React.useState(false);

  React.useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'w-full py-1.5 px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors duration-200',
        !isOnline
          ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-b border-amber-500/30'
          : 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-b border-emerald-500/30',
        className
      )}
      {...props}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{t('offline.status')}</span>
        </>
      ) : (
        <>
          <Wifi className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{t('offline.reconnected')}</span>
        </>
      )}
    </div>
  );
}
