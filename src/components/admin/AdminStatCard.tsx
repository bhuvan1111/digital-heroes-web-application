import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export function AdminStatCard({
  label,
  value,
  subtext,
  icon,
  trend,
  className,
}: AdminStatCardProps) {
  return (
    <Card className={cn("p-6 border-slate-800", className)}>
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        {subtext && <span>{subtext}</span>}
        {trend && <span className="text-brand-400 font-semibold">{trend}</span>}
      </div>
    </Card>
  );
}
