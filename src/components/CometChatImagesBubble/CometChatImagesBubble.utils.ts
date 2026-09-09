import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatImagesBubbleAttachment,
  CometChatImagesBubbleLayoutType,
} from './CometChatImagesBubble.types';

/**
 * Extract image attachments from a MediaMessage.
 * Filters out attachments without a valid URL.
 * For optimistic (pending) messages, returns a placeholder attachment with empty URL.
 */
export function extractImageAttachments(
  message: CometChat.BaseMessage
): CometChatImagesBubbleAttachment[] {
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    // Runtime: getAttachments() may return null despite SDK types saying Attachment[]
    const attachments = mediaMessage.getAttachments() as unknown as
      | CometChat.Attachment[]
      | null
      | undefined;

    if (attachments && attachments.length > 0) {
      const result: CometChatImagesBubbleAttachment[] = [];
      for (const att of attachments) {
        const url = att.getUrl();
        if (url.length > 0) {
          const entry: CometChatImagesBubbleAttachment = { url };
          const size = att.getSize();
          if (size) entry.size = size;
          const name = typeof att.getName === 'function' ? att.getName() : undefined;
          if (name) entry.name = name;
          result.push(entry);
        }
      }
      return result;
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

/**
 * Determine layout type and overflow count from attachment count.
 *
 * Layout rules (R5.2):
 * - N=1 -> full-width single image
 * - N=2 -> side-by-side (two columns)
 * - N=3 -> large image on top + 2 below
 * - N=4 -> 2x2 grid
 * - N>=5 -> 2x2 grid with +N overlay on the 4th cell
 */
export function determineLayout(count: number): {
  layoutType: CometChatImagesBubbleLayoutType;
  overflowCount: number;
} {
  if (count <= 1) return { layoutType: 'single', overflowCount: 0 };
  if (count <= 3) return { layoutType: 'grid', overflowCount: 0 };
  if (count === 4) return { layoutType: 'grid-2x2', overflowCount: 0 };
  return { layoutType: 'overflow', overflowCount: count - 4 };
}
