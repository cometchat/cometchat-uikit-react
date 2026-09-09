import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../constants/CometChatUIKitConstants';

/**
 * Metadata helpers for the multi-attachments feature.
 *
 * These read and write the UIKit-owned metadata keys (`batchId`, `audioType`) on
 * SDK messages. All reads are fully null-guarded so they are safe to call on any
 * message (including optimistic/pending or legacy messages) and never throw.
 *
 * All key/value strings flow through {@link CometChatUIKitConstants} — no magic
 * strings.
 */

/** Options accepted by {@link stampBatchMetadata}. */
export interface StampBatchMetadataOptions {
  /** The UIKit-generated grouping id shared across all messages of one send. */
  batchId: string;
  /** Optional audio-type tag (e.g. `voice_note`) for audio messages. */
  audioType?: string;
  /** Optional caption; when provided it is set via `setCaption`. */
  caption?: string;
}

/**
 * Read the raw metadata object off a message, guarded against missing messages
 * and SDK methods. Returns `undefined` when nothing is available.
 */
function readMetadata(
  message: CometChat.BaseMessage | null | undefined
): Record<string, unknown> | undefined {
  try {
    const mediaMessage = message as CometChat.MediaMessage | null | undefined;
    if (mediaMessage == null || typeof mediaMessage.getMetadata !== 'function') {
      return undefined;
    }
    const metadata = mediaMessage.getMetadata() as Record<string, unknown> | null | undefined;
    return metadata ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Read the `batchId` grouping key from a message's metadata.
 *
 * @returns the batchId string, or `undefined` when absent or unreadable.
 */
export function getBatchId(message: CometChat.BaseMessage | null | undefined): string | undefined {
  const value = readMetadata(message)?.[CometChatUIKitConstants.MetadataKeys.batchId];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Read the `audioType` tag from a message's metadata.
 *
 * @returns the audioType string (e.g. `voice_note`), or `undefined` when absent.
 */
export function getAudioType(
  message: CometChat.BaseMessage | null | undefined
): string | undefined {
  const value = readMetadata(message)?.[CometChatUIKitConstants.MetadataKeys.audioType];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Determine whether an audio message should render as a voice note (waveform).
 *
 * True ONLY when the message is explicitly tagged `audioType === "voice_note"`.
 * Absence of `audioType` (attached audio files, legacy/plain audio) means a normal
 * audio bubble — it is NOT treated as a voice note.
 */
export function isVoiceNote(message: CometChat.BaseMessage | null | undefined): boolean {
  try {
    return getAudioType(message) === CometChatUIKitConstants.AudioType.voiceNote;
  } catch {
    return false;
  }
}

/**
 * Stamp batch metadata onto a message, merging into any existing metadata without
 * dropping existing keys (e.g. `file`, `fileName`, `fileType`, `fileSize`,
 * `richText`). Sets the caption via `setCaption` when provided.
 */
export function stampBatchMetadata(
  message: CometChat.BaseMessage,
  { batchId, audioType, caption }: StampBatchMetadataOptions
): void {
  const mediaMessage = message as CometChat.MediaMessage;
  const existing = (mediaMessage.getMetadata() as Record<string, unknown> | null) ?? {};

  const metadata: Record<string, unknown> = {
    ...existing,
    [CometChatUIKitConstants.MetadataKeys.batchId]: batchId,
  };

  if (audioType !== undefined) {
    metadata[CometChatUIKitConstants.MetadataKeys.audioType] = audioType;
  }

  mediaMessage.setMetadata(metadata);

  if (caption !== undefined) {
    mediaMessage.setCaption(caption);
  }
}
