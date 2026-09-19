import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GradeBadge } from "./GradeBadge";
import { RaceDetailDialog } from "./RaceDetailDialog";
import { formatLocalDate, formatRaceTimeDisplay, getTodayLocalDateString } from "@/libs/date";
import type { Race } from "@/types/race";
import { cn } from "@/libs/utils";
import { Calendar, Clock, MapPin } from "lucide-react";

export interface RaceCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  race: Race;
  isToday?: boolean;
  onSelect?: (race: Race) => void;
}

const trackTypeLabels: Record<Race["track_type"], string> = {
  turf: "芝",
  dirt: "ダート",
  obstacle: "障害",
};

const sexConstraintShortLabels: Record<Race["sex_constraint"], string | null> = {
  filly_and_mare: "牝",
  colt_and_filly: "牡・牝",
  none: null,
};

const ageConstraintShortLabels: Record<Race["age_constraint"], string> = {
  "2yo": "2歳",
  "3yo": "3歳",
  "3yo_and_up": "3歳上",
  "4yo_and_up": "4歳上",
};

export const RaceCard = React.forwardRef<HTMLDivElement, RaceCardProps>(
  ({ race, isToday: isTodayProp, className, onSelect, ...props }, ref) => {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);

    const isToday = isTodayProp ?? (race.date === getTodayLocalDateString());
    const timeInfo = formatRaceTimeDisplay(race.start_time);
    const formattedDate = formatLocalDate(race.date);
    const sexTag = sexConstraintShortLabels[race.sex_constraint];

    const handleClick = () => {
      onSelect?.(race);
      setIsDialogOpen(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <>
        <Card
          ref={ref}
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-label={`${race.name.ja}${race.is_rescheduled ? "（代替開催）" : ""} 詳細を表示`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "group relative cursor-pointer transition-all duration-150 hover:shadow-md hover:border-primary/50",
            race.is_rescheduled && "border-amber-200 dark:border-amber-900/50 bg-amber-50/10",
            isToday && "ring-2 ring-primary/80 border-primary/40 bg-primary/[0.02] dark:bg-primary/[0.04]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
          {...props}
        >
          <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
            {/* 上部: 開催日・発走時刻・発走予定バッジ・代替開催バッジ */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium flex-wrap">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formattedDate}</span>
                {isToday && (
                  <Badge
                    variant="default"
                    className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground font-semibold"
                  >
                    本日開催
                  </Badge>
                )}
                {race.is_rescheduled && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 font-semibold"
                  >
                    代替開催
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">{timeInfo.time}</span>
                {timeInfo.statusLabel && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {timeInfo.statusLabel}
                  </Badge>
                )}
              </div>
            </div>

            {/* 代替開催時の元日程案内 */}
            {race.is_rescheduled && race.original_date && (
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium -mt-1 flex items-center gap-1">
                <span>当初予定: {formatLocalDate(race.original_date)} から順延</span>
              </div>
            )}

            {/* 中部: グレードバッジ & レース名 */}
            <div className="flex items-start gap-2.5">
              <div className="pt-0.5 shrink-0">
                <GradeBadge grade={race.grade} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-base sm:text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {race.name.ja}
                </h4>
                <p className="text-xs text-muted-foreground truncate">{race.name.en}</p>
              </div>
            </div>

            {/* 下部: コース・馬場・距離・条件タグ */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{race.course.ja}</span>
                <span className="text-muted-foreground">・</span>
                <span>
                  {trackTypeLabels[race.track_type]} {race.distance}m
                </span>
              </div>

              {/* 条件タグ */}
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-normal">
                  {ageConstraintShortLabels[race.age_constraint]}
                </Badge>
                {sexTag && (
                  <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-normal">
                    {sexTag}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-normal">
                  {race.handicap.ja}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* レース詳細モーダルダイアログ */}
        <RaceDetailDialog
          race={race}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </>
    );
  }
);
RaceCard.displayName = "RaceCard";
