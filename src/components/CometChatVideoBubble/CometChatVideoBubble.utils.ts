import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatVideoBubbleAttachment } from './CometChatVideoBubble.types';

/**
 * Extract video attachments from a MediaMessage.
 *
 * Reads the raw attachment objects (url/thumbnail/metadata properties), pulls a
 * thumbnail from the `thumbnail-generation` extension when the attachment lacks one,
 * and falls back to a blob URL from a pending (optimistic) File in metadata.
 */
export function extractVideoAttachments(
  message: CometChat.MediaMessage | undefined
): CometChatVideoBubbleAttachment[] {
  if (!message) return [];
  try {
    const rawAttachments: unknown = message.getAttachments();

    if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
      const attachments = (rawAttachments as unknown[])
        .filter(
          (att): att is Record<string, unknown> =>
            att != null &&
            typeof att === 'object' &&
            typeof (att as Record<string, unknown>).url === 'string'
        )
        .map(att => {
          const metadata = (
            typeof att.metadata === 'object' && att.metadata != null ? att.metadata : {}
          ) as Record<string, unknown>;
          const result: CometChatVideoBubbleAttachment = {
            url: att.url as string,
          };
          if (typeof att.thumbnail === 'string') result.thumbnail = att.thumbnail;
          if (typeof metadata.duration === 'number') result.duration = metadata.duration;
          if (typeof metadata.width === 'number') result.width = metadata.width;
          if (typeof metadata.height === 'number') result.height = metadata.height;
          if (typeof metadata.size === 'number') result.size = metadata.size;
          if (typeof metadata.mimeType === 'string') result.mimeType = metadata.mimeType;
          return result;
        })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        .filter((att): att is CometChatVideoBubbleAttachment => att != null);

      if (attachments.length > 0) {
        const firstAttachment = attachments[0];
        // Fallback: check @injected metadata for thumbnail-generation extension
        if (firstAttachment && firstAttachment.thumbnail === undefined) {
          try {
            const msgMetadata = message.getMetadata() as Record<string, unknown> | null;
            if (msgMetadata) {
              const injected = msgMetadata['@injected'] as Record<string, unknown> | undefined;
              const ext = injected?.extensions as Record<string, unknown> | undefined;
              const thumbGen = ext?.['thumbnail-generation'] as Record<string, unknown> | undefined;
              const thumbUrl = thumbGen?.url_medium;
              if (typeof thumbUrl === 'string') {
                firstAttachment.thumbnail = thumbUrl;
              }
            }
          } catch {
            // ignore — thumbnail is optional
          }
        }
        return attachments;
      }
    }

    // Fallback for optimistic (pending) messages: use blob URL from File in metadata
    const msgMetadata = message.getMetadata() as Record<string, unknown> | null;
    if (msgMetadata && msgMetadata.file instanceof File) {
      const file = msgMetadata.file;
      return [
        {
          url: URL.createObjectURL(file),
          isPlaceholder: true,
        },
      ];
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
export function extractVideoCaption(message: CometChat.MediaMessage | undefined): string {
  if (!message) return '';
  try {
    const text = message.getCaption();
    if (text.trim().length > 0) return text;

    const data: unknown = message.getData();
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

/** Extract the sender's display name for aria-labels. */
export function extractVideoSenderName(message: CometChat.MediaMessage | undefined): string {
  if (!message) return '';
  try {
    // getSender() can be undefined at runtime for malformed messages despite SDK types.
    const sender = message.getSender() as CometChat.User | undefined;
    return sender ? sender.getName() : '';
  } catch {
    return '';
  }
}
