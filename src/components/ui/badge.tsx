import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "gold" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    danger: "bg-red-500/15 text-red-400 border-red-500/30",
    gold: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/40",
    outline: "bg-transparent text-slate-300 border-slate-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
