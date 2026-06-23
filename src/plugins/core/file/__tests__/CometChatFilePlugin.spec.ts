import { describe, it, expect } from 'vitest';
import { CometChatFilePlugin } from '../CometChatFilePlugin';

function mockMediaMessage(
  overrides: Partial<{
    attachments: unknown[];
    caption: string;
    senderName: string;
  }> = {}
) {
  const attachments = overrides.attachments ?? [
    {
      name: 'doc.pdf',
      url: 'https://example.com/doc.pdf',
      mimeType: 'application/pdf',
      extension: 'pdf',
      size: 2048,
    },
  ];

  return {
    getType: () => 'file',
    getCategory: () => 'message',
    getAttachments: () => attachments,
    getCaption: () => overrides.caption ?? '',
    getData: () => ({ text: overrides.caption ?? '' }),
    getSender: () => ({
      getUid: () => 'user-1',
      getName: () => overrides.senderName ?? 'John Doe',
      getAvatar: () => '',
    }),
    getSentAt: () => Math.floor(Date.now() / 1000),
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getId: () => 1,
    getMuid: () => 'muid-1',
    getMentionedUsers: () => [],
    getMetadata: () => ({}),
  } as any;
}

function mockContext(alignment: 'left' | 'right' = 'right') {
  return {
    loggedInUser: { getUid: () => 'user-1', getName: () => 'Me' } as any,
    alignment,
    theme: 'light' as const,
  };
}

describe('CometChatFilePlugin', () => {
  it('has id "file"', () => {
    expect(CometChatFilePlugin.id).toBe('file');
  });

  it('handles message type "file"', () => {
    expect(CometChatFilePlugin.messageTypes).toContain('file');
  });

  it('handles message category "message"', () => {
    expect(CometChatFilePlugin.messageCategories).toContain('message');
  });

  describe('renderBubble', () => {
    it('returns a React element', () => {
      const result = CometChatFilePlugin.renderBubble(mockMediaMessage(), mockContext());
      expect(result).toBeTruthy();
    });

    it('returns the CometChatFileBubble component', () => {
      const result = CometChatFilePlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.type?.displayName).toBe('CometChatFileBubble');
    });

    it('passes the message through to the bubble', () => {
      const msg = mockMediaMessage();
      const result = CometChatFilePlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.message).toBe(msg);
    });

    it('passes right alignment for right context alignment', () => {
      const result = CometChatFilePlugin.renderBubble(
        mockMediaMessage(),
        mockContext('right')
      ) as any;
      expect(result.props.alignment).toBe('right');
    });

    it('passes left alignment for left context alignment', () => {
      const result = CometChatFilePlugin.renderBubble(
        mockMediaMessage(),
        mockContext('left')
      ) as any;
      expect(result.props.alignment).toBe('left');
    });

    it('passes text formatters to the bubble', () => {
      const result = CometChatFilePlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(Array.isArray(result.props.textFormatters)).toBe(true);
    });

    it('does not pass extracted-data props (extraction moved to the bubble)', () => {
      const result = CometChatFilePlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.attachments).toBeUndefined();
      expect(result.props.caption).toBeUndefined();
      expect(result.props.variant).toBeUndefined();
      expect(result.props.senderName).toBeUndefined();
    });
  });

  describe('getLastMessagePreview', () => {
    it('returns emoji + File text', () => {
      expect(CometChatFilePlugin.getLastMessagePreview?.(mockMediaMessage(), {} as any)).toBe(
        'File'
      );
    });
  });
});
