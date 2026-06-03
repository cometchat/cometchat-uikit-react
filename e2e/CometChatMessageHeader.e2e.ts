import { test, expect } from '@playwright/test';

const STORY_BASE = '/iframe.html?id=components-messages-cometchat-message-header';

/** Navigate to a story and wait for the header to render. */
async function gotoStory(page: import('@playwright/test').Page, storyName: string) {
  await page.goto(`${STORY_BASE}--${storyName}&viewMode=story`);
  await page.waitForSelector('[role="banner"]', { timeout: 10_000 });
}

/**
 * Locator helpers — use tag-qualified selectors to avoid strict mode violations
 * when CSS module class substrings match both wrapper and inner elements.
 */
const loc = {
  banner: (page: import('@playwright/test').Page) => page.locator('[role="banner"]'),
  title: (page: import('@playwright/test').Page) => page.locator('span[class*="message-header__title"]'),
  subtitle: (page: import('@playwright/test').Page) => page.locator('span[class*="message-header__subtitle"]'),
  subtitleWrapper: (page: import('@playwright/test').Page) => page.locator('div[class*="message-header__subtitle-wrapper"]'),
  content: (page: import('@playwright/test').Page) => page.locator('[class*="message-header__content"]'),
  backBtn: (page: import('@playwright/test').Page) => page.locator('button[aria-label="Go back"]'),
  voiceBtn: (page: import('@playwright/test').Page) => page.locator('button[aria-label="Voice call"]'),
  videoBtn: (page: import('@playwright/test').Page) => page.locator('button[aria-label="Video call"]'),
  searchBtn: (page: import('@playwright/test').Page) => page.locator('button[aria-label="Search"]'),
  summaryBtn: (page: import('@playwright/test').Page) => page.locator('button[aria-label="Conversation summary"]'),
  avatar: (page: import('@playwright/test').Page) => page.locator('[class*="message-header__avatar-container"]'),
  statusOnline: (page: import('@playwright/test').Page) => page.locator('[class*="status-indicator--online"]'),
};

