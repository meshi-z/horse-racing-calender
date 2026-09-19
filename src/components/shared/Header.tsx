import * as React from "react";
import { useViewMode } from "@/hooks/useViewMode";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/libs/i18n";
import { trackEvent } from "@/libs/analytics";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, Languages, ListFilter, Moon, Sun } from "lucide-react";
import { cn } from "@/libs/utils";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {}

export function Header({ className, ...props }: HeaderProps) {
  const { viewMode, setViewMode } = useViewMode();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useTranslation();

  const handleToggleLanguage = () => {
    const nextLanguage = language === "ja" ? "en" : "ja";
    toggleLanguage();
    trackEvent("language_change", { from: language, to: nextLanguage });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      {...props}
    >
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* タイトル & ロゴ */}
        <div className="flex items-center gap-2.5">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            alt="重賞カレンダー ロゴ"
            className="h-8 w-8 rounded-lg shadow-sm object-cover"
            width={32}
            height={32}
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">
              {t("app.title")}
            </h1>
            <p className="hidden sm:block text-[10px] text-muted-foreground leading-none">
              {t("app.subtitle")}
            </p>
          </div>
        </div>

        {/* 表示モード切替 (Tabs) & コントロール群 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Tabs
            value={viewMode}
            onValueChange={(val) => setViewMode(val as "timeline" | "calendar")}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-2 h-8">
              <TabsTrigger value="timeline" className="gap-1 px-2.5 text-xs">
                <ListFilter className="h-3.5 w-3.5" />
                <span>{t("nav.timeline")}</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1 px-2.5 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <span>{t("nav.calendar")}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 言語切替トグル */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-semibold gap-1.5"
            onClick={handleToggleLanguage}
            aria-label={
              language === "ja"
                ? t("nav.switchLanguageToEn")
                : t("nav.switchLanguageToJa")
            }
            title={
              language === "ja"
                ? t("nav.switchLanguageToEn")
                : t("nav.switchLanguageToJa")
            }
          >
            <Languages className="h-4 w-4" />
            <span>{language.toUpperCase()}</span>
          </Button>

          {/* テーマ切替 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            aria-label={
              resolvedTheme === "dark"
                ? t("nav.switchToLight")
                : t("nav.switchToDark")
            }
            title={
              resolvedTheme === "dark"
                ? t("nav.switchToLight")
                : t("nav.switchToDark")
            }
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
