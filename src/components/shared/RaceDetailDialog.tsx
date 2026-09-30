import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GradeBadge } from "./GradeBadge";
import { ConfirmedTimeHelpDialog } from "./ConfirmedTimeHelpDialog";
import { Badge } from "@/components/ui/badge";
import { formatLocalDate, formatRaceTimeDisplay } from "@/libs/date";
import {
  useTranslation,
  trackTypeLabels,
  sexConstraintLabels,
  ageConstraintLabels,
} from "@/libs/i18n";
import { getRaceDisplayNames } from "@/libs/raceLanguage";
import type { Race } from "@/types/race";
import { cn } from "@/libs/utils";
import { Calendar, Clock, MapPin, AlertTriangle, HelpCircle, Trophy, ExternalLink } from "lucide-react";
import { getOfficialRaceUrl, getOfficialSourceLabel, ENABLE_OFFICIAL_LINKS } from "@/libs/officialUrl";

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

  const timeInfo = formatRaceTimeDisplay(race.start_time, race.is_time_confirmed, undefined, language);
  const formattedDate = formatLocalDate(race.date, language);

  const { primary: primaryName, secondary: secondaryName } = getRaceDisplayNames(race, language);
  const coursePrimary = race.course[language] || race.course.en || race.course.ja;
  const courseSecondary = language === "ja" ? race.course.en : race.course.ja;
  const trackLabel = trackTypeLabels[language][race.track_type];
  const sexLabel = sexConstraintLabels[language][race.sex_constraint].full;
  const ageLabel = ageConstraintLabels[language][race.age_constraint].full;
  const handicapLabel = race.handicap[language as 'ja' | 'en'] || race.handicap.en;

  const winnerPrimaryName = race.winner
    ? (race.winner.name[language] || race.winner.name.en || race.winner.name.ja)
    : "";
  const winnerSecondaryName = race.winner
    ? (language === "ja"
        ? (race.winner.name.en !== winnerPrimaryName ? race.winner.name.en : "")
        : (race.winner.name.ja !== winnerPrimaryName ? race.winner.name.ja : ""))
    : "";
  const winnerJockey = race.winner?.jockey
    ? (race.winner.jockey[language] || race.winner.jockey.en || race.winner.jockey.ja)
    : undefined;

  const officialUrl = getOfficialRaceUrl(race, language);
  const officialSourceLabel = getOfficialSourceLabel(race.organization, language);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <GradeBadge grade={race.grade} />
            {race.country_code && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-5 font-bold tracking-wider",
                  race.country_code === "FR"
                    ? "border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40"
                    : race.country_code === "GB"
                    ? "border-sky-500/40 text-sky-800 dark:text-sky-300 bg-sky-50/60 dark:bg-sky-950/40"
                    : race.country_code === "US"
                    ? "border-blue-600/40 text-blue-800 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40"
                    : race.country_code === "HK"
                    ? "border-red-600/40 text-red-800 dark:text-red-300 bg-red-50/60 dark:bg-red-950/40"
                    : race.country_code === "IE"
                    ? "border-green-600/40 text-green-800 dark:text-green-300 bg-green-50/60 dark:bg-green-950/40"
                    : "border-slate-500/40 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/40"
                )}
              >
                {race.country_code}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 h-5 font-bold tracking-wider",
                race.organization === "jra"
                  ? "border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                  : race.organization === "france_galop"
                  ? "border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30"
                  : race.organization === "bha"
                  ? "border-sky-500/40 text-sky-800 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-950/30"
                  : race.organization === "equibase"
                  ? "border-blue-600/40 text-blue-800 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30"
                  : race.organization === "hkjc"
                  ? "border-red-600/40 text-red-800 dark:text-red-300 bg-red-50/50 dark:bg-red-950/30"
                  : race.organization === "hri"
                  ? "border-green-600/40 text-green-800 dark:text-green-300 bg-green-50/50 dark:bg-green-950/30"
                  : "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30"
              )}
            >
              {race.organization === "jra"
                ? language === "en" ? "JRA" : language === "fr" ? "JRA (Japon)" : "JRA (中央)"
                : race.organization === "france_galop"
                ? language === "ja" ? "France Galop (フランス)" : "France Galop"
                : race.organization === "bha"
                ? language === "ja" ? "BHA (イギリス)" : language === "fr" ? "BHA (Royaume-Uni)" : "BHA (UK)"
                : race.organization === "equibase"
                ? language === "ja" ? "Equibase (アメリカ)" : language === "fr" ? "Equibase (États-Unis)" : "Equibase (USA)"
                : race.organization === "hkjc"
                ? language === "ja" ? "HKJC (香港)" : language === "fr" ? "HKJC (Hong Kong)" : "HKJC (Hong Kong)"
                : race.organization === "hri"
                ? language === "ja" ? "HRI (アイルランド)" : language === "fr" ? "HRI (Irlande)" : language === "zh" ? "HRI (愛爾蘭)" : "HRI (Ireland)"
                : language === "en" ? "NAR" : language === "fr" ? "NAR (Japon Régional)" : "地方競馬 (NAR)"}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {primaryName}
          </DialogTitle>
          <div className="flex flex-col gap-0.5">
            {secondaryName && (
              <DialogDescription className="text-xs text-muted-foreground">
                {secondaryName}
              </DialogDescription>
            )}
            {race.name.fr && race.name.fr !== primaryName && race.name.fr !== secondaryName && (
              <span className="text-xs text-muted-foreground/80 italic font-serif">
                原語 (FR): {race.name.fr}
              </span>
            )}
            {race.name.zh && race.name.zh !== primaryName && race.name.zh !== secondaryName && (
              <span className="text-xs text-muted-foreground/80 font-sans">
                原語 (ZH): {race.name.zh}
              </span>
            )}
          </div>
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
            {timeInfo.isConfirmed ? (
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
            ) : (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-xs sm:text-sm">{t("status.timeTbd")}</span>
                </div>
                <ConfirmedTimeHelpDialog>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm font-normal cursor-pointer"
                  >
                    <HelpCircle className="h-3 w-3 shrink-0" />
                    <span>{t("confirmedTimeHelp.triggerShort")}</span>
                  </button>
                </ConfirmedTimeHelpDialog>
              </div>
            )}
          </div>

          {/* レース結果 / 優勝馬セクション */}
          {race.winner && (
            <div
              className="rounded-lg border border-amber-300/80 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-2.5"
              data-testid="race-winner-section"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{t("winner.resultTitle")}</span>
                </div>
                {race.winner.horse_number !== undefined && (
                  <Badge
                    variant="outline"
                    className="text-[11px] px-2 py-0 h-5 font-bold border-amber-400/80 text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/40"
                  >
                    {t("winner.numberFormat", { number: race.winner.horse_number })}
                  </Badge>
                )}
              </div>

              <div className="space-y-0.5">
                <div className="text-lg font-extrabold text-foreground tracking-tight">
                  {winnerPrimaryName}
                </div>
                {winnerSecondaryName && (
                  <div className="text-xs text-muted-foreground">{winnerSecondaryName}</div>
                )}
              </div>

              {(winnerJockey || race.winner.time) && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/50 text-xs">
                  {winnerJockey && (
                    <div>
                      <span className="text-muted-foreground mr-1.5">{t("winner.jockey")}:</span>
                      <span className="font-semibold text-foreground">{winnerJockey}</span>
                    </div>
                  )}
                  {race.winner.time && (
                    <div>
                      <span className="text-muted-foreground mr-1.5">{t("winner.time")}:</span>
                      <span className="font-mono font-semibold text-foreground">{race.winner.time}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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

          {/* 主催者公式出馬表・レース情報リンク (仕様見直し・改修期間中は一時非表示: Issue #155) */}
          {ENABLE_OFFICIAL_LINKS && officialUrl && (
            <div className="pt-1">
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all group",
                  "bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/20 dark:hover:bg-primary/25",
                  "border border-primary/25 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label={t("card.officialLinkAria", { name: primaryName })}
                data-testid="official-race-link-btn"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span>{t("dialog.viewOfficialCard")}</span>
                    <ExternalLink className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {officialSourceLabel}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 h-6 font-semibold bg-background/80 dark:bg-background/40 border-primary/30 text-primary shrink-0"
                >
                  公式 ↗
                </Badge>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
