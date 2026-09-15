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
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-sm",
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
            className="pl-9 pr-8"
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
            className="shrink-0 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive"
            aria-label="フィルターをリセット"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>リセット</span>
          </Button>
        )}
      </div>

      {/* 絞り込み条件（グレード・馬場） */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
        {/* グレード */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-muted-foreground font-medium shrink-0 mr-1">グレード:</span>
          {GRADE_OPTIONS.map(({ label, grade }) => {
            const isSelected = filters.grades.includes(grade);
            return (
              <button
                key={grade}
                type="button"
                onClick={() => handleGradeToggle(grade)}
                aria-pressed={isSelected}
                className={cn(
                  "rounded-md px-2 py-0.5 font-semibold text-xs border transition-all cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
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
          <span className="text-muted-foreground font-medium shrink-0 mr-1">馬場:</span>
          {TRACK_OPTIONS.map(({ label, type }) => {
            const isSelected = filters.trackTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTrackToggle(type)}
                aria-pressed={isSelected}
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs border transition-all cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
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
