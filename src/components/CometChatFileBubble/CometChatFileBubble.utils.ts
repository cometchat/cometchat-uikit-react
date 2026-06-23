import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatFileBubbleAttachment } from './CometChatFileBubble.types';

/**
 * Extraction helpers for CometChatFileBubble.
 *
 * These pull file attachments and caption text directly off the SDK message so the
 * bubble is self-extracting (usable standalone, no plugin). Each guards against
 * pending messages (not yet uploaded) and malformed data.
 */

/**
 * Extract the list of file attachments from a media message.
 *
 * Falls back to message metadata/data for pending messages that have no
 * uploaded attachments yet.
 */
export function extractFileAttachments(
  message: CometChat.BaseMessage
): CometChatFileBubbleAttachment[] {
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    const rawAttachments: unknown = mediaMessage.getAttachments();

    // If no attachments array (pending message), try to extract from metadata file
    if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) {
      return extractFromMetadata(mediaMessage);
    }

    return (rawAttachments as unknown[])
      .filter(
        (att): att is Record<string, unknown> =>
          att != null &&
          typeof att === 'object' &&
          typeof (
            (att as Record<string, unknown>).url ?? (att as Record<string, unknown>).getUrl
          ) !== 'undefined'
      )
      .map(att => {
        const url =
          (typeof att.url === 'string' ? att.url : '') ||
          (typeof att.getUrl === 'function' ? String((att.getUrl as () => unknown)()) : '');

        const name =
          (typeof att.name === 'string' ? att.name : '') ||
          (typeof att.getName === 'function' ? String((att.getName as () => unknown)()) : 'File');
        const mimeType =
          (typeof att.mimeType === 'string' ? att.mimeType : '') ||
          (typeof att.getMimeType === 'function'
            ? String((att.getMimeType as () => unknown)())
            : 'application/octet-stream');
        const extension =
          (typeof att.extension === 'string' ? att.extension : '') ||
          (typeof att.getExtension === 'function'
            ? String((att.getExtension as () => unknown)())
            : '');
        const rawSize =
          att.size ?? (typeof att.getSize === 'function' ? (att.getSize as () => unknown)() : 0);
        const size = typeof rawSize === 'number' ? rawSize : 0;

        return { name, url, mimeType, extension, size } satisfies CometChatFileBubbleAttachment;
      });
  } catch {
    return [];
  }
}

/**
 * For pending messages (not yet uploaded), extract file info from metadata.
 * The composer stores the File object in metadata.file.
 */
function extractFromMetadata(
  mediaMessage: CometChat.MediaMessage
): CometChatFileBubbleAttachment[] {
  try {
    const metadata = mediaMessage.getMetadata() as Record<string, unknown> | null;
    if (metadata && metadata.file instanceof File) {
      const file = metadata.file;
      return [
        {
          url: '',
          name: file.name,
          size: file.size,
          extension: file.name.split('.').pop() ?? '',
          mimeType: file.type || 'application/octet-stream',
        },
      ];
    }

    // Also try extracting from the message data (SDK may store file info there)
    const data = mediaMessage.getData() as Record<string, unknown> | null;
    if (data) {
      const name = typeof data.name === 'string' ? data.name : '';
      const size = typeof data.size === 'number' ? data.size : 0;
      if (name || size > 0) {
        return [
          {
            url: '',
            name: name || 'File',
            size,
            extension: name ? (name.split('.').pop() ?? '') : '',
            mimeType: typeof data.type === 'string' ? data.type : 'application/octet-stream',
          },
        ];
      }
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Extract the caption text from a media message.
 *
 * Prefers `getCaption()`, falling back to the `text` field of the message data.
 */
export function extractFileCaption(message: CometChat.BaseMessage): string {
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
