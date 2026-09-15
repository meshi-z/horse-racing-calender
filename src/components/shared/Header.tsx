import * as React from "react";
import { useRaceStore } from "@/store/useRaceStore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ListFilter, Trophy } from "lucide-react";
import { cn } from "@/libs/utils";

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {}

export function Header({ className, ...props }: HeaderProps) {
  const viewMode = useRaceStore((state) => state.viewMode);
  const setViewMode = useRaceStore((state) => state.setViewMode);

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
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">
              重賞カレンダー
            </h1>
            <p className="hidden sm:block text-[10px] text-muted-foreground leading-none">
              JRA Graded Races Calendar
            </p>
          </div>
        </div>

        {/* 表示モード切替 (Tabs) */}
        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </header>
  );
}
