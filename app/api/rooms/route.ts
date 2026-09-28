import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { validateDataset, type RoomData } from "@/lib/rooms";

export const dynamic = "force-dynamic";
export async function GET() {
  const result: RoomData = { datasets: [], files: [], errors: [] };
  try {
    const folder = path.join(process.cwd(), "room-database");
    const entries = await readdir(folder, { withFileTypes: true });
    const ids = new Set<string>();
    const reviewedPdfs = new Set<string>();
    const pdfs: string[] = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isFile() || entry.name.startsWith(".") || entry.name === "README.md" || entry.name.includes(".example.") || entry.name.endsWith(".source.json")) continue;
      if (entry.name.toLowerCase().endsWith(".pdf")) { pdfs.push(entry.name); result.files.push(entry.name); continue; }
      if (!entry.name.endsWith(".json")) {
        result.errors.push(`${entry.name}: awaiting conversion to the room JSON format.`);
        continue;
      }
      try {
        const dataset = validateDataset(JSON.parse(await readFile(path.join(folder, entry.name), "utf8")));
        for (const source of dataset.sources ?? []) {
          const hash = createHash("sha256").update(await readFile(path.join(folder, source.file))).digest("hex");
          if (hash !== source.sha256) throw new Error(`${source.file} has changed since review. Verify and re-import the timetable.`);
          reviewedPdfs.add(source.file);
        }
        if (!dataset.sources?.length) result.files.push(entry.name);
        if (dataset.rooms.some(r => ids.has(r.id))) throw new Error("Room ID already exists in another file; combine its bookings into one record.");
        dataset.rooms.forEach(r => ids.add(r.id));
        result.datasets.push(dataset);
      } catch (error) {
        result.errors.push(`${entry.name}: ${error instanceof Error ? error.message : "Unable to read file"}`);
      }
    }
    for (const file of pdfs) {
      if (!reviewedPdfs.has(file)) result.errors.push(`${file}: awaiting timetable verification and import.`);
    }
    // A rejected source could contain bookings for any room: withhold availability.
    if (result.errors.length) result.datasets = [];
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ...result, errors: ["Room dataset folder could not be read."] }, { status: 500 });
  }
}
