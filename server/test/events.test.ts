import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrate } from "../src/db/migrate.js";
import { app, ensureDataSource, makeEvent, makeUser, register, truncateTables } from "./helpers.js";

beforeAll(async () => { await ensureDataSource(); await migrate(); });
beforeEach(async () => {
  await truncateTables();
});

describe("event validation and time zones", () => {
  it("validates required fields and stores the instant correctly for the zone", async () => {
    const org = await makeUser("organizer");
    const bad = await request(app).post("/api/events").set(org.auth).send({ title: "", capacity: -1 });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.error.details)).toEqual(expect.arrayContaining(["title", "capacity", "location"]));

    const ok = await request(app).post("/api/events").set(org.auth)
      .send({ title: "Tokyo night", startLocal: "2099-06-01T20:00", timeZone: "Asia/Tokyo", location: "Shibuya", capacity: 10, status: "published" });
    expect(ok.status).toBe(201);
    expect(ok.body.event.startsAt).toBe("2099-06-01T11:00:00.000Z");
    expect(ok.body.event.startLocal).toBe("2099-06-01T20:00");

    const past = await request(app).post("/api/events").set(org.auth)
      .send({ title: "Old", startLocal: "2001-01-01T10:00", timeZone: "UTC", location: "x", capacity: 1 });
    expect(past.status).toBe(400);
  });
});
