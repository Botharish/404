import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const folder = path.join(root, "room-database");
const reviewed = JSON.parse(await readFile(path.join(folder, "reviewed-timetables.source.json"), "utf8"));
const times = [["09:00", "09:50"], ["09:50", "10:40"], ["10:50", "11:40"], ["11:40", "12:30"], ["12:30", "13:20"], ["13:20", "14:10"], ["14:10", "15:00"], ["15:10", "16:00"], ["16:00", "16:50"]];
const rooms = new Map();
const sources = [];

function add(roomId, section, day, periods, activity, source, multipleRooms = false) {
  if (!rooms.has(roomId)) {
    const number = Number(roomId.split("-")[1]);
    rooms.set(roomId, {
      id: roomId,
      name: roomId.replace("-", " "),
      floor: Math.floor(number / 100),
      floorInferred: true,
      capacity: null,
      ac: null,
      scheduleComplete: true,
      notes: "Floor inferred from room number; AC and capacity are not specified in the PDFs.",
      bookings: []
    });
  }
  for (const period of periods) {
    if (!times[period - 1]) throw new Error(`Invalid period ${period}`);
    const [start, end] = times[period - 1];
    rooms.get(roomId).bookings.push({ day, start, end, section, activity: activity + (multipleRooms ? " (both listed venues blocked)" : ""), source, page: 1 });
  }
}

for (const section of reviewed.current) {
  if (section.homePeriods.length !== 5) throw new Error(`Missing weekday in ${section.section}`);
  section.homePeriods.forEach((periods, index) => add(section.home, section.section, index + 1, periods, "Class / project", section.file));
  for (const [day, periods, venues, activity] of section.other) {
    for (const venue of venues) add(venue, section.section, day, periods, activity, section.file, venues.length > 1);
  }
  sources.push({ file: section.file, sha256: createHash("sha256").update(await readFile(path.join(folder, section.file))).digest("hex"), pages: 1, status: "imported", note: `${section.section} - odd semester 2026-27` });
}
sources.push({ file: reviewed.archived.file, sha256: createHash("sha256").update(await readFile(path.join(folder, reviewed.archived.file))).digest("hex"), pages: 4, status: "archived", note: reviewed.archived.reason });
for (const room of rooms.values()) room.bookings.sort((a, b) => a.day - b.day || a.start.localeCompare(b.start) || a.section.localeCompare(b.section));

const dataset = {
  validFrom: "2026-08-29",
  validTo: "2026-11-29",
  opens: "09:00",
  closes: "16:50",
  teachingDays: [1, 2, 3, 4, 5],
  closedDates: [],
  notes: [
    "9 current PDFs imported; the 4-page first-year PDF is labelled 2024-25 and remains archived.",
    "Floor numbers are inferred from room codes and need campus confirmation. AC and seating capacity were not provided.",
    "Availability uses the app's semester dates (29 Aug-29 Nov 2026) and the PDFs' teaching hours, not confirmed building access hours. Holidays and special bookings were not supplied.",
    "Room use is based only on the supplied timetables. Shared-room sections are combined; both rooms in a split lab entry are blocked. Unprefixed lab and CDC room numbers are treated as IST; TB-106 remains a separate building."
  ],
  sources,
  rooms: [...rooms.values()].sort((a, b) => a.floor - b.floor || a.id.localeCompare(b.id))
};
await writeFile(path.join(folder, "rooms.json"), JSON.stringify(dataset, null, 2) + "\n");
console.log(`Imported ${dataset.rooms.length} rooms, ${dataset.rooms.reduce((n, room) => n + room.bookings.length, 0)} room-period bookings from ${reviewed.current.length} current PDFs; 1 older PDF archived.`);
