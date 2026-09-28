"use client";

import { useMemo, useState } from "react";
import { BriefcaseMedical, CalendarMinus } from "lucide-react";
import { SubjectSummary, percent } from "@/lib/attendance";

type Props = {
  summaries: SubjectSummary[];
};

export default function LeaveSimulator({ summaries }: Props) {
  const [odClasses, setOdClasses] = useState(0);
  const [medicalClasses, setMedicalClasses] = useState(0);

  const result = useMemo(() => {
    const conducted = summaries.reduce((total, subject) => total + subject.conducted, 0);
    const attended = summaries.reduce((total, subject) => total + subject.attended, 0);
    const remaining = summaries.reduce((total, subject) => total + subject.remaining, 0);
    const totalLeave = Math.min(remaining, odClasses + medicalClasses);
    const finalConducted = conducted + remaining;
    const finalAttended = attended + Math.max(0, remaining - totalLeave);
    const finalPercent = percent(finalAttended, finalConducted);

    return {
      remaining,
      totalLeave,
      finalPercent,
      safe: finalPercent >= 75
    };
  }, [medicalClasses, odClasses, summaries]);

  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <CalendarMinus size={18} />
        OD and medical leave simulator
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Plan leave days before taking them</h2>
          <p className="mt-1 text-sm text-slate-500">Enter how many upcoming classes will be OD or medical leave.</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            result.safe ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {result.safe ? "Still above 75%" : "Drops below 75%"}
        </span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <LeaveControl
          icon={BriefcaseMedical}
          label="On-Duty classes"
          value={odClasses}
          max={result.remaining}
          onChange={setOdClasses}
        />
        <LeaveControl
          icon={CalendarMinus}
          label="Medical leave classes"
          value={medicalClasses}
          max={result.remaining}
          onChange={setMedicalClasses}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <LeaveStat label="Total leave classes" value={result.totalLeave} />
        <LeaveStat label="Classes remaining" value={result.remaining} />
        <LeaveStat label="Final attendance" value={`${result.finalPercent.toFixed(1)}%`} />
      </div>
    </section>
  );
}

function LeaveControl({
  icon: Icon,
  label,
  value,
  max,
  onChange
}: {
  icon: typeof CalendarMinus;
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Icon size={17} />
          {label}
        </span>
        <input
          type="number"
          min={0}
          max={max}
          value={Math.min(value, max)}
          onChange={(event) => onChange(Math.min(max, Math.max(0, Number(event.target.value))))}
          className="h-10 w-24 rounded-[8px] border border-slate-200 bg-white px-3 text-right font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={Math.min(value, max)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-blue-600"
      />
    </label>
  );
}

function LeaveStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
