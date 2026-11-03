/**
 * Playwright's `test`, plus optional code coverage. Specs import `test` and `expect` from here.
 *
 * With E2E_COVERAGE=1 every page in the test's browser context records Chromium's built-in
 * (V8) JavaScript coverage. The data is added to coverage/e2e/ and turned into reports
 * by the global teardown, mapped through source maps back to the UI Kit's src/. Build the sample
 * app with source maps and UIKIT_LOCAL=1 so the bundle contains the kit's own source.
 * Without E2E_COVERAGE nothing changes.
 */
import { test as base, type Page } from '@playwright/test';
import MCR from 'monocart-coverage-reports';
import { coverageOptions } from './coverage';

export * from '@playwright/test';

const enabled = process.env.E2E_COVERAGE === '1';

export const test = base.extend<{ coverage: undefined }>({
  coverage: [
    async ({ context }, use) => {
      if (!enabled) {
        await use(undefined);
        return;
      }
      const pages = new Set<Page>();
      const start = async (page: Page) => {
        pages.add(page);
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
      };
      await Promise.all(context.pages().map(start));
      context.on('page', page => void start(page));

      await use(undefined);

      const report = MCR(coverageOptions);
      for (const page of pages) {
        if (!page.isClosed()) await report.add(await page.coverage.stopJSCoverage());
      }
    },
    { auto: true },
  ],
});