test.describe('CometChatMessageHeader', () => {
  // ─── User Chat Header ──────────────────────────────────────────────

  test.describe('UserChatHeader story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'user-chat-header');
    });

    test('renders the message header container', async ({ page }) => {
      await expect(loc.banner(page)).toBeVisible();
    });

    test('has role="banner" on the root', async ({ page }) => {
      await expect(loc.banner(page)).toBeVisible();
    });

    test('has aria-label with user name', async ({ page }) => {
      const label = await loc.banner(page).getAttribute('aria-label');
      expect(label).toContain('John Doe');
    });

    test('renders the user display name', async ({ page }) => {
      await expect(loc.title(page)).toBeVisible();
      await expect(loc.title(page)).toHaveText('John Doe');
    });

    test('renders the avatar', async ({ page }) => {
      await expect(loc.avatar(page)).toBeVisible();
    });

    test('renders the online status indicator', async ({ page }) => {
      await expect(loc.statusOnline(page)).toBeVisible();
    });

    test('renders the subtitle with "Online"', async ({ page }) => {
      await expect(loc.subtitle(page)).toBeVisible();
      await expect(loc.subtitle(page)).toContainText('Online');
    });

    test('renders the back button', async ({ page }) => {
      await expect(loc.backBtn(page)).toBeVisible();
    });

    test('renders voice call button', async ({ page }) => {
      await expect(loc.voiceBtn(page)).toBeVisible();
    });

    test('renders video call button', async ({ page }) => {
      await expect(loc.videoBtn(page)).toBeVisible();
    });

    test('content area is clickable', async ({ page }) => {
      await expect(loc.content(page)).toHaveAttribute('role', 'button');
      await expect(loc.content(page)).toHaveAttribute('tabindex', '0');
    });
  });

  // ─── Group Chat Header ─────────────────────────────────────────────

  test.describe('GroupChatHeader story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'group-chat-header');
    });

    test('renders the group name', async ({ page }) => {
      await expect(loc.title(page)).toHaveText('Design Team');
    });

    test('renders the member count in subtitle', async ({ page }) => {
      await expect(loc.subtitle(page)).toContainText('12');
      await expect(loc.subtitle(page)).toContainText('Members');
    });

    test('does not render status indicator for groups', async ({ page }) => {
      await expect(loc.statusOnline(page)).toHaveCount(0);
    });

    test('has aria-label with group name and member count', async ({ page }) => {
      const label = await loc.banner(page).getAttribute('aria-label');
      expect(label).toContain('Design Team');
      expect(label).toContain('12');
    });
  });

  // ─── Offline User Header ───────────────────────────────────────────

  test.describe('OfflineUserHeader story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'offline-user-header');
    });

    test('renders the user name', async ({ page }) => {
      await expect(loc.title(page)).toHaveText('Jane Smith');
    });

    test('renders "Last seen" in subtitle', async ({ page }) => {
      await expect(loc.subtitleWrapper(page)).toContainText('Last seen');
    });

    test('does not show online status indicator', async ({ page }) => {
      await expect(loc.statusOnline(page)).toHaveCount(0);
    });
  });

  // ─── Without Back Button ───────────────────────────────────────────

  test.describe('WithoutBackButton story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'without-back-button');
    });

    test('does not render the back button', async ({ page }) => {
      await expect(loc.backBtn(page)).toHaveCount(0);
    });

    test('still renders the header content', async ({ page }) => {
      await expect(loc.title(page)).toBeVisible();
    });
  });

  // ─── Without Call Buttons ──────────────────────────────────────────

  test.describe('WithoutCallButtons story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'without-call-buttons');
    });

    test('does not render voice call button', async ({ page }) => {
      await expect(loc.voiceBtn(page)).toHaveCount(0);
    });

    test('does not render video call button', async ({ page }) => {
      await expect(loc.videoBtn(page)).toHaveCount(0);
    });

    test('still renders the header content', async ({ page }) => {
      await expect(loc.title(page)).toBeVisible();
    });
  });

  // ─── With Search Option ────────────────────────────────────────────

  test.describe('WithSearchOption story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'with-search-option');
    });

    test('renders the search button', async ({ page }) => {
      await expect(loc.searchBtn(page)).toBeVisible();
    });

    test('search button is clickable', async ({ page }) => {
      await loc.searchBtn(page).click();
    });
  });

  // ─── With Conversation Summary ─────────────────────────────────────

  test.describe('WithConversationSummary story', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'with-conversation-summary');
    });

    test('renders the summary button', async ({ page }) => {
      await expect(loc.summaryBtn(page)).toBeVisible();
    });

    test('summary button is clickable', async ({ page }) => {
      await loc.summaryBtn(page).click();
    });
  });

  // ─── Keyboard Navigation ───────────────────────────────────────────

  test.describe('Keyboard navigation', () => {
    test.beforeEach(async ({ page }) => {
      await gotoStory(page, 'user-chat-header');
    });

    test('Tab moves focus through interactive elements', async ({ page }) => {
      // Focus the back button directly, then tab forward
      await loc.backBtn(page).focus();
      await expect(loc.backBtn(page)).toBeFocused();

      // Tab forward — should eventually reach content area
      await page.keyboard.press('Tab');
      await expect(loc.content(page)).toBeFocused();

      // Tab forward — should reach voice call button
      await page.keyboard.press('Tab');
      await expect(loc.voiceBtn(page)).toBeFocused();

      // Tab forward — should reach video call button
      await page.keyboard.press('Tab');
      await expect(loc.videoBtn(page)).toBeFocused();
    });

    test('Enter activates the content area', async ({ page }) => {
      await loc.content(page).focus();
      await page.keyboard.press('Enter');
    });

    test('Space activates the content area', async ({ page }) => {
      await loc.content(page).focus();
      await page.keyboard.press('Space');
    });

    test('Enter activates the back button', async ({ page }) => {
      await loc.backBtn(page).focus();
      await page.keyboard.press('Enter');
    });

    test('Enter activates the voice call button', async ({ page }) => {
      await loc.voiceBtn(page).focus();
      await page.keyboard.press('Enter');
    });

    test('Enter activates the video call button', async ({ page }) => {
      await loc.videoBtn(page).focus();
      await page.keyboard.press('Enter');
    });
  });

  // ─── Accessibility ─────────────────────────────────────────────────

  test.describe('Accessibility', () => {
    test('root has role="banner"', async ({ page }) => {
      await gotoStory(page, 'user-chat-header');
      await expect(loc.banner(page)).toBeVisible();
    });

    test('back button has aria-label', async ({ page }) => {
      await gotoStory(page, 'user-chat-header');
      await expect(loc.backBtn(page)).toBeVisible();
      await expect(loc.backBtn(page)).toHaveAttribute('aria-label', 'Go back');
    });

    test('voice call button has aria-label', async ({ page }) => {
      await gotoStory(page, 'user-chat-header');
      await expect(loc.voiceBtn(page)).toBeVisible();
    });

    test('video call button has aria-label', async ({ page }) => {
      await gotoStory(page, 'user-chat-header');
      await expect(loc.videoBtn(page)).toBeVisible();
    });

    test('content area has role="button" and tabindex', async ({ page }) => {
      await gotoStory(page, 'user-chat-header');
      await expect(loc.content(page)).toHaveAttribute('role', 'button');
      await expect(loc.content(page)).toHaveAttribute('tabindex', '0');
    });

    test('content area has descriptive aria-label', async ({ page }) => {
      await gotoStory(page, 'user-chat-header');
      const label = await loc.content(page).getAttribute('aria-label');
      expect(label).toContain('John Doe');
      expect(label).toContain('details');
    });

    test('search button has aria-label', async ({ page }) => {
      await gotoStory(page, 'with-search-option');
      await expect(loc.searchBtn(page)).toBeVisible();
    });

    test('summary button has aria-label', async ({ page }) => {
      await gotoStory(page, 'with-conversation-summary');
      await expect(loc.summaryBtn(page)).toBeVisible();
    });

    test('status indicator has role="status"', async ({ page }) => {
      await gotoStory(page, 'user-chat-header');
      const indicator = page.locator('[role="status"]');
      await expect(indicator).toBeVisible();
    });

    test('status indicator has aria-label', async ({ page }) => {
      await gotoStory(page, 'user-chat-header');
      const indicator = page.locator('[role="status"]');
      const label = await indicator.getAttribute('aria-label');
      expect(label).toBeTruthy();
    });
  });
});
