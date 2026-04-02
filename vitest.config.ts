import { defineConfig } from "vitest/config";

/** Course exercises (`topics/`) — default `npm test`. */
export default defineConfig({
  test: {
    globals: false,
    include: ["topics/**/*.test.ts"],
    passWithNoTests: true,
  },
});
