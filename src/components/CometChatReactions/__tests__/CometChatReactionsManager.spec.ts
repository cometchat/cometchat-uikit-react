/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionsManager } from '../CometChatReactionsManager';

// ─── SDK Mock ───────────────────────────────────────────────────────────────

const mockFetchNext = vi.fn();
const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
const mockSetLimit = vi.fn().mockReturnThis();
const mockSetMessageId = vi.fn().mockReturnThis();
const mockSetReaction = vi.fn().mockReturnThis();

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    isInitialized: vi.fn().mockReturnValue(true),
    ReactionsRequestBuilder: vi.fn().mockImplementation(() => ({
      setLimit: mockSetLimit,
      setMessageId: mockSetMessageId,
      setReaction: mockSetReaction,
      build: mockBuild,
    })),
  },
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('CometChatReactionsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CometChat.isInitialized).mockReturnValue(true);
    mockBuild.mockReturnValue({ fetchNext: mockFetchNext });
    mockFetchNext.mockResolvedValue([]);
  });

  // ─── Constructor ────────────────────────────────────────────────────

  describe('constructor', () => {
    it('creates a default request builder when none is provided', () => {
      new CometChatReactionsManager(42);
      expect(CometChat.ReactionsRequestBuilder).toHaveBeenCalled();
      expect(mockSetLimit).toHaveBeenCalledWith(20);
      expect(mockSetMessageId).toHaveBeenCalledWith(42);
      expect(mockBuild).toHaveBeenCalled();
    });

    it('uses the provided request builder', () => {
      const customBuilder = {
        limit: 50,
        setMessageId: vi.fn().mockReturnThis(),
        setReaction: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue({ fetchNext: mockFetchNext }),
      };
      new CometChatReactionsManager(
        42,
        undefined,
        customBuilder as unknown as CometChat.ReactionsRequestBuilder
      );
      // The manager always creates a fresh builder but applies custom limit from provided builder
      expect(CometChat.ReactionsRequestBuilder).toHaveBeenCalled();
      expect(mockSetMessageId).toHaveBeenCalledWith(42);
      expect(mockSetLimit).toHaveBeenCalledWith(50);
      expect(mockBuild).toHaveBeenCalled();
    });

    it('sets the reaction filter when emoji is provided and not "all"', () => {
      new CometChatReactionsManager(42, '👍');
      expect(mockSetReaction).toHaveBeenCalledWith('👍');
    });

    it('does not set reaction filter when emoji is "all"', () => {
      new CometChatReactionsManager(42, 'all');
      expect(mockSetReaction).not.toHaveBeenCalled();
    });

    it('does not set reaction filter when emoji is undefined', () => {
      new CometChatReactionsManager(42);
      expect(mockSetReaction).not.toHaveBeenCalled();
    });

    it('sets request to null when SDK is not initialized', async () => {
      vi.mocked(CometChat.isInitialized).mockReturnValue(false);
      const manager = new CometChatReactionsManager(42);
      // fetchNext should return empty array since request is null
      const result = await manager.fetchNext();
      expect(result).toEqual([]);
    });

    it('sets request to null when builder throws', async () => {
      mockBuild.mockImplementation(() => {
        throw new Error('Builder error');
      });
      const manager = new CometChatReactionsManager(42);
      const result = await manager.fetchNext();
      expect(result).toEqual([]);
    });
  });

  // ─── fetchNext ──────────────────────────────────────────────────────

  describe('fetchNext', () => {
    it('returns reactors from the SDK request', async () => {
      const mockReactors = [
        {
          getReaction: () => '👍',
          getReactedBy: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
        },
      ];
      mockFetchNext.mockResolvedValue(mockReactors);

      const manager = new CometChatReactionsManager(42);
      const result = await manager.fetchNext();
      expect(result).toBe(mockReactors);
    });

    it('returns empty array when request is null', async () => {
      vi.mocked(CometChat.isInitialized).mockReturnValue(false);
      const manager = new CometChatReactionsManager(42);
      const result = await manager.fetchNext();
      expect(result).toEqual([]);
    });

    it('propagates SDK errors', async () => {
      mockFetchNext.mockRejectedValue(new Error('Network error'));
      const manager = new CometChatReactionsManager(42);
      await expect(manager.fetchNext()).rejects.toThrow('Network error');
    });

    it('can be called multiple times for pagination', async () => {
      const page1 = [{ getReaction: () => '👍' }];
      const page2 = [{ getReaction: () => '❤️' }];
      mockFetchNext.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

      const manager = new CometChatReactionsManager(42);
      const result1 = await manager.fetchNext();
      const result2 = await manager.fetchNext();
      expect(result1).toBe(page1);
      expect(result2).toBe(page2);
      expect(mockFetchNext).toHaveBeenCalledTimes(2);
    });
  });
});
