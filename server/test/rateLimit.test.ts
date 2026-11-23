import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { errorHandler } from "../src/shared/middleware/errorHandler.js";
import { rateLimit } from "../src/shared/middleware/rateLimit.js";

describe("rateLimit middleware", () => {
  it("enforces rate limits and returns standard 429 ApiError when exceeded", async () => {
    // Temporarily disable the test-skipping behavior to test the limiter itself
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const app = express();
      const limiter = rateLimit({
        windowMs: 60 * 1000,
        max: 2,
        code: "TEST_RATE_LIMIT",
        message: "Limit reached",
      });

      app.use("/test", limiter, (_req, res) => {
        res.json({ ok: true });
      });
      app.use(errorHandler);

      // Request 1: OK
      const res1 = await request(app).get("/test").expect(200);
      expect(res1.body).toEqual({ ok: true });
      expect(res1.headers["ratelimit-limit"]).toBe("2");
      expect(res1.headers["ratelimit-remaining"]).toBe("1");

      // Request 2: OK
      const res2 = await request(app).get("/test").expect(200);
      expect(res2.headers["ratelimit-remaining"]).toBe("0");

      // Request 3: Blocked (429)
      const res3 = await request(app).get("/test").expect(429);
      expect(res3.body).toEqual({
        error: {
          code: "TEST_RATE_LIMIT",
          message: "Limit reached",
        },
      });
      expect(res3.headers["retry-after"]).toBeDefined();
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it("skips rate limiting when NODE_ENV is test", async () => {
    const app = express();
    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 1,
    });

    app.use("/test-skip", limiter, (_req, res) => {
      res.json({ ok: true });
    });
    app.use(errorHandler);

    // Both requests succeed because NODE_ENV === 'test'
    await request(app).get("/test-skip").expect(200);
    await request(app).get("/test-skip").expect(200);
  });
});
