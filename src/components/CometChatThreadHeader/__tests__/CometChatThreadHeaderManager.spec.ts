import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { attachThreadHeaderMessageListener } from '../CometChatThreadHeaderManager';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    MessageListener: vi.fn().mockImplementation((callbacks: unknown) => callbacks),
  },
}));

function createMockMessage(
  overrides: {
    parentMessageId?: number;
    senderUid?: string;
    id?: number;
  } = {}
) {
  const { parentMessageId = 100, senderUid = 'other-user', id = 200 } = overrides;
  return {
    getParentMessageId: () => parentMessageId,
    getSender: () => ({ getUid: () => senderUid }),
    getId: () => id,
  } as unknown as CometChat.BaseMessage;
}

/** Helper to get the listener callbacks passed to the most recent addMessageListener call. */
function getListenerCallbacks(): Record<string, (msg: CometChat.BaseMessage) => void> {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const mockAdd = vi.mocked(CometChat.addMessageListener);
  return mockAdd.mock.calls[0]?.[1] as Record<string, (msg: CometChat.BaseMessage) => void>;
}

describe('CometChatThreadHeaderManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('attachThreadHeaderMessageListener', () => {
    it('attaches an SDK message listener', () => {
      const onNewReply = vi.fn();
      attachThreadHeaderMessageListener('test-listener', 100, 'logged-in-user', onNewReply);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(vi.mocked(CometChat.addMessageListener)).toHaveBeenCalledWith(
        'test-listener',
        expect.any(Object)
      );
    });

    it('returns a cleanup function that removes the listener', () => {
      const onNewReply = vi.fn();
      const cleanup = attachThreadHeaderMessageListener(
        'test-listener',
        100,
        'logged-in-user',
        onNewReply
      );

      cleanup();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(vi.mocked(CometChat.removeMessageListener)).toHaveBeenCalledWith('test-listener');
    });

    it('fires onNewReply for messages with matching parentMessageId', () => {
      const onNewReply = vi.fn();
      attachThreadHeaderMessageListener('test-listener', 100, 'logged-in-user', onNewReply);

      const callbacks = getListenerCallbacks();
      const message = createMockMessage({ parentMessageId: 100, senderUid: 'other-user' });
      callbacks.onTextMessageReceived(message);

      expect(onNewReply).toHaveBeenCalledWith(message);
    });

    it('does NOT fire for messages from the logged-in user', () => {
      const onNewReply = vi.fn();
      attachThreadHeaderMessageListener('test-listener', 100, 'logged-in-user', onNewReply);

      const callbacks = getListenerCallbacks();
      const message = createMockMessage({ parentMessageId: 100, senderUid: 'logged-in-user' });
      callbacks.onTextMessageReceived(message);

      expect(onNewReply).not.toHaveBeenCalled();
    });

    it('does NOT fire for messages with different parentMessageId', () => {
      const onNewReply = vi.fn();
      attachThreadHeaderMessageListener('test-listener', 100, 'logged-in-user', onNewReply);

      const callbacks = getListenerCallbacks();
      const message = createMockMessage({ parentMessageId: 999, senderUid: 'other-user' });
      callbacks.onTextMessageReceived(message);

      expect(onNewReply).not.toHaveBeenCalled();
    });

    it('handles media messages', () => {
      const onNewReply = vi.fn();
      attachThreadHeaderMessageListener('test-listener', 100, 'logged-in-user', onNewReply);

      const callbacks = getListenerCallbacks();
      const message = createMockMessage({ parentMessageId: 100, senderUid: 'other-user' });
      callbacks.onMediaMessageReceived(message);

      expect(onNewReply).toHaveBeenCalledWith(message);
    });

    it('handles custom messages', () => {
      const onNewReply = vi.fn();
      attachThreadHeaderMessageListener('test-listener', 100, 'logged-in-user', onNewReply);

      const callbacks = getListenerCallbacks();
      const message = createMockMessage({ parentMessageId: 100, senderUid: 'other-user' });
      callbacks.onCustomMessageReceived(message);

      expect(onNewReply).toHaveBeenCalledWith(message);
    });

    it('handles interactive messages', () => {
      const onNewReply = vi.fn();
      attachThreadHeaderMessageListener('test-listener', 100, 'logged-in-user', onNewReply);

      const callbacks = getListenerCallbacks();
      const message = createMockMessage({ parentMessageId: 100, senderUid: 'other-user' });
      callbacks.onInteractiveMessageReceived(message);

      expect(onNewReply).toHaveBeenCalledWith(message);
    });
  });
});
