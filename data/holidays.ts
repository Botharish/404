import type { TimetableException } from "./timetables";

export const holidays = [
  {
    date: "2026-10-02",
    name: "Gandhi Jayanti"
  },
  {
    date: "2026-10-20",
    name: "Mid-semester break"
  }
];

export const timetableExceptions: TimetableException[] = [
  {
    type: "cancelled",
    sectionId: "cse-a",
    subjectCode: "CSE201",
    date: "2026-09-14",
    reason: "Department event"
  },
  {
    type: "extra",
    sectionId: "cse-a",
    subjectCode: "MAT201",
    subjectName: "Discrete Mathematics",
    date: "2026-11-07",
    startTime: "10:00",
    endTime: "10:55",
    reason: "Revision class"
  }
];
