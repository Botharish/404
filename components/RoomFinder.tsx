"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, FolderOpen, Building2 } from "lucide-react";
import { type RoomData } from "@/lib/rooms";
import RoomMap from "@/components/RoomMap";

export default function RoomFinder() {
  const [data, setData] = useState<RoomData>({ datasets: [], files: [], errors: [] });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rooms", { cache: "no-store" });
      if (!response.ok) throw new Error("Room data could not be loaded. Please try again.");
      setData(await response.json());
    } catch (error) {
      setData({ datasets: [], files: [], errors: [error instanceof Error ? error.message : "Unable to load room data."] });
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const roomCount = data.datasets.reduce((total, dataset) => total + dataset.rooms.length, 0);

  return <div className="space-y-6 pb-20">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-slate-500"><FolderOpen size={17} />{data.files.length} source files <span aria-hidden="true">/</span> {roomCount} rooms</div>
      <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh data</button>
    </div>
    {data.errors.length > 0 && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">Data needs verification</p><ul className="mt-2 list-inside list-disc break-words">{data.errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
    {loading ? <p role="status" className="py-12 text-center text-slate-500">Checking room data...</p> : !roomCount ? <div className="py-12 text-center"><Building2 size={44} strokeWidth={1.4} className="mx-auto text-slate-400" /><h2 className="mt-4 text-xl font-semibold">Room data is awaiting verification</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">No verified rooms are available yet.</p></div> : <RoomMap data={data} />}
  </div>;
}
