import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVideoPlugin } from '../CometChatVideoPlugin';
import {
  extractVideoAttachments,
  extractVideoCaption,
  extractVideoSenderName,
} from '../../../../components/CometChatVideoBubble/CometChatVideoBubble.utils';

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

    it('renders the batch-aware CometChatVideosBubble by default (flag unset)', () => {
      const result = CometChatVideoPlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.type?.displayName).toBe('CometChatVideosBubble');
    });

    it('forwards the message to the bubble (self-extracting)', () => {
      const msg = mockMediaMessage();
      const result = CometChatVideoPlugin.renderBubble(msg, mockContext()) as any;
      expect(result.props.message).toBe(msg);
    });

    it('forwards right alignment for right-aligned context', () => {
      const result = CometChatVideoPlugin.renderBubble(
        mockMediaMessage(),
        mockContext('right')
      ) as any;
      expect(result.props.alignment).toBe('right');
    });

    it('forwards left alignment for left-aligned context', () => {
      const result = CometChatVideoPlugin.renderBubble(
        mockMediaMessage(),
        mockContext('left')
      ) as any;
      expect(result.props.alignment).toBe('left');
    });

    it('forwards text formatters from context', () => {
      const formatters = [{ id: 'mentions' }] as any;
      const context = { ...mockContext(), getTextFormatters: () => formatters };
      const result = CometChatVideoPlugin.renderBubble(mockMediaMessage(), context) as any;
      expect(result.props.textFormatters).toBe(formatters);
    });

    it('does not pass extracted-data props (attachments/variant/caption/senderName)', () => {
      const result = CometChatVideoPlugin.renderBubble(mockMediaMessage(), mockContext()) as any;
      expect(result.props.attachments).toBeUndefined();
      expect(result.props.variant).toBeUndefined();
      expect(result.props.caption).toBeUndefined();
      expect(result.props.senderName).toBeUndefined();
    });
  });

  // The data extraction moved from the plugin into the bubble's co-located utils.
  describe('video extraction utils', () => {
    it('extracts attachments from the message', () => {
      const result = extractVideoAttachments(mockMediaMessage() as CometChat.MediaMessage);
      expect(result).toHaveLength(1);
      expect(result[0]?.url).toBe('https://example.com/video1.mp4');
    });

    it('extracts duration from attachment metadata', () => {
      const result = extractVideoAttachments(mockMediaMessage() as CometChat.MediaMessage);
      expect(result[0]?.duration).toBe(125);
    });

    it('extracts caption from getCaption()', () => {
      const msg = mockMediaMessage({ caption: 'Check this out' });
      expect(extractVideoCaption(msg as CometChat.MediaMessage)).toBe('Check this out');
    });

    it('returns empty string when caption is empty', () => {
      expect(extractVideoCaption(mockMediaMessage() as CometChat.MediaMessage)).toBe('');
    });

    it('extracts the sender name', () => {
      const msg = mockMediaMessage({ senderName: 'Alice' });
      expect(extractVideoSenderName(msg as CometChat.MediaMessage)).toBe('Alice');
    });

    it('handles a message with no attachments', () => {
      const msg = mockMediaMessage({ attachments: [] });
      expect(extractVideoAttachments(msg as CometChat.MediaMessage)).toHaveLength(0);
    });

    it('returns the first attachment with a URL, skipping URL-less ones', () => {
      // The singular bubble's util returns a single attachment (multi-attachment
      // rendering is handled by CometChatVideosBubble). A leading URL-less
      // attachment is skipped and the first one with a URL is used.
      const msg = mockMediaMessage({
        attachments: [
          { thumbnail: 'https://example.com/thumb.jpg', metadata: {} },
          { url: 'https://example.com/v1.mp4', metadata: {} },
          { url: 'https://example.com/v2.mp4', metadata: {} },
        ],
      });
      const result = extractVideoAttachments(msg as CometChat.MediaMessage);
      expect(result).toHaveLength(1);
      expect(result[0]?.url).toBe('https://example.com/v1.mp4');
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
      expect(preview).toBe('Video');
    });
  });
});
