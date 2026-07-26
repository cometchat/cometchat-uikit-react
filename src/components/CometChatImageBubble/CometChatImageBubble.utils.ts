import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatImageBubbleAttachment } from './CometChatImageBubble.types';

/**
 * Extract image attachments from a MediaMessage.
 * Filters out attachments without a valid URL.
 * For optimistic (pending) messages, returns a placeholder attachment with empty URL.
 */
export function extractImageAttachments(
  message: CometChat.BaseMessage
): CometChatImageBubbleAttachment[] {
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    // Runtime: getAttachments() may return null despite SDK types saying Attachment[]
    const attachments = mediaMessage.getAttachments() as unknown as
      | CometChat.Attachment[]
      | null
      | undefined;

    if (attachments && attachments.length > 0) {
      // Only use the first attachment — multi-attachment rendering is handled by CometChatImagesBubble
      const att = attachments[0];
      if (!att) return [];
      const url = att.getUrl();
      if (url.length > 0) {
        const entry: CometChatImageBubbleAttachment = { url };
        const size = att.getSize();
        if (size) entry.size = size;
        return [entry];
      }
      return [];
    }

    // Pending (optimistic) message — no attachments yet, show placeholder
    const metadata = mediaMessage.getMetadata() as Record<string, unknown> | null;
    if (metadata && metadata.file instanceof File) {
      return [{ url: '' }];
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Extract caption text from a MediaMessage.
 * Tries getCaption() first, then getData()?.text as fallback.
 */
export function extractCaption(message: CometChat.BaseMessage): string {
  try {
    const mediaMessage = message as CometChat.MediaMessage;

    // Try getCaption() — the SDK method for media message captions
    const text = mediaMessage.getCaption();
    if (text.trim().length > 0) {
      return text;
    }

    // Fallback to getData()?.text
    const data: unknown = mediaMessage.getData();
    if (
      data != null &&
      typeof data === 'object' &&
      typeof (data as Record<string, unknown>).text === 'string'
    ) {
      const dataText = (data as Record<string, unknown>).text as string;
      if (dataText.trim().length > 0) {
        return dataText;
      }
    }

    return '';
  } catch {
    return '';
  }
}
