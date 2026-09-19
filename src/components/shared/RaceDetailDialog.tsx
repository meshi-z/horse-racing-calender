import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GradeBadge } from "./GradeBadge";
import { Badge } from "@/components/ui/badge";
import { formatLocalDate, formatRaceTimeDisplay } from "@/libs/date";
import {
  useTranslation,
  trackTypeLabels,
  sexConstraintLabels,
  ageConstraintLabels,
} from "@/libs/i18n";
import type { Race } from "@/types/race";
import { Calendar, Clock, MapPin, AlertTriangle } from "lucide-react";

export interface RaceDetailDialogProps {
  race: Race | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RaceDetailDialog({
  race,
  open,
  onOpenChange,
}: RaceDetailDialogProps) {
  const { language, t } = useTranslation();

  if (!race) return null;

  const timeInfo = formatRaceTimeDisplay(race.start_time, undefined, language);
  const formattedDate = formatLocalDate(race.date, language);

  const primaryName = race.name[language];
  const secondaryName = race.name[language === "en" ? "ja" : "en"];
  const coursePrimary = race.course[language];
  const courseSecondary = race.course[language === "en" ? "ja" : "en"];
  const trackLabel = trackTypeLabels[language][race.track_type];
  const sexLabel = sexConstraintLabels[language][race.sex_constraint].full;
  const ageLabel = ageConstraintLabels[language][race.age_constraint].full;
  const handicapLabel = race.handicap[language];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <GradeBadge grade={race.grade} />
            <span className="text-xs text-muted-foreground uppercase font-mono">
              {race.organization}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {primaryName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {secondaryName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2 text-sm">
          {/* 日程・発走時刻 */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/40">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{formattedDate}</span>
              {race.is_rescheduled && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 font-semibold"
                >
                  {t("timeline.rescheduledBadge")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{timeInfo.time}</span>
              {timeInfo.statusLabel && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  {timeInfo.statusLabel}
                </Badge>
              )}
            </div>
          </div>

          {/* 代替開催の案内通知 */}
          {race.is_rescheduled && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold">{t("dialog.rescheduledTitle")}</div>
                <p className="text-amber-700 dark:text-amber-300/90">
                  {race.original_date ? (
                    <>
                      {t("dialog.rescheduledNoticeWithDate", {
                        date: formatLocalDate(race.original_date, language),
                      })}
                    </>
                  ) : (
                    <>{t("dialog.rescheduledNotice")}</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* コース情報 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{t("dialog.course")}</span>
              </div>
              <div className="font-medium">{coursePrimary}</div>
              <div className="text-xs text-muted-foreground">{courseSecondary}</div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground mb-1">
                {t("dialog.trackAndDistance")}
              </div>
              <div className="font-medium">
                {trackLabel} {race.distance}m
              </div>
            </div>
          </div>

          {/* 出走条件 */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">
              {t("dialog.eligibilityAndWeight")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">
                {ageLabel}
              </Badge>
              <Badge variant="secondary">
                {sexLabel}
              </Badge>
              <Badge variant="outline">
                {t("dialog.weightPrefix")}{handicapLabel}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
