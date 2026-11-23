# Gathr Server

REST API backend for Gathr, providing authentication, event management, and concurrency-safe registration.

---

## What It Does

- **Event Management**: CRUD APIs for draft, published, and canceled events with IANA time zone support.
- **Concurrency-Safe Registration**: Pessimistic row locking (`SELECT ... FOR UPDATE`) and database partial unique indexes to strictly prevent overselling.
- **Role-Based Access Control**: Secure endpoints partitioned for `organizer` and `attendee` roles.
- **Attendee Reporting**: Server-side pagination and attendee roster exports for organizers.
- **Input Validation**: Request bodies, query parameters, and route params sanitized and validated with Zod.
- **Production Observability**: Structured JSON logging with Winston, Morgan HTTP request stream, and standard IETF rate-limit headers.

### Tech Stack
- **Runtime & Framework**: Node.js 20+, Express 5, TypeScript
- **Database & ORM**: PostgreSQL, TypeORM
- **Security & Validation**: Zod, Bcrypt, JWT, Express Rate Limit
- **Logging**: Winston, Morgan
- **Testing**: Vitest, Supertest

---

## How to Run It

### 1. Prerequisites
Ensure PostgreSQL is running locally:
```bash
psql -U postgres -c "CREATE DATABASE events;"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed Database
Applies schema migrations and inserts initial events and test accounts:
```bash
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
The API server runs at **http://localhost:4000**.

### 5. Run Tests & Typecheck
```bash
npm test          # Runs all 30 Vitest integration tests against PostgreSQL
npm run typecheck # Runs TypeScript type checking
```
