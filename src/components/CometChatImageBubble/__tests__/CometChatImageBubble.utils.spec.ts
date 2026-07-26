import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { extractImageAttachments, extractCaption } from '../CometChatImageBubble.utils';

// Mock message factory — mirrors the shape extractImageAttachments/extractCaption read.
function mockMediaMessage(
  overrides: Partial<{
    attachments: { getUrl: () => string; getSize: () => number | undefined }[] | null;
    caption: string;
    data: unknown;
    metadata: Record<string, unknown> | null;
  }> = {}
) {
  const attachments =
    overrides.attachments === undefined
      ? [{ getUrl: () => 'https://example.com/image1.jpg', getSize: () => 204800 }]
      : overrides.attachments;

  return {
    getAttachments: () => attachments,
    getCaption: () => overrides.caption ?? '',
    getData: () =>
      overrides.data === undefined ? { text: overrides.caption ?? '' } : overrides.data,
    getMetadata: () => overrides.metadata ?? {},
  } as unknown as CometChat.BaseMessage;
}

describe('extractImageAttachments', () => {
  it('extracts attachments from the message', () => {
    const result = extractImageAttachments(mockMediaMessage());
    expect(result).toHaveLength(1);
    expect(result[0]?.url).toBe('https://example.com/image1.jpg');
  });

  it('extracts size from the attachment', () => {
    const result = extractImageAttachments(mockMediaMessage());
    expect(result[0]?.size).toBe(204800);
  });

  it('returns empty array when there are no attachments', () => {
    const result = extractImageAttachments(mockMediaMessage({ attachments: [] }));
    expect(result).toHaveLength(0);
  });

  it('handles null attachments', () => {
    const result = extractImageAttachments(mockMediaMessage({ attachments: null }));
    expect(result).toHaveLength(0);
  });

  it('returns only the first attachment (multi-attachment handled by CometChatImagesBubble)', () => {
    const result = extractImageAttachments(
      mockMediaMessage({
        attachments: [
          { getUrl: () => 'https://example.com/img1.jpg', getSize: () => 100 },
          { getUrl: () => 'https://example.com/img2.jpg', getSize: () => 300 },
        ],
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.url).toBe('https://example.com/img1.jpg');
  });

  it('returns empty when the first attachment has no URL', () => {
    const result = extractImageAttachments(
      mockMediaMessage({
        attachments: [{ getUrl: () => '', getSize: () => 200 }],
      })
    );
    expect(result).toHaveLength(0);
  });

  it('returns a placeholder attachment for a pending message with file metadata', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = extractImageAttachments(
      mockMediaMessage({ attachments: null, metadata: { file } })
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.url).toBe('');
  });
});

describe('extractCaption', () => {
  it('extracts caption from getCaption()', () => {
    const result = extractCaption(mockMediaMessage({ caption: 'Beautiful sunset' }));
    expect(result).toBe('Beautiful sunset');
  });

  it('returns empty string when there is no caption', () => {
    const result = extractCaption(mockMediaMessage({ caption: '', data: {} }));
    expect(result).toBe('');
  });

  it('falls back to getData().text when getCaption() is empty', () => {
    const result = extractCaption(
      mockMediaMessage({ caption: '', data: { text: 'Caption from data' } })
    );
    expect(result).toBe('Caption from data');
  });

  it('ignores whitespace-only captions', () => {
    const result = extractCaption(mockMediaMessage({ caption: '   ', data: {} }));
    expect(result).toBe('');
  });
});
