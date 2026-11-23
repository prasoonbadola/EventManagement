import { DateTime } from "luxon";
import { AppDataSource } from "../../db/data-source.js";
import { EventEntity } from "../../entities/Event.js";
import { RegistrationEntity } from "../../entities/Registration.js";
import { ApiError, ErrorCode, forbidden, notFound } from "../../shared/errors.js";
import type { AuthUser } from "../../shared/middleware/auth.js";
import { LOCAL_FMT, mapEvent } from "./events.mapper.js";
import type {
  AttendeeDto,
  CreateEventInput,
  EventDto,
  ListEventsOptions,
  PaginatedEventsResponse,
  UpdateEventInput,
} from "./events.types.js";

const eventRepo = () => AppDataSource.getRepository(EventEntity);
const regRepo = () => AppDataSource.getRepository(RegistrationEntity);

/**
 * Converts a local datetime string (e.g., '2026-12-01T18:00') scheduled in a specific
 * IANA time zone (e.g., 'Asia/Kolkata') into an absolute UTC Date object for PostgreSQL storage.
 */
function toInstant(startLocal: string, timeZone: string): Date {
  const dt = DateTime.fromFormat(startLocal, LOCAL_FMT, { zone: timeZone });
  if (!dt.isValid) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid start date/time for that time zone.", {
      startLocal: [dt.invalidExplanation ?? "Invalid"],
    });
  }
  return dt.toJSDate();
}

const mustBeFuture = () =>
  new ApiError(400, ErrorCode.VALIDATION_ERROR, "Start time must be in the future.", {
    startLocal: ["Start time must be in the future"],
  });

/**
 * Creates a base TypeORM QueryBuilder selecting an event joined with its organizer
 * and computing its active registration count via an inline SQL subquery.
 */
function baseEventQuery() {
  return eventRepo()
    .createQueryBuilder("e")
    .leftJoinAndSelect("e.organizer", "u")
    .addSelect(
      (sub) =>
        sub
          .select("COUNT(*)", "cnt")
          .from(RegistrationEntity, "r")
          .where("r.event_id = e.id")
          .andWhere("r.status = 'active'"),
      "active_count"
    );
}

/**
 * Fetches a single event by ID with its joined organizer and active registration count.
 */
async function fetchOne(id: number): Promise<EventEntity | undefined> {
  const raw = await baseEventQuery().where("e.id = :id", { id }).getRawAndEntities();
  if (!raw.entities[0]) return undefined;
  const ev = raw.entities[0];
  ev.activeCount = Number(raw.raw[0]?.active_count ?? 0);
  return ev;
}

/**
 * Public events listing with server-driven search, filtering, and pagination.
 *
 * Filtering rules:
 * - Only events with `status = 'published'`
 * - Only events starting in the future (`starts_at > NOW()`)
 * - Multi-word keyword search across title, location, description, or organizer name
 * - Optional `onlyOpen` filter checks `capacity - active_registrations > 0`
 * - Optional `days` window (e.g., events in the next 7 or 30 days)
 */
export async function listPublic(
  opts: string | ListEventsOptions = ""
): Promise<PaginatedEventsResponse> {
  const options: ListEventsOptions = typeof opts === "string" ? { q: opts } : opts;
  const q = (options.q ?? "").trim();

  const qb = baseEventQuery()
    .where("e.status = 'published'")
    .andWhere("e.starts_at > NOW()");

  // Multi-word search: each word must match at least one searchable field
  if (q) {
    const words = q.split(/\s+/).filter(Boolean);
    for (let i = 0; i < words.length; i++) {
      const param = `word${i}`;
      qb.andWhere(
        `(e.title ILIKE :${param} OR e.location ILIKE :${param} OR e.description ILIKE :${param} OR u.name ILIKE :${param})`,
        { [param]: `%${words[i]}%` }
      );
    }
  }

  // Filter for events that still have open spots
  if (options.onlyOpen) {
    qb.andWhere(
      `(e.capacity - (SELECT count(*)::int FROM registrations r2 WHERE r2.event_id = e.id AND r2.status = 'active')) > 0`
    );
  }

  // Filter for events occurring within N days from now
  if (options.days && Number.isFinite(options.days) && options.days > 0) {
    qb.andWhere("e.starts_at <= (NOW() + :days::int * INTERVAL '1 day')", {
      days: Math.round(options.days),
    });
  }

  // Count total matching events prior to pagination
  const countQb = qb.clone();
  const total = await countQb.getCount();

  // Apply pagination
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
  const offset = (page - 1) * limit;

  qb.orderBy("e.starts_at", "ASC").skip(offset).take(limit);

  const result = await qb.getRawAndEntities();
  const events = result.entities.map((ev, i) => {
    ev.activeCount = Number(result.raw[i]?.active_count ?? 0);
    return mapEvent(ev);
  });

  return {
    events,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + events.length < total,
    },
  };
}

