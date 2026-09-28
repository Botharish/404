"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  ChevronsLeft,
  ChevronsRight,
  GaugeCircle,
  LayoutDashboard,
  LineChart,
  Menu,
  MessageCircle,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import AttendanceAdvisor from "@/components/AttendanceAdvisor";
import AttendanceCard from "@/components/AttendanceCard";
import AttendanceCharts from "@/components/AttendanceCharts";
import LeaveSimulator from "@/components/LeaveSimulator";
import PredictionCard from "@/components/PredictionCard";
import SectionSelector from "@/components/SectionSelector";
import Footer from "@/components/Footer";
import SubjectCard from "@/components/SubjectCard";
import SubjectPicker from "@/components/SubjectPicker";
import WhatIfSimulator from "@/components/WhatIfSimulator";
import { sections, semester } from "@/data/timetables";
import { studentsForSection } from "@/data/students";
import { buildSubjectSummaries, clampDateKey, percent, todayKey } from "@/lib/attendance";

type NavItem = { id: string; label: string; icon: LucideIcon; href: string };

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/check-attendance" },
  { id: "charts", label: "Charts", icon: BarChart3, href: "/check-attendance/charts" },
  { id: "leave", label: "Leave planner", icon: ClipboardList, href: "/check-attendance/leave" },
  { id: "subjects", label: "Subjects", icon: BookOpen, href: "/check-attendance/subjects" }
];

type DashboardProps = {
  mode?: "landing" | "dashboard";
  page?: "overview" | "charts-health" | "charts-comparison" | "leave" | "what-if" | "subjects";
};

