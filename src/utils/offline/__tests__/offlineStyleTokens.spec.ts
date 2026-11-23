/**
 * README §4: the offline states have style tokens. Each is optional and falls
 * back to today's look, so theming them is additive and nothing changes when
 * they are unset.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(__dirname, '../../..', path), 'utf8');
const compact = (css: string) => css.replace(/\s+/g, ' ');

const TOKENS: Record<string, [token: string, fallback: string][]> = {
  'components/CometChatMessageBubble/CometChatMessageBubble.css': [
    ['--cometchat-message-bubble-offline-retry-color', '--cometchat-error-color'],
    ['--cometchat-message-bubble-offline-retry-font', '--cometchat-font-caption1-regular'],
    ['--cometchat-message-bubble-offline-retry-focus-outline-color', '--cometchat-primary-color'],
    ['--cometchat-message-bubble-offline-failed-icon-color', '--cometchat-error-color'],
  ],
  'components/CometChatMessageList/CometChatMessageList.css': [
    ['--cometchat-message-list-offline-footer-color', '--cometchat-text-color-highlight'],
    ['--cometchat-message-list-offline-footer-font', '--cometchat-font-caption1-regular'],
    ['--cometchat-message-list-offline-notice-background', '--cometchat-neutral-color-300'],
    ['--cometchat-message-list-offline-notice-color', '--cometchat-text-color-secondary'],
    ['--cometchat-message-list-offline-notice-font', '--cometchat-font-caption1-regular'],
  ],
  'components/CometChatConversations/CometChatConversations.css': [
    ['--cometchat-conversations-offline-notice-background', '--cometchat-neutral-color-300'],
    ['--cometchat-conversations-offline-notice-color', '--cometchat-text-color-secondary'],
    ['--cometchat-conversations-offline-notice-font', '--cometchat-font-caption1-regular'],
  ],
  'utils/offline/OfflineMediaUnavailable.css': [
    ['--cometchat-offline-media-unavailable-background', '--cometchat-neutral-color-300'],
    ['--cometchat-offline-media-unavailable-color', '--cometchat-text-color-secondary'],
    ['--cometchat-offline-media-unavailable-font', '--cometchat-font-caption1-regular'],
  ],
};

describe('offline style tokens (README §4)', () => {
  for (const [file, tokens] of Object.entries(TOKENS)) {
    it.each(tokens)(`${file}: %s falls back to %s`, (token, fallback) => {
      expect(compact(read(file))).toMatch(new RegExp(`var\\( ?${token}, ?var\\( ?${fallback}\\b`));
    });
  }

  it('the "Connect to load older messages" footer starts below the floating date', () => {
    const css = compact(read('components/CometChatMessageList/CometChatMessageList.css'));
    // The floating date sits at top: padding-2 and is ~24px tall; the footer clears both.
    expect(css).toContain(
      '.cometchat-message-list__scroll-wrapper:has(> .cometchat-message-list__floating-date) .cometchat-message-list__offline-footer { padding-top: calc(var(--cometchat-padding-2, 8px) + 24px + var(--cometchat-padding-1, 4px));'
    );
    expect(css).toMatch(
      /\.cometchat-message-list__floating-date \{[^}]*top: var\(--cometchat-padding-2, 8px\);/
    );
  });

  it('the failed-row tint is transparent unless a theme sets it', () => {
    expect(compact(read('components/CometChatMessageBubble/CometChatMessageBubble.css'))).toContain(
      'var(--cometchat-message-bubble-offline-failed-tint, transparent)'
    );
  });
});
