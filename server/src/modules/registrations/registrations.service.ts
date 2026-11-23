import { AppDataSource } from "../../db/data-source.js";
import { EventEntity } from "../../entities/Event.js";
import { RegistrationEntity } from "../../entities/Registration.js";
import { ApiError, ErrorCode, forbidden, notFound } from "../../shared/errors.js";
import type {
  CancelRegistrationDto,
  MyRegistrationDto,
  RegistrationDto,
  RegistrationScope,
} from "./registrations.types.js";

const regRepo = () => AppDataSource.getRepository(RegistrationEntity);

/**
 * Register an attendee for an event with high concurrency safety.
 *
 * How Concurrency Safety Works:
 * 1. Pessimistic Lock (`SELECT ... FOR UPDATE`):
 *    We lock the specific `events` row inside a database transaction.
 *    Any concurrent registrations for the *same* event wait in line right here.
 *    This serializes capacity verification and prevents overselling tickets.
 *
 * 2. Critical Pre-checks under lock:
 *    - Event exists and is published (not draft or canceled).
 *    - Event has not already started.
 *    - Attendee is not already actively registered.
 *    - Remaining capacity > 0.
 *
 * 3. Database-level Safety Net:
 *    Even if application logic were somehow bypassed, a partial unique index
 *    `registrations_one_active_uq (event_id, user_id) WHERE status = 'active'`
 *    strictly guarantees at most one active registration per user at the database layer.
 */
export async function register(userId: number, eventId: number): Promise<RegistrationDto> {
  return AppDataSource.transaction(async (manager) => {
    // 1. Lock the event row so all concurrent registrations queue up
    const ev = await manager
      .getRepository(EventEntity)
      .createQueryBuilder("e")
      .setLock("pessimistic_write")
      .where("e.id = :id", { id: eventId })
      .getOne();

    if (!ev || ev.status === "draft") throw notFound("Event");
    if (ev.status === "canceled") throw new ApiError(409, ErrorCode.EVENT_CANCELED, "This event has been canceled.");
    if (ev.startsAt.getTime() <= Date.now()) throw new ApiError(409, ErrorCode.EVENT_STARTED, "This event has already started.");

    // 2. Check for existing active registration by this user
    const dup = await manager
      .getRepository(RegistrationEntity)
      .findOne({ where: { eventId, userId, status: "active" } });
    if (dup) throw new ApiError(409, ErrorCode.ALREADY_REGISTERED, "You are already registered for this event.");

    // 3. Check remaining capacity under the lock
    const activeCount = await manager
      .getRepository(RegistrationEntity)
      .createQueryBuilder("r")
      .where("r.event_id = :eventId", { eventId })
      .andWhere("r.status = 'active'")
      .getCount();

    if (activeCount >= ev.capacity) throw new ApiError(409, ErrorCode.EVENT_FULL, "Sorry, this event is full.");

    // 4. Insert registration
    let reg: RegistrationEntity;
    try {
      const created = manager.getRepository(RegistrationEntity).create({
        eventId,
        userId,
      });
      reg = await manager.getRepository(RegistrationEntity).save(created);
    } catch (e) {
      if ((e as { code?: string }).code === "23505") {
        throw new ApiError(409, ErrorCode.ALREADY_REGISTERED, "You are already registered for this event.");
      }
      throw e;
    }

    return {
      id: reg.id,
      eventId,
      status: "active" as const,
      registeredAt: reg.createdAt.toISOString(),
    };
  });
}

/**
 * Cancel an active registration.
 * - Only the attendee who made the registration can cancel it.
 * - Sets `status` to 'canceled' and records `canceled_at = NOW()`.
 * - Because event capacity counts only 'active' registrations, this immediately frees up a seat.
 */
export async function cancel(userId: number, registrationId: number): Promise<CancelRegistrationDto> {
  const reg = await regRepo().findOne({
    where: { id: registrationId },
    select: { id: true, userId: true, status: true },
  });

  if (!reg) throw notFound("Registration");
  if (reg.userId !== userId) throw forbidden("You can only cancel your own registrations.");
  if (reg.status === "canceled") throw new ApiError(409, ErrorCode.ALREADY_CANCELED, "This registration is already canceled.");

  await regRepo()
    .createQueryBuilder()
    .update(RegistrationEntity)
    .set({ status: "canceled", canceledAt: () => "NOW()" })
    .where("id = :id", { id: registrationId })
    .andWhere("status = 'active'")
    .execute();

  return { id: registrationId, status: "canceled" as const };
}

/**
 * List registrations belonging to a specific user.
 * - `scope = 'upcoming'` (default): returns only events that have not yet started.
 * - `scope = 'all'`: returns all registrations including past and canceled events (for calendar history).
 */
export async function listMine(
  userId: number,
  scope: RegistrationScope
): Promise<MyRegistrationDto[]> {
  const qb = regRepo()
    .createQueryBuilder("r")
    .innerJoinAndSelect("r.event", "e")
    .where("r.user_id = :userId", { userId });

  if (scope !== "all") {
    qb.andWhere("e.starts_at > NOW()");
  }

  qb.orderBy("e.starts_at", "ASC").addOrderBy("r.created_at", "DESC");

  const rows = await qb.getMany();

  return rows.map((r) => ({
    id: r.id,
    status: r.status as "active" | "canceled",
    registeredAt: r.createdAt.toISOString(),
    canceledAt: r.canceledAt?.toISOString() ?? null,
    event: {
      id: r.event.id,
      title: r.event.title,
      description: r.event.description,
      startsAt: r.event.startsAt.toISOString(),
      timeZone: r.event.timeZone,
      location: r.event.location,
      status: r.event.status as "draft" | "published" | "canceled",
    },
  }));
}
