"use client";

import { CalendarClock } from "lucide-react";
import { StatTile } from "@/components/AttendanceCard";
import { SubjectSummary, parseDate, percent, requiredForTarget, TARGET_75, TARGET_90 } from "@/lib/attendance";

type Props = {
  summaries: SubjectSummary[];
  currentDate: string;
  futureDate: string;
};

export default function PredictionCard({ summaries, currentDate, futureDate }: Props) {
  const conducted = summaries.reduce((total, subject) => total + subject.conducted, 0);
  const attended = summaries.reduce((total, subject) => total + subject.attended, 0);
  const remaining = summaries.reduce((total, subject) => total + subject.remaining, 0);
  const predicted = percent(attended + remaining, conducted + remaining);
  const required75 = requiredForTarget(TARGET_75, conducted, attended, remaining);
  const required90 = requiredForTarget(TARGET_90, conducted, attended, remaining);
  const canMiss = Math.max(0, remaining - required75);
  const daysLeft = Math.max(0, Math.round((parseDate(futureDate).getTime() - parseDate(currentDate).getTime()) / 86_400_000));

  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <CalendarClock size={18} />
          Future prediction
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{daysLeft} days left</span>
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Plan until {futureDate}</h2>

      <div className="mt-auto grid grid-cols-2 gap-3 pt-6 sm:grid-cols-3">
        <StatTile label="Classes remaining" value={remaining} />
        <StatTile label="Attend all" value={`${predicted.toFixed(1)}%`} />
        <StatTile label="Can miss" value={canMiss} accent />
        <StatTile label="Need for 75%" value={required75 > remaining ? "Impossible" : required75} />
        <StatTile label="Need for 90%" value={required90 > remaining ? "Impossible" : required90} />
        <StatTile label="Missed so far" value={Math.max(0, conducted - attended)} />
      </div>
    </section>
  );
}
