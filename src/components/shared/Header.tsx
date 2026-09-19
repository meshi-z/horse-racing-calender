import * as React from "react";
import { useViewMode } from "@/hooks/useViewMode";
import { useTheme } from "@/hooks/useTheme";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, ListFilter, Moon, Sun } from "lucide-react";
import { cn } from "@/libs/utils";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {}

export function Header({ className, ...props }: HeaderProps) {
  const { viewMode, setViewMode } = useViewMode();
  const { resolvedTheme, toggleTheme } = useTheme();

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
              重賞カレンダー
            </h1>
            <p className="hidden sm:block text-[10px] text-muted-foreground leading-none">
              JRA Graded Races Calendar
            </p>
          </div>
        </div>

        {/* 表示モード切替 (Tabs) & テーマ切替 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Tabs
            value={viewMode}
            onValueChange={(val) => setViewMode(val as "timeline" | "calendar")}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-2 h-8">
              <TabsTrigger value="timeline" className="gap-1 px-2.5 text-xs">
                <ListFilter className="h-3.5 w-3.5" />
                <span>タイムライン</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1 px-2.5 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <span>カレンダー</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleTheme}
            aria-label={
              resolvedTheme === "dark"
                ? "ライトモードに切り替え"
                : "ダークモードに切り替え"
            }
            title={
              resolvedTheme === "dark"
                ? "ライトモードに切り替え"
                : "ダークモードに切り替え"
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