/**
 * Fetch a single event for viewing.
 * - Published and canceled events are visible to anyone.
 * - Draft events are visible ONLY to the organizer who created them.
 * - If the viewer is logged in, checks if they currently hold an active registration.
 */
export async function getForViewer(id: number, viewer?: AuthUser): Promise<EventDto> {
  const ev = await fetchOne(id);
  const isOwner = !!ev && viewer?.id === ev.organizerId;
  if (!ev || (ev.status === "draft" && !isOwner)) throw notFound("Event");

  let myRegistration = null;
  if (viewer) {
    const reg = await regRepo().findOne({
      where: { eventId: id, userId: viewer.id, status: "active" },
      select: { id: true, status: true },
    });
    myRegistration = reg ? { id: reg.id, status: reg.status } : null;
  }

  return { ...mapEvent(ev), isOwner, myRegistration };
}

/**
 * Create a new event.
 * Validates that the event's start time is in the future.
 */
export async function createEvent(organizer: AuthUser, input: CreateEventInput): Promise<EventDto> {
  const startsAt = toInstant(input.startLocal, input.timeZone);
  if (startsAt.getTime() <= Date.now()) throw mustBeFuture();

  const ev = eventRepo().create({
    organizerId: organizer.id,
    title: input.title,
    description: input.description,
    startsAt,
    timeZone: input.timeZone,
    location: input.location,
    capacity: input.capacity,
    status: input.status,
  });

  const saved = await eventRepo().save(ev);
  const reloaded = await fetchOne(saved.id);
  return mapEvent(reloaded!);
}

/**
 * Edit or cancel an event.
 *
 * Concurrency Safety:
 * The event row is locked using `pessimistic_write` (`SELECT ... FOR UPDATE`).
 * This prevents race conditions where an organizer reduces event capacity while
 * attendees are registering for tickets concurrently.
 */
export async function updateEvent(
  organizer: AuthUser,
  id: number,
  patch: UpdateEventInput
): Promise<EventDto> {
  await AppDataSource.transaction(async (manager) => {
    // 1. Acquire pessimistic write lock on the event row
    const cur = await manager
      .getRepository(EventEntity)
      .createQueryBuilder("e")
      .setLock("pessimistic_write")
      .where("e.id = :id", { id })
      .getOne();

    if (!cur) throw notFound("Event");
    if (cur.organizerId !== organizer.id) throw forbidden("You can only edit your own events.");
    if (cur.status === "canceled") throw new ApiError(409, ErrorCode.EVENT_CANCELED, "A canceled event can no longer be edited.");

    // State machine check: cannot revert a published event back to draft
    const status = patch.status ?? cur.status;
    if (cur.status === "published" && status === "draft") {
      throw new ApiError(409, ErrorCode.INVALID_TRANSITION, "A published event cannot go back to draft. Cancel it instead.");
    }

    // Recalculate start timestamp if date/time or timeZone changed
    const timeZone = patch.timeZone ?? cur.timeZone;
    let startsAt: Date = cur.startsAt;
    if (patch.startLocal !== undefined || patch.timeZone !== undefined) {
      const currentLocal = DateTime.fromJSDate(cur.startsAt).setZone(cur.timeZone).toFormat(LOCAL_FMT);
      startsAt = toInstant(patch.startLocal ?? currentLocal, timeZone);
      if (startsAt.getTime() !== cur.startsAt.getTime() && startsAt.getTime() <= Date.now()) {
        throw mustBeFuture();
      }
    }

    // Capacity check: capacity cannot be lowered below the number of already registered attendees
    const capacity = patch.capacity ?? cur.capacity;
    if (patch.capacity !== undefined) {
      const cnt = await manager
        .getRepository(RegistrationEntity)
        .createQueryBuilder("r")
        .where("r.event_id = :id", { id })
        .andWhere("r.status = 'active'")
        .getCount();

      if (capacity < cnt) {
        throw new ApiError(
          409,
          ErrorCode.CAPACITY_BELOW_REGISTRATIONS,
          `Capacity cannot be lower than the ${cnt} active registration(s).`,
          { capacity: [`Must be at least ${cnt}`] }
        );
      }
    }

    // Update event record in the transaction
    await manager.getRepository(EventEntity).update(id, {
      title: patch.title ?? cur.title,
      description: patch.description ?? cur.description,
      startsAt,
      timeZone,
      location: patch.location ?? cur.location,
      capacity,
      status,
    });
  });

  const reloaded = await fetchOne(id);
  return mapEvent(reloaded!);
}

/**
 * Permanently delete a draft event.
 * Only unpublished drafts with zero attendees can be deleted.
 */
