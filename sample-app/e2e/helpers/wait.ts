import { Locator } from '@playwright/test';

/**
 * Resolves `true` once `locator` is visible, or `false` after `timeout` ms.
 *
 * Use this for "is it there?" branches. `locator.isVisible({ timeout })` does
 * NOT wait — the option is ignored and it checks once — so a slow render reads
 * as "absent". To require visibility, assert with `expect(locator).toBeVisible()`.
 */
export function visibleWithin(locator: Locator, timeout: number): Promise<boolean> {
  return locator.waitFor({ state: 'visible', timeout }).then(
    () => true,
    () => false
  );
}
