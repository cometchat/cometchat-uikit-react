// Lints the Playwright suite. Rules start as warnings while existing code is
// migrated (e.g. fixed sleeps → web-first assertions); `missing-playwright-await`
// is an error because a forgotten await is always a bug.
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**', 'playwright-report/**', 'test-results/**', 'e2e-results/**'] },
  {
    files: ['e2e/**/*.ts'],
    extends: [tseslint.configs.base],
    plugins: { playwright },
    rules: {
      'playwright/missing-playwright-await': 'error',
      'playwright/no-wait-for-timeout': 'warn',
      'playwright/no-wait-for-selector': 'warn',
      'playwright/no-networkidle': 'warn',
      'playwright/prefer-web-first-assertions': 'warn',
      'playwright/no-force-option': 'warn',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'off',
      // `isVisible({ timeout })` ignores the timeout and checks once, so a slow
      // render reads as "absent". Assert with `toBeVisible()`, or branch with
      // `visibleWithin()` from e2e/helpers/wait.ts.
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='isVisible'][arguments.length>0]",
          message:
            'isVisible() does not wait. Use expect(locator).toBeVisible({ timeout }) or visibleWithin(locator, timeout).',
        },
      ],
    },
  },
  {
    // Specs take `test` from e2e/helpers/test.ts, which adds coverage collection; a spec
    // importing it from Playwright directly would silently drop out of E2E coverage.
    files: ['e2e/**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['test'],
              message: "Import test (and expect) from e2e/helpers/test so the spec is included in E2E coverage.",
            },
          ],
        },
      ],
    },
  }
);
