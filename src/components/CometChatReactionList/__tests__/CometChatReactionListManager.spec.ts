/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionListManager } from '../CometChatReactionListManager';

// ─── SDK Mock ───────────────────────────────────────────────────────────────

const mockFetchNext = vi.fn();
const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
const mockSetLimit = vi.fn().mockReturnThis();
const mockSetMessageId = vi.fn().mockReturnThis();

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    isInitialized: vi.fn().mockReturnValue(true),
    ReactionsRequestBuilder: vi.fn().mockImplementation(() => ({
      setLimit: mockSetLimit,
      setMessageId: mockSetMessageId,
      build: mockBuild,
    })),
  },
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('CometChatReactionListManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CometChat.isInitialized).mockReturnValue(true);
    mockBuild.mockReturnValue({ fetchNext: mockFetchNext });
    mockFetchNext.mockResolvedValue([]);
  });

  // ─── Constructor ────────────────────────────────────────────────

  describe('constructor', () => {
    it('creates a default request builder when none is provided', () => {
      new CometChatReactionListManager(42);
      expect(CometChat.ReactionsRequestBuilder).toHaveBeenCalled();
      expect(mockSetLimit).toHaveBeenCalledWith(20);
      expect(mockSetMessageId).toHaveBeenCalledWith(42);
      expect(mockBuild).toHaveBeenCalled();
    });

    it('uses the provided request builder', () => {
      const customBuilder = {
        setMessageId: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue({ fetchNext: mockFetchNext }),
      };
      new CometChatReactionListManager(
        42,
        customBuilder as unknown as CometChat.ReactionsRequestBuilder
      );
      expect(customBuilder.setMessageId).toHaveBeenCalledWith(42);
      expect(customBuilder.build).toHaveBeenCalled();
      // Default builder should NOT have been created
      expect(CometChat.ReactionsRequestBuilder).not.toHaveBeenCalled();
    });

    it('does NOT set emoji filter (fetches all reactions for client-side grouping)', () => {
      new CometChatReactionListManager(42);
      // No setReaction call — all reactions fetched, grouped client-side
      const builderInstance = vi.mocked(CometChat.ReactionsRequestBuilder).mock.results[0]?.value;
      expect(builderInstance?.setReaction).toBeUndefined();
    });

    it('sets request to null when SDK is not initialized', async () => {
      vi.mocked(CometChat.isInitialized).mockReturnValue(false);
      const manager = new CometChatReactionListManager(42);
      const result = await manager.fetchNext();
      expect(result).toEqual([]);
    });

    it('sets request to null when builder throws', async () => {
      mockBuild.mockImplementation(() => {
        throw new Error('Builder error');
      });
      const manager = new CometChatReactionListManager(42);
      const result = await manager.fetchNext();
      expect(result).toEqual([]);
    });

    it('handles missing messageId gracefully', () => {
      // messageId = 0 is falsy but still valid — SDK handles it
      new CometChatReactionListManager(0);
      expect(mockSetMessageId).toHaveBeenCalledWith(0);
    });
  });

  // ─── fetchNext ──────────────────────────────────────────────────

  describe('fetchNext', () => {
    it('returns reactions from the SDK request', async () => {
      const mockReactions = [
        {
          getReaction: () => '👍',
          getReactedBy: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
        },
        {
          getReaction: () => '❤️',
          getReactedBy: () => ({ getUid: () => 'u2', getName: () => 'Bob' }),
        },
      ];
      mockFetchNext.mockResolvedValue(mockReactions);

      const manager = new CometChatReactionListManager(42);
      const result = await manager.fetchNext();
      expect(result).toBe(mockReactions);
      expect(result).toHaveLength(2);
    });

    it('returns empty array when request is null (SDK not initialized)', async () => {
      vi.mocked(CometChat.isInitialized).mockReturnValue(false);
      const manager = new CometChatReactionListManager(42);
      const result = await manager.fetchNext();
      expect(result).toEqual([]);
    });

    it('returns empty array when exhausted', async () => {
      mockFetchNext.mockResolvedValue([]);
      const manager = new CometChatReactionListManager(42);
      const result = await manager.fetchNext();
      expect(result).toEqual([]);
    });

    it('propagates SDK errors', async () => {
      mockFetchNext.mockRejectedValue(new Error('Network error'));
      const manager = new CometChatReactionListManager(42);
      await expect(manager.fetchNext()).rejects.toThrow('Network error');
    });

    it('can be called multiple times for pagination', async () => {
      const page1 = [{ getReaction: () => '👍' }];
      const page2 = [{ getReaction: () => '❤️' }];
      mockFetchNext.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

      const manager = new CometChatReactionListManager(42);
      const result1 = await manager.fetchNext();
      const result2 = await manager.fetchNext();
      expect(result1).toBe(page1);
      expect(result2).toBe(page2);
      expect(mockFetchNext).toHaveBeenCalledTimes(2);
    });
  });
});
