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

  // タイムラインビュー表示時に今日または直近・次のレースへ自動スクロール (Issue #6)
  React.useEffect(() => {
    if (hasScrolledRef.current || groupedRaces.length === 0) {
      return;
    }

    const dates = groupedRaces.map((g) => g.date);
    const targetDate = findUpcomingOrLatestDate(dates, todayStr);
    if (!targetDate) {
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
  }, [groupedRaces, todayStr]);

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
              className="sticky z-20 -mx-4 px-4 py-2 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border/40 transition-[top] duration-200"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isToday ? "bg-primary ring-2 ring-primary/30" : "bg-primary"
                  )}
                  aria-hidden="true"
                />
                <h3
                  id={`heading-date-${date}`}
                  className="text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2"
                >
                  <span>{formattedDate}</span>
                  {isToday && (
                    <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full leading-none">
                      今日
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
                <RaceCard key={race.id} race={race} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
