import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  badge,
  icon,
  action,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-6 flex flex-col justify-between", className)}>
      <div>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
          {badge || icon}
        </div>
        <p className="text-2xl sm:text-3xl font-black text-white mt-1">{value}</p>
        {subtext && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{subtext}</p>}
      </div>
      {action && <div className="mt-4 pt-4 border-t border-slate-800 text-xs">{action}</div>}
    </Card>
  );
}
