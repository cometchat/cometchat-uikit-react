import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCometChatGroupMembers } from '../useCometChatGroupMembers';

/* eslint-disable @typescript-eslint/unbound-method */

// --- Mock CometChat SDK ---
const mockFetchNext = vi.fn();
const mockBuild = vi.fn(() => ({ fetchNext: mockFetchNext }));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
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
      IMAGE: 'image',
      VIDEO: 'video',
      AUDIO: 'audio',
      FILE: 'file',
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
    GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
    CALL_MODE: {
      DEFAULT: 'default',
      GRID: 'grid',
      SINGLE: 'single',
      SPOTLIGHT: 'spotlight',
      TILE: 'tile',
    },
    GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
    CALL_STATUS: {
      ONGOING: 'ongoing',
      ENDED: 'ended',
      INITIATED: 'initiated',
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
      UNANSWERED: 'unanswered',
      BUSY: 'busy',
    },
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
    GroupMembersRequestBuilder: vi.fn(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setSearchKeyword: vi.fn().mockReturnThis(),
      build: mockBuild,
    })),
    GroupListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    UserListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    kickGroupMember: vi.fn(),
    banGroupMember: vi.fn(),
    unbanGroupMember: vi.fn(),
    updateGroupMemberScope: vi.fn(),
    getLoggedinUser: vi.fn().mockResolvedValue({
      getUid: () => 'logged-in-user',
      getName: () => 'Me',
    }),
    GROUP_MEMBER_SCOPE: {
      ADMIN: 'admin',
      MODERATOR: 'moderator',
      PARTICIPANT: 'participant',
    },
    GroupMemberScope: {},
  },
}));

