import * as React from "react";
import { RaceCard } from "@/components/shared/RaceCard";
import { Button } from "@/components/ui/button";
import { formatLocalDate, findUpcomingOrLatestDate, getTodayLocalDateString } from "@/libs/date";
import { useTranslation } from "@/libs/i18n";
import { useRaceStore } from "@/store/useRaceStore";
import type { Language } from "@/store/useLanguageStore";
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
function groupRacesByDate(races: Race[], lang: Language): GroupedRaces[] {
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
      formattedDate: formatLocalDate(date, lang),
      races: groupedRaces,
    });
  }

  return result;
}

interface TimelineDateSectionProps {
  date: string;
  formattedDate: string;
  dateRaces: Race[];
  isToday: boolean;
  isTargetDate: boolean;
  isLazyEnabled: boolean;
  todayBadgeText: string;
  racesCountText: string;
}

/**
 * 日付ごとのレースセクションコンポーネント (Issue #180: 遅延描画・Windowing対応)
 * 画面外のセクションはカード本体をアンマウントして高さを保持し、DOMノード数を大幅に削減する。
 */
export const TimelineDateSection = React.memo(function TimelineDateSection({
  date,
  formattedDate,
  dateRaces,
  isToday,
  isTargetDate,
  isLazyEnabled,
  todayBadgeText,
  racesCountText,
}: TimelineDateSectionProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const measuredHeightRef = React.useRef<number | null>(null);

  // 初回マウント時、遅延無効時・ターゲット日付・または IntersectionObserver 非対応時は即時描画
  const [isVisible, setIsVisible] = React.useState(
    () => !isLazyEnabled || isTargetDate || typeof IntersectionObserver === "undefined"
  );

  // 1カードあたりの推定高さ: デスクトップ2列(md:grid-cols-2)で約150px、ヘッダー約45px
  const estimatedCardsHeight = React.useMemo(() => {
    const rows = Math.max(1, Math.ceil(dateRaces.length / 2));
    return rows * 150;
  }, [dateRaces.length]);

  const totalEstimatedHeight = measuredHeightRef.current ?? (estimatedCardsHeight + 50);

  React.useEffect(() => {
    if (!isLazyEnabled || typeof IntersectionObserver === "undefined") {
      return;
    }

    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // 画面外へ出た際に実測高さを記録してアンマウント
          if (element.offsetHeight > 0) {
            measuredHeightRef.current = element.offsetHeight;
          }
          setIsVisible(false);
        }
      },
      {
        rootMargin: "800px 0px 800px 0px",
        threshold: 0,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isLazyEnabled]);

  return (
    <section
      ref={sectionRef}
      id={`section-date-${date}`}
      aria-labelledby={`heading-date-${date}`}
      aria-label={!isVisible ? formattedDate : undefined}
      style={{
        scrollMarginTop: "calc(3.5rem + var(--filterbar-height, 0px) + 0.75rem)",
        minHeight: isVisible ? undefined : `${totalEstimatedHeight}px`,
      }}
      className="scroll-mt-16 sm:scroll-mt-20 space-y-3"
    >
      {isVisible ? (
        <>
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
                    {todayBadgeText}
                  </span>
                )}
              </h3>
              <span className="text-xs text-muted-foreground font-normal">
                ({racesCountText})
              </span>
            </div>
          </div>

          {/* その日のレースカード一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dateRaces.map((race) => (
              <RaceCard key={race.id} race={race} isToday={isToday} />
            ))}
          </div>
        </>
      ) : (
        <div
          data-testid={`timeline-placeholder-${date}`}
          style={{ minHeight: `${totalEstimatedHeight}px` }}
          aria-hidden="true"
        />
      )}
    </section>
  );
});

/**
 * タイムラインビューコンポーネント (PRD 4.1, 4.2 準拠)
 * モバイル閲覧を主眼とし、開催日ごとにグループ化した時系列リストを表示する。
 */
export function TimelineView({ races, className }: TimelineViewProps) {
  const resetFilters = useRaceStore((state) => state.resetFilters);
  const selectedYear = useRaceStore((state) => state.selectedYear);
  const availableYears = useRaceStore((state) => state.availableYears);
  const loadedYears = useRaceStore((state) => state.loadedYears);
  const fetchRacesForYear = useRaceStore((state) => state.fetchRacesForYear);
  const setYearFromScroll = useRaceStore((state) => state.setYearFromScroll);
  const { language, t } = useTranslation();
  const lastScrolledYearRef = React.useRef<number | null>(null);
  const bottomSentinelRef = React.useRef<HTMLDivElement | null>(null);

  const groupedRaces = React.useMemo(() => groupRacesByDate(races, language), [races, language]);
  const todayStr = React.useMemo(() => getTodayLocalDateString(), []);

  const dates = React.useMemo(() => groupedRaces.map((g) => g.date), [groupedRaces]);
  const targetDate = React.useMemo(() => findUpcomingOrLatestDate(dates, todayStr), [dates, todayStr]);

  const [isTargetVisible, setIsTargetVisible] = React.useState(true);
  const isLazyEnabled = groupedRaces.length > 5;

  // タイムラインビュー表示時または年度切り替え時の自動スクロール
  // 現在年（システム年）であれば「今日/直近レース」、別年度であれば先頭レースへスクロール
  React.useEffect(() => {
    if (groupedRaces.length === 0) {
      return;
    }
    if (lastScrolledYearRef.current === selectedYear) {
      return;
    }

    const currentSystemYear = new Date().getFullYear();
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // 選択された年度内のレースを抽出
    const yearGroups = groupedRaces.filter(
      (g) => parseInt(g.date.slice(0, 4), 10) === selectedYear
    );
    const scrollTargetDate =
      selectedYear === currentSystemYear
        ? targetDate || yearGroups[0]?.date || groupedRaces[0]?.date
        : yearGroups[0]?.date || groupedRaces[0]?.date;

    if (scrollTargetDate) {
      const element = document.getElementById(`section-date-${scrollTargetDate}`);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "start",
          });
        }, 0);

        lastScrolledYearRef.current = selectedYear;
        return () => clearTimeout(timer);
      }
    }

    lastScrolledYearRef.current = selectedYear;
  }, [selectedYear, targetDate, groupedRaces]);

  // スクロール位置に応じて現在閲覧中の年度を検知し、URLおよびヘッダーの年度セレクターを同期
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || groupedRaces.length === 0) {
      return;
    }

    // 各年度の先頭要素（year-anchor）を監視して、スクロール位置に応じた年度セレクター/URL同期を行う
    const anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-year-anchor]"));
    if (anchors.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e?.isIntersecting && e?.target);
        if (visibleEntries.length > 0) {
          visibleEntries.sort(
            (a, b) => (a.boundingClientRect?.top ?? 0) - (b.boundingClientRect?.top ?? 0)
          );
          const topElement = visibleEntries[0]?.target as HTMLElement;
          const yearStr = topElement?.dataset.yearAnchor;
          const year = yearStr ? parseInt(yearStr, 10) : NaN;
          if (!isNaN(year) && year !== lastScrolledYearRef.current) {
            lastScrolledYearRef.current = year;
            setYearFromScroll(year);
          }
        }
      },
      {
        rootMargin: "-10% 0px -70% 0px",
        threshold: 0,
      }
    );

    anchors.forEach((anc) => observer.observe(anc));
    return () => observer.disconnect();
  }, [groupedRaces, setYearFromScroll]);

  // 末尾スクロール到達時の翌年度レース自動オンデマンドフェッチ
  React.useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          // 現在ロードされていない未来の年度が存在するかチェック
          const nextUnloadedYear = availableYears.find(
            (y) => !loadedYears.includes(y) && y > selectedYear
          );
          if (nextUnloadedYear) {
            fetchRacesForYear(nextUnloadedYear).catch(() => {
              // 取得失敗時は静かに握りつぶす
            });
          }
        }
      },
      {
        rootMargin: "600px 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [availableYears, loadedYears, selectedYear, fetchRacesForYear]);

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
            {t("timeline.noRacesTitle")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("timeline.noRacesDesc")}
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
            <span>{t("timeline.resetFilters")}</span>
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
      aria-label={t("timeline.ariaLabel")}
    >
      {groupedRaces.map(({ date, formattedDate, races: dateRaces }, idx) => {
        const isToday = date === todayStr;
        const isTargetDate = date === targetDate;
        const currentRaceYear = parseInt(date.slice(0, 4), 10);
        const prevRaceYear =
          idx > 0
            ? parseInt(groupedRaces[idx - 1].date.slice(0, 4), 10)
            : null;
        const isYearBoundary = prevRaceYear !== null && prevRaceYear !== currentRaceYear;
        const isFirstItemOfYear = idx === 0 || isYearBoundary;

        return (
          <React.Fragment key={date}>
            {/* 年度が切り替わる境界のディバイダー（例: 2026年12月 → 2027年1月） */}
            {isYearBoundary && (
              <div
                data-testid={`year-divider-${currentRaceYear}`}
                data-year-anchor={currentRaceYear}
                role="separator"
                aria-label={t("timeline.seasonHeader", { year: currentRaceYear })}
                className="my-10 flex items-center gap-4 py-2"
              >
                <div className="h-px flex-1 bg-border/60" />
                <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs sm:text-sm font-bold text-primary tracking-wide shadow-2xs">
                  {t("timeline.seasonHeader", { year: currentRaceYear })}
                </span>
                <div className="h-px flex-1 bg-border/60" />
              </div>
            )}

            {idx === 0 && (
              <div
                data-year-anchor={currentRaceYear}
                className="sr-only"
                aria-hidden="true"
              />
            )}

            <TimelineDateSection
              date={date}
              formattedDate={formattedDate}
              dateRaces={dateRaces}
              isToday={isToday}
              isTargetDate={isTargetDate}
              isLazyEnabled={isLazyEnabled}
              todayBadgeText={t("timeline.todayBadge")}
              racesCountText={t("timeline.racesCount", { count: dateRaces.length })}
            />
          </React.Fragment>
        );
      })}

      {/* スクロール末尾監視用センチネル（次年度オンデマンド読み込み用） */}
      <div
        ref={bottomSentinelRef}
        data-testid="timeline-bottom-sentinel"
        className="h-1 w-full"
        aria-hidden="true"
      />

      {/* 今日（または直近レース）へ戻るジャンプボタン (Issue #9) */}
      {targetDate && races.length > 0 && (
        <div
          data-testid="jump-to-today-container"
          className={cn(
            "fixed bottom-14 sm:bottom-16 right-4 sm:right-6 z-30 transition-all duration-300",
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
            aria-label={
              targetDate === todayStr
                ? t("timeline.jumpToTodayAria")
                : t("timeline.jumpToUpcomingAria")
            }
            className="gap-1.5 shadow-lg rounded-full px-3.5 h-9 sm:h-10 text-xs sm:text-sm font-semibold hover:shadow-xl transition-all"
          >
            <CalendarDays className="h-4 w-4" />
            <span>
              {targetDate === todayStr
                ? t("timeline.jumpToToday")
                : t("timeline.jumpToUpcoming")}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
