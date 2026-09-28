"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { SubjectSummary, percent } from "@/lib/attendance";

type Message = {
  role: "student" | "advisor";
  text: string;
};

type Props = {
  summaries: SubjectSummary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AttendanceAdvisor({ summaries, open, onOpenChange: setOpen }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "advisor",
      text: "Ask about your attendance, leave, 75%, 90%, or a subject. I will use your current dashboard numbers."
    }
  ]);

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

  function answer(question: string) {
    const normalized = question.toLowerCase();
    const subject = summaries.find((item) =>
      normalized.includes(item.subjectName.toLowerCase()) || normalized.includes(item.subjectCode.toLowerCase())
    );
    const leaveMatch = normalized.match(/(\d+)\s*(-|\s)?\s*(day|days|class|classes)/);
    const leaveCount = leaveMatch ? Number(leaveMatch[1]) : 0;
    const target = subject ?? null;

    if (target) {
      const afterLeave = leaveCount
        ? percent(target.attended + Math.max(0, target.remaining - leaveCount), target.conducted + target.remaining)
        : target.maxPossible;
      return `${target.subjectName}: current attendance is ${target.currentPercent.toFixed(1)}%. You need ${
        target.required75 > target.remaining ? "more classes than remain" : `${target.required75} more classes`
      } for 75% and ${
        target.required90 > target.remaining ? "more classes than remain" : `${target.required90} more classes`
      } for 90%. ${leaveCount ? `If you miss ${leaveCount} upcoming classes, the best final result becomes ${afterLeave.toFixed(1)}%.` : `If you attend all remaining classes, the maximum possible is ${target.maxPossible.toFixed(1)}%.`}`;
    }

    if (normalized.includes("75") || normalized.includes("safe") || normalized.includes("detention")) {
      const critical = summaries.filter((item) => item.maxPossible < 75);
      if (critical.length) {
        return `Warning: ${critical.map((item) => item.subjectName).join(", ")} cannot recover to 75% even if you attend every remaining class. Overall maximum possible is ${overall.max.toFixed(1)}%.`;
      }
      return `You are currently at ${overall.current.toFixed(1)}% overall. Maximum possible is ${overall.max.toFixed(1)}%. Keep the subjects marked "Below 75%" as your priority.`;
    }

    if (normalized.includes("90")) {
      const hard = summaries.filter((item) => item.required90 > item.remaining);
      return hard.length
        ? `90% is not reachable in ${hard.map((item) => item.subjectName).join(", ")} with the currently remaining classes.`
        : "90% is still reachable if you follow the required class counts shown on each subject card.";
    }

    if (leaveCount) {
      const finalPercent = percent(overall.attended + Math.max(0, overall.remaining - leaveCount), overall.conducted + overall.remaining);
      return `If you miss ${leaveCount} upcoming classes, your best overall final attendance becomes ${finalPercent.toFixed(1)}%. ${finalPercent >= 75 ? "That stays above 75%, but check subject cards before taking leave." : "That drops below 75%, so it is risky."}`;
    }

    const weakest = [...summaries].sort((a, b) => a.currentPercent - b.currentPercent)[0];
    return `Overall attendance is ${overall.current.toFixed(1)}%. Your weakest subject is ${weakest.subjectName} at ${weakest.currentPercent.toFixed(1)}%. Attend at least ${weakest.required75 > weakest.remaining ? "all possible classes and ask faculty for help" : `${weakest.required75} more classes`} there to protect 75%.`;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setMessages((previous) => [
      ...previous,
      { role: "student", text: question },
      { role: "advisor", text: answer(question) }
    ]);
    setInput("");
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
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-lg p-3 text-sm leading-6 ${
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
              placeholder="Ask: If I take 3 sick leave days..."
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