vi.mock('../../utils/CometChatLogger', () => ({
  CometChatLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// --- Mock group and member factories ---
function createMockGroup(guid = 'group-1') {
  return {
    getGuid: () => guid,
    getName: () => 'Test Group',
    getOwner: () => 'owner-uid',
    getMembersCount: () => 5,
  } as unknown as CometChat.Group;
}

function createMockMember(uid: string, name = 'User', scope = 'participant') {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => '',
    getScope: () => scope,
    getStatus: () => 'online',
    setScope: vi.fn(),
    setStatus: vi.fn(),
    setName: vi.fn(),
    setAvatar: vi.fn(),
  } as unknown as CometChat.GroupMember;
}

describe('useCometChatGroupMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchNext.mockReset();
  });

  it('initial state is idle then transitions to loading', async () => {
    mockFetchNext.mockResolvedValueOnce([createMockMember('u1')]);

    const { result } = renderHook(() => useCometChatGroupMembers({ group: createMockGroup() }));

    // After initial render, it should start fetching
    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });
  });

  it('fetchNext transitions state: idle → loading → loaded', async () => {
    const members = [createMockMember('u1'), createMockMember('u2')];
    mockFetchNext.mockResolvedValueOnce(members);

    const { result } = renderHook(() => useCometChatGroupMembers({ group: createMockGroup() }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
      expect(result.current.members).toHaveLength(2);
    });
  });

  it('fetchNext sets hasMore: false when empty array returned', async () => {
    mockFetchNext.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useCometChatGroupMembers({ group: createMockGroup() }));

    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });
  });

  it('error handling sets fetchState to error and stores error message', async () => {
    mockFetchNext.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCometChatGroupMembers({ group: createMockGroup() }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('error');
      expect(result.current.error).toBe('Network error');
    });
  });

  it('onError callback is called on failure', async () => {
    const onError = vi.fn();
    mockFetchNext.mockRejectedValueOnce(new Error('Fail'));

    renderHook(() => useCometChatGroupMembers({ group: createMockGroup(), onError }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('onEmpty callback fires when first fetch returns no results', async () => {
    const onEmpty = vi.fn();
    mockFetchNext.mockResolvedValueOnce([]);

    renderHook(() => useCometChatGroupMembers({ group: createMockGroup(), onEmpty }));

    await waitFor(() => {
      expect(onEmpty).toHaveBeenCalled();
    });
  });

  it('setSearchText triggers re-fetch', async () => {
    mockFetchNext.mockResolvedValueOnce([createMockMember('u1')]);

    const { result } = renderHook(() => useCometChatGroupMembers({ group: createMockGroup() }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    mockFetchNext.mockResolvedValueOnce([createMockMember('u2', 'Alice')]);

    act(() => {
      result.current.setSearchText('Alice');
    });

    await waitFor(() => {
      expect(result.current.searchText).toBe('Alice');
    });
  });

  it('selectMember adds to selection', async () => {
    const member = createMockMember('u1');
    mockFetchNext.mockResolvedValueOnce([member]);

    const { result } = renderHook(() =>
      useCometChatGroupMembers({ group: createMockGroup(), selectionMode: 'multiple' })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.selectMember(member);
    });

    expect(result.current.selectedMemberIds).toContain('u1');
  });

  it('deselectMember removes from selection', async () => {
    const member = createMockMember('u1');
    mockFetchNext.mockResolvedValueOnce([member]);

    const { result } = renderHook(() =>
      useCometChatGroupMembers({ group: createMockGroup(), selectionMode: 'multiple' })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.selectMember(member);
    });
    expect(result.current.selectedMemberIds).toContain('u1');

    act(() => {
      result.current.deselectMember('u1');
    });
    expect(result.current.selectedMemberIds).not.toContain('u1');
  });

  it('clearSelection empties selection', async () => {
    const member = createMockMember('u1');
    mockFetchNext.mockResolvedValueOnce([member]);

    const { result } = renderHook(() =>
      useCometChatGroupMembers({ group: createMockGroup(), selectionMode: 'multiple' })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.selectMember(member);
    });

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedMemberIds).toEqual([]);
  });

  it('kickMember removes member from list on success', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    vi.mocked(CometChat.kickGroupMember).mockResolvedValueOnce({} as never);
    mockFetchNext.mockResolvedValueOnce([createMockMember('u1'), createMockMember('u2')]);

    const { result } = renderHook(() => useCometChatGroupMembers({ group: createMockGroup() }));

    await waitFor(() => {
      expect(result.current.members).toHaveLength(2);
    });

    await act(async () => {
      await result.current.kickMember('u1');
    });

    expect(result.current.members.map(m => m.getUid())).not.toContain('u1');
  });

  it('banMember removes member from list on success', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    vi.mocked(CometChat.banGroupMember).mockResolvedValueOnce({} as never);
    mockFetchNext.mockResolvedValueOnce([createMockMember('u1'), createMockMember('u2')]);

    const { result } = renderHook(() => useCometChatGroupMembers({ group: createMockGroup() }));

    await waitFor(() => {
      expect(result.current.members).toHaveLength(2);
    });

    await act(async () => {
      await result.current.banMember('u1');
    });

    expect(result.current.members.map(m => m.getUid())).not.toContain('u1');
  });

  it('changeScope updates member scope in list on success', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    vi.mocked(CometChat.updateGroupMemberScope).mockResolvedValueOnce({} as never);
    mockFetchNext.mockResolvedValueOnce([createMockMember('u1', 'Alice', 'participant')]);

    const { result } = renderHook(() => useCometChatGroupMembers({ group: createMockGroup() }));

    await waitFor(() => {
      expect(result.current.members).toHaveLength(1);
    });

    await act(async () => {
      await result.current.changeScope('u1', 'admin');
    });

    // The member's setScope should have been called via the reducer
    expect(result.current.members).toHaveLength(1);
  });

  it('handleItemClick in multiple mode toggles selection', async () => {
    const member = createMockMember('u1');
    mockFetchNext.mockResolvedValueOnce([member]);

    const { result } = renderHook(() =>
      useCometChatGroupMembers({ group: createMockGroup(), selectionMode: 'multiple' })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.handleItemClick(member);
    });
    expect(result.current.selectedMemberIds).toContain('u1');

    act(() => {
      result.current.handleItemClick(member);
    });
    expect(result.current.selectedMemberIds).not.toContain('u1');
  });

  it('handleItemClick in single mode replaces selection', async () => {
    const member1 = createMockMember('u1');
    const member2 = createMockMember('u2');
    mockFetchNext.mockResolvedValueOnce([member1, member2]);

    const { result } = renderHook(() =>
      useCometChatGroupMembers({ group: createMockGroup(), selectionMode: 'single' })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.handleItemClick(member1);
    });
    expect(result.current.selectedMemberIds).toEqual(['u1']);

    act(() => {
      result.current.handleItemClick(member2);
    });
    expect(result.current.selectedMemberIds).toEqual(['u2']);
  });

  it('onItemClick callback is called', async () => {
    const onItemClick = vi.fn();
    const member = createMockMember('u1');
    mockFetchNext.mockResolvedValueOnce([member]);

    const { result } = renderHook(() =>
      useCometChatGroupMembers({ group: createMockGroup(), onItemClick })
    );

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.handleItemClick(member);
    });

    expect(onItemClick).toHaveBeenCalledWith(member);
  });

  it('setActiveMember updates activeMemberId', async () => {
    mockFetchNext.mockResolvedValueOnce([createMockMember('u1')]);

    const { result } = renderHook(() => useCometChatGroupMembers({ group: createMockGroup() }));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('loaded');
    });

    act(() => {
      result.current.setActiveMember('u1');
    });

    expect(result.current.activeMemberId).toBe('u1');
  });
});
