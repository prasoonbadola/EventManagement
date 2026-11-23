 Data Model, Key Decisions & Trade-offs

This document provides a detailed breakdown of the Gathr database schema, concurrency controls, architectural decisions, and trade-offs made during development.

---

 1. Relational Data Model

The application relies on PostgreSQL with a 3-table normalized schema designed for high relational integrity, concurrency protection, and zero overselling.

```
┌─────────────────────────────────────────┐
│                  users                  │
├─────────────────────────────────────────┤
│ id            SERIAL PRIMARY KEY        │
│ name          TEXT NOT NULL             │
│ email         TEXT NOT NULL UNIQUE      │
│ password_hash TEXT NOT NULL             │
│ role          TEXT CHECK (organizer,    │
│                           attendee)     │
│ created_at    TIMESTAMPTZ DEFAULT now() │
└────────────────────┬────────────────────┘
                     │
                     │ 1
                     │
                     │ 
┌────────────────────▼────────────────────┐          ┌─────────────────────────────────────────┐
│              registrations              │          │                 events                  │
├─────────────────────────────────────────┤          ├─────────────────────────────────────────┤
│ id          SERIAL PRIMARY KEY          │       1 │ id           SERIAL PRIMARY KEY         │
│ event_id    INTEGER NOT NULL (FK)       ├──────────┤ organizer_id INTEGER NOT NULL (FK)      │
│ user_id     INTEGER NOT NULL (FK)       │          │ title        TEXT NOT NULL              │
│ status      TEXT CHECK (active,         │          │ description  TEXT NOT NULL DEFAULT ''   │
│                         canceled)       │          │ starts_at    TIMESTAMPTZ NOT NULL (UTC) │
│ created_at  TIMESTAMPTZ DEFAULT now()   │          │ time_zone    TEXT NOT NULL (IANA)       │
│ canceled_at TIMESTAMPTZ NULL            │          │ location     TEXT NOT NULL              │
└─────────────────────────────────────────┘          │ capacity     INTEGER CHECK (> 0)        │
                                                     │ status       TEXT CHECK (draft,         │
                                                     │                          published,     │
                                                     │                          canceled)      │
                                                     │ created_at   TIMESTAMPTZ DEFAULT now()  │
                                                     │ updated_at   TIMESTAMPTZ DEFAULT now()  │
                                                     └─────────────────────────────────────────┘
```

 Table Definitions & Constraints

 `users`
- Stores user credentials and access role (`organizer` vs. `attendee`).
- Indices & Constraints:
  - `users_email_lower_uq`: Functional unique index on `lower(email)` to guarantee case-insensitive uniqueness.
  - Role check constraint: `CHECK (role IN ('organizer', 'attendee'))`.

 `events`
- Stores event metadata, scheduling, venue location, capacity, and publication lifecycle.
- Indices & Constraints:
  - `events_public_idx (status, starts_at)`: Optimizes public event discovery queries that filter published upcoming events sorted by date.
  - `events_organizer_idx (organizer_id)`: Accelerates organizer dashboard listing.
  - Capacity check constraint: `CHECK (capacity > 0)`.
  - Status state machine check: `CHECK (status IN ('draft', 'published', 'canceled'))`.

 `registrations`
- Stores attendee ticket reservations and lifecycle states.
- Indices & Constraints:
  - `registrations_one_active_uq (event_id, user_id) WHERE status = 'active'`: Database-level safety net. Guarantees that no attendee can ever possess more than one active ticket for an event simultaneously.
  - `registrations_event_idx (event_id, status)`: Accelerates real-time active capacity counting.
  - `registrations_user_idx (user_id, status)`: Speeds up attendee ticket history and calendar feeds.

---

 2. Capacity Constraint & Concurrency Architecture

A core requirement is ensuring zero overselling under high concurrent load (such as multiple attendees racing for the final remaining seat simultaneously).

 Concurrency Strategy: Pessimistic Row-Level Locking

Rather than optimistic locking (which fails and requires retry loops under high contention) or external distributed locks (e.g., Redis Redlock, which adds external points of failure), Gathr utilizes PostgreSQL row-level pessimistic write locking inside an ACID database transaction:

