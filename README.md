# Attendance Predictor

A modern student dashboard for planning attendance, checking subject-wise risk, simulating leave, and finding free rooms from timetable data.

The app is built with Next.js, React, TypeScript, Tailwind CSS, and Lucide icons. It is designed to work on desktop and mobile.

## What This Project Does

Attendance Predictor helps students answer practical questions such as:

- What is my current attendance percentage?
- Am I above or below the 75% requirement?
- How many more classes should I attend to stay safe?
- How many classes can I miss?
- What happens if I take OD or medical leave?
- Which subject is risky?
- Which rooms are free right now?
- How long is a room free before the next scheduled class?
- Can I quickly invite friends to a free room?

## Main Features

### Home Page

The home page introduces the project and provides a clean entry point to the attendance dashboard.

Route:

```txt
/
```

### Attendance Dashboard

The dashboard shows the selected class, student, date range, and overall attendance status.

Route:

```txt
/check-attendance
```

It includes:

- Section selector
- Student selector
- Current date and planning date
- Overall attendance
- Classes conducted, attended, and remaining
- Future prediction
- Required classes for 75% and 90%
- Maximum possible attendance
- Safe, warning, below 75%, and critical states

### Charts

Charts show attendance visually.

Routes:

```txt
/check-attendance/charts
/check-attendance/charts/health
/check-attendance/charts/comparison
```

Chart features:

- Attendance health chart
- Subject comparison chart
- Class and student based attendance view
- Separate pages instead of long scrolling sections

### Leave Planner

The leave planner helps students test OD or medical leave before taking it.

Route:

```txt
/check-attendance/leave
```

It calculates the final attendance percentage after adding leave classes and warns if attendance drops below 75%.

### What-if Simulator

The what-if page lets the student test future attendance choices.

Route:

```txt
/check-attendance/what-if
```

It helps answer questions like:

- What if I attend the next few classes?
- What if I miss some upcoming classes?
- Will I still stay above 75%?

### Subjects

The subjects page shows subject-wise prediction.

Route:

```txt
/check-attendance/subjects
```

Each subject can show:

- Current attendance
- Conducted classes
- Attended classes
- Remaining classes
- Required classes for 75%
- Required classes for 90%
- Maximum possible percentage
- Subject status

### Attendance Advisor

The advisor is a built-in assistant panel for attendance questions. It uses the current dashboard data and returns calculated answers based on class, student, subject, and leave percentage.

Examples:

```txt
Can I miss 3 Chemistry classes?
Will my attendance go below 75%?
How many classes should I attend for 90%?
What is my safest subject?
```

The advisor is calculation-based. It does not need an external AI API to work.

### Room Finder

The Room Finder uses the timetable PDFs stored in the project to show available rooms.

Route:

```txt
/check-attendance/rooms
```

Current Room Finder features:

- Live visual building map
- Floor-wise room grouping
- Room color based on live availability
- Live countdown until the next scheduled class
- Claim room button
- Call the Squad button
- Pre-filled WhatsApp invite message
- Mobile-friendly layout

Example WhatsApp message:

```txt
Heading to IST 108. It's free until 4:50 pm IST according to the timetable. Come fast!
```

Room availability means free according to the supplied timetables. It is not a real-time occupancy sensor and does not reserve the room officially.

## How Attendance Calculation Works

Attendance is calculated from:

- Semester start date
- Semester end date
- Class timetable
- Holidays
- Cancelled classes
- Extra classes
- Student attended class count
- Selected planning date

Core logic is in:

```txt
lib/attendance.ts
```

Important formulas:

Current percentage:

```txt
attended / conducted * 100
```

Required classes for a target:

```txt
ceil(target * total_classes - attended)
```

Maximum possible attendance:

```txt
(attended + remaining) / (conducted + remaining) * 100
```

If the maximum possible attendance is below 75%, the app marks it as a critical case.

## How Room Availability Works

