import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrate } from "../src/db/migrate.js";
import { app, ensureDataSource, makeEvent, makeUser, register, truncateTables } from "./helpers.js";

beforeAll(async () => { await ensureDataSource(); await migrate(); });
beforeEach(async () => {
  await truncateTables();
});

describe("ownership and roles (enforced by the backend)", () => {
  it("another organizer cannot edit, cancel, or list attendees of my event", async () => {
    const owner = await makeUser("organizer");
    const other = await makeUser("organizer");
    const ev = await makeEvent(owner.id);

    await request(app).patch(`/api/events/${ev}`).set(other.auth).send({ title: "hijacked" }).expect(403);
    await request(app).patch(`/api/events/${ev}`).set(other.auth).send({ status: "canceled" }).expect(403);
    await request(app).get(`/api/events/${ev}/registrations`).set(other.auth).expect(403);
    await request(app).get(`/api/events/${ev}/registrations`).expect(401);
    await request(app).get(`/api/events/${ev}/registrations`).set(owner.auth).expect(200);
  });

  it("attendees cannot create/edit events or see attendee lists", async () => {
    const org = await makeUser("organizer");
    const a = await makeUser("attendee");
    const ev = await makeEvent(org.id);
    const body = { title: "x", startLocal: "2099-01-01T10:00", timeZone: "UTC", location: "y", capacity: 3 };
    await request(app).post("/api/events").set(a.auth).send(body).expect(403);
    await request(app).patch(`/api/events/${ev}`).set(a.auth).send({ title: "z" }).expect(403);
    await request(app).get(`/api/events/${ev}/registrations`).set(a.auth).expect(403);
  });

  it("an attendee cannot cancel someone else's registration; organizers cannot register", async () => {
    const org = await makeUser("organizer");
    const [a, b] = await Promise.all([makeUser("attendee"), makeUser("attendee")]);
    const ev = await makeEvent(org.id);
    const r = await register(ev, a).expect(201);
    await request(app).delete(`/api/registrations/${r.body.registration.id}`).set(b.auth).expect(403);
    await register(ev, org).expect(403);
  });

  it("drafts are hidden from the public and other organizers but visible to the owner", async () => {
    const owner = await makeUser("organizer");
    const other = await makeUser("organizer");
    const ev = await makeEvent(owner.id, { status: "draft" });
    await request(app).get(`/api/events/${ev}`).expect(404);
    await request(app).get(`/api/events/${ev}`).set(other.auth).expect(404);
    await request(app).get(`/api/events/${ev}`).set(owner.auth).expect(200);
  });
});
