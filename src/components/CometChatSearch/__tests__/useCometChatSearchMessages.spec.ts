/**
 * Unit tests for useCometChatSearchMessages hook.
 *
 * Tests state transitions, search triggering, and loadMore behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    init: vi.fn(),
    getLoggedinUser: vi.fn().mockResolvedValue(null),
    isInitialized: vi.fn().mockReturnValue(true),
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    CATEGORY_MESSAGE: 'message',
    CATEGORY_CUSTOM: 'custom',
    CATEGORY_ACTION: 'action',
    CATEGORY_CALL: 'call',
    CATEGORY_INTERACTIVE: 'interactive',
    MessageCategory: { AGENTIC: 'agentic' },
    ModerationStatus: {
      PENDING: 'pending',
      APPROVED: 'approved',
      DISAPPROVED: 'disapproved',
      UNMODERATED: 'unmoderated',
    },
    MESSAGE_TYPE: {
      TEXT: 'text',
      FILE: 'file',
      IMAGE: 'image',
      AUDIO: 'audio',
      VIDEO: 'video',
      ASSISTANT: 'assistant',
      TOOL_ARGUMENTS: 'tool_arguments',
      TOOL_RESULT: 'tool_result',
    },
    ACTION_TYPE: {
      MEMBER_JOINED: 'joined',
      MEMBER_LEFT: 'left',
      MEMBER_ADDED: 'added',
      MEMBER_BANNED: 'banned',
      MEMBER_UNBANNED: 'unbanned',
      MEMBER_KICKED: 'kicked',
      MEMBER_INVITED: 'invited',
      MEMBER_SCOPE_CHANGED: 'scopeChanged',
    },
    GROUP_MEMBER_SCOPE: { ADMIN: 'admin', PARTICIPANT: 'participant', MODERATOR: 'moderator' },
    GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
    CALL_STATUS: {
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
      ONGOING: 'ongoing',
      ENDED: 'ended',
      INITIATED: 'initiated',
      UNANSWERED: 'unanswered',
      BUSY: 'busy',
    },
    CALL_TYPE: { VIDEO: 'video', AUDIO: 'audio' },
    CALL_MODE: { DEFAULT: 'DEFAULT' },
    GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
    AI_ASSISTANT_EVENTS: {
      RUN_STARTED: 'run_started',
      TEXT_MESSAGE_START: 'text_message_start',
      TEXT_MESSAGE_CONTENT: 'text_message_content',
      TEXT_MESSAGE_END: 'text_message_end',
      RUN_FINISHED: 'run_finished',
      TOOL_CALL_STARTED: 'tool_call_start',
      TOOL_CALL_ENDED: 'tool_call_end',
      TOOL_CALL_ARGUMENT: 'tool_call_args',
      TOOL_CALL_RESULT: 'tool_call_result',
    },
    MessagesRequestBuilder: vi.fn(),
  },
}));

// Mock the manager BEFORE importing the hook
const mockSearch = vi.fn();
const mockLoadMore = vi.fn();
const mockReset = vi.fn();

vi.mock('../CometChatSearchMessagesManager', () => ({
  CometChatSearchMessagesManager: vi.fn().mockImplementation(() => ({
    search: mockSearch,
    loadMore: mockLoadMore,
    reset: mockReset,
  })),
}));

import { useCometChatSearchMessages } from '../useCometChatSearchMessages';

describe('useCometChatSearchMessages', () => {
  const stableEmptyFilters: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockResolvedValue({ results: [], hasMore: false });
    mockLoadMore.mockResolvedValue({ results: [], hasMore: false });
  });

  describe('initial state', () => {
    it('starts with empty state when search criteria are invalid', async () => {
      const { result } = renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: '',
          activeFilters: stableEmptyFilters,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('empty');
      });
      expect(result.current.messages).toEqual([]);
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('search triggering', () => {
    it('triggers search when keyword is provided', async () => {
      const mockMessages = [
        { getId: () => 1, getType: () => 'text' },
        { getId: () => 2, getType: () => 'text' },
      ];
      mockSearch.mockResolvedValueOnce({ results: mockMessages, hasMore: false });

      const { result } = renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: 'hello',
          activeFilters: stableEmptyFilters,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      expect(result.current.messages).toHaveLength(2);
    });

    it('triggers search when uid is provided (even without keyword)', async () => {
      mockSearch.mockResolvedValueOnce({ results: [{ getId: () => 1 }], hasMore: false });

      const { result } = renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: '',
          activeFilters: stableEmptyFilters,
          uid: 'user-1',
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      expect(mockSearch).toHaveBeenCalled();
    });

    it('triggers search when guid is provided (even without keyword)', async () => {
      mockSearch.mockResolvedValueOnce({ results: [{ getId: () => 1 }], hasMore: false });

      const { result } = renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: '',
          activeFilters: stableEmptyFilters,
          guid: 'group-1',
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      expect(mockSearch).toHaveBeenCalled();
    });

    it('triggers search when message filters are active', async () => {
      mockSearch.mockResolvedValueOnce({ results: [{ getId: () => 1 }], hasMore: false });
      const photosFilter = ['photos'];

      const { result } = renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: '',
          activeFilters: photosFilter,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      expect(mockSearch).toHaveBeenCalled();
    });

    it('does NOT trigger search when criteria are invalid', async () => {
      const { result } = renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: '',
          activeFilters: stableEmptyFilters,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('empty');
      });

      expect(mockSearch).not.toHaveBeenCalled();
    });
  });

  describe('state transitions', () => {
    it('transitions to empty when search returns no results', async () => {
      mockSearch.mockResolvedValueOnce({ results: [], hasMore: false });

      const { result } = renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: 'nonexistent',
          activeFilters: stableEmptyFilters,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('empty');
      });
    });

    it('transitions to error on search failure', async () => {
      const onError = vi.fn();
      mockSearch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: 'hello',
          activeFilters: stableEmptyFilters,
          onError,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('error');
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('loadMore', () => {
    it('appends results on loadMore', async () => {
      const firstPage = [{ getId: () => 1 }, { getId: () => 2 }];
      mockSearch.mockResolvedValueOnce({ results: firstPage, hasMore: true });
      mockLoadMore.mockResolvedValueOnce({ results: [{ getId: () => 3 }], hasMore: false });

      const { result } = renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: 'hello',
          activeFilters: stableEmptyFilters,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      expect(result.current.hasMore).toBe(true);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.messages).toHaveLength(3);
      expect(result.current.hasMore).toBe(false);
    });

    it('does nothing when hasMore is false', async () => {
      mockSearch.mockResolvedValueOnce({ results: [{ getId: () => 1 }], hasMore: false });

      const { result } = renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: 'hello',
          activeFilters: stableEmptyFilters,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockLoadMore).not.toHaveBeenCalled();
    });

    it('calls onError when loadMore fails', async () => {
      const onError = vi.fn();
      mockSearch.mockResolvedValueOnce({ results: [{ getId: () => 1 }], hasMore: true });
      mockLoadMore.mockRejectedValueOnce(new Error('Load more failed'));

      const { result } = renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: 'hello',
          activeFilters: stableEmptyFilters,
          onError,
        })
      );

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('onStateChange callback', () => {
    it('calls onStateChange when fetchState changes', async () => {
      const onStateChange = vi.fn();
      mockSearch.mockResolvedValueOnce({ results: [{ getId: () => 1 }], hasMore: false });

      renderHook(() =>
        useCometChatSearchMessages({
          searchKeyword: 'hello',
          activeFilters: stableEmptyFilters,
          onStateChange,
        })
      );

      await waitFor(() => {
        expect(onStateChange).toHaveBeenCalled();
      });
    });
  });
});
