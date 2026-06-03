import { describe, it, expect } from 'vitest';
import { CometChatImagePlugin } from '../CometChatImagePlugin';

// Mock message factory
function mockMediaMessage(
  overrides: Partial<{
    attachments: { getUrl: () => string; getSize: () => number | undefined }[];
    caption: string;
    senderName: string;
    metadata: Record<string, unknown> | null;
  }> = {}
) {
  const attachments = overrides.attachments ?? [
    {
      getUrl: () => 'https://example.com/image1.jpg',
      getSize: () => 204800,
    },
  ];

  return {
    getType: () => 'image',
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
    getMetadata: () => overrides.metadata ?? {},
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

describe('CometChatImagePlugin', () => {
  it('has id "image"', () => {
    expect(CometChatImagePlugin.id).toBe('image');
  });

  it('handles message type "image"', () => {
    expect(CometChatImagePlugin.messageTypes).toContain('image');
  });

  it('handles message category "message"', () => {
    expect(CometChatImagePlugin.messageCategories).toContain('message');
  });

  describe('renderBubble', () => {
    it('returns a React element', () => {
      const result = CometChatImagePlugin.renderBubble(mockMediaMessage(), mockContext());
      expect(result).toBeTruthy();
    });

    it('returns element with correct type (CometChatImageBubble)', () => {
      const result = CometChatImagePlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.type?.displayName).toBe('CometChatImageBubble');
    });

    it('passes outgoing variant for right alignment', () => {
      const result = CometChatImagePlugin.renderBubble(
        mockMediaMessage(),
        mockContext('right')
      ) as any;
      expect(result.props.variant).toBe('outgoing');
    });

    it('passes incoming variant for left alignment', () => {
      const result = CometChatImagePlugin.renderBubble(
        mockMediaMessage(),
        mockContext('left')
      ) as any;
      expect(result.props.variant).toBe('incoming');
    });

    it('extracts attachments from message', () => {
      const result = CometChatImagePlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.attachments).toHaveLength(1);
      expect(result.props.attachments[0].url).toBe('https://example.com/image1.jpg');
    });

    it('extracts size from attachment', () => {
      const result = CometChatImagePlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.attachments[0].size).toBe(204800);
    });

    it('extracts caption from getCaption()', () => {
      const msg = mockMediaMessage({ caption: 'Beautiful sunset' });
      const result = CometChatImagePlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.caption).toBe('Beautiful sunset');
    });

    it('omits caption prop when caption is empty', () => {
      const result = CometChatImagePlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.caption).toBeUndefined();
    });

    it('extracts sender name', () => {
      const msg = mockMediaMessage({ senderName: 'Alice' });
      const result = CometChatImagePlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.senderName).toBe('Alice');
    });

    it('handles message with no attachments', () => {
      const msg = mockMediaMessage({ attachments: [] });
      const result = CometChatImagePlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.attachments).toHaveLength(0);
    });

    it('handles message with null attachments', () => {
      const msg = {
        ...mockMediaMessage(),
        getAttachments: () => null,
      };
      const result = CometChatImagePlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.attachments).toHaveLength(0);
    });

    it('filters out attachments without URL', () => {
      const msg = mockMediaMessage({
        attachments: [
          { getUrl: () => 'https://example.com/img1.jpg', getSize: () => 100 },
          { getUrl: () => '', getSize: () => 200 },
          { getUrl: () => 'https://example.com/img2.jpg', getSize: () => 300 },
        ],
      });
      const result = CometChatImagePlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.attachments).toHaveLength(2);
    });

    it('returns placeholder attachment for pending message with file metadata', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const msg = mockMediaMessage({
        attachments: [],
        metadata: { file },
      });
      // Override getAttachments to return empty/null (pending message)
      (msg as any).getAttachments = () => null;
      const result = CometChatImagePlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.attachments).toHaveLength(1);
      expect(result.props.attachments[0].url).toBe('');
    });
  });

  describe('getOptions', () => {
    it('returns an array of options', () => {
      const options = CometChatImagePlugin.getOptions?.(mockMediaMessage(), mockContext());
      expect(Array.isArray(options)).toBe(true);
      expect(options?.length).toBeGreaterThan(0);
    });

    it('includes react option', () => {
      const options = CometChatImagePlugin.getOptions?.(mockMediaMessage(), mockContext());
      expect(options?.some(o => o.id === 'react')).toBe(true);
    });

    it('includes reply option', () => {
      const options = CometChatImagePlugin.getOptions?.(mockMediaMessage(), mockContext());
      expect(options?.some(o => o.id === 'reply')).toBe(true);
    });
  });

  describe('getLastMessagePreview', () => {
    it('returns emoji + Photo text', () => {
      const preview = CometChatImagePlugin.getLastMessagePreview?.(mockMediaMessage(), {} as any);
      expect(preview).toBe('Photo');
    });
  });
});
