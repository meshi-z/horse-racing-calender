import * as React from "react";
import { RaceCard } from "@/components/shared/RaceCard";
import { Button } from "@/components/ui/button";
import { formatLocalDate, findUpcomingOrLatestDate, getTodayLocalDateString } from "@/libs/date";
import { useRaceStore } from "@/store/useRaceStore";
import type { Race } from "@/types/race";
import { CalendarDays, RotateCcw } from "lucide-react";
import { cn } from "@/libs/utils";

export interface TimelineViewProps {
  races: Race[];
  className?: string;
}

interface GroupedRaces {
  date: string;
  formattedDate: string;
  races: Race[];
}

/**
 * レース一覧を開催日昇順でグループ化するヘルパー
 */
function groupRacesByDate(races: Race[]): GroupedRaces[] {
  // 日付昇順（同日の場合は発走時刻昇順）でソート
  const sortedRaces = [...races].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.start_time.localeCompare(b.start_time);
  });

  const groupsMap = new Map<string, Race[]>();
  for (const race of sortedRaces) {
    const list = groupsMap.get(race.date);
    if (list) {
      list.push(race);
    } else {
      groupsMap.set(race.date, [race]);
    }
  }

  const result: GroupedRaces[] = [];
  for (const [date, groupedRaces] of groupsMap.entries()) {
    result.push({
      date,
      formattedDate: formatLocalDate(date),
      races: groupedRaces,
    });
  }

  return result;
}

/**
 * タイムラインビューコンポーネント (PRD 4.1, 4.2 準拠)
 * モバイル閲覧を主眼とし、開催日ごとにグループ化した時系列リストを表示する。
 */
export function TimelineView({ races, className }: TimelineViewProps) {
  const resetFilters = useRaceStore((state) => state.resetFilters);
  const hasScrolledRef = React.useRef(false);

  const groupedRaces = React.useMemo(() => groupRacesByDate(races), [races]);
  const todayStr = React.useMemo(() => getTodayLocalDateString(), []);

  const dates = React.useMemo(() => groupedRaces.map((g) => g.date), [groupedRaces]);
  const targetDate = React.useMemo(() => findUpcomingOrLatestDate(dates, todayStr), [dates, todayStr]);

  const [isTargetVisible, setIsTargetVisible] = React.useState(true);

  // タイムラインビュー表示時に今日または直近・次のレースへ自動スクロール (Issue #6)
  React.useEffect(() => {
    if (hasScrolledRef.current || !targetDate) {
      return;
    }

    const element = document.getElementById(`section-date-${targetDate}`);
    if (element) {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      const timer = setTimeout(() => {
        element.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      }, 0);

      hasScrolledRef.current = true;
      return () => clearTimeout(timer);
    }
  }, [targetDate]);

  // ターゲット日付セクションの画面内表示状態を監視し、ボタンの表示/非表示を制御 (Issue #9)
  React.useEffect(() => {
    if (!targetDate) {
      setIsTargetVisible(true);
      return;
    }

    const element = document.getElementById(`section-date-${targetDate}`);
    if (!element) {
      setIsTargetVisible(false);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTargetVisible(entry.isIntersecting);
      },
      {
        rootMargin: "-5% 0px -5% 0px",
        threshold: 0,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [targetDate, groupedRaces]);

  const handleJumpToTarget = () => {
    if (!targetDate) return;
    const element = document.getElementById(`section-date-${targetDate}`);
    if (element) {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  // 空状態（0件）表示
  if (races.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "rounded-xl border border-dashed p-12 text-center text-muted-foreground space-y-4",
          className
        )}
      >
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            該当するレースがありません
          </h3>
          <p className="text-sm text-muted-foreground">
            検索キーワードやフィルター条件を変更するか、条件のリセットをお試しください。
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>フィルターをリセット</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-8", className)}
      role="feed"
      aria-busy="false"
      aria-label="重賞レース タイムライン"
    >
      {groupedRaces.map(({ date, formattedDate, races: dateRaces }) => {
        const isToday = date === todayStr;

        return (
          <section
            key={date}
            id={`section-date-${date}`}
            aria-labelledby={`heading-date-${date}`}
            style={{
              scrollMarginTop: "calc(3.5rem + var(--filterbar-height, 0px) + 0.75rem)",
            }}
            className="scroll-mt-16 sm:scroll-mt-20 space-y-3"
          >
            {/* 日付ヘッダー */}
            <div
              style={{
                top: "calc(3.5rem + var(--filterbar-height, 0px))",
              }}
              className={cn(
                "sticky z-20 -mx-4 px-4 py-2 backdrop-blur border-b",
                isToday
                  ? "bg-primary/[0.08] supports-[backdrop-filter]:bg-primary/[0.06] border-primary/30 dark:bg-primary/[0.12] dark:supports-[backdrop-filter]:bg-primary/[0.10]"
                  : "bg-background/90 supports-[backdrop-filter]:bg-background/70 border-border/40"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full transition-all",
                    isToday
                      ? "h-2.5 w-2.5 bg-primary ring-4 ring-primary/25"
                      : "h-2 w-2 bg-primary"
                  )}
                  aria-hidden="true"
                />
                <h3
                  id={`heading-date-${date}`}
                  className={cn(
                    "text-sm sm:text-base font-bold tracking-tight flex items-center gap-2",
                    isToday ? "text-primary dark:text-primary" : "text-foreground"
                  )}
                >
                  <span>{formattedDate}</span>
                  {isToday && (
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full leading-none shadow-2xs">
                      本日開催
                    </span>
                  )}
                </h3>
                <span className="text-xs text-muted-foreground font-normal">
                  ({dateRaces.length}レース)
                </span>
              </div>
            </div>

            {/* その日のレースカード一覧 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dateRaces.map((race) => (
                <RaceCard key={race.id} race={race} isToday={isToday} />
              ))}
            </div>
          </section>
        );
      })}

      {/* 今日（または直近レース）へ戻るジャンプボタン (Issue #9) */}
      {targetDate && races.length > 0 && (
        <div
          data-testid="jump-to-today-container"
          className={cn(
            "fixed bottom-6 right-6 z-30 transition-all duration-300",
            isTargetVisible
              ? "opacity-0 pointer-events-none translate-y-4 scale-95"
              : "opacity-100 pointer-events-auto translate-y-0 scale-100"
          )}
        >
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleJumpToTarget}
            aria-label={targetDate === todayStr ? "今日開催のレースへジャンプ" : "直近のレースへジャンプ"}
            className="gap-1.5 shadow-lg rounded-full px-3.5 h-9 sm:h-10 text-xs sm:text-sm font-semibold hover:shadow-xl transition-all"
          >
            <CalendarDays className="h-4 w-4" />
            <span>{targetDate === todayStr ? "今日へ戻る" : "直近のレースへ"}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
