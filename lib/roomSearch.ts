import { availability, isDate, isTime, type RoomData } from "@/lib/rooms";

const FLOOR_WORDS: Record<string, string> = {
  ground: "0",
  first: "1",
  second: "2",
  third: "3",
  fourth: "4",
  fifth: "5",
  sixth: "6",
  seventh: "7",
};

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

export type RoomSearchIntent = {
  recognized: boolean;
  date: string;
  time: string;
  duration: number;
  floor: string;
  capacity: number;
  wantsAc: boolean;
  wantsNonAc: boolean;
  onlyFree: boolean;
  error?: string;
};

export function parseRoomRequest(query: string, defaults: { date: string; time: string; duration: number }): RoomSearchIntent {
  const q = query.toLowerCase().trim();
  const base: RoomSearchIntent = {
    recognized: false,
    date: defaults.date,
    time: defaults.time,
    duration: defaults.duration,
    floor: "all",
    capacity: 0,
    wantsAc: false,
    wantsNonAc: false,
    onlyFree: true,
  };
  if (!q) return { ...base, error: "Enter a room request first." };

  const floorMatch =
    q.match(/\b(ground|first|second|third|fourth|fifth|sixth|seventh)(?:\s+floor)?\b/) ||
    q.match(/\bfloor\s+(-?\d+)\b/);
  const durationMatch = q.match(/\b(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\s*(hours?|hrs?|minutes?|mins?)\b/);
  const people = q.match(/\b(\d+)\s*(people|students|persons|seats|members|team members)\b/);
  const wantsNonAc = /\b(no|non)[ -]?ac\b/.test(q);
  const wantsAc = !wantsNonAc && /\b(ac|a\/c|air[ -]conditioned|air conditioning)\b/.test(q);
  const requestedDate = q.match(/\b\d{4}-\d{2}-\d{2}\b/);
  const requestedTime = q.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  const hasAvailabilityWord = /\b(now|today|tomorrow|empty|free|available|room|classroom|lab|next)\b/.test(q);

  if (!floorMatch && !durationMatch && !people && !wantsAc && !wantsNonAc && !requestedDate && !requestedTime && !hasAvailabilityWord) {
    return { ...base, error: "I couldn't identify room filters. Mention a floor, AC, people, time, or duration." };
  }

  let nextDate = requestedDate?.[0] ?? defaults.date;
  if (/\btomorrow\b/.test(q) && !requestedDate) {
    const tomorrow = new Date(`${defaults.date}T12:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    nextDate = tomorrow.toISOString().slice(0, 10);
  }

  let nextTime = defaults.time;
  if (requestedTime) {
    let hour = Number(requestedTime[1]);
    const suffix = requestedTime[3];
    if (suffix && (hour < 1 || hour > 12)) return { ...base, recognized: true, error: "Use a valid 12-hour time with AM or PM." };
    if (suffix) hour = hour % 12 + (suffix === "pm" ? 12 : 0);
    nextTime = `${String(hour).padStart(2, "0")}:${requestedTime[2] ?? "00"}`;
  }

  const amount = durationMatch ? NUMBER_WORDS[durationMatch[1]] ?? Number(durationMatch[1]) : defaults.duration;
  const nextDuration = durationMatch ? amount * (/^(hour|hr)/.test(durationMatch[2]) ? 60 : 1) : defaults.duration;
  const nextCapacity = people ? Number(people[1]) : 0;
  const floorValue = floorMatch ? FLOOR_WORDS[floorMatch[1]] ?? floorMatch[1] : "all";

  if (!isDate(nextDate) || !isTime(nextTime) || !Number.isFinite(nextDuration) || nextDuration < 1 || nextDuration > 1440 || nextCapacity < 0) {
    return { ...base, recognized: true, error: "Check the date, time, group size and duration (1-1440 minutes)." };
  }

  return {
    recognized: true,
    date: nextDate,
    time: nextTime,
    duration: nextDuration,
    floor: floorValue,
    capacity: nextCapacity,
    wantsAc,
    wantsNonAc,
    onlyFree: true,
  };
}

export function answerRoomRequest(data: RoomData, intent: RoomSearchIntent) {
  const allRooms = data.datasets.flatMap(d => d.rooms.map(room => ({ room, status: availability(d, room, intent.date, intent.time, intent.duration) })));
  const selectedFloor = intent.floor === "all" ? null : Number(intent.floor);
  const floorFiltered = allRooms.filter(({ room }) => intent.floor === "all" || room.floor === selectedFloor);
  const capacityFiltered = floorFiltered.filter(({ room }) => intent.capacity === 0 || (room.capacity !== null && room.capacity >= intent.capacity));
  const acCanBeChecked = !intent.wantsAc || allRooms.some(({ room }) => room.ac === true);
  const acFiltered = acCanBeChecked ? capacityFiltered.filter(({ room }) => !intent.wantsAc || room.ac === true) : capacityFiltered;
  const freeRooms = acFiltered.filter(({ status }) => status === "Available");
  const roomNames = freeRooms.map(({ room }) => room.name);
  const floorLabel = intent.floor === "all" ? "all floors" : selectedFloor === 0 ? "ground floor" : `floor ${selectedFloor}`;
  const pieces = [`${roomNames.length} room${roomNames.length === 1 ? "" : "s"} free for ${intent.duration} minutes on ${floorLabel} from ${intent.time}.`];

  if (roomNames.length) pieces.push(`Rooms: ${roomNames.join(", ")}.`);
  if (!roomNames.length && floorFiltered.length === 0) pieces.push(`No rooms are listed for ${floorLabel} in the verified timetables.`);
  if (!roomNames.length && floorFiltered.length > 0) pieces.push("No listed room stays free for the full requested duration.");
  if (intent.wantsAc && !allRooms.some(({ room }) => room.ac !== null)) pieces.push("AC details are not present in the supplied PDFs, so I can confirm timetable availability only, not AC.");
  if (intent.wantsAc && allRooms.some(({ room }) => room.ac !== null) && !acCanBeChecked) pieces.push("No room is confirmed as AC in the room database.");
  if (intent.capacity > 0 && allRooms.some(({ room }) => room.capacity === null)) pieces.push("Seat capacity is not present for some rooms, so rooms without capacity were not used for an exact seat match.");

  return { rooms: roomNames, note: pieces.join(" ") };
}
