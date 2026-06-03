/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCometChatCallLogs } from '../useCometChatCallLogs';
import { CometChat } from '@cometchat/chat-sdk-javascript';

const mockFetchNext = vi.fn();

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    getLoggedinUser: vi.fn(),
    addCallListener: vi.fn(),
    removeCallListener: vi.fn(),
    initiateCall: vi.fn(),
    rejectCall: vi.fn(),
    Call: vi.fn().mockImplementation((uid: string, type: string, receiverType: string) => ({
      getSessionId: () => 'new-session-123',
      getType: () => type,
      getReceiver: () => ({ getUid: () => uid }),
      getReceiverType: () => receiverType,
    })),
    CallListener: vi.fn().mockImplementation((cb: unknown) => cb),
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
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
    CALL_MODE: {
      DEFAULT: 'DEFAULT',
      GRID: 'GRID',
      SINGLE: 'SINGLE',
      SPOTLIGHT: 'SPOTLIGHT',
      TILE: 'TILE',
    },
    CATEGORY_MESSAGE: 'message',
    CATEGORY_CUSTOM: 'custom',
    CATEGORY_ACTION: 'action',
    CATEGORY_CALL: 'call',
    CATEGORY_INTERACTIVE: 'interactive',
    MessageCategory: { AGENTIC: 'agentic' },
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
    ModerationStatus: {
      PENDING: 'pending',
      APPROVED: 'approved',
      DISAPPROVED: 'disapproved',
      UNMODERATED: 'unmoderated',
    },
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
  },
}));

vi.mock('../../../CometChatUIKit/CometChatCalls', () => ({
  CometChatUIKitCalls: {
    CallLogRequestBuilder: vi.fn().mockImplementation(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setCallCategory: vi.fn().mockReturnThis(),
      setAuthToken: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({ fetchNext: mockFetchNext }),
    })),
  },
}));

vi.mock('../../../hooks/useCometChatEvents', () => ({
  useCometChatEvents: vi.fn(),
}));

const mockLoggedInUser = {
  getUid: () => 'logged-in-user',
  getName: () => 'Me',
  getAuthToken: () => 'auth-token-123',
} as unknown as CometChat.User;

