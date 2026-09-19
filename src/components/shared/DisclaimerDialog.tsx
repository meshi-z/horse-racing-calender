import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, AlertTriangle, ShieldAlert, Copyright, BarChart3 } from "lucide-react";
import { useTranslation } from "@/libs/i18n";

export interface DisclaimerDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DisclaimerDialog({
  children,
  open,
  onOpenChange,
}: DisclaimerDialogProps) {
  const { t } = useTranslation();

  const changesP2Text = t("disclaimer.changesP2");
  const changesP2StrongText = t("disclaimer.changesP2Strong");
  const p2Parts = changesP2Text.split(changesP2StrongText);

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
            {t("disclaimer.trigger")}
          </button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="space-y-1.5 shrink-0 text-left">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary shrink-0" />
            <DialogTitle className="text-lg font-bold tracking-tight">
              {t("disclaimer.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("disclaimer.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-xs text-muted-foreground leading-relaxed">
          {/* 非公式ファンサイト */}
          <section className="rounded-lg border p-3.5 space-y-1.5 bg-muted/30 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>{t("disclaimer.fanSiteTitle")}</span>
            </div>
            <p className="text-muted-foreground">
              {t("disclaimer.fanSiteBody")}
            </p>
          </section>

          {/* データの出典 */}
          <section className="rounded-lg border p-3.5 space-y-1.5 bg-muted/30 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>{t("disclaimer.dataSourceTitle")}</span>
            </div>
            <p className="text-muted-foreground">
              {t("disclaimer.dataSourceBody")}
            </p>
          </section>

          {/* 変更の可能性と免責 */}
          <section className="rounded-lg border border-amber-200 dark:border-amber-900/50 p-3.5 space-y-1.5 bg-amber-50/50 dark:bg-amber-950/20 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t("disclaimer.changesTitle")}</span>
            </div>
            <div className="space-y-1.5 text-amber-900/80 dark:text-amber-200/80">
              <p>
                {t("disclaimer.changesP1")}
              </p>
              <p>
                {p2Parts[0]}
                <strong>{changesP2StrongText}</strong>
                {p2Parts[1] || ""}
              </p>
              <p>
                {t("disclaimer.changesP3")}
              </p>
            </div>
          </section>

          {/* 権利・商標の帰属 */}
          <section className="rounded-lg border p-3.5 space-y-1.5 bg-muted/30 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Copyright className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{t("disclaimer.rightsTitle")}</span>
            </div>
            <p className="text-muted-foreground">
              {t("disclaimer.rightsBody")}
            </p>
          </section>

          {/* アクセス解析ツール（Google Analytics）について */}
          <section className="rounded-lg border p-3.5 space-y-1.5 bg-muted/30 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <BarChart3 className="h-4 w-4 text-primary shrink-0" />
              <span>{t("disclaimer.analyticsTitle")}</span>
            </div>
            <div className="space-y-1.5 text-muted-foreground">
              <p>
                {t("disclaimer.analyticsP1")}
              </p>
              <p>
                {t("disclaimer.analyticsP2")}
              </p>
              <p>
                {t("disclaimer.analyticsP3")}
              </p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
