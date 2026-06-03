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

    it('passes outgoing variant for right alignment', () => {
      const result = CometChatAudioPlugin.renderBubble(
        mockMediaMessage(),
        mockContext('right')
      ) as any;
      expect(result.props.variant).toBe('outgoing');
    });

    it('passes incoming variant for left alignment', () => {
      const result = CometChatAudioPlugin.renderBubble(
        mockMediaMessage(),
        mockContext('left')
      ) as any;
      expect(result.props.variant).toBe('incoming');
    });

    it('extracts attachments from message', () => {
      const result = CometChatAudioPlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.attachments).toHaveLength(1);
      expect(result.props.attachments[0].url).toBe('https://example.com/voice.mp3');
    });

    it('extracts caption', () => {
      const msg = mockMediaMessage({ caption: 'Voice note' });
      const result = CometChatAudioPlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.caption).toBe('Voice note');
    });

    it('omits caption when empty', () => {
      const result = CometChatAudioPlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.caption).toBeUndefined();
    });

    it('handles empty attachments', () => {
      const msg = mockMediaMessage({ attachments: [] });
      const result = CometChatAudioPlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.attachments).toHaveLength(0);
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
