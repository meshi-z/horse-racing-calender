import * as React from "react";
import { useRaceStore } from "@/store/useRaceStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import type { Grade, TrackType, DistanceCategory, Organization } from "@/types/race";
import { Search, RotateCcw, X, MapPin, ChevronDown, ChevronUp, SlidersHorizontal, Globe, Check } from "lucide-react";
import { cn } from "@/libs/utils";
import {
  useTranslation,
  DISTANCE_OPTIONS_BY_LANG,
  COURSE_OPTIONS_BY_LANG,
  COURSE_GROUPS,
  getLocalizedCourseName,
  trackTypeLabels,
  type TranslationKey,
} from "@/libs/i18n";

export interface OrganizationGroupItem {
  id: string;
  labelKey: TranslationKey;
  allLabelKey: TranslationKey;
  flag: string;
  organizations: Organization[];
  items: {
    value: Organization;
    labelKey: TranslationKey;
  }[];
}

export const ORGANIZATION_GROUPS: OrganizationGroupItem[] = [
  {
    id: "japan",
    labelKey: "filter.regionJapan",
    allLabelKey: "filter.selectAllJapan",
    flag: "🇯🇵",
    organizations: ["jra", "nar"],
    items: [
      { value: "jra", labelKey: "filter.orgJra" },
      { value: "nar", labelKey: "filter.orgNar" },
    ],
  },
  {
    id: "europe",
    labelKey: "filter.regionEurope",
    allLabelKey: "filter.selectAllEurope",
    flag: "🇪🇺",
    organizations: ["france_galop", "bha"],
    items: [
      { value: "france_galop", labelKey: "filter.orgFrance" },
      { value: "bha", labelKey: "filter.orgUk" },
    ],
  },
];

export interface GradeGroupItem {
  id: string;
  labelKey: TranslationKey;
  grades: Grade[];
}

export const GRADE_GROUPS: GradeGroupItem[] = [
  {
    id: "jra",
    labelKey: "filter.gradeGroupJra",
    grades: ["G1", "G2", "G3", "J.G1", "J.G2", "J.G3"],
  },
  {
    id: "dirt",
    labelKey: "filter.gradeGroupDart",
    grades: ["Jpn1", "Jpn2", "Jpn3"],
  },
  {
    id: "nankanto",
    labelKey: "filter.gradeGroupNankanto",
    grades: ["S1", "S2", "S3"],
  },
  {
    id: "regional",
    labelKey: "filter.gradeGroupRegional",
    grades: ["local_grade"],
  },
];

export const GRADE_OPTIONS: { label: string; grade: Grade }[] = [
  { label: "G1", grade: "G1" },
  { label: "G2", grade: "G2" },
  { label: "G3", grade: "G3" },
  { label: "J.G1", grade: "J.G1" },
  { label: "J.G2", grade: "J.G2" },
  { label: "J.G3", grade: "J.G3" },
  { label: "Jpn1", grade: "Jpn1" },
  { label: "Jpn2", grade: "Jpn2" },
  { label: "Jpn3", grade: "Jpn3" },
  { label: "S1", grade: "S1" },
  { label: "S2", grade: "S2" },
  { label: "S3", grade: "S3" },
  { label: "地方重賞", grade: "local_grade" },
];

