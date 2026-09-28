export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type TimetableEntry = {
  subjectCode: string;
  subjectName: string;
  day: Weekday;
  startTime: string;
  endTime: string;
};

export type Section = {
  id: string;
  name: string;
  timetable: TimetableEntry[];
};

export type TimetableException =
  | {
      type: "cancelled";
      sectionId?: string;
      subjectCode?: string;
      date: string;
      reason: string;
    }
  | {
      type: "extra";
      sectionId: string;
      subjectCode: string;
      subjectName: string;
      date: string;
      startTime: string;
      endTime: string;
      reason: string;
    };

type SubjectMap = Record<string, { subjectCode: string; subjectName: string }>;
type SlotRow = Partial<Record<Weekday, string[]>>;

const periodTimes: Record<number, [string, string]> = {
  1: ["09:00", "09:50"],
  2: ["09:50", "10:40"],
  3: ["10:50", "11:40"],
  4: ["11:40", "12:30"],
  5: ["12:30", "13:20"],
  6: ["13:20", "14:10"],
  7: ["14:10", "15:00"],
  8: ["15:10", "16:00"],
  9: ["16:00", "16:50"]
};

const slotOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function idFromName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function subject(code: string, name: string) {
  return { subjectCode: code, subjectName: name };
}

function buildTimetable(subjects: SubjectMap, rows: SlotRow): TimetableEntry[] {
  return Object.entries(rows).flatMap(([day, slots]) =>
    slots.flatMap((slot, index) => {
      if (!slot) return [];
      const resolved = subjects[slot];
      const period = slotOrder[index];
      const time = periodTimes[period];
      if (!resolved || !time) return [];

      return {
        ...resolved,
        day: day as Weekday,
        startTime: time[0],
        endTime: time[1]
      };
    })
  );
}

function section(name: string, subjects: SubjectMap, rows: SlotRow): Section {
  return {
    id: idFromName(name),
    name,
    timetable: buildTimetable(subjects, rows)
  };
}

const iiEceDsSubjects = {
  A: subject("21MAB201T", "Transforms and Boundary Value Problems"),
  B: subject("21ECC201T", "Solid State Devices"),
  C: subject("21CSS201T", "Computer Organization and Architecture"),
  D: subject("21ECC203T", "Digital Logic Design"),
  E: subject("21ECC205T", "Electromagnetic Theory and Interference"),
  F: subject("21LEM201T", "Professional Ethics"),
  G: subject("21LEM202T", "Universal Human Values-II"),
  H: subject("21PDM201L", "Verbal Reasoning"),
  I: subject("21PDH209T", "Social Engineering"),
  LAB: subject("21ECC211L", "Devices and Digital IC Laboratory")
};

const firstYearCoreSubjects = {
  A: subject("21MAB102T", "Advanced Calculus and Complex Analysis"),
  B: subject("21CYB101J", "Chemistry"),
  C: subject("21BTB102J", "Electronic System and PCB Design"),
  D: subject("21CSS101J", "Programming for Problem Solving"),
  E: subject("21GNH101J", "Philosophy of Engineering"),
  F: subject("21BTB103T", "Biology"),
  G: subject("21EEC101J", "Electrical Circuits"),
  GER: subject("21LEH104T", "German"),
  JAP: subject("21LEH105T", "Japanese"),
  WORKSHOP: subject("21MES101L", "Basic Civil and Mechanical Workshop"),
  PPSLAB: subject("21CSS101J-LAB", "Programming for Problem Solving Laboratory"),
  PCBLAB: subject("21BTB102J-LAB", "PCB Laboratory"),
  CHELAB: subject("21CYB101J-LAB", "Chemistry Laboratory"),
  CDC: subject("21PDM102L", "General Aptitude"),
  NSS: subject("21GNM102L", "NSS"),
  YOGA: subject("21GNM101L", "Physical and Mental Health using Yoga")
};

const firstYearBiotechSubjects = {
  ...firstYearCoreSubjects,
  C: subject("21BTC105T", "Cell Biology"),
  F: subject("21BTC101T", "Biochemistry"),
  G: subject("21BTB104T", "Biology: Human Physiology and Anatomy")
};

