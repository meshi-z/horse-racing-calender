import * as React from 'react';
import { useToastStore } from '@/store/useToastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/libs/utils';

export interface ToasterProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * アプリケーション全体の通知メッセージを控えめにポップアップ表示する軽量トーストコンポーネント
 */
export function Toaster({ className, ...props }: ToasterProps) {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className={cn(
        'fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none items-center max-w-sm w-full px-4',
        className
      )}
      {...props}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 shadow-lg backdrop-blur text-xs font-medium transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 w-full sm:w-auto min-w-[280px]',
            toast.type === 'success' &&
              'bg-card/95 border-emerald-500/40 text-card-foreground shadow-emerald-500/10',
            toast.type === 'error' &&
              'bg-destructive/10 border-destructive/40 text-destructive shadow-destructive/10',
            toast.type === 'info' &&
              'bg-card/95 border-border text-card-foreground'
          )}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            {toast.type === 'info' && (
              <Info className="h-4 w-4 shrink-0 text-primary" />
            )}
            <span className="leading-snug">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground hover:text-foreground rounded p-0.5 shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="閉じる"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
