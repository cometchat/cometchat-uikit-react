import { describe, it, expect } from 'vitest';
import { CometChatAudioPlugin } from '../CometChatAudioPlugin';

function mockMediaMessage(
  overrides: Partial<{
    attachments: unknown[];
    caption: string;
    senderName: string;
  }> = {}
) {
  const attachments = overrides.attachments ?? [
    {
      name: 'voice.mp3',
      url: 'https://example.com/voice.mp3',
      mimeType: 'audio/mpeg',
      extension: 'mp3',
      size: 1048576,
    },
  ];

  return {
    getType: () => 'audio',
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

describe('CometChatAudioPlugin', () => {
  it('has id "audio"', () => {
    expect(CometChatAudioPlugin.id).toBe('audio');
  });

  it('handles message type "audio"', () => {
    expect(CometChatAudioPlugin.messageTypes).toContain('audio');
  });

  it('handles message category "message"', () => {
    expect(CometChatAudioPlugin.messageCategories).toContain('message');
  });

  describe('renderBubble', () => {
    it('returns a React element', () => {
      const result = CometChatAudioPlugin.renderBubble(mockMediaMessage(), mockContext());
      expect(result).toBeTruthy();
    });

    it('returns element with correct type', () => {
      const result = CometChatAudioPlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.type?.displayName).toBe('CometChatAudioBubble');
    });

    it('forwards the message for self-extraction', () => {
      const msg = mockMediaMessage();
      const result = CometChatAudioPlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.message).toBe(msg);
    });

    it('passes right alignment for right alignment', () => {
      const result = CometChatAudioPlugin.renderBubble(
        mockMediaMessage(),
        mockContext('right')
      ) as any;
      expect(result.props.alignment).toBe('right');
    });

    it('passes left alignment for left alignment', () => {
      const result = CometChatAudioPlugin.renderBubble(
        mockMediaMessage(),
        mockContext('left')
      ) as any;
      expect(result.props.alignment).toBe('left');
    });

    it('forwards text formatters for caption rendering', () => {
      const formatters = [{ id: 'mentions' }] as any;
      const ctx = { ...mockContext(), getTextFormatters: () => formatters };
      const result = CometChatAudioPlugin.renderBubble(mockMediaMessage(), ctx) as any;
      expect(result.props.textFormatters).toBe(formatters);
    });

    it('does not extract message-derived data itself', () => {
      const result = CometChatAudioPlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.attachments).toBeUndefined();
      expect(result.props.caption).toBeUndefined();
      expect(result.props.variant).toBeUndefined();
    });
  });

  describe('getLastMessagePreview', () => {
    it('returns emoji + Audio text', () => {
      expect(CometChatAudioPlugin.getLastMessagePreview?.(mockMediaMessage(), {} as any)).toBe(
        'Audio'
      );
    });
  });
});
