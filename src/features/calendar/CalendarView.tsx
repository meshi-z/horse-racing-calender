import * as React from "react";
import { GradeBadge } from "@/components/shared/GradeBadge";
import { RaceDetailDialog } from "@/components/shared/RaceDetailDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CALENDAR_WEEKDAYS,
  getCalendarDays,
  type CalendarDay,
} from "@/libs/calendar";
import { formatLocalTime } from "@/libs/date";
import { cn } from "@/libs/utils";
import { useRaceStore } from "@/store/useRaceStore";
import type { Race } from "@/types/race";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export interface CalendarViewProps {
  races: Race[];
  className?: string;
}

/**
 * 月間カレンダービューコンポーネント (PRD 4.1, 4.2 準拠)
 * デスクトップ/タブレット閲覧を主眼とし、月曜始まりの7列グリッドで当月の開催日程を俯瞰する。
 */
export function CalendarView({ races, className }: CalendarViewProps) {
  const currentYearMonth = useRaceStore((state) => state.currentYearMonth);
  const nextMonth = useRaceStore((state) => state.nextMonth);
  const prevMonth = useRaceStore((state) => state.prevMonth);
  const goToCurrentMonth = useRaceStore((state) => state.goToCurrentMonth);

  // 詳細ダイアログ管理
  const [selectedRace, setSelectedRace] = React.useState<Race | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // 月曜始まりのカレンダーグリッド日付配列を取得
  const calendarDays = React.useMemo(() => {
    return getCalendarDays(currentYearMonth.year, currentYearMonth.month);
  }, [currentYearMonth.year, currentYearMonth.month]);

  // 日付ごとのレース辞書（高速ルックアップ用）
  const racesByDate = React.useMemo(() => {
    const map = new Map<string, Race[]>();
    for (const race of races) {
      const list = map.get(race.date);
      if (list) {
        list.push(race);
      } else {
        map.set(race.date, [race]);
      }
    }
    // 各日付のレースを発走時刻順にソート
    for (const list of map.values()) {
      list.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return map;
  }, [races]);

  // 当月のレース総数
  const currentMonthRaceCount = React.useMemo(() => {
    return races.filter((race) => {
      const [y, m] = race.date.split("-");
      return (
        parseInt(y, 10) === currentYearMonth.year &&
        parseInt(m, 10) === currentYearMonth.month
      );
    }).length;
  }, [races, currentYearMonth.year, currentYearMonth.month]);

  const handleRaceSelect = (race: Race) => {
    setSelectedRace(race);
    setDialogOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, race: Race) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleRaceSelect(race);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* ナビゲーションヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={prevMonth}
              aria-label="前月へ"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={goToCurrentMonth}
              aria-label="今月へジャンプ"
            >
              今月
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={nextMonth}
              aria-label="翌月へ"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              {currentYearMonth.year}年 {currentYearMonth.month}月
            </h2>
            <Badge variant="secondary" className="text-xs">
              {currentMonthRaceCount} レース
            </Badge>
          </div>
        </div>

        <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>月曜始まりカレンダー（土日連続表示）</span>
        </div>
      </div>

      {/* カレンダーテーブル */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {/* 曜日ヘッダー (月曜始まり) */}
        <div className="grid grid-cols-7 border-b text-center text-xs font-semibold bg-muted/40 py-2">
          {CALENDAR_WEEKDAYS.map((weekday, idx) => {
            const isSat = idx === 5;
            const isSun = idx === 6;
            return (
              <div
                key={weekday}
                className={cn(
                  "py-0.5",
                  isSat && "text-blue-600 dark:text-blue-400 font-bold",
                  isSun && "text-rose-600 dark:text-rose-400 font-bold"
                )}
                aria-label={`${weekday}曜日`}
              >
                {weekday}
              </div>
            );
          })}
        </div>

        {/* 7列グリッド */}
        <div
          role="grid"
          aria-label={`${currentYearMonth.year}年${currentYearMonth.month}月 カレンダー`}
          className="grid grid-cols-7 divide-x divide-y border-b"
        >
          {calendarDays.map((day: CalendarDay) => {
            const dayRaces = racesByDate.get(day.date) || [];
            const hasRaces = dayRaces.length > 0;

            return (
              <div
                key={day.date}
                role="gridcell"
                aria-label={`${day.year}年${day.month}月${day.day}日 ${hasRaces ? `${dayRaces.length}件のレース` : ""}`}
                className={cn(
                  "min-h-[105px] sm:min-h-[120px] p-1 sm:p-1.5 flex flex-col transition-colors",
                  !day.isCurrentMonth && "bg-muted/30 text-muted-foreground/50 opacity-60",
                  day.isCurrentMonth && "bg-background",
                  day.isToday && "ring-2 ring-primary ring-inset bg-primary/[0.03]"
                )}
              >
                {/* 日付ヘッダー（数字 & 本日バッジ） */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs font-medium px-1 rounded",
                      day.isToday && "bg-primary text-primary-foreground font-bold",
                      !day.isToday && day.isSaturday && day.isCurrentMonth && "text-blue-600 dark:text-blue-400 font-semibold",
                      !day.isToday && day.isSunday && day.isCurrentMonth && "text-rose-600 dark:text-rose-400 font-semibold"
                    )}
                  >
                    {day.day}
                  </span>
                  {hasRaces && (
                    <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
                      {dayRaces.length}件
                    </span>
                  )}
                </div>

                {/* 該当日のレース一覧 */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[120px] pr-0.5">
                  {dayRaces.map((race) => {
                    const localTime = formatLocalTime(race.start_time);
                    return (
                      <button
                        key={race.id}
                        type="button"
                        onClick={() => handleRaceSelect(race)}
                        onKeyDown={(e) => handleKeyDown(e, race)}
                        aria-haspopup="dialog"
                        aria-label={`${race.name.ja} 詳細を表示`}
                        className={cn(
                          "w-full text-left p-1 sm:p-1.5 rounded border border-border/80 bg-card hover:bg-accent hover:border-primary/50 transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "flex flex-col gap-0.5 shadow-2xs group"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <GradeBadge
                            grade={race.grade}
                            className="text-[9px] px-1 py-0 h-3.5 shrink-0"
                          />
                          {localTime && (
                            <span className="text-[10px] text-muted-foreground font-mono leading-none">
                              {localTime}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold leading-tight truncate group-hover:text-primary transition-colors">
                          {race.name.ja}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate hidden sm:block">
                          {race.course.ja} · {race.distance}m
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* レース詳細モーダル */}
      <RaceDetailDialog
        race={selectedRace}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
