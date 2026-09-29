import { defineConfig } from 'vitest/config';

/**
 * Separate from vite.config.ts on purpose.
 *
 * The settings-seam specs are pure functions — no DOM, no JSX, no UI Kit imports — so they need
 * none of the app config. Keeping them apart also avoids a type collision: this package pins
 * vite 6, while the hoisted vitest resolves the repo root's vite 7, and the two disagree about
 * `Plugin`.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.spec.{ts,tsx}'],
  },
});
