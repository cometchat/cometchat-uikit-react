/**
 * Shared Extension URL Extractor
 */

import type { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Extracts a URL from a CometChat message's extension metadata.
 * Path: `@injected -> extensions -> extensionKey -> urlKey`
 */
export function extractExtensionUrl(
  message: CometChat.BaseMessage | null | undefined,
  extensionKey: string,
  urlKey: string
): string {
  if (!message) return '';

  try {
    const metadata = (message as CometChat.CustomMessage).getMetadata() as Record<
      string,
      unknown
    > | null;
    if (!metadata || typeof metadata !== 'object') return '';

    const injected = metadata['@injected'] as Record<string, unknown> | undefined;
    if (!injected || typeof injected !== 'object') return '';

    const extensions = injected.extensions as Record<string, unknown> | undefined;
    if (!extensions || typeof extensions !== 'object') return '';

    const extension = extensions[extensionKey] as Record<string, unknown> | undefined;
    if (!extension || typeof extension !== 'object') return '';

    const url = extension[urlKey];
    if (!url || typeof url !== 'string') return '';

    return url;
  } catch {
    return '';
  }
}
