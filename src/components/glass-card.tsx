import * as React from "react";
import { cn } from "@/lib/utils";

export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-border bg-obsidian-900/50 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]",
      className
    )}
    {...props}
  />
));
GlassCard.displayName = "GlassCard";
