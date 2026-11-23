# Gathr Client

Frontend web client for Gathr, an event discovery and management platform.

---

 What It Does

- Event Discovery: Search and filter public events by keyword, open spots, and date range.
- 1-Click Registration: Fast seat reservation with real-time UI state updates.
- Virtual Tickets: View and print digital passes featuring scannable Code-128 barcodes.
- Calendar Integration: Export `.ics` files and sync directly with Google Calendar in UTC.
- My Schedule: Visual calendar and list views showing registered, upcoming, past, and canceled events.
- Organizer Dashboard: Manage events, track live capacity fill bars, and export attendee rosters to CSV.

# Tech Stack
- Framework: React 19, Vite, TypeScript
- Routing & State: TanStack Router, TanStack Query, Axios
- UI & Icons: Tailwind CSS, Lucide React, FullCalendar
- Testing: Vitest

---

 How to Run It

# 1. Install Dependencies
```bash
npm install
```

# 2. Start Development Server
```bash
npm run dev
```
The app will run at http://localhost:5173 and proxy API requests to `http://localhost:4000`.

# 3. Build for Production
```bash
npm run build
```

# 4. Run Tests & Typecheck
```bash
npm test          # Run Vitest test suite
npm run typecheck # Run TypeScript compiler check
```
