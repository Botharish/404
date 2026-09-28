"use client";

import { AlertTriangle, CheckCircle2, Flame, ShieldAlert } from "lucide-react";
import { SubjectSummary } from "@/lib/attendance";

const statusConfig = {
  green: {
    label: "Safe",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  yellow: {
    label: "Needs attention",
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-700"
  },
  red: {
    label: "Below 75%",
    icon: Flame,
    className: "border-orange-200 bg-orange-50 text-orange-700"
  },
  critical: {
    label: "Critical",
    icon: ShieldAlert,
    className: "border-red-200 bg-red-50 text-red-700"
  }
};

type Props = {
  summary: SubjectSummary;
  onAttendedChange: (subjectCode: string, value: number) => void;
  detailed?: boolean;
};

export default function SubjectCard({ summary, onAttendedChange, detailed = false }: Props) {
  const status = statusConfig[summary.status];
  const Icon = status.icon;

  return (
    <article className={`flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm ${detailed ? "p-6" : "p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{summary.subjectCode}</p>
          <h3 title={summary.subjectName} className={`mt-1 font-semibold text-slate-950 ${detailed ? "text-2xl tracking-tight" : "line-clamp-2 min-h-[3.5rem] text-lg leading-7"}`}>
            {summary.subjectName}
          </h3>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
          <Icon size={14} />
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Current attendance</p>
          <p className={`${detailed ? "text-5xl" : "text-4xl"} font-semibold tracking-tight text-slate-950 tabular-nums`}>{summary.currentPercent.toFixed(1)}%</p>
        </div>
        <label className="grid w-28 gap-1 text-right">
          <span className="text-xs font-medium text-slate-500">Attended</span>
          <input
            type="number"
            min={0}
            max={summary.conducted}
            value={summary.attended}
            onChange={(event) => onAttendedChange(summary.subjectCode, Number(event.target.value))}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-right text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </label>
      </div>

      <div className={`mt-auto grid grid-cols-2 gap-2 pt-5 text-sm ${detailed ? "sm:grid-cols-3" : ""}`}>
        <Metric label="Conducted" value={summary.conducted} />
        <Metric label="Remaining" value={summary.remaining} />
        <Metric label="Need for 75%" value={summary.required75 > summary.remaining ? "Impossible" : summary.required75} />
        <Metric label="Need for 90%" value={summary.required90 > summary.remaining ? "Impossible" : summary.required90} />
        <Metric label="Can skip for 75%" value={summary.canSkip75} />
        <Metric label="Max possible" value={`${summary.maxPossible.toFixed(1)}%`} />
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950 tabular-nums">{value}</p>
    </div>
  );
}
