import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GradeBadge } from "./GradeBadge";
import { RaceDetailDialog } from "./RaceDetailDialog";
import { formatLocalDate, formatRaceTimeDisplay, getTodayLocalDateString } from "@/libs/date";
import {
  useTranslation,
  trackTypeLabels,
  sexConstraintLabels,
  ageConstraintLabels,
} from "@/libs/i18n";
import type { Race } from "@/types/race";
import { cn } from "@/libs/utils";
import { Calendar, Clock, MapPin } from "lucide-react";

export interface RaceCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  race: Race;
  isToday?: boolean;
  onSelect?: (race: Race) => void;
}

export const RaceCard = React.forwardRef<HTMLDivElement, RaceCardProps>(
  ({ race, isToday: isTodayProp, className, onSelect, ...props }, ref) => {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const { language, t } = useTranslation();

    const isToday = isTodayProp ?? (race.date === getTodayLocalDateString());
    const timeInfo = formatRaceTimeDisplay(race.start_time, race.is_time_confirmed, undefined, language);
    const formattedDate = formatLocalDate(race.date, language);
    const sexTag = sexConstraintLabels[language][race.sex_constraint].short;
    const ageTag = ageConstraintLabels[language][race.age_constraint].short;
    const trackLabel = trackTypeLabels[language][race.track_type];

    const primaryName = language === "en" ? race.name.en : race.name.ja;
    const secondaryName = language === "en" ? race.name.ja : race.name.en;
    const courseName = race.course[language];
    const handicapName = race.handicap[language];

    const rescheduledTagText = language === "en" ? " (Rescheduled)" : "（代替開催）";
    const viewDetailText = language === "en" ? "View Details" : "詳細を表示";

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
          aria-label={`${primaryName}${race.is_rescheduled ? rescheduledTagText : ""} ${viewDetailText}`}
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
            {/* 上部: 主催者タグ・開催日・発走時刻・発走予定バッジ・代替開催バッジ */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium flex-wrap">
                {race.country_code && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-4 font-bold tracking-wider",
                      race.country_code === "FR"
                        ? "border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40"
                        : "border-slate-500/40 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/40"
                    )}
                  >
                    {race.country_code}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 font-bold tracking-wider",
                    race.organization === "jra"
                      ? "border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                      : race.organization === "france_galop"
                      ? "border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30"
                      : "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30"
                  )}
                >
                  {race.organization === "france_galop" ? "FRANCE GALOP" : race.organization.toUpperCase()}
                </Badge>
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formattedDate}</span>
                {isToday && (
                  <Badge
                    variant="default"
                    className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground font-semibold"
                  >
                    {t("timeline.todayBadge")}
                  </Badge>
                )}
                {race.is_rescheduled && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 font-semibold"
                  >
                    {t("timeline.rescheduledBadge")}
                  </Badge>
                )}
              </div>
              {timeInfo.isConfirmed ? (
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
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium text-[11px]">{t("status.timeTbd")}</span>
                </div>
              )}
            </div>

            {/* 代替開催時の元日程案内 */}
            {race.is_rescheduled && race.original_date && (
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium -mt-1 flex items-center gap-1">
                <span>
                  {t("card.postponedFrom", {
                    date: formatLocalDate(race.original_date, language),
                  })}
                </span>
              </div>
            )}

            {/* 中部: グレードバッジ & レース名 */}
            <div className="flex items-start gap-2.5">
              <div className="pt-0.5 shrink-0">
                <GradeBadge grade={race.grade} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-base sm:text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {primaryName}
                </h4>
                <p className="text-xs text-muted-foreground truncate">{secondaryName}</p>
              </div>
            </div>

            {/* 下部: コース・馬場・距離・条件タグ */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{courseName}</span>
                <span className="text-muted-foreground">・</span>
                <span>
                  {trackLabel} {race.distance}m
                </span>
              </div>

              {/* 条件タグ */}
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-normal">
                  {ageTag}
                </Badge>
                {sexTag && (
                  <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-normal">
                    {sexTag}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-normal">
                  {handicapName}
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
