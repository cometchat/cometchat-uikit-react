/**
 * SDK extension constants for polls and stickers features.
 * Shared between plugin logic and presentational components.
 */

/** SDK extension keys for the polls feature. */
export const POLLS_CONSTANTS = Object.freeze({
  /** Custom message type for poll messages. */
  messageType: 'extension_poll',
  /** Extension name for SDK calls. */
  extensionName: 'polls',
  /** HTTP method for poll API calls. */
  postMethod: 'POST',
  /** API endpoint for creating polls. */
  createEndpoint: 'v2/create',
  /** API endpoint for voting on polls. */
  voteEndpoint: 'v2/vote',
  /** Metadata key for injected data. */
  injectedKey: '@injected',
  /** Metadata key for extensions. */
  extensionsKey: 'extensions',
  /** Metadata key for polls data. */
  pollsKey: 'polls',
});

/** SDK extension keys for the stickers feature. */
export const STICKERS_CONSTANTS = Object.freeze({
  /** Custom message type for sticker messages. */
  messageType: 'extension_sticker',
  /** Extension name for SDK calls. */
  extensionName: 'stickers',
  /** HTTP method for fetching stickers. */
  fetchMethod: 'GET',
  /** API endpoint for fetching stickers. */
  fetchEndpoint: 'v1/fetch',
  /** Custom data key for sticker URL. */
  stickerUrlKey: 'sticker_url',
  /** Custom data key for sticker name. */
  stickerNameKey: 'sticker_name',
});
