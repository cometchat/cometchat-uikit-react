import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { usePinSaveActions } from '../usePinSaveActions';
import { resolvePinSaveLimits, resetPinSaveLimits } from '../../utils/pinSaveLimits';
import { CometChatEventsContext } from '../../context/CometChatEventsContext';
import type { CometChatUIEvent } from '../../context/CometChatEvents.types';

const UID = 'alice';

let published: CometChatUIEvent[] = [];
let toasts: string[] = [];

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <CometChatEventsContext.Provider
      value={{
        subscribe: () => () => {
          /* no-op */
        },
        publish: (event: CometChatUIEvent) => {
          published.push(event);
        },
      }}
    >
      {children}
    </CometChatEventsContext.Provider>
  );
}

/** A message whose accessors behave like the SDK's: absent attr ⇒ not pinned/saved. */
function makeMessage(init: { pinnedAt?: number; pinnedBy?: string; savedAt?: number } = {}) {
  const state = { ...init };
  return {
    getId: () => 42,
    getPinnedAt: () => state.pinnedAt,
    getPinnedBy: () => state.pinnedBy,
    getSavedAt: () => state.savedAt,
    setPinnedAt: (v?: number) => {
      state.pinnedAt = v;
    },
    setPinnedBy: (v?: string) => {
      state.pinnedBy = v;
    },
    setSavedAt: (v?: number) => {
      state.savedAt = v;
    },
    isPinned: () => state.pinnedAt !== undefined,
    isSaved: () => state.savedAt !== undefined,
    __state: state,
  } as unknown as CometChat.BaseMessage & {
    __state: { pinnedAt?: number; pinnedBy?: string; savedAt?: number };
  };
}

function setup() {
  return renderHook(
    () => usePinSaveActions({ loggedInUserUid: UID, showToast: t => toasts.push(t) }),
    { wrapper }
  );
}

/**
 * Fire a request and let it settle.
 *
 * Unpin and Unsave open a confirmation first, so this confirms on their behalf —
 * the gate itself is covered separately below.
 */
async function request(
  result: { current: ReturnType<typeof usePinSaveActions> },
  name: 'requestPin' | 'requestUnpin' | 'requestSave' | 'requestUnsave',
  msg: CometChat.BaseMessage
) {
  await act(async () => {
    result.current[name](msg);
    await Promise.resolve();
  });
  if (result.current.confirmState) {
    await act(async () => {
      result.current.confirm();
      await Promise.resolve();
    });
  }
}

beforeEach(() => {
  published = [];
  toasts = [];
});

afterEach(() => {
  vi.restoreAllMocks();
  resetPinSaveLimits();
});

