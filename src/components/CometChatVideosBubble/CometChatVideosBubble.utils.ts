import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type {
  CometChatVideosBubbleAttachment,
  CometChatVideosBubbleLayoutType,
} from './CometChatVideosBubble.types';

/**
 * Extract video attachments from a MediaMessage.
 *
 * Reads the raw attachment objects (url/size/name). Thumbnails are sourced from
 * the `thumbnail-generation` extension in the message `@injected` metadata: its
 * `attachments[]` array is index-aligned with the message attachments and carries
 * a per-video thumbnail set, while the extension's top-level thumbnail is a
 * fallback for the first video only (the SDK Attachment itself carries no
 * thumbnail). Falls back to a placeholder for pending (optimistic) messages.
 */
export function extractVideoAttachments(
  message: CometChat.BaseMessage
): CometChatVideosBubbleAttachment[] {
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    // Runtime: getAttachments() may return null despite SDK types saying Attachment[]
    const attachments = mediaMessage.getAttachments() as unknown as
      | CometChat.Attachment[]
      | null
      | undefined;

    if (attachments && attachments.length > 0) {
      const result: CometChatVideosBubbleAttachment[] = [];

      for (const att of attachments) {
        const url = att.getUrl();
        if (!url) continue;

        const entry: CometChatVideosBubbleAttachment = { url };
        const size = att.getSize();
        if (size) entry.size = size;
        const name = typeof att.getName === 'function' ? att.getName() : undefined;
        if (name) entry.name = name;

        result.push(entry);
      }

      // Thumbnails come from the `thumbnail-generation` extension in @injected
      // metadata. Its `attachments[]` array is index-aligned with the message's
      // attachments, each carrying its own generated thumbnail set. The
      // extension's top-level `url_medium` is the legacy single-attachment
      // thumbnail — used only as a fallback for the first video.
      try {
        const msgMetadata = mediaMessage.getMetadata() as Record<string, unknown> | null;
        const injected = msgMetadata?.['@injected'] as Record<string, unknown> | undefined;
        const ext = injected?.extensions as Record<string, unknown> | undefined;
        const thumbGen = ext?.['thumbnail-generation'] as Record<string, unknown> | undefined;

        if (thumbGen) {
          const thumbAttachments = thumbGen.attachments as
            | { data?: { thumbnails?: Record<string, unknown> } }[]
            | undefined;

          // Per-attachment thumbnails (index-aligned with the message attachments).
          if (Array.isArray(thumbAttachments)) {
            result.forEach((entry, i) => {
              const thumbUrl = thumbAttachments[i]?.data?.thumbnails?.url_medium;
              if (typeof thumbUrl === 'string' && thumbUrl.length > 0) {
                entry.thumbnail = thumbUrl;
              }
            });
          }

          // Fallback for the first video only: the extension's top-level thumbnail.
          const first = result[0];
          const topLevelThumb = thumbGen.url_medium;
          if (
            first &&
            !first.thumbnail &&
            typeof topLevelThumb === 'string' &&
            topLevelThumb.length > 0
          ) {
            first.thumbnail = topLevelThumb;
          }
        }
      } catch {
        // ignore — thumbnails are optional
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
export function extractVideoCaption(message: CometChat.BaseMessage): string {
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    const text = mediaMessage.getCaption();
    if (text.trim().length > 0) return text;

    const data: unknown = mediaMessage.getData();
    if (
      data != null &&
      typeof data === 'object' &&
      typeof (data as Record<string, unknown>).text === 'string'
    ) {
      const dataText = (data as Record<string, unknown>).text as string;
      if (dataText.trim().length > 0) return dataText;
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
 * - N=1 -> full-width single video
 * - N=2 -> side-by-side (two columns)
 * - N=3 -> large on top + 2 below
 * - N=4 -> 2x2 grid
 * - N>=5 -> 2x2 grid with +N overlay on the 4th cell
 */
export function determineLayout(count: number): {
  layoutType: CometChatVideosBubbleLayoutType;
  overflowCount: number;
} {
  if (count <= 1) return { layoutType: 'single', overflowCount: 0 };
  if (count <= 3) return { layoutType: 'grid', overflowCount: 0 };
  if (count === 4) return { layoutType: 'grid-2x2', overflowCount: 0 };
  return { layoutType: 'overflow', overflowCount: count - 4 };
}
