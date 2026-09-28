"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { SubjectSummary, classesCanSkip, percent, TARGET_75, TARGET_90 } from "@/lib/attendance";

type Props = {
  summaries: SubjectSummary[];
};

export default function WhatIfSimulator({ summaries }: Props) {
  const totalRemaining = summaries.reduce((total, subject) => total + subject.remaining, 0);
  const [nextClasses, setNextClasses] = useState(Math.min(10, totalRemaining));
  const [willAttend, setWillAttend] = useState(Math.min(8, totalRemaining));

  const result = useMemo(() => {
    const conducted = summaries.reduce((total, subject) => total + subject.conducted, 0);
    const attended = summaries.reduce((total, subject) => total + subject.attended, 0);
    const boundedNext = Math.min(nextClasses, totalRemaining);
    const boundedAttend = Math.min(willAttend, boundedNext);
    const projectedConducted = conducted + boundedNext;
    const projectedAttended = attended + boundedAttend;
    const remainingAfterPlan = Math.max(0, totalRemaining - boundedNext);
    const projectedPercent = percent(projectedAttended, projectedConducted);
    const finalCanMiss75 = classesCanSkip(TARGET_75, projectedConducted, projectedAttended, remainingAfterPlan);

    return {
      projectedPercent,
      above75: projectedPercent >= 75,
      reaches90: projectedPercent >= 90,
      finalCanMiss75,
      boundedNext,
      boundedAttend
    };
  }, [nextClasses, summaries, totalRemaining, willAttend]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <SlidersHorizontal size={18} />
        What-if simulator
      </div>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
        I will attend {result.boundedAttend} of the next {result.boundedNext} classes
      </h2>

      <div className="mt-5 grid gap-5">
        <Control label="Next classes" value={nextClasses} max={Math.max(0, totalRemaining)} onChange={setNextClasses} />
        <Control label="I will attend" value={willAttend} max={Math.max(0, nextClasses)} onChange={setWillAttend} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Predicted attendance</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{result.projectedPercent.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Status</p>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {result.above75 ? "Above 75%" : "Below 75%"} / {result.reaches90 ? "Reaches 90%" : "Below 90%"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
          <p className="text-xs font-medium text-slate-500">Classes you can still miss for 75%</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{result.finalCanMiss75}</p>
        </div>
      </div>
    </section>
  );
}

function Control({
  label,
  value,
  max,
  onChange
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-950">{label}</span>
        <span className="text-slate-500">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={Math.min(value, max)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-blue-600"
      />
    </label>
  );
}
