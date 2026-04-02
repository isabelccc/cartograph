import { defineConfig } from "vitest/config";

/** Commerce modules under `modules/` — `npm run test:modules`. */
export default defineConfig({
  test: {
    globals: false,
    include: ["modules/**/*.test.ts"],
  },
});
