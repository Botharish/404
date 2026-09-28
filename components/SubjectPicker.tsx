"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { SubjectSummary } from "@/lib/attendance";

type Props = {
  summaries: SubjectSummary[];
  selectedCode: string;
  onSelect: (subjectCode: string) => void;
};

function dotClass(percentValue: number) {
  return percentValue >= 75 ? "bg-emerald-500" : "bg-orange-500";
}

export default function SubjectPicker({ summaries, selectedCode, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = summaries.find((subject) => subject.subjectCode === selectedCode) ?? summaries[0];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!selected) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-11 w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 text-left text-sm shadow-sm transition hover:bg-slate-50 sm:w-80"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass(selected.currentPercent)}`} />
        <span className="min-w-0 flex-1 truncate font-semibold text-slate-950">{selected.subjectName}</span>
        <span className="shrink-0 text-xs font-medium text-slate-500">
          {summaries.findIndex((subject) => subject.subjectCode === selected.subjectCode) + 1}/{summaries.length}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 top-[3.25rem] z-50 max-h-[26rem] w-[min(360px,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-300/50"
        >
          {summaries.map((subject) => {
            const active = subject.subjectCode === selected.subjectCode;
            return (
              <li key={subject.subjectCode}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onSelect(subject.subjectCode);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
                    active ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass(subject.currentPercent)}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-950">{subject.subjectName}</span>
                    <span className="block text-xs text-slate-500">{subject.subjectCode}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-slate-700 tabular-nums">
                    {subject.currentPercent.toFixed(1)}%
                  </span>
                  <Check size={16} className={`shrink-0 ${active ? "text-blue-600" : "invisible"}`} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
