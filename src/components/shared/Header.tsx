import * as React from "react";
import { useViewMode } from "@/hooks/useViewMode";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/libs/i18n";
import type { Language } from "@/store/useLanguageStore";
import { trackEvent } from "@/libs/analytics";
import { forceRefreshRaces } from "@/hooks/useRaces";
import { showToast } from "@/store/useToastStore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { YearSelector } from "@/components/shared/YearSelector";
import { Calendar, Languages, ListFilter, Moon, RotateCw, Sun } from "lucide-react";
import { cn } from "@/libs/utils";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {}

export function Header({ className, ...props }: HeaderProps) {
  const { viewMode, setViewMode } = useViewMode();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleLanguageChange = (newLanguage: Language) => {
    if (newLanguage === language) return;
    const oldLanguage = language;
    setLanguage(newLanguage);
    trackEvent("language_change", { from: oldLanguage, to: newLanguage });
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    trackEvent("force_refresh_races");
    try {
      const success = await forceRefreshRaces();
      if (success) {
        showToast(t("nav.refreshSuccess"), "success");
      } else {
        showToast(t("nav.refreshError"), "error");
      }
    } catch {
      showToast(t("nav.refreshError"), "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      {...props}
    >
      <div className="container flex h-14 items-center justify-between gap-2 sm:gap-4 px-3 sm:px-8">
        {/* タイトル & ロゴ & 年度セレクター */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            alt="重賞カレンダー ロゴ"
            className="h-8 w-8 rounded-lg shadow-sm object-cover"
            width={32}
            height={32}
          />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight whitespace-nowrap">
                {t("app.title")}
              </h1>
              <YearSelector />
            </div>
            <p className="hidden sm:block text-[10px] text-muted-foreground leading-none whitespace-nowrap">
              {t("app.subtitle")}
            </p>
          </div>
        </div>

        {/* 表示モード切替 (Tabs) & コントロール群 */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <Tabs
            value={viewMode}
            onValueChange={(val) => setViewMode(val as "timeline" | "calendar")}
            className="w-auto shrink-0"
          >
            <TabsList className="grid grid-cols-2 h-8">
              <TabsTrigger
                value="timeline"
                className="gap-1 px-2 sm:px-2.5 text-xs whitespace-nowrap"
                aria-label={t("nav.timeline")}
                title={t("nav.timeline")}
              >
                <ListFilter className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{t("nav.timeline")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="gap-1 px-2 sm:px-2.5 text-xs whitespace-nowrap"
                aria-label={t("nav.calendar")}
                title={t("nav.calendar")}
              >
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{t("nav.calendar")}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 言語切替セレクター (Shadcn UI Select) */}
          <Select
            value={language}
            onValueChange={(val) => handleLanguageChange(val as Language)}
          >
            <SelectTrigger
              className="h-8 px-1.5 sm:px-2 text-xs font-semibold gap-1 sm:gap-1.5 border-transparent bg-transparent hover:bg-accent focus:ring-0 focus:ring-offset-0 shadow-none w-auto shrink-0"
              aria-label={
                language === "ja"
                  ? "言語を選択 (日本語)"
                  : language === "fr"
                  ? "Choisir la langue (Français)"
                  : language === "zh"
                  ? "選擇語言 (繁體中文)"
                  : "Select language (English)"
              }
            >
              <Languages className="h-4 w-4 shrink-0" />
              <span className="font-bold">{language.toUpperCase()}</span>
            </SelectTrigger>
            <SelectContent align="end" className="min-w-[130px]">
              <SelectItem value="ja">日本語 (JA)</SelectItem>
              <SelectItem value="en">English (EN)</SelectItem>
              <SelectItem value="fr">Français (FR)</SelectItem>
              <SelectItem value="zh">繁體中文 (ZH)</SelectItem>
            </SelectContent>
          </Select>

          {/* 強制データ再取得ボタン */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label={t("nav.refresh")}
            title={t("nav.refresh")}
            aria-busy={isRefreshing}
          >
            <RotateCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>

          {/* テーマ切替 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
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
