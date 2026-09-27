import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, AlertTriangle, Info, Clock, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/libs/i18n";
import { cn } from "@/libs/utils";

export interface ConfirmedTimeHelpDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ScheduleRow {
  key: "jra" | "nar" | "france" | "uk" | "ireland" | "us" | "hk";
  countryCode: string;
  countryBadgeClass: string;
  orgBadgeClass: string;
}

const SCHEDULE_CONFIG: ScheduleRow[] = [
  {
    key: "jra",
    countryCode: "JP",
    countryBadgeClass: "border-slate-500/40 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/40",
    orgBadgeClass: "border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30",
  },
  {
    key: "nar",
    countryCode: "JP",
    countryBadgeClass: "border-slate-500/40 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/40",
    orgBadgeClass: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30",
  },
  {
    key: "france",
    countryCode: "FR",
    countryBadgeClass: "border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40",
    orgBadgeClass: "border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30",
  },
  {
    key: "uk",
    countryCode: "GB",
    countryBadgeClass: "border-sky-500/40 text-sky-800 dark:text-sky-300 bg-sky-50/60 dark:bg-sky-950/40",
    orgBadgeClass: "border-sky-500/40 text-sky-800 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-950/30",
  },
  {
    key: "ireland",
    countryCode: "IE",
    countryBadgeClass: "border-green-600/40 text-green-800 dark:text-green-300 bg-green-50/60 dark:bg-green-950/40",
    orgBadgeClass: "border-green-600/40 text-green-800 dark:text-green-300 bg-green-50/50 dark:bg-green-950/30",
  },
  {
    key: "us",
    countryCode: "US",
    countryBadgeClass: "border-blue-600/40 text-blue-800 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40",
    orgBadgeClass: "border-blue-600/40 text-blue-800 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30",
  },
  {
    key: "hk",
    countryCode: "HK",
    countryBadgeClass: "border-red-600/40 text-red-800 dark:text-red-300 bg-red-50/60 dark:bg-red-950/40",
    orgBadgeClass: "border-red-600/40 text-red-800 dark:text-red-300 bg-red-50/50 dark:bg-red-950/30",
  },
];

export function ConfirmedTimeHelpDialog({
  children,
  open,
  onOpenChange,
}: ConfirmedTimeHelpDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <button
            type="button"
            className="underline underline-offset-4 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {t("confirmedTimeHelp.trigger")}
          </button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="space-y-1.5 shrink-0 text-left">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary shrink-0" />
            <DialogTitle className="text-lg font-bold tracking-tight">
              {t("confirmedTimeHelp.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("confirmedTimeHelp.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-xs text-muted-foreground leading-relaxed">
          {/* 反映の仕組みの概要 */}
          <section className="rounded-lg border p-3.5 space-y-1.5 bg-muted/30 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>{t("confirmedTimeHelp.overviewTitle")}</span>
            </div>
            <p className="text-muted-foreground">
              {t("confirmedTimeHelp.overviewBody")}
            </p>
          </section>

          {/* 各国・主催者別確定スケジュール一覧 */}
          <section className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>{t("confirmedTimeHelp.tableHeaders.organization")} & {t("confirmedTimeHelp.tableHeaders.appTiming")}</span>
            </div>
            <div className="rounded-lg border overflow-hidden bg-card text-foreground">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-muted/60 text-muted-foreground font-medium">
                      <th className="py-2.5 px-3 whitespace-nowrap">
                        {t("confirmedTimeHelp.tableHeaders.organization")}
                      </th>
                      <th className="py-2.5 px-3 min-w-[140px]">
                        {t("confirmedTimeHelp.tableHeaders.officialTiming")}
                      </th>
                      <th className="py-2.5 px-3 min-w-[140px]">
                        {t("confirmedTimeHelp.tableHeaders.appTiming")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {SCHEDULE_CONFIG.map(({ key, countryCode, countryBadgeClass }) => (
                      <tr key={key} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 align-top">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] px-1.5 py-0 h-4 font-bold tracking-wider", countryBadgeClass)}
                              >
                                {countryCode}
                              </Badge>
                              <span className="font-semibold text-foreground text-xs">
                                {t(`confirmedTimeHelp.schedules.${key}.org`)}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {t(`confirmedTimeHelp.schedules.${key}.country`)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-top text-muted-foreground">
                          {t(`confirmedTimeHelp.schedules.${key}.official`)}
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <div className="flex items-start gap-1 font-medium text-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{t(`confirmedTimeHelp.schedules.${key}.app`)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 直前変更・悪天候に関する注意事項 */}
          <section className="rounded-lg border border-amber-200 dark:border-amber-900/50 p-3.5 space-y-1.5 bg-amber-50/50 dark:bg-amber-950/20 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t("confirmedTimeHelp.noticeTitle")}</span>
            </div>
            <p className="text-amber-900/80 dark:text-amber-200/80 text-[11px] sm:text-xs leading-relaxed">
              {t("confirmedTimeHelp.noticeBody")}
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
