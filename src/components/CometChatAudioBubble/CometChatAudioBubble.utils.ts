import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatAudioBubbleAttachment } from './CometChatAudioBubble.types';

/**
 * Extract audio attachments from a MediaMessage.
 *
 * Prefers `getAttachments()` for confirmed messages. Falls back to the
 * `metadata.file` (a File) for optimistic/in-progress messages, creating an
 * object URL so the just-recorded/selected audio plays before upload completes.
 */
export function extractAudioAttachments(
  message: CometChat.BaseMessage | undefined
): CometChatAudioBubbleAttachment[] {
  if (!message) return [];
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    const rawAttachments: unknown = mediaMessage.getAttachments();

    // If getAttachments() returns data, use it (confirmed messages)
    // Only use the first attachment — multi-attachment rendering is handled by CometChatAudiosBubble
    if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
      const firstRaw = (rawAttachments as unknown[]).find(
        (att): att is Record<string, unknown> =>
          att != null &&
          typeof att === 'object' &&
          typeof (
            (att as Record<string, unknown>).url ?? (att as Record<string, unknown>).getUrl
          ) !== 'undefined'
      );

      if (firstRaw) {
        const url =
          (typeof firstRaw.url === 'string' ? firstRaw.url : '') ||
          (typeof firstRaw.getUrl === 'function'
            ? String((firstRaw.getUrl as () => unknown)())
            : '');
        if (url) {
          const name =
            (typeof firstRaw.name === 'string' ? firstRaw.name : '') ||
            (typeof firstRaw.getName === 'function'
              ? String((firstRaw.getName as () => unknown)())
              : 'Audio');
          const mimeType =
            (typeof firstRaw.mimeType === 'string' ? firstRaw.mimeType : '') ||
            (typeof firstRaw.getMimeType === 'function'
              ? String((firstRaw.getMimeType as () => unknown)())
              : 'audio/mpeg');
          const extension =
            (typeof firstRaw.extension === 'string' ? firstRaw.extension : '') ||
            (typeof firstRaw.getExtension === 'function'
              ? String((firstRaw.getExtension as () => unknown)())
              : 'mp3');
          const rawSize =
            firstRaw.size ??
            (typeof firstRaw.getSize === 'function' ? (firstRaw.getSize as () => unknown)() : 0);
          const size = typeof rawSize === 'number' ? rawSize : 0;

          return [
            { name, url, mimeType, extension, size } satisfies CometChatAudioBubbleAttachment,
          ];
        }
      }
      return [];
    }

    // Fallback for optimistic (in-progress) messages: extract file from metadata
    const metadata = mediaMessage.getMetadata() as Record<string, unknown> | undefined;
    if (metadata?.file && metadata.file instanceof File) {
      const file = metadata.file;
      const url = URL.createObjectURL(file);
      return [
        {
          name: (metadata.fileName as string | undefined) ?? file.name,
          url,
          mimeType: (metadata.fileType as string | undefined) ?? (file.type || 'audio/webm'),
          extension: file.name.split('.').pop() ?? 'webm',
          size: typeof metadata.fileSize === 'number' ? metadata.fileSize : file.size,
        },
      ];
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Extract the caption from a MediaMessage.
 * Prefers `getCaption()`, falling back to `getData().text`.
 */
export function extractAudioCaption(message: CometChat.BaseMessage | undefined): string {
  if (!message) return '';
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