export async function deleteEvent(
  organizer: AuthUser,
  id: number
): Promise<{ id: number; deleted: true }> {
  const ev = await eventRepo().findOne({ where: { id } });
  if (!ev) throw notFound("Event");
  if (ev.organizerId !== organizer.id) throw forbidden("You can only delete your own events.");
  if (ev.status !== "draft") {
    throw new ApiError(
      409,
      ErrorCode.INVALID_TRANSITION,
      "Only draft events can be deleted. Cancel published events instead."
    );
  }

  await eventRepo().delete(id);
  return { id, deleted: true };
}

export interface OrganizerEventsResult {
  events: EventDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  stats: {
    total: number;
    live: number;
    drafts: number;
    canceled: number;
    used: number;
    fill: number;
  };
}

/**
 * List events owned by an organizer with server-side pagination, status filtering, search, and aggregate stats.
 */
export async function listByOrganizer(
  organizerId: number,
  options?: { page?: number; limit?: number; status?: string; q?: string }
): Promise<OrganizerEventsResult> {
  const page = Math.max(1, Number(options?.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options?.limit) || 10));
  const offset = (page - 1) * limit;

  // 1. Compute full aggregate stats for this organizer across all their events
  const allResult = await baseEventQuery()
    .where("e.organizer_id = :organizerId", { organizerId })
    .orderBy("e.starts_at", "DESC")
    .addOrderBy("e.id", "DESC")
    .getRawAndEntities();

  const allEvents = allResult.entities.map((ev, i) => {
    ev.activeCount = Number(allResult.raw[i]?.active_count ?? 0);
    return mapEvent(ev);
  });

  const live = allEvents.filter((e) => e.status === "published");
  const drafts = allEvents.filter((e) => e.status === "draft");
  const canceled = allEvents.filter((e) => e.status === "canceled");
  const totalCap = live.reduce((sum, e) => sum + e.capacity, 0);
  const totalUsed = live.reduce((sum, e) => sum + e.activeRegistrations, 0);

  const stats = {
    total: allEvents.length,
    live: live.length,
    drafts: drafts.length,
    canceled: canceled.length,
    used: totalUsed,
    fill: totalCap ? Math.round((totalUsed / totalCap) * 100) : 0,
  };

  // 2. Query paginated and filtered events
  let filteredQb = baseEventQuery().where("e.organizer_id = :organizerId", { organizerId });

  if (options?.status && options.status !== "all") {
    filteredQb = filteredQb.andWhere("e.status = :status", { status: options.status });
  }

  if (options?.q && options.q.trim()) {
    filteredQb = filteredQb.andWhere(
      "(LOWER(e.title) LIKE :q OR LOWER(e.location) LIKE :q)",
      { q: `%${options.q.trim().toLowerCase()}%` }
    );
  }

  const countQb = filteredQb.clone();
  const total = await countQb.getCount();

  filteredQb = filteredQb.orderBy("e.starts_at", "DESC").addOrderBy("e.id", "DESC").skip(offset).take(limit);

  const paginatedResult = await filteredQb.getRawAndEntities();
  const events = paginatedResult.entities.map((ev, i) => {
    ev.activeCount = Number(paginatedResult.raw[i]?.active_count ?? 0);
    return mapEvent(ev);
  });

  return {
    events,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasMore: offset + events.length < total,
    },
    stats,
  };
}

export interface AttendeesResult {
  attendees: AttendeeDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * List active attendees for an event with server-side pagination and search.
 * Ownership is enforced: only the organizer who owns the event can view the attendee roster.
 */
export async function listAttendees(
  organizer: AuthUser,
  eventId: number,
  options?: { page?: number; limit?: number; q?: string }
): Promise<AttendeesResult> {
  const ev = await eventRepo().findOne({ where: { id: eventId }, select: { id: true, organizerId: true } });
  if (!ev) throw notFound("Event");
  if (ev.organizerId !== organizer.id) throw forbidden("You can only view attendees of your own events.");

  const page = Math.max(1, Number(options?.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options?.limit) || 10));
  const offset = (page - 1) * limit;

  let qb = regRepo()
    .createQueryBuilder("r")
    .innerJoinAndSelect("r.user", "u")
    .where("r.event_id = :eventId", { eventId })
    .andWhere("r.status = 'active'");

  if (options?.q && options.q.trim()) {
    qb = qb.andWhere(
      "(LOWER(u.name) LIKE :q OR LOWER(u.email) LIKE :q)",
      { q: `%${options.q.trim().toLowerCase()}%` }
    );
  }

  const countQb = qb.clone();
  const total = await countQb.getCount();

  qb = qb.orderBy("r.created_at", "ASC").skip(offset).take(limit);

  const rows = await qb.getMany();

  const attendees = rows.map((r) => ({
    registrationId: r.id,
    name: r.user.name,
    email: r.user.email,
    registeredAt: r.createdAt.toISOString(),
  }));

  return {
    attendees,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasMore: offset + attendees.length < total,
    },
  };
}
