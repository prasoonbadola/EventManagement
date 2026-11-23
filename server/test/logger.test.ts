import { describe, expect, it, vi } from "vitest";
import { logger, morganStream } from "../src/shared/logger.js";

describe("logger", () => {
  it("exports a winston logger instance with standard logging methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.http).toBe("function");
  });

  it("pipes morganStream.write into logger.http", () => {
    const httpSpy = vi.spyOn(logger, "http").mockImplementation(() => logger);
    morganStream.write("GET /api/events 200 4.2ms\n");

    expect(httpSpy).toHaveBeenCalledWith("GET /api/events 200 4.2ms");
    httpSpy.mockRestore();
  });

  it("logs structured metadata and errors without throwing", () => {
    expect(() => {
      logger.info("Test info message", { userId: 123, action: "test" });
      logger.error("Test error message", new Error("Sample error"));
    }).not.toThrow();
  });
});
