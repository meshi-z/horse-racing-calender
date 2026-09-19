import * as React from "react";
import { useRaceStore } from "@/store/useRaceStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Grade, TrackType } from "@/types/race";
import { Search, RotateCcw, X } from "lucide-react";
import { cn } from "@/libs/utils";

const GRADE_OPTIONS: { label: string; grade: Grade }[] = [
  { label: "G1", grade: "G1" },
  { label: "G2", grade: "G2" },
  { label: "G3", grade: "G3" },
  { label: "J.G1", grade: "J.G1" },
  { label: "J.G2", grade: "J.G2" },
  { label: "J.G3", grade: "J.G3" },
];

const TRACK_OPTIONS: { label: string; type: TrackType }[] = [
  { label: "芝", type: "turf" },
  { label: "ダート", type: "dirt" },
  { label: "障害", type: "obstacle" },
];

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FilterBar({ className, ...props }: FilterBarProps) {
  const filters = useRaceStore((state) => state.filters);
  const setFilter = useRaceStore((state) => state.setFilter);
  const resetFilters = useRaceStore((state) => state.resetFilters);

  const [isScrolled, setIsScrolled] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // スクロール検知によりコンパクト表示フラグを切り替え
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // FilterBarの実際の高さを計測し、CSSカスタムプロパティ（--filterbar-height）として共有
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateHeight = () => {
      const height = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--filterbar-height",
        `${height}px`
      );
    };

    updateHeight();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateHeight();
      });
      observer.observe(el);
      return () => {
        observer.disconnect();
        document.documentElement.style.removeProperty("--filterbar-height");
      };
    }

    return () => {
      document.documentElement.style.removeProperty("--filterbar-height");
    };
  }, [isScrolled]);

  const hasActiveFilters =
    filters.searchQuery.trim() !== "" ||
    filters.grades.length > 0 ||
    filters.trackTypes.length > 0 ||
    filters.courses.length > 0 ||
    filters.sexConstraints.length > 0 ||
    filters.ageConstraints.length > 0 ||
    filters.yearMonth !== null;

  const handleGradeToggle = (grade: Grade) => {
    const nextGrades = filters.grades.includes(grade)
      ? filters.grades.filter((g) => g !== grade)
      : [...filters.grades, grade];
    setFilter("grades", nextGrades);
  };

  const handleTrackToggle = (track: TrackType) => {
    const nextTracks = filters.trackTypes.includes(track)
      ? filters.trackTypes.filter((t) => t !== track)
      : [...filters.trackTypes, track];
    setFilter("trackTypes", nextTracks);
  };

  return (
    <div
      ref={containerRef}
      data-testid="filter-bar"
      data-scrolled={isScrolled ? "true" : "false"}
      className={cn(
        "sticky top-14 z-30 transition-all duration-200",
        "flex flex-col rounded-xl border",
        isScrolled
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 shadow-md py-2 px-3 sm:px-4 gap-2 border-border/80"
          : "bg-card text-card-foreground p-4 gap-3 shadow-sm border-border",
        className
      )}
      {...props}
    >
      {/* 検索入力 & リセット */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className={cn(
              "absolute left-2.5 text-muted-foreground pointer-events-none transition-all",
              isScrolled ? "top-2 h-3.5 w-3.5" : "top-2.5 h-4 w-4"
            )}
          />
          <Input
            type="text"
            placeholder="レース名で検索（例: フェブラリー、有馬記念、February）"
            value={filters.searchQuery}
            onChange={(e) => setFilter("searchQuery", e.target.value)}
            className={cn(
              "pl-8 sm:pl-9 pr-8 transition-all",
              isScrolled ? "h-8 text-xs" : "h-9 text-sm"
            )}
            aria-label="レース名検索"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => setFilter("searchQuery", "")}
              className={cn(
                "absolute right-2.5 text-muted-foreground hover:text-foreground",
                isScrolled ? "top-2" : "top-2.5"
              )}
              aria-label="検索キーワードをクリア"
            >
              <X className={isScrolled ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className={cn(
              "shrink-0 gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive transition-all",
              isScrolled ? "h-8 px-2.5 text-[11px]" : "text-xs"
            )}
            aria-label="フィルターをリセット"
          >
            <RotateCcw className={isScrolled ? "h-3 w-3" : "h-3.5 w-3.5"} />
            <span>リセット</span>
          </Button>
        )}
      </div>

      {/* 絞り込み条件（グレード・馬場） */}
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center text-xs transition-all",
          isScrolled ? "gap-1.5 sm:gap-3" : "gap-2 sm:gap-4"
        )}
      >
        {/* グレード */}
        <div className="flex items-center flex-wrap gap-1 sm:gap-1.5">
          <span
            className={cn(
              "text-muted-foreground font-medium shrink-0 mr-0.5",
              isScrolled ? "text-[11px]" : "text-xs"
            )}
          >
            グレード:
          </span>
          {GRADE_OPTIONS.map(({ label, grade }) => {
            const isSelected = filters.grades.includes(grade);
            return (
              <button
                key={grade}
                type="button"
                onClick={() => handleGradeToggle(grade)}
                aria-pressed={isSelected}
                className={cn(
                  "rounded-md font-semibold border transition-all cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isScrolled ? "px-1.5 py-0 text-[11px] h-5.5 sm:h-6" : "px-2 py-0.5 text-xs",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* 馬場種別 */}
        <div
          className={cn(
            "flex items-center flex-wrap gap-1 sm:gap-1.5 sm:border-l sm:border-border/60",
            isScrolled ? "sm:pl-3" : "sm:pl-4"
          )}
        >
          <span
            className={cn(
              "text-muted-foreground font-medium shrink-0 mr-0.5",
              isScrolled ? "text-[11px]" : "text-xs"
            )}
          >
            馬場:
          </span>
          {TRACK_OPTIONS.map(({ label, type }) => {
            const isSelected = filters.trackTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTrackToggle(type)}
                aria-pressed={isSelected}
                className={cn(
                  "rounded-md border transition-all cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isScrolled ? "px-1.5 py-0 text-[11px] h-5.5 sm:h-6" : "px-2 py-0.5 text-xs",
                  isSelected
                    ? "bg-secondary text-secondary-foreground font-medium border-secondary-foreground/20 shadow-sm"
                    : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
