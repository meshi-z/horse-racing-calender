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
import type { Race } from "@/types/race";
import { Calendar, Clock, MapPin, AlertTriangle } from "lucide-react";

export interface RaceDetailDialogProps {
  race: Race | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const trackTypeLabels: Record<Race["track_type"], string> = {
  turf: "芝",
  dirt: "ダート",
  obstacle: "障害",
};

const sexConstraintLabels: Record<Race["sex_constraint"], string> = {
  filly_and_mare: "牝馬限定",
  colt_and_filly: "牡・牝",
  none: "性別不問（制限なし）",
};

const ageConstraintLabels: Record<Race["age_constraint"], string> = {
  "2yo": "2歳",
  "3yo": "3歳",
  "3yo_and_up": "3歳以上",
  "4yo_and_up": "4歳以上",
};

export function RaceDetailDialog({
  race,
  open,
  onOpenChange,
}: RaceDetailDialogProps) {
  if (!race) return null;

  const timeInfo = formatRaceTimeDisplay(race.start_time);
  const formattedDate = formatLocalDate(race.date);

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
            {race.name.ja}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {race.name.en}
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
                  代替開催
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
                <div className="font-semibold">悪天候等による代替開催（日程変更）</div>
                <p className="text-amber-700 dark:text-amber-300/90">
                  {race.original_date ? (
                    <>当初開催予定日：<strong>{formatLocalDate(race.original_date)}</strong> より変更されました。</>
                  ) : (
                    <>当初の予定日程から変更されました。</>
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
                <span>開催場</span>
              </div>
              <div className="font-medium">{race.course.ja}</div>
              <div className="text-xs text-muted-foreground">{race.course.en}</div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground mb-1">馬場・距離</div>
              <div className="font-medium">
                {trackTypeLabels[race.track_type]} {race.distance}m
              </div>
            </div>
          </div>

          {/* 出走条件 */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">出走条件・負担重量</div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">
                {ageConstraintLabels[race.age_constraint]}
              </Badge>
              <Badge variant="secondary">
                {sexConstraintLabels[race.sex_constraint]}
              </Badge>
              <Badge variant="outline">
                斤量: {race.handicap.ja}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