describe('useCometChatCallLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CometChat.getLoggedinUser).mockResolvedValue(mockLoggedInUser);
    mockFetchNext.mockResolvedValue([]);
  });

  // ─── Initial state ──────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with idle fetchState', () => {
      const { result } = renderHook(() => useCometChatCallLogs());
      expect(result.current.fetchState).toBe('idle');
    });

    it('starts with empty callList', () => {
      const { result } = renderHook(() => useCometChatCallLogs());
      expect(result.current.callList).toEqual([]);
    });

    it('starts with hasMore true', () => {
      const { result } = renderHook(() => useCometChatCallLogs());
      expect(result.current.hasMore).toBe(true);
    });

    it('starts with loggedInUser null', () => {
      const { result } = renderHook(() => useCometChatCallLogs());
      expect(result.current.loggedInUser).toBeNull();
    });
  });

  // ─── Fetching call logs ─────────────────────────────────────────

  describe('fetching call logs', () => {
    it('fetches logged-in user on mount', async () => {
      renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(vi.mocked(CometChat.getLoggedinUser)).toHaveBeenCalled();
      });
    });

    it('sets loggedInUser after fetching', async () => {
      const { result } = renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(result.current.loggedInUser).not.toBeNull();
      });
      expect(result.current.loggedInUser?.getUid()).toBe('logged-in-user');
    });

    it('fetches first page of call logs after getting user', async () => {
      const mockCalls = [
        {
          getSessionID: () => 'session-1',
          getInitiator: () => ({ getUid: () => 'logged-in-user' }),
          getReceiver: () => ({ getUid: () => 'user-2', getName: () => 'Bob' }),
          getType: () => 'audio',
          getStatus: () => 'ended',
        },
      ];
      mockFetchNext.mockResolvedValue(mockCalls);

      const { result } = renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(result.current.fetchState).toBe('loaded');
      });
      expect(result.current.callList).toHaveLength(1);
    });

    it('sets fetchState to empty when no call logs exist', async () => {
      mockFetchNext.mockResolvedValue([]);

      const { result } = renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(result.current.fetchState).toBe('empty');
      });
    });

    it('sets fetchState to error on SDK failure', async () => {
      mockFetchNext.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(result.current.fetchState).toBe('error');
      });
    });

    it('calls onError callback on SDK failure', async () => {
      const onError = vi.fn();
      const error = new Error('Network error');
      mockFetchNext.mockRejectedValue(error);

      renderHook(() => useCometChatCallLogs({ onError }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });
  });

  // ─── fetchNext (pagination) ─────────────────────────────────────

  describe('fetchNext', () => {
    it('appends new calls to existing list', async () => {
      mockFetchNext.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([{ id: 2 }]);

      const { result } = renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(result.current.callList).toHaveLength(1);
      });

      await act(async () => {
        await result.current.fetchNext();
      });

      expect(result.current.callList).toHaveLength(2);
    });

    it('does not fetch when hasMore is false', async () => {
      mockFetchNext.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(result.current.hasMore).toBe(false);
      });

      const callCountBefore = mockFetchNext.mock.calls.length;

      await act(async () => {
        await result.current.fetchNext();
      });

      expect(mockFetchNext.mock.calls.length).toBe(callCountBefore);
    });
  });

  // ─── handleCallButtonClick ──────────────────────────────────────

  describe('handleCallButtonClick', () => {
    it('calls onCallButtonClicked callback when provided', async () => {
      const onCallButtonClicked = vi.fn();
      mockFetchNext.mockResolvedValue([]);

      const { result } = renderHook(() => useCometChatCallLogs({ onCallButtonClicked }));

      await waitFor(() => {
        expect(result.current.loggedInUser).not.toBeNull();
      });

      const mockCall = { id: 1, type: 'audio' };
      act(() => {
        result.current.handleCallButtonClick(mockCall);
      });

      expect(onCallButtonClicked).toHaveBeenCalledWith(mockCall);
    });

    it('initiates a call when no onCallButtonClicked is provided', async () => {
      vi.mocked(CometChat.initiateCall).mockResolvedValue({
        getSessionId: () => 'new-session',
        getType: () => 'audio',
      } as unknown as CometChat.Call);

      mockFetchNext.mockResolvedValue([]);

      const { result } = renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(result.current.loggedInUser).not.toBeNull();
      });

      const mockCall = {
        getInitiator: () => ({ getUid: () => 'logged-in-user' }),
        getReceiver: () => ({ getUid: () => 'user-2', getName: () => 'Bob' }),
        type: 'audio',
        getType: () => 'audio',
      };

      act(() => {
        result.current.handleCallButtonClick(mockCall);
      });

      await waitFor(() => {
        expect(vi.mocked(CometChat.initiateCall)).toHaveBeenCalled();
      });
    });
  });

  // ─── cancelOutgoingCall ─────────────────────────────────────────

  describe('cancelOutgoingCall', () => {
    it('rejects the active call with CANCELLED status', async () => {
      vi.mocked(CometChat.initiateCall).mockResolvedValue({
        getSessionId: () => 'new-session',
        getType: () => 'audio',
      } as unknown as CometChat.Call);
      vi.mocked(CometChat.rejectCall).mockResolvedValue({} as unknown as CometChat.Call);
      mockFetchNext.mockResolvedValue([]);

      const { result } = renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(result.current.loggedInUser).not.toBeNull();
      });

      // First initiate a call
      const mockCall = {
        getInitiator: () => ({ getUid: () => 'logged-in-user' }),
        getReceiver: () => ({ getUid: () => 'user-2', getName: () => 'Bob', uid: 'user-2' }),
        type: 'audio',
        getType: () => 'audio',
      };

      act(() => {
        result.current.handleCallButtonClick(mockCall);
      });

      await waitFor(() => {
        expect(result.current.showOutgoingCallScreen).toBe(true);
      });

      // Now cancel it
      act(() => {
        result.current.cancelOutgoingCall();
      });

      await waitFor(() => {
        expect(vi.mocked(CometChat.rejectCall)).toHaveBeenCalledWith('new-session', 'cancelled');
      });
    });
  });

  // ─── closeCallScreen ────────────────────────────────────────────

  describe('closeCallScreen', () => {
    it('resets call-related state', async () => {
      mockFetchNext.mockResolvedValue([]);

      const { result } = renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(result.current.loggedInUser).not.toBeNull();
      });

      act(() => {
        result.current.closeCallScreen();
      });

      expect(result.current.showOngoingCall).toBe(false);
      expect(result.current.callSessionId).toBeNull();
      expect(result.current.activeCallObj).toBeNull();
    });
  });

  // ─── SDK call listener ──────────────────────────────────────────

  describe('SDK call listener', () => {
    it('attaches a call listener when loggedInUser is available', async () => {
      mockFetchNext.mockResolvedValue([]);

      renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(vi.mocked(CometChat.addCallListener)).toHaveBeenCalled();
      });
    });

    it('removes the call listener on unmount', async () => {
      mockFetchNext.mockResolvedValue([]);

      const { unmount } = renderHook(() => useCometChatCallLogs());

      await waitFor(() => {
        expect(vi.mocked(CometChat.addCallListener)).toHaveBeenCalled();
      });

      unmount();

      expect(vi.mocked(CometChat.removeCallListener)).toHaveBeenCalled();
    });
  });

  // ─── showOutgoingCallScreen / showOngoingCall ───────────────────

  describe('call screen states', () => {
    it('starts with showOutgoingCallScreen false', () => {
      const { result } = renderHook(() => useCometChatCallLogs());
      expect(result.current.showOutgoingCallScreen).toBe(false);
    });

    it('starts with showOngoingCall false', () => {
      const { result } = renderHook(() => useCometChatCallLogs());
      expect(result.current.showOngoingCall).toBe(false);
    });

    it('starts with activeCallObj null', () => {
      const { result } = renderHook(() => useCometChatCallLogs());
      expect(result.current.activeCallObj).toBeNull();
    });

    it('starts with callSessionId null', () => {
      const { result } = renderHook(() => useCometChatCallLogs());
      expect(result.current.callSessionId).toBeNull();
    });
  });
});
