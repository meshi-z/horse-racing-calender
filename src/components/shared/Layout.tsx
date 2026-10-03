import * as React from "react";
import { Header } from "./Header";
import { OfflineIndicator } from "./OfflineIndicator";
import { ReloadPrompt } from "./ReloadPrompt";
import { PwaInstallPrompt } from "./PwaInstallPrompt";
import { DisclaimerDialog } from "./DisclaimerDialog";
import { ConfirmedTimeHelpDialog } from "./ConfirmedTimeHelpDialog";
import { Toaster } from "@/components/ui/toast";
import { useViewMode } from "@/hooks/useViewMode";
import { cn } from "@/libs/utils";
import { useTranslation } from "@/libs/i18n";

export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const { t } = useTranslation();
  const { viewMode } = useViewMode();
  const isTimeline = viewMode === "timeline";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <Header />
      <OfflineIndicator />
      <main className={cn("container flex-1 py-6 px-4 sm:px-6 space-y-6 max-w-full", isTimeline && "pb-16", className)}>
        {children}
        {isTimeline && (
          <div className="pt-6 pb-2 text-center text-[11px] text-muted-foreground/80 max-w-lg mx-auto leading-relaxed">
            <p>{t("footer.unofficialNotice")}</p>
          </div>
        )}
      </main>
      {isTimeline ? (
        <footer
          data-testid="timeline-fixed-footer"
          className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/90 supports-[backdrop-filter]:bg-background/80 backdrop-blur py-2.5 px-4 text-center text-xs text-muted-foreground shadow-xs"
        >
          <div className="container max-w-full px-2 sm:px-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>{t("footer.copyright")}</span>
            <span aria-hidden="true" className="text-muted-foreground/40">•</span>
            <ConfirmedTimeHelpDialog />
            <span aria-hidden="true" className="text-muted-foreground/40">•</span>
            <DisclaimerDialog />
          </div>
        </footer>
      ) : (
        <footer
          data-testid="standard-footer"
          className="border-t py-6 text-center text-xs text-muted-foreground bg-muted/20"
        >
          <div className="container px-4 sm:px-6 flex flex-col items-center gap-2">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>{t("footer.copyright")}</span>
              <span aria-hidden="true" className="text-muted-foreground/40">•</span>
              <ConfirmedTimeHelpDialog />
              <span aria-hidden="true" className="text-muted-foreground/40">•</span>
              <DisclaimerDialog />
            </div>
            <p className="text-[11px] text-muted-foreground/80 max-w-lg leading-relaxed">
              {t("footer.unofficialNotice")}
            </p>
          </div>
        </footer>
      )}
      <ReloadPrompt />
      <PwaInstallPrompt />
      <Toaster />
    </div>
  );
}
