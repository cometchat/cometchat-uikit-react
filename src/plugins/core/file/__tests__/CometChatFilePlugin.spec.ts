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

    it('returns element with correct type', () => {
      const result = CometChatFilePlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.type?.displayName).toBe('CometChatFileBubble');
    });

    it('passes outgoing variant for right alignment', () => {
      const result = CometChatFilePlugin.renderBubble(
        mockMediaMessage(),
        mockContext('right')
      ) as any;
      expect(result.props.variant).toBe('outgoing');
    });

    it('passes incoming variant for left alignment', () => {
      const result = CometChatFilePlugin.renderBubble(
        mockMediaMessage(),
        mockContext('left')
      ) as any;
      expect(result.props.variant).toBe('incoming');
    });

    it('extracts attachments from message', () => {
      const result = CometChatFilePlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.attachments).toHaveLength(1);
      expect(result.props.attachments[0].name).toBe('doc.pdf');
    });

    it('extracts caption', () => {
      const msg = mockMediaMessage({ caption: 'Check this file' });
      const result = CometChatFilePlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.caption).toBe('Check this file');
    });

    it('omits caption when empty', () => {
      const result = CometChatFilePlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.caption).toBeUndefined();
    });

    it('handles empty attachments', () => {
      const msg = mockMediaMessage({ attachments: [] });
      const result = CometChatFilePlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.attachments).toHaveLength(0);
    });

    it('filters out attachments without URL', () => {
      const msg = mockMediaMessage({
        attachments: [
          {
            name: 'a.pdf',
            url: 'https://example.com/a.pdf',
            mimeType: 'application/pdf',
            extension: 'pdf',
            size: 1024,
          },
          { name: 'b.pdf', mimeType: 'application/pdf', extension: 'pdf', size: 1024 },
        ],
      });
      const result = CometChatFilePlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.attachments).toHaveLength(1);
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
