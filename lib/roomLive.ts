import { availability, type Room, type RoomDataset } from "./rooms";

export function liveRoom(dataset: RoomDataset, room: Room, now: number) {
  const date = new Date(now + 330 * 60_000).toISOString().slice(0, 10);
  const time = new Date(now + 330 * 60_000).toISOString().slice(11, 16);
  const status = availability(dataset, room, date, time, 1);
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const stamp = (value: string) => new Date(`${date}T${value}:00+05:30`).getTime();
  const next = room.bookings.filter(b => b.day === day && stamp(b.start) > now).sort((a, b) => a.start.localeCompare(b.start))[0];
  const until = status === "Available" ? Math.min(next ? stamp(next.start) : Infinity, stamp(dataset.closes)) : null;
  return { status, until, next, seconds: until === null ? 0 : Math.max(0, Math.floor((until - now) / 1000)), endsAtClose: until === stamp(dataset.closes) };
}

export const roomTime = (stamp: number) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(stamp);
export function squadMessage(name: string, until: number) {
  return `📍 Heading to ${name}. It's free until ${roomTime(until)} IST according to the timetable. Come fast!`;
}
