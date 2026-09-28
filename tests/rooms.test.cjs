const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
function loadTs(file, overrides = {}) {
  const module = { exports: {} };
  const js = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
  }).outputText;
  new Function("exports", "require", "module", js)(module.exports, name => {
    if (name in overrides) return overrides[name];
    if (name.startsWith("@/")) return loadTs(name.slice(2) + ".ts", overrides);
    return require(name);
  }, module);
  return module.exports;
}
const { validateDataset, availability } = loadTs("lib/rooms.ts");
const { parseRoomRequest, answerRoomRequest } = loadTs("lib/roomSearch.ts");
const dataset = JSON.parse(fs.readFileSync(path.join(root, "room-database/rooms.json"), "utf8"));
const room = id => dataset.rooms.find(r => r.id === id);
const status = (id, date, time, duration) => availability(dataset, room(id), date, time, duration);
const { liveRoom, squadMessage } = loadTs("lib/roomLive.ts", { "./rooms": loadTs("lib/rooms.ts") });

test("live countdown ends exactly at the next class and prevents claiming occupied rooms", () => {
  const now = new Date("2026-09-28T12:30:15+05:30").getTime();
  const live = liveRoom(dataset, room("IST-518"), now);
  assert.equal(live.status, "Available");
  assert.equal(live.seconds, 49 * 60 + 45);
  assert.equal(liveRoom(dataset, room("IST-518"), live.until).status, "Occupied");
  assert.equal(liveRoom(dataset, room("IST-518"), live.until).until, null);
  assert.match(squadMessage("IST 518", live.until), /IST 518.*1:20 pm IST/i);
});

test("closed dates and incomplete schedules never provide a claim countdown", () => {
  const now = new Date("2026-09-28T12:30:00+05:30").getTime();
  assert.equal(liveRoom({...dataset, closedDates:["2026-09-28"]}, room("IST-518"), now).until, null);
  assert.equal(liveRoom(dataset, {...room("IST-518"), scheduleComplete:false}, now).until, null);
});

test("dataset contains all reviewed rooms and PDF references", () => {
  assert.equal(validateDataset(dataset).rooms.length, 14);
  assert.equal(dataset.rooms.reduce((sum, r) => sum + r.bookings.length, 0), 261);
  assert.equal(dataset.sources.filter(s => s.status === "imported").length, 9);
  assert.equal(dataset.sources.filter(s => s.status === "archived").length, 1);
  assert.ok(dataset.rooms.every(r => r.ac === null && r.capacity === null));
  assert.ok(dataset.rooms.every(r => r.bookings.every(b => b.source && b.page === 1)));
});
test("shared IST 518 includes both sections and keeps lunch boundaries exact", () => {
  assert.equal(status("IST-518", "2026-09-28", "09:00", 30), "Occupied");
  assert.equal(status("IST-518", "2026-09-28", "13:20", 30), "Occupied");
  assert.equal(status("IST-518", "2026-09-28", "12:30", 50), "Available");
  assert.equal(status("IST-518", "2026-09-28", "12:30", 51), "Occupied");
});
test("full-duration check detects later bookings", () => {
  assert.equal(status("IST-602", "2026-09-28", "12:30", 120), "Occupied");
  assert.equal(status("IST-225", "2026-09-28", "09:50", 60), "Available");
  assert.equal(status("IST-225", "2026-09-28", "09:50", 61), "Occupied");
});
test("explicit lab slots block the lab instead of the header classroom", () => {
  assert.equal(status("IST-108", "2026-09-30", "09:50", 50), "Occupied");
  assert.equal(status("IST-225", "2026-09-30", "09:50", 50), "Available");
  assert.equal(status("IST-107", "2026-09-28", "15:10", 100), "Occupied");
  assert.equal(status("IST-309", "2026-09-28", "15:10", 100), "Occupied");
});
test("unknown dates, weekends and incomplete schedules are not free", () => {
  assert.equal(status("IST-225", "2026-10-03", "10:00", 30), "Unknown");
  assert.equal(status("IST-225", "2027-01-01", "10:00", 30), "Unknown");
  assert.equal(status("IST-225", "2026-02-30", "10:00", 30), "Unknown");
  assert.equal(status("IST-225", "2026-09-28", "16:00", 60), "Closed");
  assert.equal(availability(dataset, {...room("IST-225"), scheduleComplete:false}, "2026-09-28", "14:00", 30), "Unknown");
});
test("validator rejects malformed records and unsafe source paths", () => {
  assert.throws(() => validateDataset({...dataset, rooms:[room("IST-225"), room("IST-225")]}));
  assert.throws(() => validateDataset({...dataset, rooms:[{...room("IST-225"), ac:"yes"}]}));
  assert.throws(() => validateDataset({...dataset, sources:[{...dataset.sources[0], file:"../secret.pdf"}]}));
});

async function responseWith(changes = {}) {
  const folder = path.join(root, "room-database");
  const files = new Map(fs.readdirSync(folder, {withFileTypes:true}).filter(e => e.isFile()).map(e => [e.name, fs.readFileSync(path.join(folder, e.name))]));
  for (const [name, content] of Object.entries(changes)) content === null ? files.delete(name) : files.set(name, Buffer.from(content));
  const route = loadTs("app/api/rooms/route.ts", {
    "node:fs/promises": {
      readdir: async () => [...files.keys()].map(name => ({name, isFile:() => true})),
      readFile: async (filename, encoding) => {
        const value = files.get(path.basename(filename));
        if (!value) throw new Error("Missing source");
        return encoding ? value.toString(encoding) : value;
      }
    }
  });
  return (await route.GET()).json();
}
test("API imports reviewed PDFs without requiring their removal", async () => {
  const result = await responseWith();
  assert.deepEqual(result.errors, []);
  assert.equal(result.files.length, 10);
  assert.equal(result.datasets[0].rooms.length, 14);
});
test("API withholds stale availability for changed or missing PDFs", async () => {
  for (const content of ["changed PDF", null]) {
    const result = await responseWith({"III ECE B.pdf":content});
    assert.equal(result.datasets.length, 0);
    assert.ok(result.errors.length);
  }
});
test("new unreviewed PDFs cannot silently leave availability unchanged", async () => {
  const result = await responseWith({"new-room.pdf":"unreviewed"});
  assert.equal(result.datasets.length, 0);
  assert.ok(result.errors.some(e => e.includes("new-room.pdf")));
});
test("room request parser understands AC ground-floor duration questions", () => {
  const intent = parseRoomRequest("I need an AC room on the ground floor for me and my team for the next 2 hours.", {
    date: "2026-09-28",
    time: "13:20",
    duration: 30
  });
  assert.equal(intent.error, undefined);
  assert.equal(intent.floor, "0");
  assert.equal(intent.duration, 120);
  assert.equal(intent.wantsAc, true);
  const answer = answerRoomRequest({ datasets: [dataset], files: [], errors: [] }, intent).note;
  assert.match(answer, /ground floor/);
  assert.match(answer, /AC details are not present/);
});
test("room advisor returns exact free rooms when timetable data supports the request", () => {
  const intent = parseRoomRequest("free room on floor 2 for 1 hour", {
    date: "2026-09-28",
    time: "13:20",
    duration: 30
  });
  const answer = answerRoomRequest({ datasets: [dataset], files: [], errors: [] }, intent);
  assert.deepEqual(answer.rooms.sort(), ["IST 225", "IST 227"].sort());
  assert.match(answer.note, /IST 225/);
  assert.match(answer.note, /IST 227/);
});
