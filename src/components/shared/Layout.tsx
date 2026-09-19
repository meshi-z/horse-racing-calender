import * as React from "react";
import { Header } from "./Header";
import { OfflineIndicator } from "./OfflineIndicator";
import { ReloadPrompt } from "./ReloadPrompt";
import { DisclaimerDialog } from "./DisclaimerDialog";
import { cn } from "@/libs/utils";
import { useTranslation } from "@/libs/i18n";

export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <Header />
      <OfflineIndicator />
      <main className={cn("container flex-1 py-6 px-4 sm:px-6 space-y-6", className)}>
        {children}
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground bg-muted/20">
        <div className="container px-4 sm:px-6 flex flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>{t("footer.copyright")}</span>
            <span aria-hidden="true" className="text-muted-foreground/40">•</span>
            <DisclaimerDialog />
          </div>
          <p className="text-[11px] text-muted-foreground/80 max-w-lg leading-relaxed">
            {t("footer.unofficialNotice")}
          </p>
        </div>
      </footer>
      <ReloadPrompt />
    </div>
  );
}
