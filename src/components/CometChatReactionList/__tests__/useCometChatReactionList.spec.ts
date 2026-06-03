import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatReactionList } from '../useCometChatReactionList';

// ─── SDK Mock ───────────────────────────────────────────────────────────────
// NOTE: vi.mock is hoisted — no top-level variables allowed inside the factory.
// We use vi.mocked() in tests to access the mocked functions.

vi.mock('@cometchat/chat-sdk-javascript', () => {
  const mockFetchNext = vi.fn().mockResolvedValue([]);
  const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
  return {
    CometChat: {
      isInitialized: vi.fn().mockReturnValue(true),
      getLoggedinUser: vi
        .fn()
        .mockResolvedValue({ getUid: () => 'alice-1', getName: () => 'Alice' }),
      ReactionsRequestBuilder: vi.fn().mockImplementation(() => ({
        setLimit: vi.fn().mockReturnThis(),
        setMessageId: vi.fn().mockReturnThis(),
        build: mockBuild,
      })),
    },
  };
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildReaction(emoji: string, uid: string, name: string): CometChat.Reaction {
  return {
    getReaction: () => emoji,
    getReactedBy: () => ({
      getUid: () => uid,
      getName: () => name,
      getAvatar: () => `https://example.com/${uid}.png`,
    }),
    getMessageId: () => 1,
  } as unknown as CometChat.Reaction;
}

function buildMessage(id = 1): CometChat.BaseMessage {
  return {
    getId: () => id,
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('useCometChatReactionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { isInitialized } = vi.mocked(CometChat);
    isInitialized.mockReturnValue(true);

    // Re-setup the builder mock after clearAllMocks
    const mockFetchNext = vi.fn().mockResolvedValue([]);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(CometChat.getLoggedinUser).mockResolvedValue({
      getUid: () => 'alice-1',
      getName: () => 'Alice',
    } as unknown as CometChat.User);
  });

  // ─── Initial state ────────────────────────────────────────────────

  it('starts with loading or idle fetch state', () => {
    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message }));
    expect(['idle', 'loading']).toContain(result.current.fetchState);
  });

  it('has empty allReactions initially', () => {
    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message }));
    expect(result.current.allReactions).toHaveLength(0);
  });

  // ─── Fetches reactions on mount ───────────────────────────────────

  it('fetches reactions on mount', async () => {
    const reactions = [buildReaction('👍', 'u1', 'Alice'), buildReaction('❤️', 'u2', 'Bob')];

    // Setup fetchNext to return reactions
    const mockFetchNext = vi.fn().mockResolvedValue(reactions);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    expect(result.current.allReactions).toHaveLength(2);
  });

  it('sets fetchState to empty when no reactions returned', async () => {
    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('empty');
    });
  });

  // ─── selectEmoji ──────────────────────────────────────────────────

  it('selectEmoji filters reactions correctly', async () => {
    const reactions = [
      buildReaction('👍', 'u1', 'Alice'),
      buildReaction('👍', 'u2', 'Bob'),
      buildReaction('❤️', 'u3', 'Charlie'),
    ];

    const mockFetchNext = vi.fn().mockResolvedValue(reactions);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    // All reactions shown by default
    expect(result.current.filteredReactions).toHaveLength(3);

    // Filter by 👍
    act(() => {
      result.current.selectEmoji('👍');
    });

    expect(result.current.selectedEmoji).toBe('👍');
    expect(result.current.filteredReactions).toHaveLength(2);

    // Back to all
    act(() => {
      result.current.selectEmoji(null);
    });

    expect(result.current.selectedEmoji).toBeNull();
    expect(result.current.filteredReactions).toHaveLength(3);
  });

  // ─── handleItemClick ──────────────────────────────────────────────

  it('handleItemClick removes reaction optimistically for current user', async () => {
    const reactions = [
      buildReaction('👍', 'alice-1', 'Alice'),
      buildReaction('👍', 'bob-1', 'Bob'),
    ];

    const mockFetchNext = vi.fn().mockResolvedValue(reactions);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    await waitFor(() => {
      expect(result.current.loggedInUserUid).toBe('alice-1');
    });

    expect(result.current.allReactions).toHaveLength(2);

    act(() => {
      result.current.handleItemClick(reactions[0]!);
    });

    expect(result.current.allReactions).toHaveLength(1);
    expect(result.current.allReactions[0]?.getReactedBy().getUid()).toBe('bob-1');
  });

  it('handleItemClick does nothing for non-current-user reactions', async () => {
    const reactions = [
      buildReaction('👍', 'alice-1', 'Alice'),
      buildReaction('👍', 'bob-1', 'Bob'),
    ];

    const mockFetchNext = vi.fn().mockResolvedValue(reactions);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    await waitFor(() => {
      expect(result.current.loggedInUserUid).toBe('alice-1');
    });

    // Try to click Bob's reaction (not current user)
    act(() => {
      result.current.handleItemClick(reactions[1]!);
    });

    // Should not be removed
    expect(result.current.allReactions).toHaveLength(2);
  });

  it('calls onItemClick callback when current user clicks their reaction', async () => {
    const reactions = [buildReaction('👍', 'alice-1', 'Alice')];

    const mockFetchNext = vi.fn().mockResolvedValue(reactions);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    const onItemClick = vi.fn();
    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message, onItemClick }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    await waitFor(() => {
      expect(result.current.loggedInUserUid).toBe('alice-1');
    });

    act(() => {
      result.current.handleItemClick(reactions[0]!);
    });

    expect(onItemClick).toHaveBeenCalledWith(reactions[0], message);
  });

  // ─── onEmpty ──────────────────────────────────────────────────────

  it('onEmpty fires when last reaction is removed', async () => {
    const reactions = [buildReaction('👍', 'alice-1', 'Alice')];

    const mockFetchNext = vi.fn().mockResolvedValue(reactions);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    const onEmpty = vi.fn();
    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message, onEmpty }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    await waitFor(() => {
      expect(result.current.loggedInUserUid).toBe('alice-1');
    });

    act(() => {
      result.current.handleItemClick(reactions[0]!);
    });

    expect(onEmpty).toHaveBeenCalledTimes(1);
  });

  it('onEmpty does NOT fire when other reactions remain', async () => {
    const reactions = [
      buildReaction('👍', 'alice-1', 'Alice'),
      buildReaction('❤️', 'bob-1', 'Bob'),
    ];

    const mockFetchNext = vi.fn().mockResolvedValue(reactions);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    const onEmpty = vi.fn();
    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message, onEmpty }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    await waitFor(() => {
      expect(result.current.loggedInUserUid).toBe('alice-1');
    });

    act(() => {
      result.current.handleItemClick(reactions[0]!);
    });

    expect(onEmpty).not.toHaveBeenCalled();
  });

  // ─── retry ────────────────────────────────────────────────────────

  it('retry resets and re-fetches', async () => {
    // First fetch fails
    const mockFetchNext = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue([buildReaction('👍', 'u1', 'Alice')]);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    const onError = vi.fn();
    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message, onError }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('error');
    });

    expect(onError).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    expect(result.current.allReactions).toHaveLength(1);
  });

  // ─── onError ──────────────────────────────────────────────────────

  it('calls onError callback on fetch failure', async () => {
    const error = new Error('Network error');
    const mockFetchNext = vi.fn().mockRejectedValue(error);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    const onError = vi.fn();
    const message = buildMessage();
    renderHook(() => useCometChatReactionList({ message, onError }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  // ─── Derived values ───────────────────────────────────────────────

  it('emojiTabs contains unique emojis from reactions', async () => {
    const reactions = [
      buildReaction('👍', 'u1', 'Alice'),
      buildReaction('👍', 'u2', 'Bob'),
      buildReaction('❤️', 'u3', 'Charlie'),
    ];

    const mockFetchNext = vi.fn().mockResolvedValue(reactions);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    expect(result.current.emojiTabs).toEqual(['👍', '❤️']);
  });

  it('totalCount equals allReactions.length', async () => {
    const reactions = [
      buildReaction('👍', 'u1', 'Alice'),
      buildReaction('❤️', 'u2', 'Bob'),
      buildReaction('😂', 'u3', 'Charlie'),
    ];

    const mockFetchNext = vi.fn().mockResolvedValue(reactions);
    const mockBuild = vi.fn().mockReturnValue({ fetchNext: mockFetchNext });
    vi.mocked(CometChat.ReactionsRequestBuilder).mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setMessageId: vi.fn().mockReturnThis(),
      build: mockBuild,
    }));

    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    expect(result.current.totalCount).toBe(3);
  });

  // ─── isCurrentUser ────────────────────────────────────────────────

  it('isCurrentUser returns true for logged-in user reactions', async () => {
    const message = buildMessage();
    const { result } = renderHook(() => useCometChatReactionList({ message }));

    await waitFor(() => {
      expect(result.current.loggedInUserUid).toBe('alice-1');
    });

    const aliceReaction = buildReaction('👍', 'alice-1', 'Alice');
    const bobReaction = buildReaction('👍', 'bob-1', 'Bob');

    expect(result.current.isCurrentUser(aliceReaction)).toBe(true);
    expect(result.current.isCurrentUser(bobReaction)).toBe(false);
  });
});
