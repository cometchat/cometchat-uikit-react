import { test, expect, Page, Route } from '../helpers/test';
import { loginToApp, PRIMARY_USER, SECONDARY_USER } from '../helpers';
import { createThrowawayGroup, createThrowawayUser } from '../helpers/fixtures';
import { selectGroupByName, waitForChatOpen } from '../helpers/navigation';
import { addReaction, openPinnedPanel, sendMessageToGroup } from '../helpers/pinSave';
import { fixturePath, stageAndSendAttachment } from '../helpers/attachments';
import { createPoll } from '../helpers/threads';
import { startCall } from '../helpers/calls';
import { getUserName } from '../helpers/agentic';
import { addGroupMembers, groupAttachments, markGroupRead, sendToGroup, voteInPoll } from '../helpers/restMessages';
import { tokenEffect } from './token-effect';

/**
 * E2E — theme tokens take effect, many at once (style-token coverage).
 *
 * The app walks through the screens below in order, each building on the last (the media sent on
 * one screen is still in the chat on the next). On each screen, every token listed for it is set
 * on `.cometchat`, where an app sets it, and must change the computed style of an element that a
 * kit stylesheet styles with it (see `tokenEffect`). A token is listed under the first screen where
 * that is true.
 *
 * Some states come from the other members over REST (an incoming voice note, a read receipt, a vote
 * by someone without an avatar), some from holding back a request (a list still loading) or failing
 * it (a sticker keyboard that couldn't load), and some from the window's width.
 *
 * `theme-tokens.spec.ts` checks specific tokens with exact values; this one covers breadth: a
 * rename, a hard-coded value or a broken chain between tokens fails here.
 */

/** The chat under test. */
interface Chat {
  guid: string;
  name: string;
  /** A user with no avatar, who joins to vote, so their initials show where an avatar would. */
  voter: string;
  /** The window size the test started with. */
  viewport: { width: number; height: number };
  /** Requests a screen holds back so its loading state stays up; its close lets them go. */
  held: Route[];
}

interface Screen {
  name: string;
  open: (page: Page, chat: Chat) => Promise<void>;
  /** Defaults to Escape. */
  close?: (page: Page, chat: Chat) => Promise<void>;
  tokens: string[];
}

const OUTGOING = 'Outgoing token check';
const INCOMING = 'Incoming token check https://example.com';
const FORMATTED = 'Formatted token check';

/** Media at this address never loads: its bubble and the viewer show that there is no preview. */
const BROKEN_MEDIA = 'https://broken-media.invalid';
const brokenAttachment = (name: string, mimeType: string) => ({
  url: `${BROKEN_MEDIA}/${name}`,
  name,
  mimeType,
  extension: name.split('.').pop() ?? '',
  size: 10,
});
const STICKERS_REQUEST = /\/\/stickers-[\w-]+\.[\w.-]+\/v1\/fetch/;
const PHOTOS_SEARCH = /\/messages\?.*attachmentTypes=image/;

const messages = (page: Page) => page.locator('.cometchat-messages-wrapper .cometchat-message-list');
const bubbleWith = (page: Page, text: string) =>
  page.locator('.cometchat-messages-wrapper .cometchat-message-bubble__wrapper').filter({ hasText: text }).last();

async function openMessageMenu(page: Page, text: string) {
  const bubble = bubbleWith(page, text);
  await bubble.locator('.cometchat-message-bubble__body').first().hover();
  await bubble.getByRole('button', { name: /more/i }).first().click();
}

/** Focus `selector` as a keyboard user would, so `:focus-visible` applies. */
async function keyboardFocus(page: Page, selector: string) {
  await page.keyboard.press('Shift');
  await page.locator(selector).first().focus();
}

