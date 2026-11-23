import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrate } from "../src/db/migrate.js";
import { app, ensureDataSource, makeEvent, makeUser, register, truncateTables, AppDataSource } from "./helpers.js";

beforeAll(async () => { await ensureDataSource(); await migrate(); });
beforeEach(async () => {
  await truncateTables();
});

describe("duplicate registration", () => {
  it("rejects a second active registration but allows re-registering after cancel", async () => {
    const org = await makeUser("organizer");
    const a = await makeUser("attendee");
    const ev = await makeEvent(org.id);

    const first = await register(ev, a);
    expect(first.status).toBe(201);
    const dup = await register(ev, a);
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe("ALREADY_REGISTERED");

    await request(app).delete(`/api/registrations/${first.body.registration.id}`).set(a.auth).expect(200);
    await register(ev, a).expect(201);
  });

  it("is also enforced by the database (partial unique index)", async () => {
    const org = await makeUser("organizer");
    const a = await makeUser("attendee");
    const ev = await makeEvent(org.id);
    await AppDataSource.query("INSERT INTO registrations (event_id,user_id) VALUES ($1,$2)", [ev, a.id]);
    await expect(AppDataSource.query("INSERT INTO registrations (event_id,user_id) VALUES ($1,$2)", [ev, a.id])).rejects.toThrow(/unique/);
  });
});

describe("capacity", () => {
  it("blocks when full and releases a place on cancel", async () => {
    const org = await makeUser("organizer");
    const [a, b, c] = await Promise.all([makeUser("attendee"), makeUser("attendee"), makeUser("attendee")]);
    const ev = await makeEvent(org.id, { capacity: 2 });

    await register(ev, a).expect(201);
    const rb = await register(ev, b).expect(201);
    const full = await register(ev, c);
    expect(full.status).toBe(409);
    expect(full.body.error.code).toBe("EVENT_FULL");

    await request(app).delete(`/api/registrations/${rb.body.registration.id}`).set(b.auth).expect(200);
    const detail = await request(app).get(`/api/events/${ev}`);
    expect(detail.body.event.placesRemaining).toBe(1);
    await register(ev, c).expect(201);
  });

  it("never oversells under simultaneous requests (25 racers, 5 places)", async () => {
    const org = await makeUser("organizer");
    const users = await Promise.all(Array.from({ length: 25 }, () => makeUser("attendee")));
    const ev = await makeEvent(org.id, { capacity: 5 });

    const results = await Promise.all(users.map((u) => register(ev, u)));
    const ok = results.filter((r) => r.status === 201).length;
    const full = results.filter((r) => r.status === 409 && r.body.error.code === "EVENT_FULL").length;
    expect(ok).toBe(5);
    expect(full).toBe(20);
    const rows = await AppDataSource.query("SELECT count(*)::int n FROM registrations WHERE event_id=$1 AND status='active'", [ev]);
    expect(rows[0].n).toBe(5);
  });

  it("last place race: exactly one of two attendees wins", async () => {
    const org = await makeUser("organizer");
    const [a, b] = await Promise.all([makeUser("attendee"), makeUser("attendee")]);
    const ev = await makeEvent(org.id, { capacity: 1 });
    const res = await Promise.all([register(ev, a), register(ev, b)]);
    expect(res.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it("the same user firing many parallel requests only gets one registration", async () => {
    const org = await makeUser("organizer");
    const a = await makeUser("attendee");
    const ev = await makeEvent(org.id, { capacity: 10 });
    const res = await Promise.all(Array.from({ length: 10 }, () => register(ev, a)));
    expect(res.filter((r) => r.status === 201)).toHaveLength(1);
  });

  it("cannot reduce capacity below active registrations", async () => {
    const org = await makeUser("organizer");
    const [a, b] = await Promise.all([makeUser("attendee"), makeUser("attendee")]);
    const ev = await makeEvent(org.id, { capacity: 5 });
    await register(ev, a); await register(ev, b);

    const bad = await request(app).patch(`/api/events/${ev}`).set(org.auth).send({ capacity: 1 });
    expect(bad.status).toBe(409);
    expect(bad.body.error.code).toBe("CAPACITY_BELOW_REGISTRATIONS");
    await request(app).patch(`/api/events/${ev}`).set(org.auth).send({ capacity: 2 }).expect(200);
    await request(app).patch(`/api/events/${ev}`).set(org.auth).send({ capacity: 0 }).expect(400);
  });
});

describe("registration availability rules", () => {
  it("rejects draft, canceled and already-started events", async () => {
    const org = await makeUser("organizer");
    const a = await makeUser("attendee");
    const draft = await makeEvent(org.id, { status: "draft" });
    const canceled = await makeEvent(org.id, { status: "canceled" });
    const started = await makeEvent(org.id, { startsAt: new Date(Date.now() - 3600_000) });

    expect((await register(draft, a)).status).toBe(404);
    expect((await register(canceled, a)).body.error.code).toBe("EVENT_CANCELED");
    expect((await register(started, a)).body.error.code).toBe("EVENT_STARTED");
  });

  it("public listing hides drafts, canceled and past events", async () => {
    const org = await makeUser("organizer");
    await makeEvent(org.id);
    await makeEvent(org.id, { status: "draft" });
    await makeEvent(org.id, { status: "canceled" });
    await makeEvent(org.id, { startsAt: new Date(Date.now() - 3600_000) });
    const res = await request(app).get("/api/events");
    expect(res.body.events).toHaveLength(1);
  });
});

describe("my registrations scope", () => {
  it("upcoming hides past events; scope=all includes them and canceled registrations", async () => {
    const org = await makeUser("organizer");
    const a = await makeUser("attendee");
    const future = await makeEvent(org.id);
    const past = await makeEvent(org.id, { startsAt: new Date(Date.now() - 86400_000) });
    const r = await register(future, a).expect(201);
    await AppDataSource.query("INSERT INTO registrations (event_id,user_id) VALUES ($1,$2)", [past, a.id]);
    await request(app).delete(`/api/registrations/${r.body.registration.id}`).set(a.auth).expect(200);

    const upcoming = await request(app).get("/api/me/registrations").set(a.auth);
    expect(upcoming.body.registrations.map((x: { event: { id: number } }) => x.event.id)).toEqual([future]);
    expect(upcoming.body.registrations[0].status).toBe("canceled");

    const all = await request(app).get("/api/me/registrations?scope=all").set(a.auth);
    expect(all.body.registrations).toHaveLength(2);
  });
});
