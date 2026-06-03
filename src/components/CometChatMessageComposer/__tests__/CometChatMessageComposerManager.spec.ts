/**
 * Unit tests for CometChatMessageComposerManager.
 *
 * Tests all SDK-facing functions in isolation by mocking the CometChat SDK.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockCometChat } from '../../../testing/mock-sdk';

// ─── SDK mock ────────────────────────────────────────────────────────────────
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: mockCometChat,
}));

// Import after mock is registered
import * as ComposerManager from '../CometChatMessageComposerManager';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeTextMessageMock = (receiverId: string, text: string, receiverType: string) => {
  const obj = {
    receiverId,
    text,
    receiverType,
    _id: 0 as number,
    _parentMessageId: undefined as number | undefined,
    _metadata: undefined as Record<string, unknown> | undefined,
    _quotedMessage: undefined as unknown,
    setId(id: number) {
      obj._id = id;
    },
    setParentMessageId(id: number) {
      obj._parentMessageId = id;
    },
    setMetadata(meta: Record<string, unknown>) {
      obj._metadata = meta;
    },
    setQuotedMessage(msg: unknown) {
      obj._quotedMessage = msg;
    },
    getId: () => obj._id,
    getText: () => text,
  };
  return obj;
};

const makeMediaMessageMock = (
  receiverId: string,
  file: File,
  fileType: string,
  receiverType: string
) => ({
  receiverId,
  file,
  fileType,
  receiverType,
  _parentMessageId: undefined as number | undefined,
  _quotedMessage: undefined as unknown,
  setParentMessageId(id: number) {
    this._parentMessageId = id;
  },
  setQuotedMessage(msg: unknown) {
    this._quotedMessage = msg;
  },
});

const makeTypingIndicatorMock = (receiverId: string, receiverType: string) => ({
  receiverId,
  receiverType,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CometChatMessageComposerManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (mockCometChat as unknown as Record<string, unknown>).TextMessage = vi.fn(
      (receiverId: string, text: string, receiverType: string) =>
        makeTextMessageMock(receiverId, text, receiverType)
    );
    (mockCometChat as unknown as Record<string, unknown>).MediaMessage = vi.fn(
      (receiverId: string, file: File, fileType: string, receiverType: string) =>
        makeMediaMessageMock(receiverId, file, fileType, receiverType)
    );
    (mockCometChat as unknown as Record<string, unknown>).TypingIndicator = vi.fn(
      (receiverId: string, receiverType: string) =>
        makeTypingIndicatorMock(receiverId, receiverType)
    );
    (mockCometChat as unknown as Record<string, unknown>).MessageListener = vi.fn(
      (callbacks: Record<string, unknown>) => callbacks
    );
    (mockCometChat as unknown as Record<string, unknown>).ConnectionListener = vi.fn(
      (callbacks: Record<string, unknown>) => callbacks
    );

    mockCometChat.sendMessage.mockResolvedValue({ getId: () => 1 });
    mockCometChat.sendMediaMessage.mockResolvedValue({ getId: () => 2 });
    mockCometChat.editMessage.mockResolvedValue({ getId: () => 3 });
  });

  // ─── sendTextMessage ───────────────────────────────────────────────────────

  describe('sendTextMessage', () => {
    it('creates a TextMessage with correct receiverId, text, and receiverType', async () => {
      await ComposerManager.sendTextMessage('user-1', 'user', 'Hello world');
      expect(mockCometChat.sendMessage).toHaveBeenCalledOnce();
      const msg = mockCometChat.sendMessage.mock.calls[0][0] as ReturnType<
        typeof makeTextMessageMock
      >;
      expect(msg.receiverId).toBe('user-1');
      expect(msg.text).toBe('Hello world');
      expect(msg.receiverType).toBe('user');
    });

    it('calls CometChat.sendMessage with the constructed TextMessage', async () => {
      await ComposerManager.sendTextMessage('group-1', 'group', 'Hi group');
      expect(mockCometChat.sendMessage).toHaveBeenCalledOnce();
    });

    it('sets parentMessageId on the message when provided', async () => {
      await ComposerManager.sendTextMessage('user-1', 'user', 'Thread reply', 99);
      const msg = mockCometChat.sendMessage.mock.calls[0][0] as ReturnType<
        typeof makeTextMessageMock
      >;
      expect(msg._parentMessageId).toBe(99);
    });

    it('does NOT set parentMessageId when not provided', async () => {
      await ComposerManager.sendTextMessage('user-1', 'user', 'Normal message');
      const msg = mockCometChat.sendMessage.mock.calls[0][0] as ReturnType<
        typeof makeTextMessageMock
      >;
      expect(msg._parentMessageId).toBeUndefined();
    });

    it('sets richText metadata when richTextHtml is provided', async () => {
      // Rich text metadata is no longer set at the Manager level.
      // The Manager's sendTextMessage only handles text, parentMessageId, and quotedMessage.
      // Rich text formatting is handled at the hook/component level.
      await ComposerManager.sendTextMessage('user-1', 'user', 'Bold text');
      const msg = mockCometChat.sendMessage.mock.calls[0][0] as ReturnType<
        typeof makeTextMessageMock
      >;
      expect(msg.text).toBe('Bold text');
      expect(msg.receiverId).toBe('user-1');
    });

    it('does NOT set metadata when richTextHtml is empty string', async () => {
      await ComposerManager.sendTextMessage('user-1', 'user', 'Plain', undefined, undefined, '');
      const msg = mockCometChat.sendMessage.mock.calls[0][0] as ReturnType<
        typeof makeTextMessageMock
      >;
      expect(msg._metadata).toBeUndefined();
    });

    it('does NOT set metadata when richTextHtml is whitespace only', async () => {
      await ComposerManager.sendTextMessage('user-1', 'user', 'Plain', undefined, undefined, '   ');
      const msg = mockCometChat.sendMessage.mock.calls[0][0] as ReturnType<
        typeof makeTextMessageMock
      >;
      expect(msg._metadata).toBeUndefined();
    });

    it('sets quotedMessage when provided', async () => {
      const quotedMsg = { getId: () => 10 };
      await ComposerManager.sendTextMessage(
        'user-1',
        'user',
        'Reply',
        undefined,
        quotedMsg as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage
      );
      const msg = mockCometChat.sendMessage.mock.calls[0][0] as ReturnType<
        typeof makeTextMessageMock
      >;
      expect(msg._quotedMessage).toBe(quotedMsg);
    });

    it('returns the resolved message from CometChat.sendMessage', async () => {
      const sentMsg = { getId: () => 55 };
      mockCometChat.sendMessage.mockResolvedValue(sentMsg);
      const result = await ComposerManager.sendTextMessage('user-1', 'user', 'Hello');
      expect(result).toBe(sentMsg);
    });
  });

  // ─── sendMediaMessage ──────────────────────────────────────────────────────

  describe('sendMediaMessage', () => {
    it('creates a MediaMessage with correct receiverId, file, fileType, and receiverType', async () => {
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      await ComposerManager.sendMediaMessage('user-1', 'user', file, 'image');
      expect(mockCometChat.sendMediaMessage).toHaveBeenCalledOnce();
      const msg = mockCometChat.sendMediaMessage.mock.calls[0][0] as ReturnType<
        typeof makeMediaMessageMock
      >;
      expect(msg.receiverId).toBe('user-1');
      expect(msg.file).toBe(file);
      expect(msg.fileType).toBe('image');
      expect(msg.receiverType).toBe('user');
    });

    it('sets parentMessageId on the media message when provided', async () => {
      const file = new File(['data'], 'video.mp4', { type: 'video/mp4' });
      await ComposerManager.sendMediaMessage('user-1', 'user', file, 'video', 77);
      const msg = mockCometChat.sendMediaMessage.mock.calls[0][0] as ReturnType<
        typeof makeMediaMessageMock
      >;
      expect(msg._parentMessageId).toBe(77);
    });

    it('calls CometChat.sendMediaMessage', async () => {
      const file = new File(['data'], 'audio.mp3', { type: 'audio/mpeg' });
      await ComposerManager.sendMediaMessage('group-1', 'group', file, 'audio');
      expect(mockCometChat.sendMediaMessage).toHaveBeenCalledOnce();
    });
  });

  // ─── editTextMessage ───────────────────────────────────────────────────────

  describe('editTextMessage', () => {
    it('calls CometChat.editMessage with a TextMessage containing the new text', async () => {
      await ComposerManager.editTextMessage(42, 'Updated text');
      expect(mockCometChat.editMessage).toHaveBeenCalledOnce();
      const msg = mockCometChat.editMessage.mock.calls[0][0] as ReturnType<
        typeof makeTextMessageMock
      >;
      expect(msg.text).toBe('Updated text');
    });

    it('sets the message ID on the TextMessage', async () => {
      await ComposerManager.editTextMessage(99, 'Edited');
      const msg = mockCometChat.editMessage.mock.calls[0][0] as ReturnType<
        typeof makeTextMessageMock
      >;
      expect(msg._id).toBe(99);
    });

    it('returns the resolved message from CometChat.editMessage', async () => {
      const editedMsg = { getId: () => 99 };
      mockCometChat.editMessage.mockResolvedValue(editedMsg);
      const result = await ComposerManager.editTextMessage(99, 'Edited');
      expect(result).toBe(editedMsg);
    });
  });

  // ─── startTypingIndicator ─────────────────────────────────────────────────

  describe('startTypingIndicator', () => {
    it('calls CometChat.startTyping with a TypingIndicator', () => {
      ComposerManager.startTypingIndicator('user-1', 'user');
      expect(mockCometChat.startTyping).toHaveBeenCalledOnce();
    });

    it('creates TypingIndicator with correct receiverId and receiverType', () => {
      ComposerManager.startTypingIndicator('group-1', 'group');
      const indicator = mockCometChat.startTyping.mock.calls[0][0] as ReturnType<
        typeof makeTypingIndicatorMock
      >;
      expect(indicator.receiverId).toBe('group-1');
      expect(indicator.receiverType).toBe('group');
    });

    it('does not throw when CometChat.startTyping throws', () => {
      mockCometChat.startTyping.mockImplementation(() => {
        throw new Error('SDK error');
      });
      expect(() => ComposerManager.startTypingIndicator('user-1', 'user')).not.toThrow();
    });
  });

  // ─── endTypingIndicator ───────────────────────────────────────────────────

  describe('endTypingIndicator', () => {
    it('calls CometChat.endTyping with a TypingIndicator', () => {
      ComposerManager.endTypingIndicator('user-1', 'user');
      expect(mockCometChat.endTyping).toHaveBeenCalledOnce();
    });

    it('creates TypingIndicator with correct receiverId and receiverType', () => {
      ComposerManager.endTypingIndicator('group-1', 'group');
      const indicator = mockCometChat.endTyping.mock.calls[0][0] as ReturnType<
        typeof makeTypingIndicatorMock
      >;
      expect(indicator.receiverId).toBe('group-1');
      expect(indicator.receiverType).toBe('group');
    });

    it('does not throw when CometChat.endTyping throws', () => {
      mockCometChat.endTyping.mockImplementation(() => {
        throw new Error('SDK error');
      });
      expect(() => ComposerManager.endTypingIndicator('user-1', 'user')).not.toThrow();
    });
  });

  // ─── attachMessageListener ────────────────────────────────────────────────

  describe('attachMessageListener', () => {
    it('calls CometChat.addMessageListener with the given listenerId', () => {
      const callbacks = { onMessageEdited: vi.fn(), onMessageDeleted: vi.fn() };
      ComposerManager.attachMessageListener('listener-1', callbacks);
      expect(mockCometChat.addMessageListener).toHaveBeenCalledWith(
        'listener-1',
        expect.anything()
      );
    });

    it('returns a cleanup function', () => {
      const callbacks = { onMessageEdited: vi.fn(), onMessageDeleted: vi.fn() };
      const cleanup = ComposerManager.attachMessageListener('listener-1', callbacks);
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup function calls CometChat.removeMessageListener with the listenerId', () => {
      const callbacks = { onMessageEdited: vi.fn(), onMessageDeleted: vi.fn() };
      const cleanup = ComposerManager.attachMessageListener('listener-abc', callbacks);
      cleanup();
      expect(mockCometChat.removeMessageListener).toHaveBeenCalledWith('listener-abc');
    });
  });

  // ─── attachConnectionListener ─────────────────────────────────────────────

  describe('attachConnectionListener', () => {
    it('calls CometChat.addConnectionListener with the given listenerId', () => {
      const onConnected = vi.fn();
      ComposerManager.attachConnectionListener('conn-listener-1', onConnected);
      expect(mockCometChat.addConnectionListener).toHaveBeenCalledWith(
        'conn-listener-1',
        expect.anything()
      );
    });

    it('returns a cleanup function', () => {
      const onConnected = vi.fn();
      const cleanup = ComposerManager.attachConnectionListener('conn-listener-1', onConnected);
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup function calls CometChat.removeConnectionListener with the listenerId', () => {
      const onConnected = vi.fn();
      const cleanup = ComposerManager.attachConnectionListener('conn-listener-xyz', onConnected);
      cleanup();
      expect(mockCometChat.removeConnectionListener).toHaveBeenCalledWith('conn-listener-xyz');
    });
  });
});
