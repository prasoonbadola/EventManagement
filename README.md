 Gathr — Event Discovery & Management Platform

Gathr is a full-stack event discovery and ticketing application built with React 19, Express 5, and PostgreSQL. It allows organizers to publish and manage events while providing attendees with instant 1-click registration, interactive schedules, and digital event passes.

---

## 📑 Core Documentation
- **[Data Model, Key Decisions & Trade-offs](file:///Users/prasoonbadola/Desktop/event-app/DATA_MODEL_AND_DECISIONS.md)**: Full database schema, pessimistic locking architecture, race condition handling, and technical trade-offs.
- **[Project Status: Completed vs. Unfinished & Future Improvements](file:///Users/prasoonbadola/Desktop/event-app/PROJECT_STATUS.md)**: Feature breakdown, tested edge cases, scope boundaries, and future roadmap.

---

 What the App Does

 For Attendees
- Event Discovery: Search and filter upcoming public events by keyword, open capacity, and date range.
- 1-Click Registration: Instant seat reservation with zero overselling, guaranteed by database-level concurrency controls and pessimistic row locking.
- Digital Passes: View and print virtual event tickets complete with scannable Code-128 barcodes and venue details.
- Calendar Integration: 1-click sync with Google Calendar or downloadable `.ics` files (Apple, Outlook) using accurate UTC instant conversions.
- Interactive Calendar View: Visual schedule showing registered, upcoming, past, and canceled events with color-coded status badges.
- Registration Management: Release reserved seats anytime, instantly freeing up spots for others in real-time.

 For Organizers
- Event Creation & Scheduling: Create draft, published, or private events with support for venue addresses and IANA time zones.
- Dashboard & Capacity Tracking: Monitor seat occupancy with live capacity fill bars and status indicators.
- Attendee Rosters & CSV Export: Search attendee lists and export complete registration rosters to CSV for door check-in.
- Event Controls: Edit event details, duplicate events, or cancel events (safeguards prevent reducing capacity below existing registrations).

---

 Tech Stack

- Frontend: React 19, Vite, TypeScript, TanStack Router, TanStack Query, Axios, Tailwind CSS, Lucide Icons, FullCalendar.
- Backend: Node.js 20+, Express 5, TypeScript, TypeORM, PostgreSQL, Winston, Morgan, Zod validation, Express Rate Limit.
- Testing: Vitest test runner across both client and server suites.

---

 How to Run the App

 1. Prerequisites
- Node.js: v20 or higher
- PostgreSQL: v14+ (local or cloud instance like Supabase)

 2. Database Setup
Create the local database (or use your own PostgreSQL credentials):
```bash
psql -U postgres -c "CREATE DATABASE events;"
```

 3. Backend Setup
In your first terminal:
```bash
cd server
npm install
npm run seed        Runs database migrations and seeds sample events & users
npm run dev         Starts the API server on http://localhost:4000
```

 4. Frontend Setup
In your second terminal:
```bash
cd client
npm install
npm run dev         Starts the Vite client on http://localhost:5173
```
Open `http://localhost:5173` in your browser.

---

 Demo Accounts

All seeded demo accounts use the password: `password123` (the sign-in page includes 1-click demo login buttons):

| Role | Email | Description |
| :--- | :--- | :--- |
| Organizer | `olivia@example.com` | Manages 4 events (Published meetups, limited workshops, drafts) |
| Organizer | `omar@example.com` | Manages outdoor yoga and tech summit events |
| Attendee | `alice@example.com` | Registered attendee with active tickets |
| Attendee | `bob@example.com` | Registered attendee with multiple bookings |
| Attendee | `carol@example.com` | New attendee account with 0 registrations |

---

 Running Tests

Run the automated test suites:

```bash
 Server tests (30 integration tests covering concurrency, locking, auth, and validation)
cd server
npm test

 Client tests
cd ../client
npm test
```
