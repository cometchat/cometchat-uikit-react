import { test, expect, Page, Locator } from '../helpers/test';
import { knownIssue, loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, ThrowawayGroup } from '../helpers/fixtures';
import { sendMessageToGroup } from '../helpers/pinSave';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { AttachmentOption, stageAndSendAttachment } from '../helpers/attachments';

/**
 * E2E — global search with other scripts and the result filters (catalog H2).
 *
 * Each test gets a throwaway group with a name in several scripts, and Bob posts two messages
 * into it: one in several scripts, one with a link. The media test also uploads one file of each
 * kind from `e2e/fixtures`, so it doesn't depend on media other tests may or may not have sent. Alice hasn't opened the group, so it is
 * unread for her. Every search term carries a per-test token, so results from other chats
 * can't match.
 *
 * The search service matches whole words and keeps accents (searching "cafe" doesn't find
 * "Café"), so terms here are spelled as written.
 */

let group: ThrowawayGroup;
let token: string;
let scripts: string;
let link: string;

test.beforeEach(async ({ page }) => {
  token = `h2${String(Date.now())}`;
  group = await createThrowawayGroup({
    name: `E2E Ünïcødé 東京 ${token}`,
    owner: PRIMARY_USER,
    members: [SECONDARY_USER],
  });
  scripts = `Café crème 東京タワー Привет مرحبا naïve 🚀 ${token}`;
  link = `Docs at https://www.cometchat.com/docs ${token}`;
  await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: scripts });
  await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: link });

  await loginToApp(page);
  await openSearch(page);
});

test.afterEach(async () => {
  await group.dispose();
});

async function openSearch(page: Page) {
  await page.locator('.cometchat-tab-component__tab:has-text("Chats")').first().click();
  const searchBar = page.locator('.cometchat-conversations__search-bar').first();
  await expect(searchBar).toBeVisible({ timeout: 30_000 });
  await searchBar.click();
  await expect(searchInput(page)).toBeVisible({ timeout: 5_000 });
}

const searchInput = (page: Page) => page.locator('.cometchat-search__input input').first();
const filter = (page: Page, name: string) =>
  page.locator('.cometchat-search__body-filter').filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) }).first();
const messageResults = (page: Page) => page.locator('.cometchat-search__messages-list-item');
const conversationResults = (page: Page) => page.locator('.cometchat-search__conversations-list-item');
/** "No Results" — for the whole search, or for the one section a filter leaves. */
const noResults = (page: Page) =>
  page.locator('.cometchat-search__empty-view, .cometchat-search__section-empty-view').first();

async function toggleFilter(page: Page, name: string, on: boolean) {
  const chip = filter(page, name);
  await expect(chip).toBeVisible({ timeout: 5_000 });
  await chip.click();
  if (on) await expect(chip).toHaveClass(/cometchat-search__body-filter--active/);
  else await expect(chip).not.toHaveClass(/cometchat-search__body-filter--active/);
}

const isMessageSearch = (url: string) => url.includes('/messages?') && url.includes('searchKey=');

/**
 * Turn a filter off and wait for the unfiltered search to answer. Turning the next filter on
 * before then races the two answers (a late unfiltered answer replaces the filtered list),
 * which the race test below covers on purpose.
 */
async function filterOff(page: Page, name: string) {
  const unfiltered = page.waitForResponse(r => isMessageSearch(r.url()) && !r.url().includes('attachmentTypes'));
  await toggleFilter(page, name, false);
  await unfiltered;
}

/** Open the group, upload the given media from the composer, and go back to search. */
async function uploadMedia(page: Page, media: { option: AttachmentOption; name: string }[]) {
  await page.locator('.cometchat-search__back-button').first().click();
  await selectGroupByName(page, group.name);
  await waitForChatOpen(page, group.name, { expectMessages: true });
  for (const { option, name } of media) await stageAndSendAttachment(page, option, { name });
  await openSearch(page);
  await searchInput(page).fill(token);
}

async function expectOnlyResult(results: Locator, text: string) {
  await expect(results.filter({ hasText: text })).toHaveCount(1, { timeout: 20_000 });
  await expect(results).toHaveCount(1);
}

test('words in other scripts find the message, which shows intact and opens the chat', async ({ page }) => {
  for (const term of ['東京タワー', 'Привет', 'naïve']) {
    await test.step(`"${term}"`, async () => {
      // Words are matched separately, so the token alone also finds the link message.
      await searchInput(page).fill(`${term} ${token}`);
      const hit = messageResults(page).filter({ hasText: token }).filter({ hasText: term }).first();
      await expect(hit).toBeVisible({ timeout: 20_000 });
      await expect(hit).toContainText(scripts);
    });
  }

  await messageResults(page).filter({ hasText: token }).filter({ hasText: 'naïve' }).first().click();
  await expect(page.locator('.cometchat-messages-wrapper .cometchat-message-header__title').first()).toContainText(
    group.name,
    { timeout: 15_000 }
  );
  await expect(
    page.locator('.cometchat-messages-wrapper .cometchat-message-bubble__wrapper').filter({ hasText: scripts }).first()
  ).toBeInViewport({ timeout: 15_000 });
});

test('a group name in other scripts is found and shown intact', async ({ page }) => {
  await searchInput(page).fill(`東京 ${token}`);
  await expectOnlyResult(conversationResults(page), group.name);
  await expect(conversationResults(page).first()).toContainText(group.name);
});

