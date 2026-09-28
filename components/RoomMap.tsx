"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, DoorOpen, Clock3, MapPin, MessageCircle, Check, X } from "lucide-react";
import { type RoomData } from "@/lib/rooms";
import { liveRoom, roomTime, squadMessage } from "@/lib/roomLive";

const tone = { Available: "border-emerald-300 bg-emerald-50 text-emerald-900", Occupied: "border-rose-200 bg-rose-50 text-rose-900", Closed: "border-slate-200 bg-slate-100 text-slate-600", Unknown: "border-amber-200 bg-amber-50 text-amber-900" };
export default function RoomMap({ data }: { data: RoomData }) {
  const [now, setNow] = useState<number | null>(null);
  const [floor, setFloor] = useState("all");
  const [selected, setSelected] = useState("");
  const detailsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selected && window.innerWidth < 1280) detailsRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selected]);
  const [claim, setClaim] = useState<{ key: string; until: number } | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const rooms = data.datasets.flatMap((dataset, index) => dataset.rooms.map(room => ({ dataset, room, key: `${index}:${room.id}`, live: liveRoom(dataset, room, now ?? Date.now()) })));
  const floors = [...new Set(rooms.map(r => r.room.floor))].sort((a, b) => (a ?? 99) - (b ?? 99));
  const active = rooms.find(r => r.key === selected);
  const claimed = active && claim?.key === active.key && claim.until === active.live.until && active.live.status === "Available";
  const floorLabel = (n: number | null) => n === null ? "Unassigned" : n === 0 ? "Ground" : `Floor ${n}`;
  if (!now) return <p className="py-8 text-sm text-slate-500">Loading live map...</p>;
  return <section className="space-y-5" aria-label="Live room map">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-xl font-semibold"><Building2 size={22} />Live building map</h2><p className="mt-1 text-sm text-slate-500">{new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" }).format(now)} · {roomTime(now)} IST</p></div>
      <span className="flex items-center gap-2 text-sm font-medium text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />{rooms.filter(r => r.live.status === "Available").length} free now</span>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="Map floor filter">{["all", ...floors.map(n => String(n))].map(value => <button key={value} onClick={() => { setFloor(value); setSelected(""); }} aria-pressed={floor === value} className={`rounded-md border px-3 py-2 text-sm font-medium ${floor === value ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{value === "all" ? "All floors" : floorLabel(value === "null" ? null : Number(value))}</button>)}</div>
    <div className="flex flex-wrap gap-4 text-xs text-slate-600">{Object.entries(tone).map(([label, color]) => <span key={label} className="flex items-center gap-2"><span className={`h-3 w-3 rounded-sm border ${color}`} />{label === "Available" ? "Free now" : label}</span>)}</div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">{floors.filter(n => floor === "all" || String(n) === floor).map(n => <div key={String(n)} className="border-y border-slate-200 bg-white px-4 py-5 sm:px-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-600">{floorLabel(n)}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{rooms.filter(r => r.room.floor === n).map(({ room, key, live }) => <button key={key} onClick={() => setSelected(key)} aria-pressed={selected === key} className={`min-h-28 min-w-0 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${tone[live.status]} ${selected === key ? "ring-2 ring-blue-600 ring-offset-2" : ""}`}><DoorOpen size={20} /><span className="mt-2 block break-words text-sm font-semibold">{room.name}</span><span className="mt-1 block text-xs">{live.until ? `Until ${roomTime(live.until)}` : live.status}</span></button>)}</div>
        <div className="mt-4 border-y border-dashed border-slate-200 py-2 text-center text-xs uppercase tracking-widest text-slate-400">Floor {n ?? "?"}</div>
      </div>)}<p className="text-xs leading-5 text-slate-500">Schematic arrangement, not a campus floor plan. Floors are inferred from room numbers. Live status uses the current IST time.</p></div>
      <aside ref={detailsRef} className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 xl:sticky xl:top-6" aria-label="Selected room">
        {active ? <><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-medium uppercase text-slate-500">{floorLabel(active.room.floor)}</p><h3 className="mt-1 text-xl font-semibold">{active.room.name}</h3></div><button aria-label="Close room details" title="Close room details" onClick={() => setSelected("")} className="rounded p-2 hover:bg-slate-100"><X size={18} /></button></div>
          <p className="mt-4 text-sm font-medium">{active.live.status === "Available" ? "Free in timetable" : active.live.status}</p>
          {active.live.until ? <><p className="mt-6 flex items-center gap-2 text-xs text-slate-500"><Clock3 size={15} />{active.live.endsAtClose ? "Time until campus closes" : "Time until next class"}</p><p className="mt-2 font-mono text-4xl font-semibold tabular-nums" role="timer">{[Math.floor(active.live.seconds / 3600), Math.floor(active.live.seconds / 60) % 60, active.live.seconds % 60].map(n => String(n).padStart(2, "0")).join(":")}</p><p className="mt-2 text-sm text-slate-500">Free until {roomTime(active.live.until)} IST</p>
            {claimed ? <><p className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-700"><Check size={17} />Your room choice</p><a href={`https://wa.me/?text=${encodeURIComponent(squadMessage(active.room.name, active.live.until))}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"><MessageCircle size={18} />Call the Squad</a><button onClick={() => setClaim(null)} className="mt-3 w-full py-2 text-sm text-slate-500">Release my choice</button></> : <button onClick={() => setClaim({ key: active.key, until: active.live.until! })} className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white"><MapPin size={17} />Claim this room</button>}
          </> : <p className="mt-4 text-sm leading-6 text-slate-500">{active.live.status === "Occupied" ? "A class is scheduled now. Choose a free room to invite your friends." : "Availability cannot be confirmed now. Check the room schedule below."}</p>}
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">Your choice is local to this page, not a reservation. Availability reflects supplied timetables, not live occupancy.</p>
        </> : <div className="py-8 text-center"><MapPin size={28} className="mx-auto text-slate-400" /><h3 className="mt-3 font-semibold">Choose a room</h3><p className="mt-2 text-sm leading-6 text-slate-500">Room timing and squad invitation</p></div>}
      </aside>
    </div>
  </section>;
}
