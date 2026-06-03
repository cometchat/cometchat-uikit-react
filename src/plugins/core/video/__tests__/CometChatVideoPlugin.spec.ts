import { describe, it, expect } from 'vitest';
import { CometChatVideoPlugin } from '../CometChatVideoPlugin';

function mockMediaMessage(
  overrides: Partial<{
    attachments: unknown[];
    caption: string;
    senderName: string;
  }> = {}
) {
  const attachments = overrides.attachments ?? [
    {
      url: 'https://example.com/video1.mp4',
      thumbnail: 'https://example.com/thumb1.jpg',
      metadata: { width: 1920, height: 1080, duration: 125, size: 5242880, mimeType: 'video/mp4' },
    },
  ];

  return {
    getType: () => 'video',
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
    getParentMessageId: () => 0,
    getReceiverType: () => 'user',
    getReceiver: () => ({ getUid: () => 'user-2', getName: () => 'Jane', getRole: () => '' }),
  } as any;
}

function mockContext(alignment: 'left' | 'right' = 'right') {
  return {
    loggedInUser: { getUid: () => 'user-1', getName: () => 'Me' } as any,
    alignment,
    theme: 'light' as const,
  };
}

describe('CometChatVideoPlugin', () => {
  it('has id "video"', () => {
    expect(CometChatVideoPlugin.id).toBe('video');
  });

  it('handles message type "video"', () => {
    expect(CometChatVideoPlugin.messageTypes).toContain('video');
  });

  it('handles message category "message"', () => {
    expect(CometChatVideoPlugin.messageCategories).toContain('message');
  });

  describe('renderBubble', () => {
    it('returns a React element', () => {
      const result = CometChatVideoPlugin.renderBubble(mockMediaMessage(), mockContext());
      expect(result).toBeTruthy();
    });

    it('returns element with correct type (CometChatVideoBubble)', () => {
      const result = CometChatVideoPlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.type?.displayName).toBe('CometChatVideoBubble');
    });

    it('passes outgoing variant for right alignment', () => {
      const result = CometChatVideoPlugin.renderBubble(
        mockMediaMessage(),
        mockContext('right')
      ) as any;
      expect(result.props.variant).toBe('outgoing');
    });

    it('passes incoming variant for left alignment', () => {
      const result = CometChatVideoPlugin.renderBubble(
        mockMediaMessage(),
        mockContext('left')
      ) as any;
      expect(result.props.variant).toBe('incoming');
    });

    it('extracts attachments from message', () => {
      const result = CometChatVideoPlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.attachments).toHaveLength(1);
      expect(result.props.attachments[0].url).toBe('https://example.com/video1.mp4');
    });

    it('extracts duration from attachment metadata', () => {
      const result = CometChatVideoPlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.attachments[0].duration).toBe(125);
    });

    it('extracts caption from getCaption()', () => {
      const msg = mockMediaMessage({ caption: 'Check this out' });
      const result = CometChatVideoPlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.caption).toBe('Check this out');
    });

    it('omits caption prop when caption is empty', () => {
      const result = CometChatVideoPlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.caption).toBeUndefined();
    });

    it('extracts sender name', () => {
      const msg = mockMediaMessage({ senderName: 'Alice' });
      const result = CometChatVideoPlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.senderName).toBe('Alice');
    });

    it('handles message with no attachments', () => {
      const msg = mockMediaMessage({ attachments: [] });
      const result = CometChatVideoPlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.attachments).toHaveLength(0);
    });

    it('filters out attachments without URL', () => {
      const msg = mockMediaMessage({
        attachments: [
          { url: 'https://example.com/v1.mp4', metadata: {} },
          { thumbnail: 'https://example.com/thumb.jpg', metadata: {} },
          { url: 'https://example.com/v2.mp4', metadata: {} },
        ],
      });
      const result = CometChatVideoPlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.attachments).toHaveLength(2);
    });
  });

  describe('getOptions', () => {
    it('returns an array of options', () => {
      const options = CometChatVideoPlugin.getOptions?.(mockMediaMessage(), mockContext());
      expect(Array.isArray(options)).toBe(true);
      expect(options?.length).toBeGreaterThan(0);
    });
  });

  describe('getLastMessagePreview', () => {
    it('returns emoji + Video text', () => {
      const preview = CometChatVideoPlugin.getLastMessagePreview?.(mockMediaMessage(), {} as any);
      expect(preview).toBe('🎥 Video');
    });
  });
});
