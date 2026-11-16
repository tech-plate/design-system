import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["react/src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.mjs"],
  },
});
