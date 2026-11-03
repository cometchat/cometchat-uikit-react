import { test } from '@playwright/test';

/**
 * Run the check that a known product bug breaks, so the bug doesn't turn the run red while
 * everything around it is still tested.
 *
 * - The check fails: the test is reported as an expected failure (Playwright's `test.fail`).
 *   Steps before this point still have to pass; the test ends here.
 * - The check passes: the bug looks fixed, so the test fails and asks for the marker to be
 *   removed. With `intermittent` (a bug that doesn't show on every run) a pass is fine and the
 *   test carries on.
 *
 * Describe the bug in plain words: these files are mirrored publicly, so no ticket ids.
 */
export async function knownIssue(
  description: string,
  check: () => Promise<void>,
  { intermittent = false }: { intermittent?: boolean } = {}
): Promise<void> {
  try {
    await check();
  } catch (error) {
    test.fail(true, `Known issue: ${description}`);
    throw error;
  }
  if (!intermittent) {
    throw new Error(
      `Known issue no longer reproduces: "${description}". If it has been fixed, remove the knownIssue() wrapper.`
    );
  }
}
