"use client";

import { BarChart3, PieChart } from "lucide-react";
import { StatTile } from "@/components/AttendanceCard";
import { SubjectSummary, percent } from "@/lib/attendance";

type Props = {
  summaries: SubjectSummary[];
  view?: "health" | "comparison";
};

export default function AttendanceCharts({ summaries, view = "health" }: Props) {
  const conducted = summaries.reduce((total, subject) => total + subject.conducted, 0);
  const attended = summaries.reduce((total, subject) => total + subject.attended, 0);
  const remaining = summaries.reduce((total, subject) => total + subject.remaining, 0);
  const missed = Math.max(0, conducted - attended);
  const overall = percent(attended, conducted);
  const safe = overall >= 75;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progress = (Math.min(100, overall) / 100) * circumference;
  const targetAngle = 0.75 * 2 * Math.PI;
  const belowTarget = summaries.filter((subject) => subject.currentPercent < 75).length;

  return (
    <section className="grid gap-6">
      {view === "health" ? (
      <div className="flex min-h-[460px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:min-h-[620px]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <PieChart size={18} />
            Attendance health
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              safe ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
            }`}
          >
            {safe ? "Safe" : "Below 75%"}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-8 pt-28">
          <div className="relative h-56 w-56">
            <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
              <circle cx="80" cy="80" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={safe ? "#2563eb" : "#f97316"}
                strokeLinecap="round"
                strokeWidth="12"
                strokeDasharray={`${progress} ${circumference}`}
                className="transition-all duration-500"
              />
              <line
                x1={80 + (radius - 9) * Math.cos(targetAngle)}
                y1={80 + (radius - 9) * Math.sin(targetAngle)}
                x2={80 + (radius + 9) * Math.cos(targetAngle)}
                y2={80 + (radius + 9) * Math.sin(targetAngle)}
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-4xl font-semibold tracking-tight text-slate-950 tabular-nums">{overall.toFixed(1)}%</p>
                <p className="mt-1 text-xs font-medium text-slate-500">overall</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            <span className="mr-1.5 inline-block h-2.5 w-0.5 bg-slate-900 align-middle" />
            75% target
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Attended" value={attended} />
          <StatTile label="Missed" value={missed} />
          <StatTile label="Left" value={remaining} />
        </div>
      </div>
      ) : null}

      {view === "comparison" ? (
      <div className="flex min-h-[460px] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:min-h-[620px]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <BarChart3 size={18} />
            Subject comparison
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {belowTarget ? `${belowTarget} below 75%` : "All above 75%"}
          </span>
        </div>

        <div className="mt-6 flex flex-1 flex-col justify-between gap-5">
          {summaries.map((subject) => {
            const ok = subject.currentPercent >= 75;
            return (
              <div key={subject.subjectCode}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span title={subject.subjectName} className="truncate font-medium text-slate-800">
                    {subject.subjectName}
                  </span>
                  <span className={`shrink-0 font-semibold tabular-nums ${ok ? "text-slate-950" : "text-orange-600"}`}>
                    {subject.currentPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${ok ? "bg-blue-600" : "bg-orange-500"}`}
                    style={{ width: `${Math.min(100, subject.currentPercent)}%` }}
                  />
                  <div className="absolute -top-1 bottom-[-4px] left-[75%] w-0.5 rounded bg-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      ) : null}
    </section>
  );
}
