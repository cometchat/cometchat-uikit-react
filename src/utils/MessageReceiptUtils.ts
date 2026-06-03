import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../constants/CometChatUIKitConstants';

/** All possible receipt states a message can be in. */
export type CometChatReceipt = 'wait' | 'sent' | 'delivered' | 'read' | 'error';

/**
 * Compute the receipt state for a message.
 *
 * Priority order:
 *   1. moderationStatus === 'disapproved' → error
 *   2. message.error OR message.metadata.error → error
 *   3. getReadAt() → read
 *   4. getDeliveredAt() → delivered
 *   5. getSentAt() && getId() → sent
 *   6. fallback → wait (optimistic in-flight)
 *
 * Moderation and error cases take precedence over normal delivery state,
 * so a message that was disapproved after being delivered still renders
 * as error — not delivered/read.
 */
export function getReceiptStatus(message: CometChat.BaseMessage): CometChatReceipt {
  // 1. Moderation takes precedence
  if (message instanceof CometChat.TextMessage || message instanceof CometChat.MediaMessage) {
    const moderationStatus = message.getModerationStatus();
    if (moderationStatus === CometChatUIKitConstants.moderationStatus.disapproved) {
      return 'error';
    }
  }

  // 2. Direct error or metadata error (e.g., permission denied from composer's handleSDKError)
  if (hasMessageError(message)) {
    return 'error';
  }

  // 3–5. Normal delivery progression
  if (message.getReadAt()) {
    return 'read';
  }
  if (message.getDeliveredAt()) {
    return 'delivered';
  }
  if (message.getSentAt() && message.getId()) {
    return 'sent';
  }

  // 6. Optimistic message still in flight
  return 'wait';
}

/** Read an error object off either the message or its metadata. */
export function getMessageError(
  message: CometChat.BaseMessage
): { code?: string; message?: string; details?: string } | undefined {
  // Try _ccError (our custom property that bypasses SDK getters)
  const ccError = (message as unknown as { _ccError?: unknown })._ccError;
  if (ccError) return extractErrorFields(ccError);
  // Try direct .error property
  const direct = (message as unknown as { error?: unknown }).error;
  if (direct) return extractErrorFields(direct);
  // Then try metadata.error
  try {
    const meta = (message as unknown as { getMetadata?: () => unknown }).getMetadata?.() as
      | Record<string, unknown>
      | null
      | undefined;
    if (meta?.error) return extractErrorFields(meta.error);
  } catch {
    /* non-fatal */
  }
  return undefined;
}

/** Extract code/message/details from an error object of unknown shape (SDK exception, Error, plain object). */
function extractErrorFields(
  error: unknown
): { code?: string; message?: string; details?: string } | undefined {
  if (!error) return undefined;
  if (typeof error === 'string') return { message: error };
  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    const result: { code?: string; message?: string; details?: string } = {};
    if (obj.code && typeof obj.code === 'string') result.code = obj.code;
    if (obj.message && typeof obj.message === 'string') result.message = obj.message;
    if (obj.details && typeof obj.details === 'string') result.details = obj.details;
    // Some SDK errors nest the code in error.error.code
    if (!result.code && obj.error && typeof obj.error === 'object') {
      const nested = obj.error as Record<string, unknown>;
      if (nested.code && typeof nested.code === 'string') result.code = nested.code;
    }
    if (result.code || result.message) return result;
  }
  return { message: 'Send failed' };
}

export function hasMessageError(message: CometChat.BaseMessage): boolean {
  return Boolean(getMessageError(message));
}

/**
 * Has this message been disapproved by moderation AND belongs to the
 * logged-in user? only surfaces the moderation footer to the sender —
 * other users don't see the message (or see it as plain content).
 */
export function isMessageModerated(
  message: CometChat.BaseMessage,
  loggedInUserUid: string
): boolean {
  if (!(message instanceof CometChat.TextMessage) && !(message instanceof CometChat.MediaMessage)) {
    return false;
  }
  if (message.getModerationStatus() !== CometChatUIKitConstants.moderationStatus.disapproved) {
    return false;
  }
  return message.getSender().getUid() === loggedInUserUid;
}

/**
 * Does this message carry a permission-denied error (from the composer's
 * SDK error handler)? treats this like moderation — shows a footer, red
 * receipt, reduced options.
 *
 * Mirrors v6 getIsPermissionDeniedError exactly.
 */
export function isPermissionDeniedError(
  message: CometChat.BaseMessage,
  loggedInUserUid: string
): boolean {
  if (!(message instanceof CometChat.MediaMessage) && !(message instanceof CometChat.TextMessage)) {
    return false;
  }

  // Read error from multiple sources (v6 pattern)
  const ccError = (message as unknown as { _ccError?: { code?: string } })._ccError;
  const directError = (message as unknown as { error?: { code?: string } }).error;
  const metadata = message.getMetadata() as { error?: { code?: string } } | null | undefined;
  const metadataError = metadata?.error;

  // Try multiple ways to get the error code (v6 pattern)
  let errorCode: string | undefined;
  if (ccError?.code) {
    errorCode = ccError.code;
  } else if (directError?.code) {
    errorCode = directError.code;
  } else if (metadataError) {
    errorCode =
      metadataError.code ?? ((metadataError as Record<string, unknown>).code as string | undefined);
  }

  if (errorCode !== 'ERR_PERMISSION_DENIED' && errorCode !== 'ERR_FILE_TYPE_NOT_ALLOWED') {
    return false;
  }

  // Sender may be undefined for messages that were rejected before reaching the server.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- sender may be unset on optimistic messages
  const senderUid = message.getSender()?.getUid?.();
  return !senderUid || senderUid === loggedInUserUid;
}

/** Is this message still moderating (pending server review)? */
export function isMessagePendingModeration(message: CometChat.BaseMessage): boolean {
  if (!(message instanceof CometChat.TextMessage) && !(message instanceof CometChat.MediaMessage)) {
    return false;
  }
  return message.getModerationStatus() === CometChatUIKitConstants.moderationStatus.pending;
}
