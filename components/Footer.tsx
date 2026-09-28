import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";

const links = [
  { label: "Home", href: "/" },
  { label: "Overview", href: "/check-attendance" },
  { label: "Charts", href: "/check-attendance/charts" },
  { label: "Leave planner", href: "/check-attendance/leave" },
  { label: "What-if", href: "/check-attendance/what-if" },
  { label: "Subjects", href: "/check-attendance/subjects" }
];

type Props = {
  className?: string;
};

export default function Footer({ className = "" }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className={`border-t border-slate-200 bg-white ${className}`}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
              <CalendarCheck2 size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Attendance Predictor</p>
              <p className="text-xs text-slate-500">Know before you miss.</p>
            </div>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
            Plan your semester with real timetables, holidays, and a 75% guardrail for every subject.
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-slate-600 transition hover:text-slate-950">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {year} Attendance Predictor. All rights reserved.</p>
          <p>
            Built by team{" "}
            <span className="rounded-md bg-slate-950 px-2 py-1 font-mono text-xs font-semibold text-white">404 : Syntax Error</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
