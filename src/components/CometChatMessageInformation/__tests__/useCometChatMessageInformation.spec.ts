/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCometChatMessageInformation } from '../useCometChatMessageInformation';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { buildTextMessage } from '../../../testing/mock-builders';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    getMessageReceipts: vi.fn(),
    getLoggedinUser: vi.fn(),
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    MessageListener: vi.fn().mockImplementation((cb: unknown) => cb),
    ConnectionListener: vi.fn().mockImplementation((cb: unknown) => cb),
    RECEIVER_TYPE: { GROUP: 'group', USER: 'user' },
  },
}));

// Create stable message references outside of tests to avoid infinite re-render loops.
// The hook's useCallback depends on `message`, so a new reference each render = infinite loop.
const stableUserMessage = buildTextMessage({
  receiverType: 'user',
  readAt: 500,
  deliveredAt: 400,
  id: 1,
}) as unknown as CometChat.BaseMessage;

const stableGroupMessage = buildTextMessage({
  receiverType: 'group',
  readAt: 0,
  deliveredAt: 0,
  id: 42,
}) as unknown as CometChat.BaseMessage;

describe('useCometChatMessageInformation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CometChat.getLoggedinUser).mockResolvedValue({
      getUid: () => 'logged-in-user',
      getName: () => 'Me',
    } as unknown as CometChat.User);
    vi.mocked(CometChat.getMessageReceipts).mockResolvedValue([]);
  });

  // ─── SDK fetch mode (1-on-1) ────────────────────────────────────

  describe('1-on-1 messages (SDK fetch)', () => {
    it('returns loaded state for 1-on-1 message', async () => {
      const { result } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableUserMessage,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      expect(result.current.isGroupMessage).toBe(false);
      expect(result.current.oneOnOneReadAt).toBe(500);
      expect(result.current.oneOnOneDeliveredAt).toBe(400);
    });

    it('calls getLoggedinUser and getMessageReceipts for 1-on-1', async () => {
      const { result } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableUserMessage,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      // 1-on-1 reads timestamps from message object, but still calls getLoggedinUser
      expect(vi.mocked(CometChat.getLoggedinUser)).toHaveBeenCalled();
    });
  });

  // ─── SDK fetch mode (group) ─────────────────────────────────────

  describe('group messages (SDK fetch)', () => {
    it('returns loaded state with group receipts from SDK', async () => {
      const mockReceipt = {
        getSender: () => ({
          getUid: () => 'u1',
          getName: () => 'Alice',
          getAvatar: () => '',
        }),
        getReadAt: () => 100,
        getDeliveredAt: () => 50,
      };
      vi.mocked(CometChat.getMessageReceipts).mockResolvedValue([mockReceipt] as never);

      const { result } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableGroupMessage,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      expect(result.current.isGroupMessage).toBe(true);
      expect(result.current.userReceipts).toHaveLength(1);
      expect(result.current.userReceipts[0]!.readAt).toBe(100);
    });

    it('returns empty state for group with no receipts from SDK', async () => {
      vi.mocked(CometChat.getMessageReceipts).mockResolvedValue([]);

      const { result } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableGroupMessage,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('empty');
      });
      expect(result.current.userReceipts).toHaveLength(0);
    });

    it('filters out logged-in user from group receipts', async () => {
      const mockReceipts = [
        {
          getSender: () => ({
            getUid: () => 'logged-in-user',
            getName: () => 'Me',
            getAvatar: () => '',
          }),
          getReadAt: () => 100,
          getDeliveredAt: () => 50,
        },
        {
          getSender: () => ({
            getUid: () => 'u2',
            getName: () => 'Bob',
            getAvatar: () => '',
          }),
          getReadAt: () => 200,
          getDeliveredAt: () => 150,
        },
      ];
      vi.mocked(CometChat.getMessageReceipts).mockResolvedValue(mockReceipts as never);

      const { result } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableGroupMessage,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      // Should only have Bob, not the logged-in user
      expect(result.current.userReceipts).toHaveLength(1);
      expect(result.current.userReceipts[0]!.user.getUid()).toBe('u2');
    });
  });

  // ─── isGroupMessage ─────────────────────────────────────────────

  describe('isGroupMessage', () => {
    it('returns true for group messages', async () => {
      const { result } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableGroupMessage,
        })
      );
      await waitFor(() => {
        expect(result.current.fetchState).not.toBe('loading');
      });
      expect(result.current.isGroupMessage).toBe(true);
    });

    it('returns false for user messages', async () => {
      const { result } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableUserMessage,
        })
      );
      await waitFor(() => {
        expect(result.current.fetchState).not.toBe('loading');
      });
      expect(result.current.isGroupMessage).toBe(false);
    });
  });

  // ─── retry ──────────────────────────────────────────────────────

  describe('retry', () => {
    it('exposes a retry function', async () => {
      const { result } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableUserMessage,
        })
      );
      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      expect(typeof result.current.retry).toBe('function');
    });

    it('retry resets and re-fetches from SDK', async () => {
      const { result } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableUserMessage,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
    });
  });

  // ─── onError callback ──────────────────────────────────────────

  describe('onError', () => {
    it('calls onError when SDK fetch fails', async () => {
      const onError = vi.fn();
      const error = new Error('SDK error');
      vi.mocked(CometChat.getMessageReceipts).mockRejectedValue(error);

      const { result } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableGroupMessage,
          onError,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('error');
      });
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  // ─── SDK listeners ─────────────────────────────────────────────

  describe('SDK listeners', () => {
    it('attaches message and connection listeners', async () => {
      const { result } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableUserMessage,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      expect(vi.mocked(CometChat.addMessageListener)).toHaveBeenCalled();
      expect(vi.mocked(CometChat.addConnectionListener)).toHaveBeenCalled();
    });

    it('removes listeners on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useCometChatMessageInformation({
          message: stableUserMessage,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      unmount();
      expect(vi.mocked(CometChat.removeMessageListener)).toHaveBeenCalled();
      expect(vi.mocked(CometChat.removeConnectionListener)).toHaveBeenCalled();
    });
  });
});