describe('usePinSaveActions — pin and save act immediately', () => {
  it('calls the SDK straight away for an additive action', async () => {
    const msg = makeMessage();
    const pinSpy = vi.spyOn(CometChat, 'pinMessage').mockResolvedValue(msg);
    const { result } = setup();

    await request(result, 'requestPin', msg);

    await waitFor(() => {
      expect(pinSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('exposes a confirmation surface, but no "don\'t ask again"', () => {
    const { result } = setup();
    expect(Object.keys(result.current).sort()).toEqual([
      'cancel',
      'confirm',
      'confirmState',
      'isBusy',
      'requestPin',
      'requestSave',
      'requestUnpin',
      'requestUnsave',
    ]);
  });

  it('does not confirm before pinning', async () => {
    const msg = makeMessage();
    const pinSpy = vi.spyOn(CometChat, 'pinMessage').mockResolvedValue(msg);
    const { result } = setup();
    await act(async () => {
      result.current.requestPin(msg);
      await Promise.resolve();
    });
    expect(result.current.confirmState).toBeNull();
    expect(pinSpy).toHaveBeenCalledTimes(1);
  });

  it('ignores a second request while one is in flight', async () => {
    const msg = makeMessage();
    let resolveCall: (m: CometChat.BaseMessage) => void = () => undefined;
    const pinSpy = vi.spyOn(CometChat, 'pinMessage').mockReturnValue(
      new Promise(res => {
        resolveCall = res;
      })
    );
    const { result } = setup();

    act(() => {
      result.current.requestPin(msg);
      result.current.requestPin(msg);
    });

    expect(pinSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCall(msg);
      await Promise.resolve();
    });
  });
});

describe('usePinSaveActions — confirmation before display', () => {
  it('does NOT flip the attribute until the network call resolves', async () => {
    const msg = makeMessage();
    let resolveCall: (m: CometChat.BaseMessage) => void = () => undefined;
    vi.spyOn(CometChat, 'pinMessage').mockReturnValue(
      new Promise(res => {
        resolveCall = res;
      })
    );
    const { result } = setup();

    act(() => {
      result.current.requestPin(msg);
    });

    // In flight: still unpinned, and no surface has been told otherwise. Pinning
    // past the server's cap is a routine failure, and an optimistic flip made it
    // show the message as pinned before yanking it back.
    expect(msg.isPinned()).toBe(false);
    expect(published.some(e => e.type === 'ui:message/pin-changed')).toBe(false);

    await act(async () => {
      resolveCall(makeMessage({ pinnedAt: 999, pinnedBy: UID }));
      await Promise.resolve();
    });

    expect(msg.isPinned()).toBe(true);
  });

  it('publishes nothing at all when the call rejects', async () => {
    const msg = makeMessage();
    vi.spyOn(CometChat, 'pinMessage').mockRejectedValue({ code: 'ERR_LIMIT' });
    const { result } = setup();

    await request(result, 'requestPin', msg);

    // The panel must never see an insert it then has to undo.
    expect(published.some(e => e.type === 'ui:message/pin-changed')).toBe(false);
    expect(msg.isPinned()).toBe(false);
  });

  it('reconciles against the authoritative message the SDK returns', async () => {
    const msg = makeMessage();
    const authoritative = makeMessage({ pinnedAt: 999, pinnedBy: 'moderator-bob' });
    vi.spyOn(CometChat, 'pinMessage').mockResolvedValue(authoritative);
    const { result } = setup();

    await request(result, 'requestPin', msg);

    expect(msg.getPinnedAt()).toBe(999);
    expect(msg.getPinnedBy()).toBe('moderator-bob');
  });

  it('unpin CLEARS the attributes rather than zeroing them', async () => {
    const msg = makeMessage({ pinnedAt: 123, pinnedBy: 'alice' });
    vi.spyOn(CometChat, 'unpinMessage').mockResolvedValue(makeMessage());
    const { result } = setup();

    await request(result, 'requestUnpin', msg);

    expect(msg.getPinnedAt()).toBeUndefined();
    expect(msg.getPinnedBy()).toBeUndefined();
    expect(msg.isPinned()).toBe(false);
  });

  it('unsave clears savedAt', async () => {
    const msg = makeMessage({ savedAt: 123 });
    vi.spyOn(CometChat, 'unsaveMessage').mockResolvedValue(makeMessage());
    const { result } = setup();

    await request(result, 'requestUnsave', msg);

    expect(msg.getSavedAt()).toBeUndefined();
    expect(msg.isSaved()).toBe(false);
  });

  it('publishes a pin-changed UI event', async () => {
    const msg = makeMessage();
    vi.spyOn(CometChat, 'pinMessage').mockResolvedValue(msg);
    const { result } = setup();

    await request(result, 'requestPin', msg);

    expect(published.some(e => e.type === 'ui:message/pin-changed')).toBe(true);
  });

  it('publishes save-changed for save, never pin-changed', async () => {
    const msg = makeMessage();
    vi.spyOn(CometChat, 'saveMessage').mockResolvedValue(msg);
    const { result } = setup();

    await request(result, 'requestSave', msg);

    expect(published.some(e => e.type === 'ui:message/save-changed')).toBe(true);
    expect(published.some(e => e.type === 'ui:message/pin-changed')).toBe(false);
  });
});

describe('usePinSaveActions — failure handling', () => {
  it('leaves the message untouched when the call rejects', async () => {
    const msg = makeMessage();
    vi.spyOn(CometChat, 'pinMessage').mockRejectedValue({ code: 'ERR_API_NOT_FOUND' });
    const { result } = setup();

    await request(result, 'requestPin', msg);

    expect(msg.isPinned()).toBe(false);
    expect(msg.getPinnedAt()).toBeUndefined();
  });

  it('keeps the PREVIOUS pinner on a failed unpin, not just "unpinned"', async () => {
    const msg = makeMessage({ pinnedAt: 500, pinnedBy: 'original-pinner' });
    vi.spyOn(CometChat, 'unpinMessage').mockRejectedValue({ code: 'ERR_ACTION_NOT_ALLOWED' });
    const { result } = setup();

    await request(result, 'requestUnpin', msg);

    // Never cleared in the first place, so there is nothing to restore.
    expect(msg.getPinnedAt()).toBe(500);
    expect(msg.getPinnedBy()).toBe('original-pinner');
  });

  it('shows the permission toast for a permission-denied code', async () => {
    const msg = makeMessage();
    vi.spyOn(CometChat, 'pinMessage').mockRejectedValue({ code: 'ERR_PERMISSION_DENIED' });
    const { result } = setup();

    await request(result, 'requestPin', msg);

    expect(toasts).toContain("You don't have permission to perform this action.");
  });

  it('shows the warmed app-settings cap when a pin limit is hit', async () => {
    const msg = makeMessage();
    vi.spyOn(CometChat, 'pinMessage').mockRejectedValue({
      code: 'ERR_PINNED_MESSAGES_LIMIT_EXCEEDED',
    });
    // Spy all three so the warm-up never touches the (uninitialised) real SDK.
    vi.spyOn(CometChat, 'getPinnedMessagesLimit').mockResolvedValue(250);
    vi.spyOn(CometChat, 'getSavedMessagesLimit').mockResolvedValue(null);
    vi.spyOn(CometChat, 'getPinnedConversationsLimit').mockResolvedValue(null);
    await resolvePinSaveLimits();
    const { result } = setup();

    await request(result, 'requestPin', msg);

    expect(toasts).toContain('You can only pin 250 messages. Unpin one to pin another.');
  });

  it('falls back to the cap in the error text when the setting is unknown', async () => {
    const msg = makeMessage();
    // Detection is by the exact code; the number still falls back to the text
    // when the warmed setting is unknown.
    vi.spyOn(CometChat, 'saveMessage').mockRejectedValue({
      code: 'ERR_SAVED_MESSAGES_LIMIT_EXCEEDED',
      message: 'has reached the allowed limit of 42.',
    });
    const { result } = setup();

    await request(result, 'requestSave', msg);

    expect(toasts).toContain('You can save up to 42 messages.');
  });

  it('falls back to generic copy for a non-limit failure', async () => {
    const msg = makeMessage();
    vi.spyOn(CometChat, 'saveMessage').mockRejectedValue({ code: 'ERR_SOMETHING' });
    const { result } = setup();

    await request(result, 'requestSave', msg);

    expect(toasts).toContain('Something went wrong. Please try again.');
  });

  it('does not toast success when the call failed', async () => {
    const msg = makeMessage();
    vi.spyOn(CometChat, 'pinMessage').mockRejectedValue({ code: 'ERR' });
    const { result } = setup();

    await request(result, 'requestPin', msg);

    expect(toasts).not.toContain('Message pinned');
  });
});

describe('usePinSaveActions — toasts', () => {
  it.each([
    ['requestPin', 'pinMessage', 'Message pinned'],
    ['requestUnpin', 'unpinMessage', 'Message unpinned'],
    ['requestSave', 'saveMessage', 'Message saved'],
    ['requestUnsave', 'unsaveMessage', 'Message unsaved'],
  ] as const)('%s toasts "%s"', async (name, sdkMethod, expected) => {
    const msg = makeMessage({ pinnedAt: 1, pinnedBy: 'x', savedAt: 1 });
    vi.spyOn(CometChat, sdkMethod).mockResolvedValue(msg);
    const { result } = setup();

    await request(result, name, msg);

    expect(toasts).toContain(expected);
  });
});

describe('usePinSaveActions — confirmation on the removing actions', () => {
  it.each([
    ['requestUnpin', 'unpinMessage', 'unpin'],
    ['requestUnsave', 'unsaveMessage', 'unsave'],
  ] as const)('%s asks before acting', (name, sdkMethod, action) => {
    const msg = makeMessage({ pinnedAt: 1, pinnedBy: 'x', savedAt: 1 });
    const spy = vi.spyOn(CometChat, sdkMethod);
    const { result } = setup();

    act(() => {
      result.current[name](msg);
    });

    expect(result.current.confirmState?.action).toBe(action);
    expect(spy).not.toHaveBeenCalled();
  });

  it('acts once confirmed', async () => {
    const msg = makeMessage({ pinnedAt: 1, pinnedBy: 'x' });
    const spy = vi.spyOn(CometChat, 'unpinMessage').mockResolvedValue(msg);
    const { result } = setup();

    act(() => {
      result.current.requestUnpin(msg);
    });
    await act(async () => {
      result.current.confirm();
      await Promise.resolve();
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.current.confirmState).toBeNull();
  });

  it('cancel acts on nothing and leaves the message untouched', () => {
    const msg = makeMessage({ pinnedAt: 123, pinnedBy: 'alice' });
    const spy = vi.spyOn(CometChat, 'unpinMessage');
    const { result } = setup();

    act(() => {
      result.current.requestUnpin(msg);
    });
    act(() => {
      result.current.cancel();
    });

    expect(result.current.confirmState).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    // No optimistic flip either — the pin survives an abandoned confirmation.
    expect(msg.isPinned()).toBe(true);
  });
});