```typescript
// server/src/modules/registrations/registrations.service.ts
return AppDataSource.transaction(async (manager) => {
  // 1. Acquire pessimistic write lock on the target event
  const ev = await manager
    .getRepository(EventEntity)
    .createQueryBuilder("e")
    .setLock("pessimistic_write") // SELECT ... FOR UPDATE
    .where("e.id = :id", { id: eventId })
    .getOne();

  if (!ev || ev.status === "draft") throw notFound("Event");
  if (ev.status === "canceled") throw new ApiError(409, ErrorCode.EVENT_CANCELED, "Event canceled");
  if (ev.startsAt.getTime() <= Date.now()) throw new ApiError(409, ErrorCode.EVENT_STARTED, "Already started");

  // 2. Verify attendee does not already have an active registration
  const dup = await manager
    .getRepository(RegistrationEntity)
    .findOne({ where: { eventId, userId, status: "active" } });
  if (dup) throw new ApiError(409, ErrorCode.ALREADY_REGISTERED, "Already registered");

  // 3. Count currently active registrations under the lock
  const activeCount = await manager
    .getRepository(RegistrationEntity)
    .createQueryBuilder("r")
    .where("r.event_id = :eventId", { eventId })
    .andWhere("r.status = 'active'")
    .getCount();

  // 4. Strictly enforce capacity
  if (activeCount >= ev.capacity) {
    throw new ApiError(409, ErrorCode.EVENT_FULL, "Sorry, this event is full.");
  }

  // 5. Insert active registration
  const reg = manager.getRepository(RegistrationEntity).create({ eventId, userId });
  return await manager.getRepository(RegistrationEntity).save(reg);
});
```

 Why this prevents overselling:
1. Queued Execution: When 25 users attempt to book the last seat at the exact same millisecond, the first transaction acquires the `FOR UPDATE` lock on the `events` row. The remaining 24 transactions pause and wait for the row lock to be released upon transaction commit.
2. Fresh Reads Under Lock: When subsequent transactions acquire the lock, they read the newly committed registration count. The second transaction immediately detects that `activeCount == capacity` and aborts with HTTP 409 `EVENT_FULL`.
3. Capacity Reduction Protection: When an organizer edits an event's capacity, the organizer route also locks the `events` row with `setLock("pessimistic_write")` and verifies `capacity >= activeCount`. This guarantees an organizer cannot reduce capacity while registrations are being processed.
4. Database Defense-in-Depth: The PostgreSQL partial unique index `registrations_one_active_uq` guarantees that even if application logic were bypassed, a duplicate active ticket can never be inserted.

---

 3. Key Decisions & Assumptions

 1. Dual Timestamp & Time Zone Architecture
- Decision: Store `starts_at` as a canonical UTC `TIMESTAMPTZ` instant alongside an IANA string `time_zone` (e.g., `"America/New_York"`).
- Rationale: An event occurs at an absolute instant in physical time. Storing UTC prevents ambiguities during Daylight Saving Time (DST) shifts. Preserving the organizer's original IANA time zone ensures the event description can correctly format local times for local and remote attendees.
- Client Conversion: Google Calendar URLs and `.ics` files use exact UTC timestamps formatted in RFC 5545 (`YYYYMMDDTHHmmssZ`), ensuring seamless import across Apple Calendar, Outlook, and Google Calendar.

 2. Soft Cancellation with Immediate Capacity Release
- Decision: Canceling a registration sets `status = 'canceled'` and populates `canceled_at = NOW()`.
- Rationale: Hard deleting (`DELETE FROM registrations`) loses historical audit trails and prevents organizers from understanding attendee churn. Because the capacity check counts only `WHERE status = 'active'`, canceling instantly frees up capacity for another attendee without destroying records.

 3. Role-Based Access Control (RBAC) at Controller & Service Layers
- Decision: Strict separation between `organizer` and `attendee` roles enforced via middleware (`requireRole('organizer')`) and service-level owner verification.
- Assumptions: Organizers manage events but cannot register as attendees for their own events. Attendees discover and register for events but cannot create events or inspect other attendees' contact information.

 4. Input Sanitization & Formula Injection Neutralization
- Decision: Attendee rosters exported to CSV pass through PapaParse with formula neutralizers (`=`, `+`, `-`, `@` characters prefixed) to protect organizers opening exported CSVs in Microsoft Excel or Google Sheets.

---

 4. Architectural Trade-offs

| Decision | Chosen Approach | Alternative Considered | Trade-off / Rationale |
| :--- | :--- | :--- | :--- |
| Concurrency Lock | Database row-level lock (`SELECT ... FOR UPDATE`) | Distributed lock (Redis Redlock) | Avoids adding external Redis infrastructure dependency; PostgreSQL provides native ACID transaction guarantees. Serializes registrations per event row while maintaining concurrent registrations across different events. |
| Capacity Calculation | Dynamic `COUNT()` under lock | Denormalized `remaining_seats` column | Dynamic count eliminates counter desynchronization bugs or drift caused by unexpected transaction rollbacks, with negligible overhead given index on `(event_id, status)`. |
| Registration Identity | Single row per reservation with status flag | Separate `active_registrations` and `registration_history` tables | Single table with a partial unique index minimizes schema complexity while keeping queries straightforward. |
| Search Engine | PostgreSQL multi-word `ILIKE` query | External search engine (Elasticsearch, Algolia) | Built-in SQL search easily handles thousands of events without external sync pipelines or deployment complexity. |
