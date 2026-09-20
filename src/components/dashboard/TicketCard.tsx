import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface TicketCardProps {
  numbers: number[];
  maxCount?: number;
  title?: string;
  subtitle?: string;
}

export function TicketCard({
  numbers,
  maxCount = 5,
  title = "Active Draw Ticket (5 Scores)",
  subtitle = "Your latest 5 Stableford scores automatically compose your monthly entry:",
}: TicketCardProps) {
  const isComplete = numbers.length === maxCount;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-400" />
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
        <Badge variant={isComplete ? "success" : "warning"}>
          {isComplete ? `${maxCount}/${maxCount} Full Entry` : `${numbers.length}/${maxCount} Scores`}
        </Badge>
      </div>

      {subtitle && <p className="text-xs text-slate-400 mb-6">{subtitle}</p>}

      <div className="flex items-center justify-center sm:justify-start gap-3 my-2">
        {numbers.map((score, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5">
            <span className="h-12 w-12 rounded-xl bg-slate-800 border border-brand-500/50 font-extrabold text-lg text-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/10">
              {score}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">#{idx + 1}</span>
          </div>
        ))}

        {Array.from({ length: Math.max(0, maxCount - numbers.length) }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="h-12 w-12 rounded-xl border border-dashed border-slate-700 font-bold text-slate-600 flex items-center justify-center">
              -
            </span>
            <span className="text-[10px] text-slate-600">Pending</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
