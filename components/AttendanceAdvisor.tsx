"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { Section } from "@/data/timetables";
import { studentsForSection } from "@/data/students";
import { buildSubjectSummaries, percent } from "@/lib/attendance";
import type { RoomData } from "@/lib/rooms";
import { answerRoomRequest, parseRoomRequest } from "@/lib/roomSearch";

const ROOM_QUESTION = /\b(rooms?|classrooms?|labs?|hall|study space|place to study)\b/;
const EACH_SUBJECT = /\b(each|every|all|per|subject[- ]?wise)\b.*\bsubjects?\b|\bsubjects?\b.*\b(each|every|all|wise|list)\b|\ball subjects\b/;
const istDate = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const istTime = () =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());

type Message = {
  role: "student" | "advisor";
  text: string;
};

type Props = {
  sections: Section[];
  currentDate: string;
  futureDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AttendanceAdvisor({ sections, currentDate, futureDate, open, onOpenChange: setOpen }: Props) {
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id ?? "");
  const sectionStudents = useMemo(() => studentsForSection(selectedSectionId), [selectedSectionId]);
  const [selectedStudentId, setSelectedStudentId] = useState(sectionStudents[0]?.id ?? "");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "advisor",
      text: "Select your class and name, then ask about attendance, leave, 75%, 90%, any subject, or a free room."
    }
  ]);

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) ?? sections[0],
    [sections, selectedSectionId]
  );
  const selectedStudent = sectionStudents.find((student) => student.id === selectedStudentId) ?? sectionStudents[0];

  const summaries = useMemo(
    () => buildSubjectSummaries(selectedSection, selectedStudent?.attendedBySubject ?? {}, currentDate, futureDate),
    [currentDate, futureDate, selectedSection, selectedStudent]
  );

  function changeSection(sectionId: string) {
    const students = studentsForSection(sectionId);
    setSelectedSectionId(sectionId);
    setSelectedStudentId(students[0]?.id ?? "");
    setMessages([
      {
        role: "advisor",
        text: "Class changed. Select the student name if needed, then ask your question."
      }
    ]);
  }

  function changeStudent(studentId: string) {
    setSelectedStudentId(studentId);
    setMessages([
      {
        role: "advisor",
        text: "Student selected. Ask your attendance question now."
      }
    ]);
  }

  const overall = useMemo(() => {
    const conducted = summaries.reduce((total, subject) => total + subject.conducted, 0);
    const attended = summaries.reduce((total, subject) => total + subject.attended, 0);
    const remaining = summaries.reduce((total, subject) => total + subject.remaining, 0);
    return {
      conducted,
      attended,
      remaining,
      current: percent(attended, conducted),
      max: percent(attended + remaining, conducted + remaining)
    };
  }, [summaries]);

  function leaveProjection(leaveClasses: number, subject = summaries[0]) {
    const leave = Math.min(Math.max(0, leaveClasses), subject.remaining);
    const finalPercent = percent(subject.attended + Math.max(0, subject.remaining - leave), subject.conducted + subject.remaining);
    return {
      leave,
      finalPercent,
      safe75: finalPercent >= 75,
      safe90: finalPercent >= 90
    };
  }

  function overallLeaveProjection(leaveClasses: number) {
    const leave = Math.min(Math.max(0, leaveClasses), overall.remaining);
    const finalPercent = percent(overall.attended + Math.max(0, overall.remaining - leave), overall.conducted + overall.remaining);
    return {
      leave,
      finalPercent,
      safe75: finalPercent >= 75,
      safe90: finalPercent >= 90
    };
  }

  function maxLeaveForTarget(targetPercent: number, subject = summaries[0]) {
    let answer = 0;
    for (let leave = 0; leave <= subject.remaining; leave += 1) {
      const projection = leaveProjection(leave, subject);
      if (projection.finalPercent >= targetPercent) {
        answer = leave;
      } else {
        break;
      }
    }
    return answer;
  }

  function maxOverallLeaveForTarget(targetPercent: number) {
    let answer = 0;
    for (let leave = 0; leave <= overall.remaining; leave += 1) {
      const projection = overallLeaveProjection(leave);
      if (projection.finalPercent >= targetPercent) {
        answer = leave;
      } else {
        break;
      }
    }
    return answer;
  }

  function targetLine(finalPercent: number, targetPercent: number) {
    const gap = Math.abs(finalPercent - targetPercent).toFixed(1);
    if (finalPercent >= targetPercent) {
      return `This is ${gap}% above the ${targetPercent}% target.`;
    }
    return `This is ${gap}% below the ${targetPercent}% target.`;
  }

  function answer(question: string) {
    const normalized = question.toLowerCase();
    if (!summaries.length) {
      return "No attendance data is available for this selection yet. Choose another class or student and try again.";
    }

    const subject = summaries.find((item) =>
      normalized.includes(item.subjectName.toLowerCase()) || normalized.includes(item.subjectCode.toLowerCase())
    );
    const leaveMatch = normalized.match(/(\d+)\s*(-|\s)?\s*(day|days|class|classes|leave|leaves|od|medical)/);
    const leaveCount = leaveMatch ? Number(leaveMatch[1]) : 0;
    const asksLeave = /(leave|leaves|od|medical|sick|miss|skip|absent)/.test(normalized);
    const asksMaximum = /(how many|max|maximum|can i miss|can i skip|can i take)/.test(normalized);
    const asksPercent = /(percentage|percent|attendance|drop|final|become|result)/.test(normalized);
    const targetPercent = normalized.includes("90") ? 90 : 75;
    const target = subject ?? null;

    if (!target && EACH_SUBJECT.test(normalized)) {
      const lines = summaries.map(
        (item) =>
          `• ${item.subjectName}: ${item.currentPercent.toFixed(1)}% (${item.attended}/${item.conducted})${item.currentPercent < 75 ? " ⚠ below 75%" : ""}`
      );
      return `${selectedStudent?.name ?? "This student"} (${selectedSection?.name ?? "this class"}) — subject-wise attendance:\n${lines.join("\n")}\nOverall: ${overall.current.toFixed(1)}%.`;
    }

    if (target && asksLeave && leaveCount) {
      const projection = leaveProjection(leaveCount, target);
      return `Final percentage: ${projection.finalPercent.toFixed(1)}% in ${target.subjectName}. ${targetLine(projection.finalPercent, 75)} ${
        projection.safe75 ? "So this leave is safe for 75%." : "So this leave is not safe for 75%."
      } Current percentage is ${target.currentPercent.toFixed(1)}%; if every remaining class is attended, maximum possible is ${target.maxPossible.toFixed(1)}%.`;
    }

    if (target && asksLeave && asksMaximum) {
      const canLeave75 = maxLeaveForTarget(75, target);
      const canLeave90 = maxLeaveForTarget(90, target);
      const percentAt75Limit = leaveProjection(canLeave75, target).finalPercent;
      const percentAt90Limit = leaveProjection(canLeave90, target).finalPercent;
      return `${target.subjectName}: ${selectedStudent?.name ?? "this student"} can take ${canLeave75} leave/missed classes and still finish at ${percentAt75Limit.toFixed(1)}% for the 75% target. For the 90% target, safe leave count is ${canLeave90}, ending at ${percentAt90Limit.toFixed(1)}%. Current percentage is ${target.currentPercent.toFixed(1)}%.`;
    }

    if (asksLeave && leaveCount) {
      const projection = overallLeaveProjection(leaveCount);
      return `Final overall percentage: ${projection.finalPercent.toFixed(1)}%. ${targetLine(projection.finalPercent, 75)} ${
        projection.safe75 ? "So this leave is safe for 75%." : "So this leave is risky for 75%."
      } Current overall percentage is ${overall.current.toFixed(1)}%; if every remaining class is attended, maximum possible is ${overall.max.toFixed(1)}%.`;
    }

    if (asksLeave && asksMaximum) {
      const canLeave75 = maxOverallLeaveForTarget(75);
      const canLeave90 = maxOverallLeaveForTarget(90);
      const percentAt75Limit = overallLeaveProjection(canLeave75).finalPercent;
      const percentAt90Limit = overallLeaveProjection(canLeave90).finalPercent;
      return `${selectedStudent?.name ?? "This student"} can take ${canLeave75} leave/missed classes overall and still finish at ${percentAt75Limit.toFixed(1)}% for the 75% target. For the 90% target, safe leave count is ${canLeave90}, ending at ${percentAt90Limit.toFixed(1)}%. Current overall percentage is ${overall.current.toFixed(1)}%; maximum possible is ${overall.max.toFixed(1)}%.`;
    }

    if (target) {
      return `${selectedStudent?.name ?? "This student"} in ${selectedSection?.name ?? "this class"}: ${target.subjectName} is currently ${target.currentPercent.toFixed(1)}%. You need ${
        target.required75 > target.remaining ? "more classes than remain" : `${target.required75} more classes`
      } for 75% and ${
        target.required90 > target.remaining ? "more classes than remain" : `${target.required90} more classes`
      } for 90%. If you attend all remaining classes, the maximum possible is ${target.maxPossible.toFixed(1)}%.`;
    }

    if (normalized.includes("75") || normalized.includes("safe") || normalized.includes("detention")) {
      const critical = summaries.filter((item) => item.maxPossible < 75);
      if (critical.length) {
        return `${selectedStudent?.name ?? "This student"} has risk in ${critical.map((item) => item.subjectName).join(", ")}. These cannot recover to 75% even if every remaining class is attended. Overall maximum possible is ${overall.max.toFixed(1)}%.`;
      }
      return `${selectedStudent?.name ?? "This student"} is currently at ${overall.current.toFixed(1)}% overall. Maximum possible is ${overall.max.toFixed(1)}%. Keep any subject below 75% as the priority.`;
    }

    if (normalized.includes("90")) {
      const hard = summaries.filter((item) => item.required90 > item.remaining);
      return hard.length
        ? `Current overall percentage is ${overall.current.toFixed(1)}%, and maximum possible is ${overall.max.toFixed(1)}%. 90% is not reachable in ${hard.map((item) => item.subjectName).join(", ")} with the currently remaining classes.`
        : `Current overall percentage is ${overall.current.toFixed(1)}%, and maximum possible is ${overall.max.toFixed(1)}%. 90% is reachable if you follow the required class counts shown on each subject card.`;
    }

    if (asksPercent) {
      return `${selectedStudent?.name ?? "This student"} has ${overall.current.toFixed(1)}% overall right now. If every remaining class is attended, the final overall attendance can reach ${overall.max.toFixed(1)}%. To finish at ${targetPercent}%, check the subjects needing more classes first.`;
    }

    const weakest = [...summaries].sort((a, b) => a.currentPercent - b.currentPercent)[0];
    return `${selectedStudent?.name ?? "This student"} has ${overall.current.toFixed(1)}% overall attendance. The weakest subject is ${weakest.subjectName} at ${weakest.currentPercent.toFixed(1)}%. Attend ${weakest.required75 > weakest.remaining ? "all possible classes and ask faculty for help" : `${weakest.required75} more classes`} there to protect 75%.`;
  }

  async function answerRooms(question: string) {
    const intent = parseRoomRequest(question, { date: istDate(), time: istTime(), duration: 60 });
    if (intent.error) return intent.error;
    try {
      const response = await fetch("/api/rooms", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data: RoomData = await response.json();
      if (data.errors.length || !data.datasets.length) {
        return "Room data is not verified right now, so I can't confirm free rooms. Open the Room Finder page for details.";
      }
      return `${answerRoomRequest(data, intent).note} (Checked for ${intent.date}, IST.)`;
    } catch {
      return "I couldn't load room data. Please try again or open the Room Finder page.";
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput("");
    if (ROOM_QUESTION.test(question.toLowerCase())) {
      setMessages((previous) => [...previous, { role: "student", text: question }, { role: "advisor", text: "Checking rooms…" }]);
      const reply = await answerRooms(question);
      setMessages((previous) => [...previous.slice(0, -1), { role: "advisor", text: reply }]);
      return;
    }
    setMessages((previous) => [
      ...previous,
      { role: "student", text: question },
      { role: "advisor", text: answer(question) }
    ]);
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-xl transition hover:bg-slate-800 sm:bottom-5 sm:right-5 sm:h-14 sm:px-5 sm:text-base"
      >
        <MessageCircle size={20} />
        Advisor
      </button>

      {open ? (
        <div className="fixed inset-x-3 bottom-20 z-50 flex h-[min(520px,calc(100vh-6rem))] flex-col rounded-xl border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-5 sm:w-[min(380px,calc(100vw-2.5rem))]">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-white">
                <Bot size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-950">Attendance Advisor</p>
                <p className="text-xs text-slate-500">Uses your dashboard data</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Class
                <select
                  value={selectedSectionId}
                  onChange={(event) => changeSection(event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Name
                <select
                  value={selectedStudent?.id ?? ""}
                  onChange={(event) => changeStudent(event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  {sectionStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.rollNo} · {student.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`whitespace-pre-line rounded-lg p-3 text-sm leading-6 ${
                  message.role === "student"
                    ? "ml-8 bg-blue-600 text-white"
                    : "mr-8 border border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask: % in each subject, or a free room now"
              className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
            <button className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white hover:bg-slate-800">
              <Send size={17} />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
