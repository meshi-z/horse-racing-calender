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
        "sticky top-14 z-30 transition-shadow duration-200",
        "flex flex-col rounded-xl border p-3.5 sm:p-4 gap-3",
        isScrolled
          ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 shadow-md border-border/80"
          : "bg-card text-card-foreground shadow-sm border-border",
        className
      )}
      {...props}
    >
      {/* 検索入力 & リセット */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="レース名で検索（例: フェブラリー、有馬記念、February）"
            value={filters.searchQuery}
            onChange={(e) => setFilter("searchQuery", e.target.value)}
            className="pl-8 sm:pl-9 pr-8 h-9 text-sm"
            aria-label="レース名検索"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => setFilter("searchQuery", "")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="検索キーワードをクリア"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="shrink-0 gap-1.5 h-9 px-3 text-xs text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
            aria-label="フィルターをリセット"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>リセット</span>
          </Button>
        )}
      </div>

      {/* 絞り込み条件（グレード・馬場） */}
      <div className="flex flex-col sm:flex-row sm:items-center text-xs gap-2 sm:gap-4">
        {/* グレード */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-muted-foreground font-medium shrink-0 mr-0.5 text-xs">
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
                  "rounded-md font-semibold border transition-colors cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "px-2.5 py-1 text-xs min-h-[30px] sm:min-h-[32px]",
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
        <div className="flex items-center flex-wrap gap-1.5 sm:border-l sm:border-border/60 sm:pl-4">
          <span className="text-muted-foreground font-medium shrink-0 mr-0.5 text-xs">
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
                  "rounded-md border transition-colors cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "px-2.5 py-1 text-xs min-h-[30px] sm:min-h-[32px]",
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
