import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { usePinConversationActions } from '../usePinConversationActions';
import { CometChatEventsContext } from '../../context/CometChatEventsContext';
import { resetPinSaveLimits } from '../../utils/pinSaveLimits';

let toasts: string[] = [];
/** Every toast as [text, variant], for the assertions that care about the variant. */
let toastCalls: [string, string | undefined][] = [];

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <CometChatEventsContext.Provider
      value={{
        subscribe: () => () => {
          /* no-op */
        },
        publish: () => {
          /* no-op */
        },
      }}
    >
      {children}
    </CometChatEventsContext.Provider>
  );
}

/** A conversation whose pin attributes behave like the SDK's. */
function conv(pin: 'global' | 'user' | 'none' = 'user'): CometChat.Conversation {
  const state: { pinnedAt?: number; pinnedBy?: string } = {
    pinnedAt: pin === 'none' ? undefined : 100,
    pinnedBy: pin === 'global' ? 'app_system' : pin === 'user' ? 'me' : undefined,
  };
  return {
    getConversationId: () => 'c1',
    getConversationType: () => 'user',
    getConversationWith: () => ({ getUid: () => 'bob' }),
    getPinnedAt: () => state.pinnedAt,
    getPinnedBy: () => state.pinnedBy,
    setPinnedAt: (v?: number) => {
      state.pinnedAt = v;
    },
    setPinnedBy: (v?: string) => {
      state.pinnedBy = v;
    },
    isPinned: () => state.pinnedAt !== undefined,
    isSystemPinned: () => state.pinnedBy === 'app_system',
  } as unknown as CometChat.Conversation;
}

function setup() {
  return renderHook(() => usePinConversationActions({
        showToast: (t, variant) => {
          toasts.push(t);
          toastCalls.push([t, variant]);
        },
      }), {
    wrapper,
  });
}

beforeEach(() => {
  toasts = [];
  toastCalls = [];
});

afterEach(() => {
  vi.restoreAllMocks();
  resetPinSaveLimits();
});

describe('usePinConversationActions', () => {
  it('pins immediately — additive, no confirmation', async () => {
    const c = conv('none');
    const spy = vi.spyOn(CometChat, 'pinConversation').mockResolvedValue(c);
    const { result } = setup();

    await act(async () => {
      result.current.requestPin(c);
      await Promise.resolve();
    });

    expect(result.current.confirmState).toBeNull();
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it('asks before unpinning', () => {
    const c = conv('user');
    const spy = vi.spyOn(CometChat, 'unpinConversation');
    const { result } = setup();

    act(() => {
      result.current.requestUnpin(c);
    });

    expect(result.current.confirmState?.action).toBe('unpin-conversation');
    expect(spy).not.toHaveBeenCalled();
  });

  it('unpins once confirmed', async () => {
    const c = conv('user');
    const spy = vi.spyOn(CometChat, 'unpinConversation').mockResolvedValue(c);
    const { result } = setup();

    act(() => {
      result.current.requestUnpin(c);
    });
    await act(async () => {
      result.current.confirm();
      await Promise.resolve();
    });

    expect(spy).toHaveBeenCalledWith('bob', 'user');
    expect(result.current.confirmState).toBeNull();
  });

  it('cancel leaves the pin untouched', () => {
    const c = conv('user');
    const spy = vi.spyOn(CometChat, 'unpinConversation');
    const { result } = setup();

    act(() => {
      result.current.requestUnpin(c);
    });
    act(() => {
      result.current.cancel();
    });

    expect(result.current.confirmState).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    // No optimistic flip either — an abandoned confirmation changes nothing.
    expect(c.isPinned()).toBe(true);
  });

  it('refuses an admin-global pin without opening a confirmation', () => {
    // The server would reject it; say so rather than asking a pointless question.
    const c = conv('global');
    const spy = vi.spyOn(CometChat, 'unpinConversation');
    const { result } = setup();

    act(() => {
      result.current.requestUnpin(c);
    });

    expect(result.current.confirmState).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    expect(toasts).toContain("You can't unpin a conversation pinned by an admin.");
  });

  it('names the pinned-chats cap when the pin limit is hit', async () => {
    // No warmed app setting, so the number comes from the error text.
    const c = conv('none');
    vi.spyOn(CometChat, 'pinConversation').mockRejectedValue({
      code: 'ERR_PINNED_CONVERSATIONS_LIMIT_EXCEEDED',
      message: 'has reached the allowed limit of 7.',
    });
    const { result } = setup();

    await act(async () => {
      result.current.requestPin(c);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(toastCalls).toContainEqual([
        'You can only pin 7 chats. Unpin one to pin another.',
        'error',
      ]);
    });
  });
});