const iiiEceSubjectsA = {
  A: subject("21MAB302T", "Discrete Mathematics"),
  B: subject("21ECC301P", "Microprocessor, Microcontroller, and Interfacing Techniques"),
  C: subject("21ECC303T", "VLSI Design and Technology"),
  D: subject("21ECE468T", "System and Network on Chip"),
  E: subject("21CSO355T", "Machine Learning for All"),
  F: subject("21GNP301L", "Community Connect"),
  G: subject("21PDM301L", "Analytical and Logical Thinking Skills"),
  H: subject("21LEM301T", "Indian Art Form"),
  LAB: subject("21ECC311L", "VLSI Design / Microprocessor Laboratory")
};

const iiiEceSubjectsDs = {
  ...iiiEceSubjectsA,
  D: subject("21CSO355T", "Machine Learning for All"),
  E: subject("21ECE371T", "Database Design and Management")
};

const ivEceSubjects = {
  A: subject("21GNH401T", "Behavioural Psychology"),
  B: subject("21ECC401T", "Wireless Communication and Antenna Systems"),
  C: subject("21ECC402P", "Computer Communication and Network Security"),
  D: subject("21ECE461T", "Semiconductor Memory Design"),
  E: subject("21ECE463T", "Scripting Language for Electronic Design Automation"),
  F: subject("21CSO355T", "Machine Learning for All"),
  LAB: subject("21ECC402P-LAB", "Computer Communication and Network Security Laboratory")
};

const iiBmeSubjects = {
  A: subject("21MAB201T", "Transforms and Boundary Value Problems"),
  B: subject("21BMC202T", "Biomedical Signals and Systems"),
  C: subject("21BMC203J", "Electric and Electronic Circuits"),
  D: subject("21BMC204J", "Digital Logic for Medical Systems"),
  E: subject("21PYS202T", "Medical Physics"),
  F: subject("21LEM201T", "Professional Ethics"),
  G: subject("21LEM202T", "Universal Human Values-II"),
  H: subject("21PDM201L", "Verbal Reasoning"),
  I: subject("21PDH201T", "Social Engineering")
};