Room data is stored in:

```txt
room-database/rooms.json
```

Room logic is in:

```txt
lib/rooms.ts
lib/roomLive.ts
lib/roomSearch.ts
```

The app checks:

- Whether the selected date is inside the valid timetable range
- Whether the campus is inside teaching hours
- Whether the date is closed
- Whether the room schedule is complete
- Whether any class overlaps with the requested time

Live room status can be:

- Available
- Occupied
- Closed
- Unknown

The countdown checks the next scheduled booking for that room and shows how much time is left.

## Data Files

Attendance data:

```txt
data/timetables.ts
data/students.ts
data/holidays.ts
```

Room data:

```txt
room-database/
```

Room PDFs:

```txt
room-database/*.pdf
```

Generated room database:

```txt
room-database/rooms.json
```

Room import script:

```txt
scripts/import-room-timetables.mjs
```

The room database currently uses reviewed timetable PDFs. AC and seating capacity are not confirmed from the PDFs, so those values are kept unknown unless manually verified.

## Project Structure

```txt
app/
  page.tsx
  check-attendance/
  api/rooms/

components/
  Dashboard.tsx
  AttendanceAdvisor.tsx
  AttendanceCharts.tsx
  LeaveSimulator.tsx
  RoomFinder.tsx
  RoomMap.tsx
  SubjectCard.tsx
  WhatIfSimulator.tsx

data/
  timetables.ts
  students.ts
  holidays.ts

lib/
  attendance.ts
  rooms.ts
  roomLive.ts
  roomSearch.ts

room-database/
  rooms.json
  reviewed-timetables.source.json
  *.pdf

tests/
  rooms.test.cjs
```

## Installation

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Build for production:

```bash
npm run build
```

Start the production build:

```bash
npm start
```

## Testing

Run the room tests:

```bash
node --test tests/rooms.test.cjs
```

Run TypeScript checking:

```bash
npx tsc --noEmit
```

## Tech Stack Used

This project uses a modern frontend stack focused on speed, clean UI, and reliable calculations.

### Frontend

- Next.js - React framework used for routing, pages, API routes, and production builds.
- React - Used to build the dashboard components and interactive UI.
- TypeScript - Adds type safety for attendance data, room data, calculations, and components.
- Tailwind CSS - Used for responsive styling, spacing, colors, cards, buttons, and layouts.
- Lucide React - Used for clean professional icons across the navbar, sidebar, dashboard, charts, advisor, and room finder.

### Backend / API

- Next.js API Routes - Used for the room database API at `/api/rooms`.
- Node.js - Used to run scripts, tests, and the development server.

### Data Handling

- TypeScript data files - Used for attendance timetables, students, holidays, and semester settings.
- JSON database - Used for verified room timetable data in `room-database/rooms.json`.
- PDF timetable source files - Stored in `room-database/` and used as the source for room availability.

### Testing and Verification

- Node.js built-in test runner - Used for room database, room search, and live countdown tests.
- TypeScript compiler - Used to check type safety with `npx tsc --noEmit`.

### Design

- Responsive dashboard layout - Works on desktop and mobile.
- Card-based dashboard UI - Used for attendance stats, predictions, charts, subjects, and room details.
- Live visual room map - Used for room availability, countdown timer, claiming a room, and WhatsApp squad sharing.

## Important Notes

- Attendance predictions depend on the timetable and student data entered in the project.
- Room availability is based only on the supplied timetable PDFs.
- The Room Finder does not confirm live physical occupancy.
- The room map is a schematic visual layout, not an official campus floor plan.
- Room floor numbers are inferred from room numbers unless confirmed in the database.
- The WhatsApp button only opens a pre-filled message. The user still chooses whether to send it.

## Summary

Attendance Predictor is a complete student planning tool. It combines attendance prediction, subject-wise warnings, leave simulation, advisor-style answers, room availability, live countdowns, and squad sharing in one clean dashboard.
