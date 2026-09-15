import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/libs/utils";
import type { Grade } from "@/types/race";

export interface GradeBadgeProps extends Omit<BadgeProps, "variant"> {
  grade: Grade;
}

export function getGradeVariant(grade: Grade): "g1" | "g2" | "g3" | "default" {
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
    default:
      return "default";
  }
}

export const GradeBadge = React.forwardRef<HTMLDivElement, GradeBadgeProps>(
  ({ grade, className, children, ...props }, ref) => {
    const variant = getGradeVariant(grade);

    return (
      <Badge
        ref={ref}
        variant={variant}
        className={cn("px-2 py-0.5 text-xs font-bold tracking-wider", className)}
        aria-label={`グレード: ${grade}`}
        {...props}
      >
        {children ?? grade}
      </Badge>
    );
  }
);
GradeBadge.displayName = "GradeBadge";
