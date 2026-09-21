import * as React from "react";
import { Layout } from "@/components/shared/Layout";
import { FilterBar } from "@/components/shared/FilterBar";
import { TimelineView } from "@/features/timeline/TimelineView";
import { CalendarView } from "@/features/calendar/CalendarView";
import { Skeleton } from "@/components/ui/skeleton";
import { useRaces } from "@/hooks/useRaces";
import { useViewMode } from "@/hooks/useViewMode";
import { useRaceStore, selectFilteredRaces } from "@/store/useRaceStore";
import { useTranslation } from "@/libs/i18n";
import { updatePwaMetadata } from "@/libs/pwaMetadata";
import { AlertCircle } from "lucide-react";

export function App() {
  const { isLoading, error } = useRaces();
  const { viewMode } = useViewMode();
  const { t, language } = useTranslation();
  const filteredRaces = useRaceStore(selectFilteredRaces);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.title = t("filter.appDocTitle");
      updatePwaMetadata(language);
    }
  }, [language, t]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* フィルターバー */}
        <FilterBar />

        {/* 状態表示: ローディングスケルトン */}
        {isLoading && (
          <div
            className="space-y-4"
            role="status"
            aria-live="polite"
            aria-label={t("filter.loadingRaces")}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-5 space-y-3 bg-card">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex gap-2.5 items-center">
                    <Skeleton className="h-5 w-10 rounded-full" />
                    <Skeleton className="h-6 w-40" />
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 状態表示: エラー */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive flex items-center justify-center gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{t("filter.loadError")}{error.message}</span>
          </div>
        )}

        {/* メインビュー表示 */}
        {!isLoading && !error && (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>{t("filter.matchedRaces").replace("{count}", String(filteredRaces.length))}</span>
              <span className="capitalize">
                {t("filter.viewModeLabel").replace(
                  "{mode}",
                  viewMode === "timeline"
                    ? t("filter.viewModeTimeline")
                    : t("filter.viewModeCalendar")
                )}
              </span>
            </div>

            {viewMode === "timeline" ? (
              <TimelineView races={filteredRaces} />
            ) : (
              <CalendarView races={filteredRaces} />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default App;