async function stageInTray(page: Page, option: 'Image' | 'Video', file: string) {
  await page.locator('.cometchat-message-composer__attachment-button').first().click();
  const chooser = page.waitForEvent('filechooser', { timeout: 5_000 });
  await page.locator('.cometchat-message-composer__attachment-option').filter({ hasText: option }).first().click();
  await (await chooser).setFiles(fixturePath(file));
  await expect(page.locator('.cometchat-message-composer__tray').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.cometchat-message-composer__tray-progress')).toHaveCount(0, { timeout: 60_000 });
}

async function dragFiles(page: Page, type: 'dragenter' | 'dragleave') {
  await page.locator('.cometchat-messages-wrapper .cometchat-message-composer').first().evaluate((composer, type) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File(['x'], 'photo.png', { type: 'image/png' }));
    composer.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
  }, type);
}

async function release(chat: Chat) {
  for (const route of chat.held.splice(0)) await route.continue();
}

const nothing = async () => {};

const SCREENS: Screen[] = [
  {
    name: 'chat',
    open: nothing,
    close: nothing,
    tokens: [
      '--cometchat-background-color-02',
      '--cometchat-background-color-03',
      '--cometchat-background-color-04',
      '--cometchat-border-color-dark',
      '--cometchat-border-color-default',
      '--cometchat-border-color-light',
      '--cometchat-extended-primary-color-100',
      '--cometchat-extended-primary-color-300',
      '--cometchat-extended-primary-color-500',
      '--cometchat-extended-primary-color-800',
      '--cometchat-font-body-bold',
      '--cometchat-font-body-medium',
      '--cometchat-font-body-regular',
      '--cometchat-font-caption1-medium',
      '--cometchat-font-caption1-regular',
      '--cometchat-font-caption2-regular',
      '--cometchat-font-heading1-bold',
      '--cometchat-font-heading4-bold',
      '--cometchat-font-heading4-medium',
      '--cometchat-font-title-regular',
      '--cometchat-icon-color-highlight',
      '--cometchat-icon-color-primary',
      '--cometchat-icon-color-secondary',
      '--cometchat-info-color',
      '--cometchat-margin-1',
      '--cometchat-margin-2',
      '--cometchat-message-list-bg',
      '--cometchat-message-seen-color',
      '--cometchat-neutral-color-50',
      '--cometchat-neutral-color-100',
      '--cometchat-neutral-color-200',
      '--cometchat-neutral-color-300',
      '--cometchat-neutral-color-400',
      '--cometchat-neutral-color-500',
      '--cometchat-neutral-color-600',
      '--cometchat-neutral-color-900',
      '--cometchat-padding',
      '--cometchat-padding-1',
      '--cometchat-padding-2',
      '--cometchat-padding-3',
      '--cometchat-padding-4',
      '--cometchat-radius',
      '--cometchat-radius-1',
      '--cometchat-radius-2',
      '--cometchat-radius-3',
      '--cometchat-radius-max',
      '--cometchat-spacing-1',
      '--cometchat-spacing-2',
      '--cometchat-spacing-3',
      '--cometchat-spacing-4',
      '--cometchat-spacing-max',
      '--cometchat-static-white',
      '--cometchat-success-color',
      '--cometchat-text-color-highlight',
      '--cometchat-text-color-primary',
      '--cometchat-text-color-secondary',
      '--cometchat-text-color-tertiary',
      '--cometchat-warning-color',
    ],
  },
  {
    name: 'chat opened from the conversation list',
    open: async (page, chat) => {
      await page.locator('.cometchat-tab-component__tab:has-text("Chats")').first().click();
      const conversation = page.locator('.cometchat-conversations__item').filter({ hasText: chat.name }).first();
      await expect(conversation).toBeVisible({ timeout: 15_000 });
      await conversation.click();
      await waitForChatOpen(page, chat.name, { expectMessages: true });
      await page.mouse.move(0, 0);
    },
    close: nothing,
    tokens: ['--cometchat-white-pressed'],
  },
  {
    name: 'keyboard focus in the composer',
    open: page => keyboardFocus(page, '.cometchat-messages-wrapper .cometchat-formatting-toolbar__button'),
    close: page => page.locator('.cometchat-messages-wrapper .cometchat-formatting-toolbar__button').first().blur(),
    tokens: ['--cometchat-border-color-highlight'],
  },
  {
    name: 'media messages',
    open: async page => {
      for (const kind of ['Image', 'Video', 'Audio', 'File'] as const) await stageAndSendAttachment(page, kind);
      await page.mouse.move(0, 0);
    },
    close: nothing,
    tokens: [
      '--cometchat-audio-bubble-card-min-width',
      '--cometchat-audios-bubble-max-width',
      '--cometchat-file-bubble-card-min-width',
      '--cometchat-files-bubble-max-width',
      '--cometchat-overlay-background-light',
      '--cometchat-videos-bubble-container-max-width',
    ],
  },
  {
    name: 'incoming media',
    open: async (page, chat) => {
      // The other member sends the files just uploaded again, so nothing new is uploaded.
      const { audio, file, image } = await groupAttachments(chat.guid, PRIMARY_USER);
      if (!audio || !file || !image) throw new Error('The media sent on the previous screen is missing.');
      const send = (type: string, data: Record<string, unknown>) =>
        sendToGroup(chat.guid, SECONDARY_USER, { category: 'message', type, data });
      await send('audio', { attachments: [audio], metadata: { audioType: 'voice_note' } });
      await send('file', { attachments: [file, file] });
      await send('image', { attachments: [image, image, image, image, image] });
      await send('image', { attachments: [brokenAttachment('no-preview.png', 'image/png')] });
      await send('video', { attachments: [brokenAttachment('no-preview.mp4', 'video/mp4')] });
      await expect(messages(page).locator('.cometchat-audio-bubble').first()).toBeVisible({ timeout: 30_000 });
      await expect(messages(page).locator('.cometchat-files-bubble__container--multi').first()).toBeVisible({ timeout: 30_000 });
      await expect(messages(page).locator('.cometchat-images-bubble__overflow-text').first()).toBeVisible({ timeout: 30_000 });
      await expect(messages(page).locator('.cometchat-images-bubble__unsupported').first()).toBeVisible({ timeout: 30_000 });
      await expect(messages(page).locator('.cometchat-videos-bubble__tile--unsupported').first()).toBeVisible({ timeout: 30_000 });
    },
    close: nothing,
    tokens: [
      '--cometchat-audio-bubble-max-width',
      '--cometchat-audio-bubble-min-width',
      '--cometchat-neutral-color-350',
      '--cometchat-text-shadow-strong',
    ],
  },
  {
    name: 'keyboard focus on an image',
    open: page => keyboardFocus(page, '.cometchat-messages-wrapper .cometchat-images-bubble__image-wrapper'),
    close: page => page.locator('.cometchat-messages-wrapper .cometchat-images-bubble__image-wrapper').first().blur(),
    tokens: [
      '--cometchat-focus-ring-color',
      '--cometchat-focus-ring-color-inverse',
      '--cometchat-focus-ring-offset',
      '--cometchat-focus-ring-style',
      '--cometchat-focus-ring-width',
    ],
  },
  {
    name: 'files dragged over the composer',
    open: async page => {
      await dragFiles(page, 'dragenter');
      await expect(page.locator('.cometchat-message-composer__drop-overlay').first()).toBeVisible({ timeout: 5_000 });
    },
    close: async page => {
      await dragFiles(page, 'dragleave');
      await expect(page.locator('.cometchat-message-composer__drop-overlay')).toHaveCount(0, { timeout: 5_000 });
    },
    tokens: ['--cometchat-drop-overlay-background'],
  },
  {
    name: 'attachment tray',
    open: page => stageInTray(page, 'Image', 'test-image.png'),
    close: async page => page.locator('.cometchat-message-composer__send-button--active').first().click(),
    tokens: ['--cometchat-static-black', '--cometchat-static-neutral-700'],
  },
  {
    name: 'video in the attachment tray, its remove button hovered',
    open: async page => {
      await stageInTray(page, 'Video', 'test-video.mp4');
      await expect(page.locator('.cometchat-message-composer__tray-duration').first()).toBeVisible({ timeout: 10_000 });
      // The remove button shows while its tile is hovered.
      await page.locator('.cometchat-message-composer__tray-tile').first().hover();
      await page.locator('.cometchat-message-composer__tray-remove-button').first().hover();
    },
    close: async page => {
      await page.locator('.cometchat-message-composer__tray-remove-button').first().click();
      await expect(page.locator('.cometchat-message-composer__tray')).toHaveCount(0, { timeout: 5_000 });
      await page.mouse.move(0, 0);
    },
    tokens: ['--cometchat-static-neutral-100', '--cometchat-static-neutral-400'],
  },
  {
    name: 'sticker keyboard that failed to load',
    open: async page => {
      await page.route(STICKERS_REQUEST, route => route.abort());
      await page.locator('.cometchat-messages-wrapper .cometchat-message-composer__sticker-button').first().click();
      await expect(page.locator('.cometchat-stickers-keyboard__retry-button').first()).toBeVisible({ timeout: 10_000 });
    },
    close: async page => {
      await page.keyboard.press('Escape');
      await expect(page.locator('.cometchat-stickers-keyboard')).toHaveCount(0, { timeout: 5_000 });
      await page.unroute(STICKERS_REQUEST);
    },
    tokens: ['--cometchat-primary-button-background', '--cometchat-primary-button-text'],
  },
  {
    name: 'poll',
    open: async (page, chat) => {
      const question = await createPoll(page, 'Token poll');
      const poll = page.locator('.cometchat-messages-wrapper .cometchat-poll-bubble').filter({ hasText: question }).last();
      await expect(poll.locator('.cometchat-poll-bubble__option-progress').first()).toBeVisible({ timeout: 15_000 });
      await addGroupMembers(chat.guid, [chat.voter]);
      await voteInPoll({ guid: chat.guid, question, as: chat.voter, option: 1 });
      await expect(poll.locator('.cometchat-poll-bubble__option-avatar-initials').first()).toBeVisible({ timeout: 20_000 });
    },
    close: nothing,
    tokens: [
      '--cometchat-extended-primary-color-600',
      '--cometchat-extended-primary-color-700',
      '--cometchat-padding-5',
      '--cometchat-poll-bubble-max-width',
      '--cometchat-poll-bubble-width',
      '--cometchat-radius-4',
      '--cometchat-spacing-5',
    ],
  },
  {
    name: 'reaction details',
    open: async page => {
      await bubbleWith(page, INCOMING).locator('.cometchat-reactions__info-wrapper').first().hover();
      await expect(page.locator('.cometchat-reactions__info-emoji').first()).toBeVisible({ timeout: 10_000 });
    },
    close: async page => {
      await page.mouse.move(0, 0);
      await expect(page.locator('.cometchat-reactions__info')).toHaveCount(0, { timeout: 5_000 });
    },
    tokens: ['--cometchat-font-heading1-regular'],
  },
  {
    name: 'message menu',
    open: page => openMessageMenu(page, OUTGOING),
    tokens: ['--cometchat-white-hover'],
  },
  {
    name: 'message information',
    open: async page => {
      await openMessageMenu(page, OUTGOING);
      await page.getByRole('menuitem', { name: 'Info', exact: true }).click();
      await expect(page.locator('.cometchat-message-information__header-close-button').first()).toBeVisible({ timeout: 15_000 });
      // The receipts load after the panel opens; without them part of the panel isn't drawn yet.
      await expect(page.locator('.cometchat-message-information [class*="shimmer"]')).toHaveCount(0, { timeout: 15_000 });
    },
    close: async page => {
      const close = page.locator('.cometchat-message-information__header-close-button').first();
      await close.click();
      await expect(close).toBeHidden({ timeout: 5_000 });
    },
    tokens: [
      '--cometchat-font-heading3-bold',
      '--cometchat-overlay-background-heavy',
      '--cometchat-padding-6',
      '--cometchat-radius-5',
      '--cometchat-spacing-6',
    ],
  },
  {
    name: 'delete confirmation',
    open: async page => {
      await openMessageMenu(page, OUTGOING);
      await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
    },
    close: async page => page.getByRole('button', { name: 'Cancel', exact: true }).click(),
    tokens: ['--cometchat-error-color', '--cometchat-font-button-medium', '--cometchat-font-heading2-medium', '--cometchat-spacing'],
  },
  {
    name: 'new-messages divider',
    open: async page => {
      await openMessageMenu(page, FORMATTED);
      await page.getByRole('menuitem', { name: 'Mark Unread', exact: true }).click();
      await expect(page.locator('.cometchat-message-list__new-message-divider').first()).toBeVisible({ timeout: 10_000 });
    },
    close: nothing,
    tokens: ['--cometchat-padding-7', '--cometchat-spacing-7'],
  },
  {
    name: 'image with no preview, in the viewer',
    open: async page => {
      await messages(page)
        .locator('.cometchat-images-bubble__image-wrapper')
        .filter({ has: page.locator('.cometchat-images-bubble__unsupported') })
        .first()
        .click();
      await expect(page.locator('.cometchat-fullscreen-viewer__unsupported-state').first()).toBeVisible({ timeout: 10_000 });
    },
    close: nothing,
    tokens: [
      '--cometchat-padding-8',
      '--cometchat-primary-button-icon',
      '--cometchat-spacing-8',
      '--cometchat-static-white-70',
    ],
  },
  {
    name: "the viewer's download button held down",
    open: async page => {
      await page.locator('.cometchat-fullscreen-viewer__unsupported-download').first().hover();
      await page.mouse.down();
    },
    close: async page => {
      // Released away from the button, so it doesn't download.
      await page.mouse.move(0, 0);
      await page.mouse.up();
      await page.keyboard.press('Escape');
      await expect(page.locator('.cometchat-fullscreen-viewer__unsupported-state')).toHaveCount(0, { timeout: 5_000 });
    },
    tokens: ['--cometchat-extended-primary-color-900'],
  },
  {
    name: 'pinned messages',
    open: openPinnedPanel,
    tokens: ['--cometchat-icon-color-tertiary', '--cometchat-margin-4'],
  },
  {
    name: 'search',
    open: async page => {
      await page.locator('.cometchat-messages-wrapper .cometchat-message-header__overflow-menu button').first().click();
      await page.getByRole('menuitem', { name: 'Search', exact: true }).click();
    },
    tokens: ['--cometchat-font-heading4-regular'],
  },
  {
    name: 'search for photos, still loading',
    open: async (page, chat) => {
      await page.locator('.cometchat-messages-wrapper .cometchat-message-header__overflow-menu button').first().click();
      await page.getByRole('menuitem', { name: 'Search', exact: true }).click();
      await page.route(PHOTOS_SEARCH, route => {
        chat.held.push(route);
      });
      await page.locator('.cometchat-search__body-filter').filter({ hasText: 'Photos' }).first().click();
      await expect(page.locator('.cometchat-search__shimmer').first()).toBeVisible({ timeout: 10_000 });
      await page.mouse.move(0, 0);
    },
    close: async (page, chat) => {
      await page.unroute(PHOTOS_SEARCH);
      await release(chat);
      await page.keyboard.press('Escape');
    },
    tokens: ['--cometchat-neutral-color-800', '--cometchat-shimmer-gradient-color'],
  },
  {
    name: 'group details',
    open: async page => {
      await page.locator('.cometchat-message-header__title, .cometchat-message-header .cometchat-avatar').first().click();
      await expect(page.locator('.side-component-wrapper').first()).toBeVisible({ timeout: 5_000 });
    },
    close: nothing,
    tokens: ['--cometchat-font-caption2-medium', '--cometchat-font-heading3-medium'],
  },
  {
    name: 'add members, one selected',
    open: async page => {
      await page.locator('.side-component-content__action-item').filter({ hasText: 'Add Members' }).first().click();
      const user = page.locator('.cometchat-add-members-overlay .cometchat-users__item').first();
      await expect(user).toBeVisible({ timeout: 20_000 });
      await user.click();
      await expect(page.locator('.cometchat-add-members-overlay .cometchat-users__item--selected').first()).toBeVisible();
      await page.mouse.move(0, 0);
    },
    close: async page => {
      await page.locator('.cometchat-add-members__back-button').first().click();
      await page.locator('.side-component-header__icon').first().click();
      await expect(page.locator('.side-component-wrapper')).toHaveCount(0, { timeout: 5_000 });
    },
    tokens: ['--cometchat-extended-primary-color-50'],
  },
  {
    name: 'narrow window',
    open: async (page, chat) => {
      await page.setViewportSize({ width: 700, height: chat.viewport.height });
      await expect(messages(page).locator('.cometchat-images-bubble__overflow-text').first()).toBeVisible();
    },
    close: nothing,
    tokens: ['--cometchat-font-heading2-bold'],
  },
  {
    name: 'phone-width window',
    open: async (page, chat) => {
      await page.setViewportSize({ width: 400, height: chat.viewport.height });
      await expect(messages(page).locator('.cometchat-videos-bubble__tile--unsupported').first()).toBeVisible();
    },
    close: async (page, chat) => page.setViewportSize(chat.viewport),
    tokens: ['--cometchat-videos-bubble-single-tile-min-width'],
  },
  {
    name: 'outgoing call',
    open: async page => startCall(page, (await getUserName(SECONDARY_USER)) ?? SECONDARY_USER),
    close: nothing,
    tokens: ['--cometchat-font-title-medium'],
  },
  {
    name: 'outgoing call on a phone',
    open: async (page, chat) => page.setViewportSize({ width: 500, height: chat.viewport.height }),
    close: async (page, chat) => {
      await page.setViewportSize(chat.viewport);
      await page.locator('.cometchat-outgoing-call button').last().click();
    },
    tokens: [
      '--cometchat-margin-10',
      '--cometchat-spacing-10',
      '--cometchat-spacing-15',
      '--cometchat-spacing-20',
    ],
  },
];

