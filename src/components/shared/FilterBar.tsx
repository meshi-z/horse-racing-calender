import * as React from "react";
import { useRaceStore } from "@/store/useRaceStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Grade, TrackType, DistanceCategory } from "@/types/race";
import { Search, RotateCcw, X, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/libs/utils";
import {
  useTranslation,
  DISTANCE_OPTIONS_BY_LANG,
  COURSE_OPTIONS_BY_LANG,
  getLocalizedCourseName,
  trackTypeLabels,
} from "@/libs/i18n";

export const GRADE_OPTIONS: { label: string; grade: Grade }[] = [
  { label: "G1", grade: "G1" },
  { label: "G2", grade: "G2" },
  { label: "G3", grade: "G3" },
  { label: "J.G1", grade: "J.G1" },
  { label: "J.G2", grade: "J.G2" },
  { label: "J.G3", grade: "J.G3" },
];

export const TRACK_OPTIONS: { label: string; type: TrackType }[] = [
  { label: "芝", type: "turf" },
  { label: "ダート", type: "dirt" },
  { label: "障害", type: "obstacle" },
];

export const DISTANCE_OPTIONS = DISTANCE_OPTIONS_BY_LANG.ja;
export const COURSE_OPTIONS = COURSE_OPTIONS_BY_LANG.ja;

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function FilterBar({ className, ...props }: FilterBarProps) {
  const { t, language } = useTranslation();
  const filters = useRaceStore((state) => state.filters);
  const setFilter = useRaceStore((state) => state.setFilter);
  const resetFilters = useRaceStore((state) => state.resetFilters);

  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isCourseExpanded, setIsCourseExpanded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const trackOptions: { label: string; type: TrackType }[] = [
    { label: trackTypeLabels[language].turf, type: "turf" },
    { label: trackTypeLabels[language].dirt, type: "dirt" },
    { label: trackTypeLabels[language].obstacle, type: "obstacle" },
  ];
  const distanceOptions = DISTANCE_OPTIONS_BY_LANG[language];
  const courseOptions = COURSE_OPTIONS_BY_LANG[language];

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
  }, [isScrolled, isCourseExpanded, filters.courses.length, filters.distanceCategories.length]);

  const hasActiveFilters =
    filters.searchQuery.trim() !== "" ||
    filters.grades.length > 0 ||
    filters.trackTypes.length > 0 ||
    filters.distanceCategories.length > 0 ||
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

  const handleDistanceToggle = (category: DistanceCategory) => {
    const nextCategories = filters.distanceCategories.includes(category)
      ? filters.distanceCategories.filter((c) => c !== category)
      : [...filters.distanceCategories, category];
    setFilter("distanceCategories", nextCategories);
  };

  const handleCourseToggle = (courseName: string) => {
    const nextCourses = filters.courses.includes(courseName)
      ? filters.courses.filter((c) => c !== courseName)
      : [...filters.courses, courseName];
    setFilter("courses", nextCourses);
  };

  const handleClearCourses = () => {
    setFilter("courses", []);
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
            placeholder={t("filter.searchPlaceholder")}
            value={filters.searchQuery}
            onChange={(e) => setFilter("searchQuery", e.target.value)}
            className="pl-8 sm:pl-9 pr-8 h-9 text-sm"
            aria-label={t("filter.searchAria")}
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => setFilter("searchQuery", "")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label={t("filter.clearSearchAria")}
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
            aria-label={t("filter.resetFilterAria")}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t("filter.reset")}</span>
          </Button>
        )}
      </div>

      {/* 絞り込み条件（グレード・馬場・競馬場展開） */}
      <div className="flex flex-col sm:flex-row sm:items-center text-xs gap-2 sm:gap-4 flex-wrap">
        {/* グレード */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-muted-foreground font-medium shrink-0 mr-0.5 text-xs">
            {t("filter.gradeLabel")}
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
            {t("filter.trackLabel")}
          </span>
          {trackOptions.map(({ label, type }) => {
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

        {/* 距離区分 */}
        <div className="flex items-center flex-wrap gap-1.5 sm:border-l sm:border-border/60 sm:pl-4">
          <span className="text-muted-foreground font-medium shrink-0 mr-0.5 text-xs">
            {t("filter.distanceLabel")}
          </span>
          {distanceOptions.map(({ label, category, description }) => {
            const isSelected = filters.distanceCategories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleDistanceToggle(category)}
                aria-pressed={isSelected}
                title={description}
                aria-label={t("filter.distanceFilterAria")
                  .replace("{label}", label)
                  .replace("{description}", description)}
                className={cn(
                  "rounded-md border transition-colors cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  "px-2.5 py-1 text-xs min-h-[30px] sm:min-h-[32px]",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                    : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* 競馬場トグルボタン */}
        <div className="flex items-center gap-1.5 sm:border-l sm:border-border/60 sm:pl-4">
          <button
            type="button"
            onClick={() => setIsCourseExpanded((prev) => !prev)}
            aria-expanded={isCourseExpanded}
            aria-label={t("filter.courseExpandAria")}
            className={cn(
              "flex items-center gap-1.5 rounded-md border font-semibold transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "px-2.5 py-1 text-xs min-h-[30px] sm:min-h-[32px]",
              filters.courses.length > 0
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>{t("filter.courseLabel")}</span>
            {filters.courses.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary-foreground text-primary px-1.5 py-0.2 text-[10px] font-bold">
                {filters.courses.length}
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                isCourseExpanded && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {/* 競馬場選択パネル（展開時） */}
      {isCourseExpanded && (
        <div
          data-testid="course-filter-panel"
          className="flex flex-col gap-2 pt-2 border-t border-border/60 animate-in fade-in-50 duration-150"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" />
              <span>{t("filter.selectCourses")}</span>
            </span>
            {filters.courses.length > 0 && (
              <button
                type="button"
                onClick={handleClearCourses}
                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2 cursor-pointer"
              >
                {t("filter.clearCourses")}
              </button>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-1.5">
            {courseOptions.map(({ label, name }) => {
              const isSelected = filters.courses.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleCourseToggle(name)}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-md border transition-colors cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    "px-2.5 py-1 text-xs min-h-[30px] sm:min-h-[32px]",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                      : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 選択中の競馬場バッジ（折りたたみ時に表示） */}
      {!isCourseExpanded && filters.courses.length > 0 && (
        <div
          data-testid="selected-courses-bar"
          className="flex items-center flex-wrap gap-1.5 pt-1 text-xs border-t border-border/40"
        >
          <span className="text-muted-foreground text-[11px] mr-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary" />
            <span>{t("filter.selectedCourses")}</span>
          </span>
          {filters.courses.map((course) => {
            const localizedCourse = getLocalizedCourseName(course, language);
            return (
              <span
                key={course}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-medium"
              >
                <span>{localizedCourse}</span>
                <button
                  type="button"
                  onClick={() => handleCourseToggle(course)}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
                  aria-label={t("filter.removeCourseAria").replace("{course}", localizedCourse)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={handleClearCourses}
            className="text-[11px] text-muted-foreground hover:text-destructive transition-colors ml-1 underline underline-offset-2 cursor-pointer"
          >
            {t("filter.clear")}
          </button>
        </div>
      )}
    </div>
  );
}
