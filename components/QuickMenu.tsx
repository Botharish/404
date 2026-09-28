"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Home, LayoutGrid, MessageCircle, Printer, RotateCcw, type LucideIcon } from "lucide-react";
import { Section, semester } from "@/data/timetables";
import type { Student } from "@/data/students";

export type NavItem = { id: string; label: string; icon: LucideIcon; href: string };

type Props = {
  sections: Section[];
  selectedSectionId: string;
  students?: Student[];
  selectedStudentId?: string;
  futureDate: string;
  navItems: NavItem[];
  onSectionChange: (sectionId: string) => void;
  onStudentChange?: (studentId: string) => void;
  onFutureDateChange: (date: string) => void;
  onOpenAdvisor: () => void;
  onReset: () => void;
};

const fieldClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function QuickMenu({
  sections,
  selectedSectionId,
  students = [],
  selectedStudentId,
  futureDate,
  navItems,
  onSectionChange,
  onStudentChange,
  onFutureDateChange,
  onOpenAdvisor,
  onReset
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  function run(action: () => void) {
    action();
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
      >
        <LayoutGrid size={16} />
        Menu
        <ChevronDown size={16} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-950">Quick menu</p>
            <p className="text-xs text-slate-500">
              Semester {semester.start} to {semester.end}
            </p>
          </div>

          <div className="grid gap-3 border-b border-slate-100 p-4">
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-500">Section</span>
              <select value={selectedSectionId} onChange={(event) => onSectionChange(event.target.value)} className={fieldClass}>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-500">Student</span>
              <select
                value={selectedStudentId}
                onChange={(event) => onStudentChange?.(event.target.value)}
                className={fieldClass}
                disabled={!students.length}
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.rollNo} · {student.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-slate-500">Planning date</span>
              <input
                type="date"
                min={semester.start}
                max={semester.end}
                value={futureDate}
                onChange={(event) => onFutureDateChange(event.target.value)}
                className={fieldClass}
              />
            </label>
          </div>

          <div className="border-b border-slate-100 p-2">
            <p className="px-2 pb-1 pt-1 text-xs font-medium text-slate-500">Go to</p>
            {navItems.map(({ id, label, icon: Icon, href }) => (
              <Link
                key={id}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Icon size={16} className="text-slate-400" />
                {label}
              </Link>
            ))}
          </div>

          <div className="p-2">
            <MenuButton icon={MessageCircle} label="Ask the advisor" onClick={() => run(onOpenAdvisor)} />
            <MenuButton icon={Printer} label="Print report" onClick={() => run(() => window.print())} />
            <MenuButton icon={RotateCcw} label="Reset attended classes" onClick={() => run(onReset)} />
            <Link
              href="/"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <Home size={16} className="text-slate-400" />
              Back to home
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
    >
      <Icon size={16} className="text-slate-400" />
      {label}
    </button>
  );
}
