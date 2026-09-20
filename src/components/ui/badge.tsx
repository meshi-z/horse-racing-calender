import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/libs/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Grade semantic variants (WCAG 2.1 AA compliant)
        g1: "border-transparent bg-grade-g1 text-grade-g1-foreground shadow",
        g2: "border-transparent bg-grade-g2 text-grade-g2-foreground shadow",
        g3: "border-transparent bg-grade-g3 text-grade-g3-foreground shadow",
        jpn1: "border-transparent bg-grade-jpn1 text-grade-jpn1-foreground shadow",
        jpn2: "border-transparent bg-grade-jpn2 text-grade-jpn2-foreground shadow",
        jpn3: "border-transparent bg-grade-jpn3 text-grade-jpn3-foreground shadow",
        s1: "border-transparent bg-grade-s1 text-grade-s1-foreground shadow",
        s2: "border-transparent bg-grade-s2 text-grade-s2-foreground shadow",
        s3: "border-transparent bg-grade-s3 text-grade-s3-foreground shadow",
        local: "border-transparent bg-grade-local text-grade-local-foreground shadow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
