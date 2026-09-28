"use client";

import { GaugeCircle } from "lucide-react";
import { SubjectSummary, percent } from "@/lib/attendance";

type Props = {
  summaries: SubjectSummary[];
};

export default function AttendanceCard({ summaries }: Props) {
  const conducted = summaries.reduce((total, subject) => total + subject.conducted, 0);
  const attended = summaries.reduce((total, subject) => total + subject.attended, 0);
  const remaining = summaries.reduce((total, subject) => total + subject.remaining, 0);
  const attendance = percent(attended, conducted);
  const width = Math.min(100, Math.max(0, attendance));
  const safe = attendance >= 75;

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <GaugeCircle size={18} />
          Overall attendance
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            safe ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
          }`}
        >
          {safe ? "Safe" : "Below 75%"}
        </span>
      </div>

      <p className="mt-4 text-6xl font-semibold tracking-tight text-slate-950 tabular-nums">{attendance.toFixed(1)}%</p>

      <div className="mt-6">
        <div className="relative h-2.5 rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${safe ? "bg-blue-600" : "bg-orange-500"}`}
            style={{ width: `${width}%` }}
          />
          <div className="absolute -top-1 bottom-[-4px] left-[75%] w-0.5 rounded bg-slate-400" />
        </div>
        <div className="relative mt-2 h-4 text-xs text-slate-500">
          <span className="absolute left-0">0%</span>
          <span className="absolute left-[75%] -translate-x-1/2">75%</span>
          <span className="absolute right-0">100%</span>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-3 pt-6">
        <StatTile label="Conducted" value={conducted} />
        <StatTile label="Attended" value={attended} />
        <StatTile label="Remaining" value={remaining} />
      </div>
    </section>
  );
}

export function StatTile({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${accent ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
      <p className={`text-xs font-medium ${accent ? "text-blue-700" : "text-slate-500"}`}>{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">{value}</p>
    </div>
  );
}
