import { sections } from "./timetables";

export type Student = {
  id: string;
  name: string;
  rollNo: string;
  sectionId: string;
  attendedBySubject: Record<string, number>;
};

const names = [
  "Aarav Kumar",
  "Diya Raman",
  "Harish Y",
  "Meera Joseph",
  "Nikhil Raj",
  "Priya S",
  "Rahul Menon",
  "Sneha K"
];

function buildStudent(sectionId: string, sectionIndex: number, studentIndex: number): Student {
  const section = sections[sectionIndex];
  const uniqueCodes = Array.from(new Map(section.timetable.map((entry) => [entry.subjectCode, entry])).values());
  const attendedBySubject = Object.fromEntries(
    uniqueCodes.map((subject, subjectIndex) => {
      const seed = (sectionIndex * 11 + studentIndex * 7 + subjectIndex * 5) % 18;
      return [subject.subjectCode, seed];
    })
  );

  return {
    id: `${sectionId}-student-${studentIndex + 1}`,
    name: names[studentIndex % names.length],
    rollNo: `${section.name.replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase()}-${String(studentIndex + 1).padStart(2, "0")}`,
    sectionId,
    attendedBySubject
  };
}

export const students: Student[] = sections.flatMap((section, sectionIndex) =>
  Array.from({ length: 8 }, (_, studentIndex) => buildStudent(section.id, sectionIndex, studentIndex))
);

export function studentsForSection(sectionId: string) {
  return students.filter((student) => student.sectionId === sectionId);
}
