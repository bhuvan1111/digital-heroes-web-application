import * as React from "react";
import { GolfScore } from "@/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2 } from "lucide-react";

interface ScoreRowProps {
  score: GolfScore;
  index: number;
  onEdit?: (s: GolfScore) => void;
  onDelete?: (s: GolfScore) => void;
}

export function ScoreRow({ score, index, onEdit, onDelete }: ScoreRowProps) {
  return (
    <tr className="hover:bg-slate-850/40 transition-colors">
      <td className="px-6 py-4">
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-400 font-black text-base">
          {score.score}
        </span>
      </td>
      <td className="px-6 py-4 font-semibold text-white">
        {formatDate(score.played_date)}
      </td>
      <td className="px-6 py-4 text-slate-300">
        {score.course_name || "Official Round"}
      </td>
      <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
        {score.notes || "—"}
      </td>
      <td className="px-6 py-4">
        <Badge variant="success">Active #{index + 1}</Badge>
      </td>
      <td className="px-6 py-4 text-right space-x-2">
        {onEdit && (
          <button
            onClick={() => onEdit(score)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Edit Score"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(score)}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            title="Delete Score"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </td>
    </tr>
  );
}
