import "reflect-metadata";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { AppDataSource } from "../src/db/data-source.js";
import { UserEntity } from "../src/entities/User.js";
import { EventEntity } from "../src/entities/Event.js";
import { signToken } from "../src/shared/middleware/auth.js";

// Initialise TypeORM once for the test suite
let dsReady = false;
export async function ensureDataSource() {
  if (!dsReady) {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    dsReady = true;
  }
}

export const truncateTables = () =>
  AppDataSource.query("TRUNCATE registrations, events, users RESTART IDENTITY CASCADE");

export const app = createApp();
export { AppDataSource };
let seq = 0;

export async function makeUser(role: "organizer" | "attendee") {
  const n = ++seq;
  const userRepo = AppDataSource.getRepository(UserEntity);
  const user = userRepo.create({
    name: `${role} ${n}`,
    email: `${role}${n}@test.dev`,
    passwordHash: await bcrypt.hash("password123", 4),
    role,
  });
  const saved = await userRepo.save(user);
  return { id: saved.id, auth: { Authorization: `Bearer ${signToken(saved.id)}` } };
}

export async function makeEvent(organizerId: number, over: Record<string, unknown> = {}) {
  const o = { capacity: 2, status: "published", startsAt: new Date(Date.now() + 7 * 864e5), ...over };
  const eventRepo = AppDataSource.getRepository(EventEntity);
  const ev = eventRepo.create({
    organizerId,
    title: "Test event",
    startsAt: o.startsAt as Date,
    timeZone: "UTC",
    location: "Somewhere",
    capacity: o.capacity as number,
    status: o.status as "draft" | "published" | "canceled",
  });
  const saved = await eventRepo.save(ev);
  return saved.id;
}

export function register(eventId: number, user: { auth: { Authorization: string } }) {
  return request(app).post(`/api/events/${eventId}/registrations`).set(user.auth);
}
