"use client";

import { CalendarDays } from "lucide-react";
import { Section, semester } from "@/data/timetables";
import type { Student } from "@/data/students";

type Props = {
  sections: Section[];
  selectedSectionId: string;
  currentDate: string;
  futureDate: string;
  students?: Student[];
  selectedStudentId?: string;
  onSectionChange: (sectionId: string) => void;
  onStudentChange?: (studentId: string) => void;
  onFutureDateChange: (date: string) => void;
};

const fieldClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function SectionSelector({
  sections,
  selectedSectionId,
  currentDate,
  futureDate,
  students = [],
  selectedStudentId,
  onSectionChange,
  onStudentChange,
  onFutureDateChange
}: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-5 md:grid-cols-4">
        <Field label="Section" hint="Timetable loads automatically">
          <select value={selectedSectionId} onChange={(event) => onSectionChange(event.target.value)} className={fieldClass}>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Student" hint="Attendance loads automatically">
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
        </Field>

        <Field label="Current date" hint={`Semester starts ${semester.start}`}>
          <div className={`${fieldClass} flex items-center gap-2 bg-slate-50 text-slate-700`}>
            <CalendarDays size={16} className="text-slate-400" />
            {currentDate}
          </div>
        </Field>

        <Field label="Planning date" hint={`Semester ends ${semester.end}`}>
          <input
            type="date"
            min={semester.start}
            max={semester.end}
            value={futureDate}
            onChange={(event) => onFutureDateChange(event.target.value)}
            className={fieldClass}
          />
        </Field>
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      <span className="text-xs text-slate-500">{hint}</span>
    </label>
  );
}
