import "reflect-metadata";
import bcrypt from "bcryptjs";
import { logger } from "../shared/logger.js";
import { AppDataSource } from "./data-source.js";
import { UserEntity } from "../entities/User.js";
import { EventEntity } from "../entities/Event.js";
import { RegistrationEntity } from "../entities/Registration.js";
import { migrate } from "./migrate.js";

const PASSWORD = "password123";
const day = 24 * 3600 * 1000;

export interface SeedOptions {
  force?: boolean;
}

export async function seed(options: SeedOptions = {}) {
  await migrate();
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(UserEntity);
  const eventRepo = AppDataSource.getRepository(EventEntity);
  const regRepo = AppDataSource.getRepository(RegistrationEntity);

  const existingCount = await userRepo.count();
  if (existingCount > 0 && !options.force) {
    logger.info("Database already seeded; skipping to prevent duplicate data.", {
      existingUsers: existingCount,
    });
    return;
  }

  if (options.force) {
    if (process.env.NODE_ENV === "production") {
      logger.warn("Refusing to truncate database in production.");
      return;
    }
    await AppDataSource.query("TRUNCATE registrations, events, users RESTART IDENTITY CASCADE");
  }

  const hash = await bcrypt.hash(PASSWORD, 10);

  const mk = async (name: string, email: string, role: "organizer" | "attendee") => {
    const u = userRepo.create({ name, email, passwordHash: hash, role });
    const saved = await userRepo.save(u);
    return saved.id;
  };

  // Organizers
  const org1 = await mk("Olivia Organizer", "olivia@example.com", "organizer");
  const org2 = await mk("Omar Organizer", "omar@example.com", "organizer");

  // Attendees
  const attAlice = await mk("Alice Attendee", "alice@example.com", "attendee");
  const attBob = await mk("Bob Attendee", "bob@example.com", "attendee");
  const attCarol = await mk("Carol Attendee", "carol@example.com", "attendee");
  const attDavid = await mk("David Attendee", "david@example.com", "attendee");
  const attEmma = await mk("Emma Attendee", "emma@example.com", "attendee");

  const ev = async (
    org: number,
    title: string,
    desc: string,
    offsetDays: number,
    tz: string,
    loc: string,
    cap: number,
    status: "draft" | "published" | "canceled"
  ) => {
    const e = eventRepo.create({
      organizerId: org,
      title,
      description: desc,
      startsAt: new Date(Date.now() + offsetDays * day),
      timeZone: tz,
      location: loc,
      capacity: cap,
      status,
    });
    const saved = await eventRepo.save(e);
    return saved.id;
  };

  // --- Olivia's Events ---
  const meetup = await ev(
    org1,
    "Jaipur JS Meetup",
    "Lightning talks and networking for JavaScript & TypeScript developers in the Pink City.",
    7,
    "Asia/Kolkata",
    "Pink City Co-working, C-Scheme, Jaipur",
    50,
    "published"
  );

  const pottery = await ev(
    org1,
    "Pottery Workshop (tiny class)",
    "Hands-on wheel throwing and ceramic sculpting. Only 2 places available for intimate guidance.",
    10,
    "Asia/Kolkata",
    "Clay & Wheel Studio, Jodhpur",
    2,
    "published"
  );

  const aiMasterclass = await ev(
    org1,
    "AI & TypeScript Masterclass",
    "Building generative AI agents with TypeScript, TypeORM, and streaming responses.",
    3,
    "Asia/Kolkata",
    "DevSpace Hub, Bangalore",
    35,
    "published"
  );

  const reactPerf = await ev(
    org1,
    "React Performance Deep Dive",
    "Optimizing re-renders, bundle splitting, and virtual list architectures.",
    21,
    "Asia/Kolkata",
    "Tech Park Auditorium, Hyderabad",
    60,
    "published"
  );

  const confDraft = await ev(
    org1,
    "Global Web Summit 2027",
    "3-day international conference on full-stack architecture and distributed computing.",
    45,
    "Europe/London",
    "ExCeL London, Royal Victoria Dock",
    400,
    "draft"
  );

  const canceledDesign = await ev(
    org1,
    "Design Systems Bootcamp",
    "This session was called off due to speaker scheduling conflict.",
    12,
    "America/New_York",
    "Manhattan Innovation Space, New York",
    25,
    "canceled"
  );

  const pastGraphql = await ev(
    org1,
    "Introduction to GraphQL & Apollo",
    "Past workshop exploring GraphQL schemas, resolvers, and cache policies.",
    -10,
    "Asia/Kolkata",
    "Pink City Co-working, Jaipur",
    40,
    "published"
  );

  // --- Omar's Events ---
  const yoga = await ev(
    org2,
    "Sunrise Yoga in the Park",
    "Gentle morning Vinyasa flow outdoors. Bring a mat and water bottle.",
    4,
    "Asia/Kolkata",
    "Central Park Lawns, Jaipur",
    30,
    "published"
  );

  const berlinSummit = await ev(
    org2,
    "Berlin Product Summit",
    "A full day of product discovery, metrics, and customer interview methodologies.",
    35,
    "Europe/Berlin",
    "Station Berlin, Luckenwalder Str.",
    300,
    "published"
  );

  const tokyoGame = await ev(
    org2,
    "Tokyo Indie Game Dev Showcase",
    "Independent creators demo their latest prototypes with live attendee playtesting.",
    16,
    "Asia/Tokyo",
    "Akihabara Tech Plaza, Tokyo",
    45,
    "published"
  );

  const cleanArch = await ev(
    org2,
    "Clean Architecture & DDD Roundtable",
    "In-depth discussion on domain-driven design and decoupling business logic from frameworks.",
    5,
    "Asia/Kolkata",
    "OpenDoor Coworking, Mumbai",
    20,
    "published"
  );

  const founderStories = await ev(
    org2,
    "Founder Stories & Investor Networking",
    "Candid fireside chats with early-stage founders followed by evening drinks.",
    18,
    "Europe/Berlin",
    "Factory Berlin Mitte",
    80,
    "published"
  );

  const unannouncedVenture = await ev(
    org2,
    "Autumn Demo Day (Draft)",
    "Private pitch session for cohort startups. Not yet public.",
    50,
    "America/New_York",
    "Pier 57, Hudson River Park",
    120,
    "draft"
  );

  const pastBootcamp = await ev(
    org2,
    "Winter Coding Bootcamp 2026",
    "Past intensive sprint on distributed databases and transaction isolation levels.",
    -25,
    "Europe/Berlin",
    "Betahaus, Kreuzberg, Berlin",
    50,
    "published"
  );

  // --- Registrations ---
  const now = new Date();
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);

  const registrations = [
    // Alice's Registrations (Upcoming active, past active, and canceled event)
    regRepo.create({ eventId: meetup, userId: attAlice, status: "active" }),
    regRepo.create({ eventId: aiMasterclass, userId: attAlice, status: "active" }),
    regRepo.create({ eventId: yoga, userId: attAlice, status: "active" }),
    regRepo.create({ eventId: pastGraphql, userId: attAlice, status: "active" }),
    regRepo.create({ eventId: canceledDesign, userId: attAlice, status: "active" }),

    // Bob's Registrations (Takes seat 1 of tiny class, meetup, clean arch, past bootcamp)
    regRepo.create({ eventId: meetup, userId: attBob, status: "active" }),
    regRepo.create({ eventId: pottery, userId: attBob, status: "active" }),
    regRepo.create({ eventId: cleanArch, userId: attBob, status: "active" }),
    regRepo.create({ eventId: pastBootcamp, userId: attBob, status: "active" }),

    // Carol's Registrations (Takes seat 2 of tiny class -> MAKING IT FULL! Plus canceled one)
    regRepo.create({ eventId: pottery, userId: attCarol, status: "active" }),
    regRepo.create({ eventId: aiMasterclass, userId: attCarol, status: "active" }),
    regRepo.create({ eventId: berlinSummit, userId: attCarol, status: "active" }),
    regRepo.create({
      eventId: tokyoGame,
      userId: attCarol,
      status: "canceled",
      canceledAt: yesterday,
    }),

    // David's Registrations
    regRepo.create({ eventId: meetup, userId: attDavid, status: "active" }),
    regRepo.create({ eventId: reactPerf, userId: attDavid, status: "active" }),
    regRepo.create({ eventId: cleanArch, userId: attDavid, status: "active" }),
    regRepo.create({ eventId: founderStories, userId: attDavid, status: "active" }),

    // Emma's Registrations
    regRepo.create({ eventId: aiMasterclass, userId: attEmma, status: "active" }),
    regRepo.create({ eventId: yoga, userId: attEmma, status: "active" }),
    regRepo.create({ eventId: tokyoGame, userId: attEmma, status: "active" }),
  ];

  await regRepo.save(registrations);

  logger.info(`Seeded 14 events and ${registrations.length} registrations.`);
  logger.info(`All accounts use password "${PASSWORD}".`);
}

if (process.argv[1]?.endsWith("seed.ts")) {
  const force = process.argv.includes("--force");
  seed({ force })
    .catch((err) => {
      logger.error("Seed execution failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
    });
}
