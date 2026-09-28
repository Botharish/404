import { holidays, timetableExceptions } from "@/data/holidays";
import { Section, TimetableEntry, Weekday, semester } from "@/data/timetables";

export type SubjectSummary = {
  subjectCode: string;
  subjectName: string;
  conducted: number;
  attended: number;
  remaining: number;
  currentPercent: number;
  required75: number;
  required90: number;
  canSkip75: number;
  canSkip90: number;
  maxPossible: number;
  status: AttendanceStatus;
};

export type AttendanceStatus = "green" | "yellow" | "red" | "critical";

export const TARGET_75 = 0.75;
export const TARGET_90 = 0.9;

const weekdays: Weekday[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

export function clampDateKey(dateKey: string) {
  if (dateKey < semester.start) return semester.start;
  if (dateKey > semester.end) return semester.end;
  return dateKey;
}

export function uniqueSubjects(section: Section) {
  const map = new Map<string, Pick<TimetableEntry, "subjectCode" | "subjectName">>();
  section.timetable.forEach((entry) => {
    map.set(entry.subjectCode, {
      subjectCode: entry.subjectCode,
      subjectName: entry.subjectName
    });
  });
  timetableExceptions.forEach((entry) => {
    if (entry.type === "extra" && entry.sectionId === section.id) {
      map.set(entry.subjectCode, {
        subjectCode: entry.subjectCode,
        subjectName: entry.subjectName
      });
    }
  });
  return Array.from(map.values());
}

export function countClassesBetween(
  section: Section,
  subjectCode: string,
  startDate: string,
  endDate: string
) {
  const start = parseDate(clampDateKey(startDate));
  const end = parseDate(clampDateKey(endDate));
  if (start > end) return 0;

  let count = 0;
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const key = toDateKey(date);
    const day = weekdays[date.getDay()];
    const isHoliday = holidays.some((holiday) => holiday.date === key);
    if (isHoliday) continue;

    const cancelledCount = timetableExceptions.filter(
      (exception) =>
        exception.type === "cancelled" &&
        exception.date === key &&
        (!exception.sectionId || exception.sectionId === section.id) &&
        (!exception.subjectCode || exception.subjectCode === subjectCode)
    ).length;

    const regularCount = section.timetable.filter(
      (entry) => entry.subjectCode === subjectCode && entry.day === day
    ).length;

    const extraCount = timetableExceptions.filter(
      (exception) =>
        exception.type === "extra" &&
        exception.sectionId === section.id &&
        exception.subjectCode === subjectCode &&
        exception.date === key
    ).length;

    count += Math.max(0, regularCount - cancelledCount) + extraCount;
  }

  return count;
}

export function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

export function requiredForTarget(target: number, conducted: number, attended: number, remaining: number) {
  const required = Math.ceil(target * (conducted + remaining) - attended);
  if (required <= 0) return 0;
  if (required > remaining) return remaining + 1;
  return required;
}

export function classesCanSkip(target: number, conducted: number, attended: number, remaining: number) {
  const minimumAttend = Math.ceil(target * (conducted + remaining) - attended);
  return Math.max(0, remaining - Math.max(0, minimumAttend));
}

export function getStatus(currentPercent: number, maxPossible: number): AttendanceStatus {
  if (maxPossible < 75) return "critical";
  if (currentPercent < 75) return "red";
  if (currentPercent < 82) return "yellow";
  return "green";
}

export function buildSubjectSummaries(
  section: Section,
  attendedBySubject: Record<string, number>,
  currentDate: string,
  futureDate: string
): SubjectSummary[] {
  const today = clampDateKey(currentDate);
  const planDate = clampDateKey(futureDate);
  const conductedEnd = today < semester.start ? semester.start : today > semester.end ? semester.end : today;
  const remainingStartDate = new Date(parseDate(conductedEnd));
  remainingStartDate.setDate(remainingStartDate.getDate() + 1);
  const remainingStart = toDateKey(remainingStartDate);

  return uniqueSubjects(section).map((subject) => {
    const conducted = today < semester.start ? 0 : countClassesBetween(section, subject.subjectCode, semester.start, conductedEnd);
    const remaining = planDate < remainingStart ? 0 : countClassesBetween(section, subject.subjectCode, remainingStart, planDate);
    const attended = Math.min(attendedBySubject[subject.subjectCode] ?? Math.round(conducted * 0.82), conducted);
    const currentPercent = percent(attended, conducted);
    const maxPossible = percent(attended + remaining, conducted + remaining);

    return {
      ...subject,
      conducted,
      attended,
      remaining,
      currentPercent,
      required75: requiredForTarget(TARGET_75, conducted, attended, remaining),
      required90: requiredForTarget(TARGET_90, conducted, attended, remaining),
      canSkip75: classesCanSkip(TARGET_75, conducted, attended, remaining),
      canSkip90: classesCanSkip(TARGET_90, conducted, attended, remaining),
      maxPossible,
      status: getStatus(currentPercent, maxPossible)
    };
  });
}
