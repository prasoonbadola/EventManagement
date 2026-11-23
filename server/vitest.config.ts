import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    testTimeout: 20000,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ?? "postgres://evt:evt@localhost:5432/events_test",
      JWT_SECRET: "test-secret",
    },
  },
});
