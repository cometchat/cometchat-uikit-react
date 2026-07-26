/**
 * Batch adjacency utilities for multi-attachment message grouping.
 *
 * A batch is a set of consecutive messages sharing the same `batchId` in metadata.
 * The position within a batch determines which chrome (avatar, sender name, status
 * info) is shown — see design §6 and Requirements 6.1–6.6.
 *
 * @module CometChatBatchUtils
 */
import type { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * The metadata key used for batchId. Matches the value in CometChatUIKitConstants.MetadataKeys.batchId.
 * Duplicated here to avoid importing the full CometChatUIKitConstants class (which triggers
 * SDK enum resolution at module load time and breaks test mocks in files that don't fully mock the SDK).
 */
const BATCH_ID_KEY = 'batchId';

/** Batch position within a multi-attachment batch group. */
export type BatchPosition = 'first' | 'middle' | 'last' | 'single';

/**
 * Reads the `batchId` from a message's metadata, null-guarded.
 * Returns `undefined` if the message has no batchId.
 */
export function getMessageBatchId(
  message: CometChat.BaseMessage | undefined | null
): string | undefined {
  try {
    const mediaMessage = message as CometChat.MediaMessage | null | undefined;
    if (mediaMessage == null || typeof mediaMessage.getMetadata !== 'function') {
      return undefined;
    }
    const metadata = mediaMessage.getMetadata() as Record<string, unknown> | null | undefined;
    if (!metadata) return undefined;
    const value = metadata[BATCH_ID_KEY];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Computes the batch position of a message given its immediate neighbors.
 *
 * Groups consecutive messages by comparing each message's `batchId` to only its
 * immediate previous and next neighbors (R6.1). The result drives chrome
 * suppression in the renderer:
 *
 * | Position | Avatar+Name | StatusInfo |
 * |----------|-------------|------------|
 * | first    | show        | suppress   |
 * | middle   | suppress    | suppress   |
 * | last     | suppress    | show       |
 * | single   | show        | show       |
 *
 * Voice notes have no batchId → always 'single'.
 */
export function computeBatchPosition(
  prev: CometChat.BaseMessage | undefined | null,
  current: CometChat.BaseMessage | undefined | null,
  next: CometChat.BaseMessage | undefined | null
): BatchPosition {
  const id = getMessageBatchId(current);
  if (!id) return 'single';

  const matchesPrev = id === getMessageBatchId(prev);
  const matchesNext = id === getMessageBatchId(next);

  if (matchesPrev && matchesNext) return 'middle';
  if (matchesNext) return 'first';
  if (matchesPrev) return 'last';
  return 'single';
}
