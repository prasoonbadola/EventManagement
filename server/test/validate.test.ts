import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { errorHandler } from "../src/shared/middleware/errorHandler.js";
import { validateBody, validateQuery } from "../src/shared/middleware/validate.js";

describe("validate middleware", () => {
  it("validates body and coerces/sanitizes input", async () => {
    const app = express();
    app.use(express.json());

    const schema = z.object({
      name: z.string().trim(),
      age: z.number().int().min(1),
    });

    app.post("/test-body", validateBody(schema), (req, res) => {
      res.json({ received: req.body });
    });
    app.use(errorHandler);

    // Valid request
    const resOk = await request(app)
      .post("/test-body")
      .send({ name: "  Alice  ", age: 30 })
      .expect(200);

    expect(resOk.body.received).toEqual({ name: "Alice", age: 30 });

    // Invalid request
    const resErr = await request(app)
      .post("/test-body")
      .send({ name: "", age: -5 })
      .expect(400);

    expect(resErr.body.error.code).toBe("VALIDATION_ERROR");
    expect(resErr.body.error.details).toBeDefined();
  });

  it("validates and coerces query parameters", async () => {
    const app = express();
    const schema = z.object({
      page: z.coerce.number().int().default(1),
      limit: z.coerce.number().int().default(10),
    });

    app.get("/test-query", validateQuery(schema), (req, res) => {
      res.json({ query: req.query });
    });
    app.use(errorHandler);

    const res = await request(app).get("/test-query?page=3&limit=25").expect(200);
    expect(res.body.query).toEqual({ page: 3, limit: 25 });
  });
});