export const TRACK_OPTIONS: { label: string; type: TrackType }[] = [
  { label: "芝", type: "turf" },
  { label: "ダート", type: "dirt" },
  { label: "障害", type: "obstacle" },
  { label: "ばんえい", type: "banei" },
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
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const isManuallyToggledRef = React.useRef(false);
  const [isCourseExpanded, setIsCourseExpanded] = React.useState(false);
  const [isOrgDialogOpen, setIsOrgDialogOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const trackOptions: { label: string; type: TrackType }[] = [
    { label: trackTypeLabels[language].turf, type: "turf" },
    { label: trackTypeLabels[language].dirt, type: "dirt" },
    { label: trackTypeLabels[language].aw, type: "aw" },
    { label: trackTypeLabels[language].obstacle, type: "obstacle" },
    { label: trackTypeLabels[language].banei, type: "banei" },
  ];
  const distanceOptions = DISTANCE_OPTIONS_BY_LANG[language];

  // スクロール検知により詳細エリアの自動折りたたみを制御（手動操作時の意図を尊重）
  React.useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);

      if (!scrolled) {
        // 最上部に戻ったら手動操作フラグをリセットし、自動で展開状態に戻す
        isManuallyToggledRef.current = false;
        setIsCollapsed(false);
      } else if (!isManuallyToggledRef.current) {
        // スクロールダウン時、手動操作されていなければ自動で折りたたむ
        setIsCollapsed(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleCollapse = () => {
    isManuallyToggledRef.current = true;
    setIsCollapsed((prev) => !prev);
  };

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
      return () => observer.disconnect();
    }
  }, []);

  // フィルター変更時、折りたたみ状態であれば展開する（ユーザーが操作した感触を維持）
  // ただしマウント時およびスクロール時は除く
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
  }, [
    isScrolled,
    isCollapsed,
    isCourseExpanded,
    filters.courses.length,
    filters.distanceCategories.length,
    filters.grades.length,
    filters.organizations.length,
    filters.trackTypes.length,
  ]);

  const hasActiveFilters =
    filters.searchQuery.trim() !== "" ||
    filters.organizations.length > 0 ||
    filters.grades.length > 0 ||
    filters.trackTypes.length > 0 ||
    filters.distanceCategories.length > 0 ||
    filters.courses.length > 0 ||
    filters.sexConstraints.length > 0 ||
    filters.ageConstraints.length > 0 ||
    filters.yearMonth !== null;

  const activeDetailFiltersCount =
    filters.grades.length +
    filters.trackTypes.length +
    filters.distanceCategories.length +
    filters.courses.length;

  const handleOrgToggle = (org: "all" | Organization) => {
    if (org === "all") {
      setFilter("organizations", []);
      return;
    }
    if (filters.organizations.length === 0) {
      setFilter("organizations", [org]);
      return;
    }
    if (filters.organizations.includes(org)) {
      const next = filters.organizations.filter((o) => o !== org);
      setFilter("organizations", next);
    } else {
      setFilter("organizations", [...filters.organizations, org]);
    }
  };

  const handleGroupOrgToggle = (groupOrgs: Organization[]) => {
    const allSelected = groupOrgs.every((org) => filters.organizations.includes(org));
    if (allSelected) {
      const next = filters.organizations.filter((o) => !groupOrgs.includes(o));
      setFilter("organizations", next);
    } else {
      const next = Array.from(new Set([...filters.organizations, ...groupOrgs]));
      setFilter("organizations", next);
    }
  };

  const getOrgTriggerLabel = () => {
    if (filters.organizations.length === 0) {
      return t("filter.orgTriggerAll");
    }
    const isAllJapan =
      filters.organizations.length === 2 &&
      filters.organizations.includes("jra") &&
      filters.organizations.includes("nar");
    if (isAllJapan) {
      return `🇯🇵 ${t("filter.regionJapan")} (2)`;
    }
    const isAllEurope =
      filters.organizations.length === 2 &&
      filters.organizations.includes("france_galop") &&
      filters.organizations.includes("bha");
    if (isAllEurope) {
      return `🇪🇺 ${t("filter.regionEurope")} (2)`;
    }
    if (filters.organizations.length === 1) {
      const org = filters.organizations[0];
      if (org === "jra") return "🇯🇵 JRA";
      if (org === "nar") return "🇯🇵 NAR";
      if (org === "france_galop") return "🇫🇷 France";
      if (org === "bha") return "🇬🇧 UK";
    }
    return `${t("filter.orgSelectTrigger")} (${filters.organizations.length})`;
  };

  const handleGradeToggle = (grade: Grade) => {
    const nextGrades = filters.grades.includes(grade)
      ? filters.grades.filter((g) => g !== grade)
      : [...filters.grades, grade];
    setFilter("grades", nextGrades);
  };

  const handleGroupToggle = (groupGrades: Grade[]) => {
    const allSelected = groupGrades.every((g) => filters.grades.includes(g));
    if (allSelected) {
      // 解除
      setFilter(
        "grades",
        filters.grades.filter((g) => !groupGrades.includes(g))
      );
    } else {
      // 一括追加
      const newGrades = Array.from(new Set([...filters.grades, ...groupGrades]));
      setFilter("grades", newGrades);
    }
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

  const handleCourseGroupToggle = (courseNames: string[]) => {
    const allSelected = courseNames.every((c) => filters.courses.includes(c));
    if (allSelected) {
      setFilter(
        "courses",
        filters.courses.filter((c) => !courseNames.includes(c))
      );
    } else {
      const newCourses = Array.from(new Set([...filters.courses, ...courseNames]));
      setFilter("courses", newCourses);
    }
  };

  const handleClearCourses = () => {
    setFilter("courses", []);
  };

  const orgOptions: { value: "all" | Organization; label: string }[] = [
    { value: "all", label: t("filter.orgAll") },
    { value: "jra", label: t("filter.orgJra") },
    { value: "nar", label: t("filter.orgNar") },
    { value: "france_galop", label: t("filter.orgFrance") },
    { value: "bha", label: t("filter.orgUk") },
  ];

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
      {/* 検索入力 & 主催者セグメント & 詳細展開トグル & リセット */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {/* 検索バー */}
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
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={t("filter.clearSearchAria")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* コントロール群（主催者・詳細トグル・リセット） */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto">
          {/* モバイル向け: 開催国・主催者選択ダイアログ (sm:hidden) */}
          <div className="sm:hidden">
            <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={t("filter.orgSelectModalTitle")}
                  className={cn(
                    "h-9 px-2.5 text-xs font-semibold gap-1.5 shrink-0 transition-colors cursor-pointer",
                    filters.organizations.length > 0
                      ? "border-primary/50 text-primary bg-primary/5 hover:bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[130px]">{getOrgTriggerLabel()}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-[calc(100vw-32px)] max-h-[85vh] overflow-y-auto p-5">
                <DialogHeader className="text-left space-y-1">
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    {t("filter.orgSelectModalTitle")}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {t("filter.orgSelectModalDesc")}
                  </DialogDescription>
                </DialogHeader>

                {/* クイックアクション: すべて表示 / 全解除 */}
                <div className="flex items-center justify-between pt-2 pb-1 border-b text-xs">
                  <span className="font-semibold text-muted-foreground">
                    {t("filter.orgAll")}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={filters.organizations.length === 0 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("organizations", [])}
                      className="h-7 text-xs px-2.5"
                    >
                      {t("filter.orgAll")}
                    </Button>
                    {filters.organizations.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilter("organizations", [])}
                        className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                      >
                        {t("filter.clear")}
                      </Button>
                    )}
                  </div>
                </div>

                {/* 地域別グルーピング */}
                <div className="flex flex-col gap-3 py-2">
                  {ORGANIZATION_GROUPS.map((group) => {
                    const isAllGroupSelected = group.organizations.every((org) =>
                      filters.organizations.includes(org)
                    );
                    return (
                      <div key={group.id} className="flex flex-col gap-2 rounded-lg border p-3 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm flex items-center gap-1.5">
                            <span>{group.flag}</span>
                            <span>{t(group.labelKey)}</span>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGroupOrgToggle(group.organizations)}
                            className="h-6 text-[11px] px-2 text-primary hover:text-primary hover:bg-primary/10"
                          >
                            {isAllGroupSelected ? t("filter.clearGroup") : t(group.allLabelKey)}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 pt-1">
                          {group.items.map((item) => {
                            const isSelected = filters.organizations.includes(item.value);
                            return (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => handleOrgToggle(item.value)}
                                aria-pressed={isSelected}
                                className={cn(
                                  "flex items-center justify-between w-full px-3 py-2 rounded-md text-xs font-medium transition-all text-left border cursor-pointer",
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                    : "bg-background text-foreground border-input hover:bg-accent"
                                )}
                              >
                                <span>{t(item.labelKey)}</span>
                                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* モーダルフッター */}
                <div className="flex justify-end pt-2 border-t">
                  <DialogClose asChild>
                    <Button type="button" size="sm" className="w-full sm:w-auto px-6">
                      {t("filter.orgModalDone")}
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* デスクトップ向け: 主催者セグメントコントロール (All / JRA / NAR / France / UK) */}
          <div
            role="group"
            aria-label={t("filter.orgLabel")}
            className="hidden sm:flex items-center rounded-lg border bg-muted/40 p-0.5 shrink-0"
          >
            {orgOptions.map((opt) => {
              const isSelected =
                opt.value === "all"
                  ? filters.organizations.length === 0
                  : filters.organizations.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleOrgToggle(opt.value)}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                    isSelected
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            {/* 詳細フィルター展開/折りたたみボタン */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleCollapse}
              aria-expanded={!isCollapsed}
              aria-controls="detailed-filters-panel"
              aria-label={
                isCollapsed
                  ? t("filter.expandFilters")
                  : t("filter.collapseFilters")
              }
              className={cn(
                "shrink-0 gap-1.5 h-9 px-2.5 sm:px-3 text-xs transition-colors cursor-pointer",
                !isCollapsed
                  ? "bg-accent text-accent-foreground border-accent-foreground/20"
                  : activeDetailFiltersCount > 0
                  ? "border-primary/50 text-primary hover:bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>
                {isCollapsed ? t("filter.expandFilters") : t("filter.collapseFilters")}
              </span>
              {activeDetailFiltersCount > 0 && (
                <span
                  data-testid="filter-badge-count"
                  className="rounded-full bg-primary text-primary-foreground px-1.5 py-0.2 text-[10px] font-bold leading-none"
                >
                  {activeDetailFiltersCount}
                </span>
              )}
              {isCollapsed ? (
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 transition-transform duration-200" />
              )}
            </Button>

            {/* リセットボタン */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="shrink-0 gap-1.5 h-9 px-2.5 sm:px-3 text-xs text-muted-foreground hover:text-destructive hover:border-destructive transition-colors cursor-pointer"
                aria-label={t("filter.resetFilterAria")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t("filter.reset")}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 折りたたみ時の適用中詳細フィルター要約バッジ */}
      {isCollapsed && activeDetailFiltersCount > 0 && (
        <div
          data-testid="active-filters-summary"
          className="flex items-center flex-wrap gap-1.5 pt-1 text-xs border-t border-border/40 animate-in fade-in-50 duration-150"
        >
          <span className="text-muted-foreground text-[11px] font-medium mr-0.5 flex items-center gap-1">
            <span>{t("filter.activeFiltersCount").replace("{count}", String(activeDetailFiltersCount))}</span>
          </span>

          {/* 選択中グレード */}
          {filters.grades.map((grade) => (
            <span
              key={grade}
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-medium"
            >
              <span>{grade}</span>
              <button
                type="button"
                onClick={() => handleGradeToggle(grade)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
                aria-label={`${grade}の絞り込みを解除`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {/* 選択中馬場種別 */}
          {filters.trackTypes.map((track) => {
            const trackLabel = trackTypeLabels[language][track];
            return (
              <span
                key={track}
                className="inline-flex items-center gap-1 rounded-md bg-secondary text-secondary-foreground border border-secondary-foreground/20 px-2 py-0.5 text-xs font-medium"
              >
                <span>{trackLabel}</span>
                <button
                  type="button"
                  onClick={() => handleTrackToggle(track)}
                  className="hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors cursor-pointer"
                  aria-label={`${trackLabel}の絞り込みを解除`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}

          {/* 選択中距離 */}
          {filters.distanceCategories.map((category) => {
            const opt = distanceOptions.find((d) => d.category === category);
            const label = opt ? opt.label : category;
            return (
              <span
                key={category}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-medium"
              >
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => handleDistanceToggle(category)}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
                  aria-label={`${label}の絞り込みを解除`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}

          {/* 選択中競馬場 */}
          {filters.courses.map((course) => {
            const localizedCourse = getLocalizedCourseName(course, language);
            return (
              <span
                key={course}
                className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-medium"
              >
                <MapPin className="h-2.5 w-2.5" />
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
        </div>
      )}

      {/* 絞り込み条件（グレード・クイックトグル・馬場・競馬場展開 - アコーディオンパネル） */}
      {!isCollapsed && (
        <div
          id="detailed-filters-panel"
          data-testid="detailed-filters-panel"
          className="flex flex-col gap-3 animate-in fade-in-50 duration-150"
        >
          <div className="flex flex-col gap-2.5 text-xs">
            {/* グレード選択行 */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted-foreground font-medium shrink-0 mr-0.5 text-xs">
              {t("filter.gradeLabel")}
            </span>

            {/* JRA重賞 (G1-G3, J.G1-J.G3) */}
            <div className="flex items-center gap-1 flex-wrap">
              {GRADE_OPTIONS.slice(0, 6).map(({ label, grade }) => {
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
                      "px-2 py-1 text-xs min-h-[30px] sm:min-h-[32px]",
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

            {/* ダートグレード (Jpn1-Jpn3) */}
            <div className="flex items-center gap-1 flex-wrap pl-1 border-l border-border/60">
              {GRADE_OPTIONS.slice(6, 9).map(({ label, grade }) => {
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
                      "px-2 py-1 text-xs min-h-[30px] sm:min-h-[32px]",
                      isSelected
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm dark:bg-amber-500"
                        : "bg-background text-amber-700 dark:text-amber-400 border-input hover:bg-accent"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 南関重賞 (S1-S3) */}
            <div className="flex items-center gap-1 flex-wrap pl-1 border-l border-border/60">
              {GRADE_OPTIONS.slice(9, 12).map(({ label, grade }) => {
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
                      "px-2 py-1 text-xs min-h-[30px] sm:min-h-[32px]",
                      isSelected
                        ? "bg-cyan-700 text-white border-cyan-700 shadow-sm dark:bg-cyan-600"
                        : "bg-background text-cyan-700 dark:text-cyan-400 border-input hover:bg-accent"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 地方重賞 */}
            <div className="flex items-center gap-1 flex-wrap pl-1 border-l border-border/60">
              {GRADE_OPTIONS.slice(12, 13).map(({ grade }) => {
                const isSelected = filters.grades.includes(grade);
                const displayLabel = language === "en" ? "Regional" : "地方重賞";
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
                        ? "bg-slate-700 text-white border-slate-700 shadow-sm dark:bg-slate-600"
                        : "bg-background text-slate-700 dark:text-slate-300 border-input hover:bg-accent"
                    )}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* クイックトグルボタン（ダートグレード一括 / 南関重賞一括 / 地方重賞一括） */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground pl-0 lg:pl-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground/70">一括:</span>
            {GRADE_GROUPS.slice(1).map((grp) => {
              const allSelected = grp.grades.every((g) => filters.grades.includes(g));
              const toggleLabel = `${t(grp.labelKey)}${language === "en" ? " All" : "一括"}`;
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => handleGroupToggle(grp.grades)}
                  aria-label={toggleLabel}
                  className={cn(
                    "rounded border px-1.5 py-0.5 transition-colors cursor-pointer",
                    allSelected
                      ? "bg-primary/10 border-primary/40 text-primary font-bold"
                      : "bg-muted/50 border-border hover:bg-muted text-muted-foreground"
                  )}
                >
                  {toggleLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* 馬場種別・距離・競馬場行 */}
        <div className="flex flex-col sm:flex-row sm:items-center text-xs gap-2 sm:gap-4 flex-wrap pt-1 border-t border-border/40">
          {/* 馬場種別 */}
          <div className="flex items-center flex-wrap gap-1.5">
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
      </div>

      {/* 競馬場選択パネル（展開時: 4グループ表示） */}
      {isCourseExpanded && (
        <div
          data-testid="course-filter-panel"
          className="flex flex-col gap-3 pt-3 border-t border-border/60 animate-in fade-in-50 duration-150"
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

          <div className="space-y-2.5">
            {COURSE_GROUPS.map((group) => {
              const groupCourseNames = group.courses.map((c) => c.name);
              const allSelected = groupCourseNames.every((c) => filters.courses.includes(c));

              return (
                <div key={group.region} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                    <span>{group.label[language]}</span>
                    <button
                      type="button"
                      onClick={() => handleCourseGroupToggle(groupCourseNames)}
                      className="text-[10px] text-primary hover:underline cursor-pointer"
                    >
                      {allSelected ? t("filter.clearGroup") : t("filter.selectAll")}
                    </button>
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5">
                    {group.courses.map((c) => {
                      const isSelected = filters.courses.includes(c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleCourseToggle(c.name)}
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
                          {c.label[language]}
                        </button>
                      );
                    })}
                  </div>
                </div>
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
      )}
    </div>
  );
}