const softly = expect.configure({ soft: true, timeout: 10_000 });

test('every listed theme token changes the screen that uses it', async ({ page }) => {
  test.setTimeout(600_000);
  const group = await createThrowawayGroup({ name: `E2E Token Effects ${String(Date.now())}`, owner: PRIMARY_USER, members: [SECONDARY_USER] });
  const voter = await createThrowawayUser({ name: `E2E Token Voter ${String(Date.now())}` });
  try {
    const incomingId = await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: INCOMING });
    await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: `${FORMATTED} \`inline code\`` });
    // A message that is a single emoji shows it large.
    await sendMessageToGroup({ guid: group.guid, as: SECONDARY_USER, text: '🎉' });
    await sendMessageToGroup({ guid: group.guid, as: PRIMARY_USER, text: OUTGOING });
    // A group call started by the logged-in user, shown with a Join button.
    await sendToGroup(group.guid, PRIMARY_USER, {
      category: 'custom',
      type: 'meeting',
      data: { customData: { callType: 'video', sessionID: `e2e-token-${String(Date.now())}` } },
    });
    await addReaction(incomingId, '👍', PRIMARY_USER);
    // Read by everyone else, so the outgoing messages show the "seen" receipt.
    await markGroupRead(group.guid, SECONDARY_USER);
    await page.route(`${BROKEN_MEDIA}/**`, route => route.abort());
    await loginToApp(page);
    await selectGroupByName(page, group.name);
    await waitForChatOpen(page, group.name, { expectMessages: true });
    // A pointer left over an element would hold its hover style while tokens are compared.
    await page.mouse.move(0, 0);

    const chat: Chat = {
      guid: group.guid,
      name: group.name,
      voter: voter.uid,
      viewport: page.viewportSize() ?? { width: 1600, height: 900 },
      held: [],
    };
    for (const screen of SCREENS) {
      await test.step(screen.name, async () => {
        await screen.open(page, chat);
        for (const token of screen.tokens) {
          // Polled: part of a screen can still be loading when it opens.
          await softly
            .poll(async () => (await tokenEffect(page, token)).changed, {
              message: `${token} changed nothing on the ${screen.name} screen`,
            })
            .toBe(true);
        }
        await (screen.close ?? (p => p.keyboard.press('Escape')))(page, chat);
      });
    }
  } finally {
    await group.dispose();
    await voter.dispose();
  }
});