export default function Dashboard({ mode = "landing", page = "overview" }: DashboardProps) {
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0].id);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [currentDate, setCurrentDate] = useState(semester.start);
  const [futureDate, setFutureDate] = useState(semester.end);
  const [attendedBySubject, setAttendedBySubject] = useState<Record<string, number>>({});
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("");
  useEffect(() => {
    const browserToday = todayKey();
    setCurrentDate(clampDateKey(browserToday));
    setFutureDate(clampDateKey(browserToday > semester.end ? semester.end : semester.end));
  }, []);

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? sections[0],
    [selectedSectionId]
  );
  const sectionStudents = useMemo(() => studentsForSection(selectedSection.id), [selectedSection.id]);
  const selectedStudent = sectionStudents.find((student) => student.id === selectedStudentId) ?? sectionStudents[0];

  useEffect(() => {
    if (selectedStudent && selectedStudent.id !== selectedStudentId) {
      setSelectedStudentId(selectedStudent.id);
    }
  }, [selectedStudent, selectedStudentId]);

  const summaries = useMemo(
    () => buildSubjectSummaries(selectedSection, { ...selectedStudent?.attendedBySubject, ...attendedBySubject }, currentDate, futureDate),
    [attendedBySubject, currentDate, futureDate, selectedSection, selectedStudent]
  );

  const selectedSubject = summaries.find((subject) => subject.subjectCode === selectedSubjectCode) ?? summaries[0];

  const overallConducted = summaries.reduce((total, subject) => total + subject.conducted, 0);
  const overallAttended = summaries.reduce((total, subject) => total + subject.attended, 0);
  const overallRemaining = summaries.reduce((total, subject) => total + subject.remaining, 0);

  function updateAttended(subjectCode: string, value: number) {
    const subject = summaries.find((item) => item.subjectCode === subjectCode);
    const max = subject?.conducted ?? Number.MAX_SAFE_INTEGER;
    const boundedValue = Number.isFinite(value) ? Math.min(Math.max(0, value), max) : 0;
    setAttendedBySubject((previous) => ({
      ...previous,
      [subjectCode]: boundedValue
    }));
  }

  function changeSection(sectionId: string) {
    setSelectedSectionId(sectionId);
    setAttendedBySubject({});
    setSelectedStudentId("");
  }

  function changeStudent(studentId: string) {
    setSelectedStudentId(studentId);
    setAttendedBySubject({});
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {mode === "landing" ? (
      <>
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
                <CalendarCheck2 size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">Attendance Predictor</p>
                <p className="text-xs text-slate-500">Student planning dashboard</p>
              </div>
            </div>
            <Link
              href="/check-attendance"
              className="hidden items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:inline-flex"
            >
              Check attendance
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/check-attendance"
              aria-label="Open attendance checker"
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
            >
              <Menu size={20} />
            </Link>
          </nav>

          <div className="grid items-center gap-10 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                <CalendarCheck2 size={15} />
                Built for 75% attendance decisions
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Attendance, made simple.
              </h1>
              <div className="mt-4 h-1.5 w-24 rounded-full bg-blue-600" />
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Check your 75% safety, plan leaves, and know exactly what to attend next.
              </p>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                <MiniStat label="Target" value="75%" />
                <MiniStat label="Semester" value="93 days" />
                <MiniStat label="Sections" value={`${sections.length}`} />
              </div>
            </div>

            <div id="preview">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Live preview</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight">Attendance health</h2>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-600 text-white">
                    <GaugeCircle size={22} />
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                    <p className="text-sm font-medium text-slate-500">Overall attendance</p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <p className="text-5xl font-bold tracking-tight">84.6%</p>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">Safe</span>
                    </div>
                    <div className="mt-5 h-2 rounded-full bg-slate-200">
                      <div className="h-2 w-[85%] rounded-full bg-blue-600" />
                    </div>
                  </div>
                  <PreviewTile icon={CalendarCheck2} label="Classes left" value="127" />
                  <PreviewTile icon={LineChart} label="Attend all" value="94.8%" />
                  <PreviewTile icon={ShieldCheck} label="Need for 75%" value="89" />
                  <PreviewTile icon={CheckCircle2} label="Can miss" value="38" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-b border-slate-200 bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-700">Why it is useful</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Clear numbers before you make a decision.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Feature icon={CalendarCheck2} title="Real timetable counts" text="Counts classes from semester dates, weekdays, holidays, and exceptions." />
            <Feature icon={ShieldCheck} title="Detention warning" text="Shows when 75% is mathematically impossible, subject by subject." />
            <Feature icon={BarChart3} title="Visual charts" text="See overall health and subject-wise attendance in clear chart cards." />
            <Feature icon={ClipboardList} title="Leave simulator" text="Test OD or medical leave classes and instantly see the final percentage." />
            <Feature icon={MessageCircle} title="Attendance advisor" text="Ask natural questions and get advice from your current dashboard numbers." />
          </div>
        </div>
      </section>
      <Footer />
      </>
      ) : null}

      {mode === "dashboard" ? (
      <section id="check-attendance">
      <div className={`grid min-h-screen transition-[grid-template-columns] duration-300 ${
        sidebarCollapsed ? "lg:grid-cols-[88px_minmax(0,1fr)]" : "lg:grid-cols-[260px_minmax(0,1fr)]"
      }`}>
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col px-5 py-6">
            <div className="flex items-start justify-between gap-2">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-white">
                  <CalendarCheck2 size={20} />
                </div>
                {!sidebarCollapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">Attendance</p>
                    <p className="truncate text-xs text-slate-500">Predictor Suite</p>
                  </div>
                ) : null}
              </Link>
              <button
                type="button"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
                onClick={() => setSidebarCollapsed((value) => !value)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
              >
                {sidebarCollapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
              </button>
            </div>
            <nav className="mt-8 grid gap-1 text-sm font-medium">
              {navItems.map(({ id, label, icon: Icon, href }) => (
                <Link
                  key={id}
                  title={sidebarCollapsed ? label : undefined}
                  className={`flex items-center rounded-lg px-3 py-2.5 text-left transition ${
                    sidebarCollapsed ? "justify-center" : "gap-3"
                  } ${
                    (id === "charts" ? page === "charts-health" || page === "charts-comparison" : page === id)
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                  href={href}
                >
                  <Icon size={18} />
                  {!sidebarCollapsed ? label : null}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setAdvisorOpen(true)}
                title={sidebarCollapsed ? "Advisor" : undefined}
                className={`flex items-center rounded-lg px-3 py-2.5 text-left text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 ${
                  sidebarCollapsed ? "justify-center" : "gap-3"
                }`}
              >
                <MessageCircle size={18} />
                {!sidebarCollapsed ? "Advisor" : null}
              </button>
            </nav>
            {!sidebarCollapsed ? (
            <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShieldCheck size={17} />
                75% guardrail
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Uses real dates, weekdays, holidays, and remaining classes for every subject.
              </p>
            </div>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:hidden">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-950 text-white">
                  <CalendarCheck2 size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">Attendance</p>
                  <p className="truncate text-xs text-slate-500">Predictor Suite</p>
                </div>
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((value) => !value)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900"
                >
                  <Menu size={17} />
                  Menu
                  </button>
                {mobileMenuOpen ? (
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/50">
                    {navItems.map(({ id, label, icon: Icon, href }) => (
                      <Link
                        key={id}
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                          (id === "charts" ? page === "charts-health" || page === "charts-comparison" : page === id)
                            ? "bg-slate-950 text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Icon size={16} />
                        {label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setAdvisorOpen(true);
                      }}
                      className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <MessageCircle size={16} />
                      Advisor
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-6">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">Dashboard</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Attendance Predictor</h1>
                <p className="mt-2 text-base text-slate-500">Know before you miss. Plan attendance with clean, subject-wise forecasts.</p>
              </div>
            </header>

            <div className="grid gap-6 py-6">
              {page === "overview" ? (
              <div className="grid gap-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  <AttendanceCard summaries={summaries} />
                  <PredictionCard summaries={summaries} currentDate={currentDate} futureDate={futureDate} />
                </div>
              </div>
              ) : null}

              {page === "charts-health" ? (
              <div className="grid gap-6">
                <ChartTabs page={page} />
                <SectionSelector
                  sections={sections}
                  selectedSectionId={selectedSectionId}
                  students={sectionStudents}
                  selectedStudentId={selectedStudent?.id}
                  currentDate={currentDate}
                  futureDate={futureDate}
                  onSectionChange={changeSection}
                  onStudentChange={changeStudent}
                  onFutureDateChange={(date) => setFutureDate(clampDateKey(date))}
                />
                <AttendanceCharts summaries={summaries} view="health" />
              </div>
              ) : null}
              {page === "charts-comparison" ? (
              <div className="grid gap-6">
                <ChartTabs page={page} />
                <SectionSelector
                  sections={sections}
                  selectedSectionId={selectedSectionId}
                  students={sectionStudents}
                  selectedStudentId={selectedStudent?.id}
                  currentDate={currentDate}
                  futureDate={futureDate}
                  onSectionChange={changeSection}
                  onStudentChange={changeStudent}
                  onFutureDateChange={(date) => setFutureDate(clampDateKey(date))}
                />
                <AttendanceCharts summaries={summaries} view="comparison" />
              </div>
              ) : null}
              {page === "leave" ? (
              <div className="grid gap-6">
                <LeaveSimulator summaries={summaries} />
              </div>
              ) : null}
              {page === "what-if" ? (
              <div>
                <WhatIfSimulator summaries={summaries} />
              </div>
              ) : null}

              {page === "subjects" ? (
              <section>
                <SectionSelector
                  sections={sections}
                  selectedSectionId={selectedSectionId}
                  students={sectionStudents}
                  selectedStudentId={selectedStudent?.id}
                  currentDate={currentDate}
                  futureDate={futureDate}
                  onSectionChange={changeSection}
                  onStudentChange={changeStudent}
                  onFutureDateChange={(date) => setFutureDate(clampDateKey(date))}
                />
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Subject-wise prediction · {selectedSection.name}</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Pick a subject to see its forecast</h2>
                  </div>
                  <SubjectPicker summaries={summaries} selectedCode={selectedSubject?.subjectCode ?? ""} onSelect={setSelectedSubjectCode} />
                </div>
                {selectedSubject ? (
                  <SubjectCard key={selectedSubject.subjectCode} summary={selectedSubject} onAttendedChange={updateAttended} detailed />
                ) : null}
              </section>
              ) : null}
            </div>
          </div>
        </div>
        </div>
      </div>
      </section>
      ) : null}
      {mode === "dashboard" ? (
        <AttendanceAdvisor
          currentDate={currentDate}
          futureDate={futureDate}
          open={advisorOpen}
          onOpenChange={setAdvisorOpen}
          sections={sections}
        />
      ) : null}
    </main>
  );
}

function ChartTabs({ page }: { page: "charts-health" | "charts-comparison" }) {
  const tabs = [
    {
      href: "/check-attendance/charts/health",
      label: "Attendance health",
      icon: GaugeCircle,
      active: page === "charts-health"
    },
    {
      href: "/check-attendance/charts/comparison",
      label: "Subject comparison",
      icon: BarChart3,
      active: page === "charts-comparison"
    }
  ];

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:w-fit sm:flex-row">
      {tabs.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
            active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
          }`}
        >
          <Icon size={17} />
          {label}
        </Link>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function PreviewTile({
  icon: Icon,
  label,
  value
}: {
  icon: typeof CalendarCheck2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Icon size={16} />
        {label}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text
}: {
  icon: typeof CalendarCheck2;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white">
        <Icon size={20} />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
