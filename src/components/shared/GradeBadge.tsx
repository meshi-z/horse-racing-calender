import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/libs/utils";
import type { Grade } from "@/types/race";
import { useTranslation } from "@/libs/i18n";

export interface GradeBadgeProps extends Omit<BadgeProps, "variant"> {
  grade: Grade;
}

export type GradeVariant =
  | "g1"
  | "g2"
  | "g3"
  | "jpn1"
  | "jpn2"
  | "jpn3"
  | "s1"
  | "s2"
  | "s3"
  | "local"
  | "default";

export function getGradeVariant(grade: Grade): GradeVariant {
  switch (grade) {
    case "G1":
    case "J.G1":
      return "g1";
    case "G2":
    case "J.G2":
      return "g2";
    case "G3":
    case "J.G3":
      return "g3";
    case "Jpn1":
      return "jpn1";
    case "Jpn2":
      return "jpn2";
    case "Jpn3":
      return "jpn3";
    case "S1":
      return "s1";
    case "S2":
      return "s2";
    case "S3":
      return "s3";
    case "local_grade":
      return "local";
    default:
      return "default";
  }
}

export function formatGradeLabel(grade: Grade, lang: "ja" | "en"): string {
  if (grade === "local_grade") {
    return lang === "en" ? "Regional" : "地方重賞";
  }
  return grade;
}

export const GradeBadge = React.forwardRef<HTMLDivElement, GradeBadgeProps>(
  ({ grade, className, children, ...props }, ref) => {
    const { language } = useTranslation();
    const variant = getGradeVariant(grade);
    const label = formatGradeLabel(grade, language);

    return (
      <Badge
        ref={ref}
        variant={variant}
        className={cn("px-2 py-0.5 text-xs font-bold tracking-wider", className)}
        aria-label={language === "en" ? `Grade: ${label}` : `グレード: ${label}`}
        {...props}
      >
        {children ?? label}
      </Badge>
    );
  }
);
GradeBadge.displayName = "GradeBadge";
