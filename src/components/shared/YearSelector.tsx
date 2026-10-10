import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useRaceStore } from "@/store/useRaceStore";
import { useTranslation, formatYearLabel } from "@/libs/i18n";
import { trackEvent } from "@/libs/analytics";
import { cn } from "@/libs/utils";
import { CalendarRange, Loader2 } from "lucide-react";

export interface YearSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  triggerClassName?: string;
}

export function YearSelector({ className, triggerClassName }: YearSelectorProps) {
  const selectedYear = useRaceStore((state) => state.selectedYear);
  const availableYears = useRaceStore((state) => state.availableYears);
  const setSelectedYear = useRaceStore((state) => state.setSelectedYear);
  const isLoadingYear = useRaceStore((state) => state.isLoadingYear);
  const { language, t } = useTranslation();

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr, 10);
    if (!isNaN(year) && year !== selectedYear) {
      trackEvent("year_change", { from: selectedYear, to: year });
      void setSelectedYear(year);
    }
  };

  const formattedSelectedYear = formatYearLabel(selectedYear, language);

  return (
    <div className={cn("inline-flex items-center", className)} data-testid="year-selector">
      <Select
        value={String(selectedYear)}
        onValueChange={handleYearChange}
        disabled={isLoadingYear}
      >
        <SelectTrigger
          className={cn(
            "h-7 sm:h-8 px-2 text-xs font-semibold gap-1 sm:gap-1.5 rounded-md border border-input/60 bg-background/50 hover:bg-accent focus:ring-1 focus:ring-ring w-auto shrink-0 transition-colors shadow-2xs cursor-pointer",
            triggerClassName
          )}
          aria-label={t("yearSelector.selectAria", { year: selectedYear })}
        >
          {isLoadingYear ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <CalendarRange className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="font-bold text-xs">{formattedSelectedYear}</span>
        </SelectTrigger>
        <SelectContent align="start" className="min-w-[90px]">
          {availableYears.map((year) => (
            <SelectItem key={year} value={String(year)} className="text-xs font-medium cursor-pointer">
              {formatYearLabel(year, language)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