test('the Groups and Unread filters narrow conversation results', async ({ page }) => {
  await searchInput(page).fill(token);
  await expect(conversationResults(page).filter({ hasText: group.name })).toHaveCount(1, { timeout: 20_000 });

  await test.step('Groups keeps the group', async () => {
    await toggleFilter(page, 'Groups', true);
    await expectOnlyResult(conversationResults(page), group.name);
    await toggleFilter(page, 'Groups', false);
  });

  await test.step("Unread keeps it while Alice hasn't read it", async () => {
    await toggleFilter(page, 'Unread', true);
    await expectOnlyResult(conversationResults(page), group.name);
  });

  await test.step('once read, Unread drops it', async () => {
    await page.locator('.cometchat-search__back-button').first().click();
    await page.locator('.cometchat-conversations__item').filter({ hasText: group.name }).first().click();
    await expect(
      page.locator('.cometchat-messages-wrapper .cometchat-message-bubble__wrapper').filter({ hasText: link }).first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator('.cometchat-conversations__item').filter({ hasText: group.name }).locator('.cometchat-conversations__item-unread-badge')
    ).toHaveCount(0, { timeout: 15_000 });

    await openSearch(page);
    await searchInput(page).fill(token);
    await toggleFilter(page, 'Unread', true);
    await expect(noResults(page)).toBeVisible({ timeout: 20_000 });
    await expect(conversationResults(page)).toHaveCount(0);
  });
});

test('the Links filter keeps the message with a link and drops the other', async ({ page }) => {
  await searchInput(page).fill(token);
  await expect(messageResults(page).filter({ hasText: token })).toHaveCount(2, { timeout: 20_000 });

  await toggleFilter(page, 'Links', true);
  await expectOnlyResult(messageResults(page), link);

  await filterOff(page, 'Links');
  await toggleFilter(page, 'Photos', true);
  await expect(noResults(page)).toBeVisible({ timeout: 20_000 });
  await expect(messageResults(page)).toHaveCount(0);
});

test('each media filter keeps only its own kind', async ({ page }) => {
  test.setTimeout(240_000);
  // One of each kind, uploaded from the composer under names that carry the token.
  const media: { option: AttachmentOption; filter: string; name: string }[] = [
    { option: 'Image', filter: 'Photos', name: `${token}-photo.png` },
    { option: 'Video', filter: 'Videos', name: `${token}-video.mp4` },
    { option: 'Audio', filter: 'Audio', name: `${token}-audio.mp3` },
    { option: 'File', filter: 'Documents', name: `${token}-document.pdf` },
  ];
  await uploadMedia(page, media);
  for (const { filter: chip, name } of media) {
    await test.step(chip, async () => {
      await toggleFilter(page, chip, true);
      await expectOnlyResult(messageResults(page), name);
      await filterOff(page, chip);
    });
  }
});

test("a late answer for an earlier search doesn't replace the current filter's results", async ({ page }) => {
  test.setTimeout(180_000);
  const video = `${token}-video.mp4`;
  const document = `${token}-document.pdf`;
  await uploadMedia(page, [
    { option: 'Video', name: video },
    { option: 'File', name: document },
  ]);

  // Make every unfiltered message search answer late, so it always lands after the filtered one.
  await page.route('**/messages?*', async route => {
    const url = route.request().url();
    if (isMessageSearch(url) && !url.includes('attachmentTypes')) await new Promise(r => setTimeout(r, 3_000));
    await route.continue();
  });

  await toggleFilter(page, 'Videos', true);
  await expectOnlyResult(messageResults(page), video);
  // Switch straight to another filter, as a user would, while the unfiltered search is pending.
  const late = page.waitForResponse(r => isMessageSearch(r.url()) && !r.url().includes('attachmentTypes'));
  await toggleFilter(page, 'Videos', false);
  await toggleFilter(page, 'Documents', true);
  await expectOnlyResult(messageResults(page), document);
  await late;

  await knownIssue('a late search answer replaces the results of the filter chosen after it', async () => {
    // The late answer has arrived; give the page a moment to render whatever it does with it.
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1_000)));
    await expect(messageResults(page)).toHaveCount(1);
    await expect(messageResults(page).first()).toContainText(document);
  });
});

test('a query made of special characters gets an answer, not an error', async ({ page }) => {
  // Whether the service ignores the punctuation (and finds the token) or finds nothing is its
  // choice; the search must answer either way, and show markup in the query as text.
  for (const query of [`%_*${token}`, `<b>${token}</b>`, `'; -- ${token}`, `(.*)[\\]{}${token}`]) {
    await test.step(query, async () => {
      await searchInput(page).fill(query);
      await expect(
        page
          .locator(
            '.cometchat-search__empty-view, .cometchat-search__section-empty-view, .cometchat-search__error-view, ' +
              '.cometchat-search__section-error-view, .cometchat-search__messages-list-item, ' +
              '.cometchat-search__conversations-list-item'
          )
          .first()
      ).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('.cometchat-search__error-view')).toHaveCount(0);
      await expect(page.locator('.cometchat-search__section-error-view')).toHaveCount(0);
      await expect(page.locator('.cometchat-search b')).toHaveCount(0);
    });
  }
});
