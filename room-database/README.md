# Room database

All 10 supplied PDFs have been visually reviewed (13 pages).
`rooms.json` contains 14 rooms and 261 room-period bookings from the nine
2026-27 timetables. Room Finder reads this file when opened or refreshed.
Original PDFs remain untouched in this folder.

## Source handling

- `reviewed-timetables.source.json` contains the reviewed transcription,
  including all four pages of the older first-year PDF.
- `I year Time Table SEEE.pdf` is labelled 2024-25 (odd semester on pages 1-2,
  even semester on pages 3-4). It is archived, not applied to 2026-27.
- `rooms.json` records SHA-256 fingerprints for all 10 PDFs. Replaced, missing,
  or newly added PDFs require review before availability is shown again.
- After visually reviewing changed PDFs, update the transcription and run
  `node scripts/import-room-timetables.mjs` to regenerate the dataset.
  This command compiles the transcription; it does not OCR or verify new scans.
- `.source.json` and `.example.json` are reference files, not live datasets.

## Interpretation and missing information

- Period times are taken from the current PDFs, including both tea breaks.
- Regular classes use the header venue; explicitly named labs and CDC venues
  override the header venue. IST 518 combines III ECE A and III ECE B.
- Both venues in split lab entries are blocked for the listed period; the
  PDFs do not identify which group uses which room.
- Unprefixed lab/CDC room numbers are normalized to IST; TB-106 remains separate.
  This building interpretation should be confirmed with the campus.
- Floors are inferred from numbering (IST 518 -> floor 5) and labelled as
  inferred in the website. Campus floor labels still need confirmation.
- AC and capacity are `null`: the PDFs do not supply them. Confirmed AC and
  minimum-seat filters exclude unknown values. Empty seating includes all rooms.
- The app calendar, 2026-08-29 through 2026-11-29, is used for planning.
  Exact start/end dates are not printed in the PDFs; this is not a verified calendar.
- Hours 09:00-16:50 are teaching hours, not confirmed building opening hours.
- Weekend availability is unknown. Holidays and special bookings were not supplied.
- `scheduleComplete` means all listed current timetable entries were transcribed,
  not that every possible campus booking is known. Free results mean free in the
  supplied timetables only, not a reservation or live occupancy guarantee.

## Adding confirmed room metadata

Set real `capacity`, `ac`, and `floor` values in `rooms.json` once verified;
set `floorInferred` to false when confirmed. Update the importer too before
regenerating, since regeneration replaces the derived file. Do not use guesses.
