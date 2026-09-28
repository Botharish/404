export type Room = {
  id: string;
  name: string;
  floor: number | null;
  floorInferred?: boolean;
  capacity: number | null;
  ac: boolean | null;
  notes?: string;
  scheduleComplete: boolean;
  bookings: { day: number; start: string; end: string; section: string; activity?: string; source?: string; page?: number }[];
};
export type RoomDataset = {
  validFrom: string;
  validTo: string;
  opens: string;
  closes: string;
  closedDates: string[];
  rooms: Room[];
  teachingDays?: number[];
  notes?: string[];
  sources?: { file: string; sha256: string; pages: number; status: "imported" | "archived"; note: string }[];
};
export type RoomData = { datasets: RoomDataset[]; files: string[]; errors: string[] };
export const isTime = (value: unknown): value is string => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateDataset(value: unknown): RoomDataset {
  const d = value as RoomDataset;
  if (!d || !isDate(d.validFrom) || !isDate(d.validTo) || d.validTo < d.validFrom || !isTime(d.opens) || !isTime(d.closes) || d.opens >= d.closes || !Array.isArray(d.closedDates) || !d.closedDates.every(isDate) || !Array.isArray(d.rooms)) throw new Error("Invalid dates, opening hours, closedDates, or rooms list.");
  const ids = new Set<string>();
  if (d.teachingDays !== undefined && (!Array.isArray(d.teachingDays) || !d.teachingDays.every(day => Number.isInteger(day) && day >= 0 && day <= 6))) throw new Error("Invalid teaching days.");
  if (d.notes !== undefined && (!Array.isArray(d.notes) || !d.notes.every(note => typeof note === "string"))) throw new Error("Invalid dataset notes.");
  if (d.sources !== undefined && (!Array.isArray(d.sources) || !d.sources.every(s => s && typeof s.file === "string" && /^[^/\\]+\.pdf$/i.test(s.file) && typeof s.sha256 === "string" && /^[a-f0-9]{64}$/.test(s.sha256) && Number.isInteger(s.pages) && s.pages > 0 && ["imported", "archived"].includes(s.status) && typeof s.note === "string"))) throw new Error("Invalid PDF source references.");
  for (const r of d.rooms) {
    if (!r || typeof r.id !== "string" || !r.id.trim() || ids.has(r.id) || typeof r.name !== "string" || !r.name.trim() || (r.floor !== null && !Number.isInteger(r.floor)) || (r.capacity !== null && (!Number.isInteger(r.capacity) || r.capacity < 1)) || (r.ac !== null && typeof r.ac !== "boolean") || typeof r.scheduleComplete !== "boolean" || !Array.isArray(r.bookings)) throw new Error("Invalid room fields or duplicate room ID.");
    if ((r.floorInferred !== undefined && typeof r.floorInferred !== "boolean") || (r.notes !== undefined && typeof r.notes !== "string")) throw new Error(`Invalid room metadata in ${r.id}.`);
    ids.add(r.id);
    for (const b of r.bookings) {
      if (!b || !Number.isInteger(b.day) || b.day < 0 || b.day > 6 || !isTime(b.start) || !isTime(b.end) || b.start >= b.end || typeof b.section !== "string" || !b.section.trim()) throw new Error(`Invalid booking in ${r.id}.`);
      if ((b.activity !== undefined && typeof b.activity !== "string") || (b.source !== undefined && typeof b.source !== "string") || (b.page !== undefined && (!Number.isInteger(b.page) || b.page < 1))) throw new Error(`Invalid booking source in ${r.id}.`);
    }
  }
  return d;
}
export function availability(d: RoomDataset, r: Room, date: string, start: string, duration: number): "Unknown" | "Closed" | "Occupied" | "Available" {
  if (!isDate(date) || !isTime(start) || !Number.isFinite(duration) || duration <= 0) return "Unknown";
  if (date < d.validFrom || date > d.validTo || !r.scheduleComplete) return "Unknown";
  const from = minutes(start), to = from + duration;
  if (d.closedDates.includes(date) || from < minutes(d.opens) || to > minutes(d.closes)) return "Closed";
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (d.teachingDays && !d.teachingDays.includes(day)) return "Unknown";
  return r.bookings.some(b => b.day === day && minutes(b.start) < to && minutes(b.end) > from) ? "Occupied" : "Available";
}