export const sections: Section[] = [
  section("I ECE A", firstYearCoreSubjects, {
    Monday: ["E", "E", "B", "A", "", "CHELAB", "CHELAB", "F", "CDC"],
    Tuesday: ["C", "B", "A", "D", "", "WORKSHOP", "WORKSHOP", "WORKSHOP", "WORKSHOP"],
    Wednesday: ["B", "E", "D", "", "", "PPSLAB", "PPSLAB", "PCBLAB", "PCBLAB"],
    Thursday: ["GER", "GER", "GER", "A", "", "CDC", "CDC", "NSS", "NSS"],
    Friday: ["D", "A", "C", "B", "", "F", "GER", "GER", "GER"]
  }),
  section("I ECE B / EEE", firstYearCoreSubjects, {
    Monday: ["CDC", "F", "CHELAB", "CHELAB", "", "E", "E", "B", "A"],
    Tuesday: ["WORKSHOP", "WORKSHOP", "WORKSHOP", "WORKSHOP", "", "C", "B", "A", "D"],
    Wednesday: ["F", "PPSLAB", "CDC", "CDC", "PPSLAB", "", "B", "E", "D"],
    Thursday: ["NSS", "NSS", "C", "A", "", "D", "GER", "GER", "GER"],
    Friday: ["PCBLAB", "PCBLAB", "", "", "GER", "GER", "GER", "B", "A"]
  }),
  section("I ECE DS", firstYearCoreSubjects, {
    Monday: ["F", "CDC", "PCBLAB", "PCBLAB", "", "E", "E", "B", "A"],
    Tuesday: ["CHELAB", "CHELAB", "NSS", "NSS", "", "C", "B", "A", "D"],
    Wednesday: ["CDC", "CDC", "A", "", "PPSLAB", "PPSLAB", "B", "E", "D"],
    Thursday: ["F", "A", "D", "GER", "GER", "GER", "", "E", "B"],
    Friday: ["GER", "GER", "GER", "PPSLAB", "", "WORKSHOP", "WORKSHOP", "WORKSHOP", "WORKSHOP"]
  }),
  section("I Biotech B / Biomedical Engineering", firstYearBiotechSubjects, {
    Monday: ["C", "YOGA", "YOGA", "F", "", "E", "E", "A", "B"],
    Tuesday: ["CDC", "CDC", "C", "F", "", "", "B", "A", "D"],
    Wednesday: ["WORKSHOP", "WORKSHOP", "WORKSHOP", "WORKSHOP", "", "D", "B", "E", "D"],
    Thursday: ["CHELAB", "CHELAB", "A", "C", "", "B", "JAP", "JAP", "JAP"],
    Friday: ["F", "CDC", "A", "JAP", "JAP", "JAP", "", "PPSLAB", "PPSLAB"]
  }),
  section("II BME", iiBmeSubjects, {
    Monday: ["E", "C", "I", "I", "", "G", "G", "", ""],
    Tuesday: ["C", "E", "B", "A", "", "H", "H", "", ""],
    Wednesday: ["B", "D", "A", "", "", "H", "G", "", ""],
    Thursday: ["A", "E", "B", "D", "", "", "", "G", "G"],
    Friday: ["F", "A", "C", "D", "", "", "", "G", "G"]
  }),
  section("II ECE DS A", iiEceDsSubjects, {
    Monday: ["E", "A", "I", "I", "", "G", "G", "LAB", "LAB"],
    Tuesday: ["C", "A", "E", "D", "", "G", "G", "H", "H"],
    Wednesday: ["A", "B", "C", "D", "", "", "H", "", ""],
    Thursday: ["B", "C", "A", "F", "", "LAB", "LAB", "", ""],
    Friday: ["D", "B", "E", "C", "", "", "", "", ""]
  }),
  section("II ECE DS B", iiEceDsSubjects, {
    Monday: ["", "", "LAB", "LAB", "", "D", "B", "C", "I"],
    Tuesday: ["LAB", "LAB", "", "", "", "C", "D", "E", "A"],
    Wednesday: ["G", "G", "", "", "", "I", "E", "A", "D"],
    Thursday: ["G", "G", "H", "H", "", "A", "C", "B", "E"],
    Friday: ["H", "H", "", "", "", "F", "A", "B", "C"]
  }),
  section("III ECE A", iiiEceSubjectsA, {
    Monday: ["E", "B", "B", "A", "", "G", "G", "", ""],
    Tuesday: ["H", "D", "B", "B", "", "", "G", "", ""],
    Wednesday: ["C", "A", "D", "F", "", "", "", "LAB", "LAB"],
    Thursday: ["A", "E", "C", "F", "", "", "", "", ""],
    Friday: ["D", "A", "E", "C", "", "LAB", "LAB", "", ""]
  }),
  section("III ECE DS", iiiEceSubjectsDs, {
    Monday: ["E", "B", "C", "A", "", "", "", "", ""],
    Tuesday: ["C", "B", "D", "F", "", "LAB", "LAB", "", ""],
    Wednesday: ["H", "B", "A", "C", "", "", "", "G", "G"],
    Thursday: ["A", "D", "E", "F", "", "", "", "", ""],
    Friday: ["D", "A", "E", "B", "", "G", "G", "LAB", "LAB"]
  }),
  section("IV ECE A", ivEceSubjects, {
    Monday: ["C", "", "A", "D", "", "", "", "", ""],
    Tuesday: ["C", "D", "B", "F", "", "", "", "", ""],
    Wednesday: ["B", "LAB", "E", "F", "", "", "", "", ""],
    Thursday: ["F", "A", "E", "B", "", "", "", "", ""],
    Friday: ["C", "A", "D", "E", "", "", "", "", ""]
  }),
  section("IV ECE B", ivEceSubjects, {
    Monday: ["C", "A", "E", "F", "", "", "", "", ""],
    Tuesday: ["C", "E", "F", "B", "", "", "", "", ""],
    Wednesday: ["C", "D", "A", "B", "", "", "", "", ""],
    Thursday: ["D", "B", "LAB", "A", "", "", "", "", ""],
    Friday: ["E", "D", "F", "", "", "", "", "", ""]
  })
];

export const semester = {
  start: "2026-08-29",
  end: "2026-11-29"
};
