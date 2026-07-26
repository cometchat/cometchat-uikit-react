import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatAudiosBubbleAttachment } from './CometChatAudiosBubble.types';

/**
 * Extract audio attachments from a MediaMessage.
 *
 * Prefers `getAttachments()` for confirmed messages. Falls back to the
 * `metadata.file` (a File) for optimistic/in-progress messages.
 */
export function extractAudioAttachments(
  message: CometChat.BaseMessage
): CometChatAudiosBubbleAttachment[] {
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    const rawAttachments: unknown = mediaMessage.getAttachments();

    if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
      const result: CometChatAudiosBubbleAttachment[] = [];

      for (const raw of rawAttachments as unknown[]) {
        if (raw == null || typeof raw !== 'object') continue;
        const att = raw as Record<string, unknown>;

        const url =
          (typeof att.url === 'string' ? att.url : '') ||
          (typeof att.getUrl === 'function' ? String((att.getUrl as () => unknown)()) : '');
        if (!url) continue;

        const name =
          (typeof att.name === 'string' ? att.name : '') ||
          (typeof att.getName === 'function' ? String((att.getName as () => unknown)()) : 'Audio');
        const mimeType =
          (typeof att.mimeType === 'string' ? att.mimeType : '') ||
          (typeof att.getMimeType === 'function'
            ? String((att.getMimeType as () => unknown)())
            : 'audio/mpeg');
        const extension =
          (typeof att.extension === 'string' ? att.extension : '') ||
          (typeof att.getExtension === 'function'
            ? String((att.getExtension as () => unknown)())
            : 'mp3');
        const rawSize =
          att.size ?? (typeof att.getSize === 'function' ? (att.getSize as () => unknown)() : 0);
        const size = typeof rawSize === 'number' ? rawSize : 0;

        // Duration from attachment metadata
        const meta = (
          typeof att.metadata === 'object' && att.metadata != null ? att.metadata : {}
        ) as Record<string, unknown>;
        const duration = typeof meta.duration === 'number' ? meta.duration : undefined;

        const entry: CometChatAudiosBubbleAttachment = { name, url, mimeType, extension, size };
        if (duration != null) entry.duration = duration;
        result.push(entry);
      }

      return result;
    }

    // Fallback for optimistic messages
    const metadata = mediaMessage.getMetadata() as Record<string, unknown> | undefined;
    if (metadata?.file && metadata.file instanceof File) {
      const file = metadata.file;
      return [
        {
          name: (metadata.fileName as string | undefined) ?? file.name,
          url: '',
          mimeType: (metadata.fileType as string | undefined) ?? (file.type || 'audio/mpeg'),
          extension: file.name.split('.').pop() ?? 'mp3',
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
 * Extract caption text from a MediaMessage.
 * Tries getCaption() first, then getData()?.text as fallback.
 */
export function extractAudioCaption(message: CometChat.BaseMessage): string {
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
