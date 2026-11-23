CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('organizer', 'attendee')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq ON users (lower(email));

CREATE TABLE IF NOT EXISTS events (
  id           SERIAL PRIMARY KEY,
  organizer_id INTEGER NOT NULL REFERENCES users(id),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  starts_at    TIMESTAMPTZ NOT NULL,           -- absolute instant (UTC)
  time_zone    TEXT NOT NULL,                  -- IANA zone the organizer scheduled it in
  location     TEXT NOT NULL,
  capacity     INTEGER NOT NULL CHECK (capacity > 0),
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'canceled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_public_idx ON events (status, starts_at);
CREATE INDEX IF NOT EXISTS events_organizer_idx ON events (organizer_id);

CREATE TABLE IF NOT EXISTS registrations (
  id          SERIAL PRIMARY KEY,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  canceled_at TIMESTAMPTZ
);
-- Safety net: at most one ACTIVE registration per (event, user), enforced by the DB itself.
CREATE UNIQUE INDEX IF NOT EXISTS registrations_one_active_uq
  ON registrations (event_id, user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS registrations_event_idx ON registrations (event_id, status);
CREATE INDEX IF NOT EXISTS registrations_user_idx ON registrations (user_id, status);
