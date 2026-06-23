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

function mockContext(alignment: 'left' | 'right' | 'center' = 'right') {
  return {
    loggedInUser: { getUid: () => 'user-1', getName: () => 'Me' } as any,
    alignment,
    theme: 'light' as const,
    getTextFormatters: () => [],
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

    // The bubble self-extracts attachments/caption/sender from the message now;
    // the plugin only forwards the message + alignment + formatters.
    it('forwards the message to the bubble', () => {
      const msg = mockMediaMessage();
      const result = CometChatImagePlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.message).toBe(msg);
    });

    it('forwards right alignment', () => {
      const result = CometChatImagePlugin.renderBubble(
        mockMediaMessage(),
        mockContext('right')
      ) as any;
      expect(result.props.alignment).toBe('right');
    });

    it('forwards left alignment', () => {
      const result = CometChatImagePlugin.renderBubble(
        mockMediaMessage(),
        mockContext('left')
      ) as any;
      expect(result.props.alignment).toBe('left');
    });

    it('maps non-right alignment (center) to left', () => {
      const result = CometChatImagePlugin.renderBubble(
        mockMediaMessage(),
        mockContext('center')
      ) as any;
      expect(result.props.alignment).toBe('left');
    });

    it('forwards text formatters from context', () => {
      const result = CometChatImagePlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(Array.isArray(result.props.textFormatters)).toBe(true);
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
