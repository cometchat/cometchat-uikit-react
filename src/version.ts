/**
 * The package version, in one place.
 *
 * Its own module rather than `index.ts` so `CometChatUIKit` can import it without a cycle —
 * `index.ts` re-exports `CometChatUIKit`.
 */
export const VERSION = '7.2.3';

/** What the UI Kit registers on `window.CometChatUiKit` for support and analytics. */
export const UIKIT_METADATA = {
  name: '@cometchat/chat-uikit-react',
  version: VERSION,
} as const;
