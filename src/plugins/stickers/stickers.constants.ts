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
