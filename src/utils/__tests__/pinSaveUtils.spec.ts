/**
 * Unit tests for the Pin/Save shared helpers.
 *
 * The invariant under test throughout: the PRESENCE of `pinnedAt`/`savedAt` is the
 * boolean. A message that was unpinned has the field CLEARED, never zeroed — so any
 * implementation that compares against 0 must fail these tests.
 */
import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  isPinned,
  isSaved,
  isSystemPinned,
  getPinnedBy,
  isPinSaveEligible,
  isThreadReply,
  readLimitFromError,
  isLimitError,
  isPermissionError,
} from '../pinSaveUtils';

type Msg = CometChat.BaseMessage;

interface MsgOverrides {
  id?: number;
  pinnedAt?: number | undefined;
  pinnedBy?: string | undefined;
  savedAt?: number | undefined;
  deletedAt?: number;
  category?: string;
  parentMessageId?: number;
}

/**
 * Build a message whose pin/save accessors behave exactly like the SDK's:
 * `isPinned()` is `pinnedAt !== undefined`, and the getters return undefined
 * when the attribute is absent.
 */
function makeMessage(o: MsgOverrides = {}): Msg {
  const { id = 101, pinnedAt, pinnedBy, savedAt, deletedAt = 0 } = o;
  return {
    getId: () => id,
    getPinnedAt: () => pinnedAt,
    getPinnedBy: () => pinnedBy,
    getSavedAt: () => savedAt,
    isPinned: () => pinnedAt !== undefined,
    isSaved: () => savedAt !== undefined,
    isSystemPinned: () => pinnedAt !== undefined && pinnedBy === 'app_system',
    getDeletedAt: () => deletedAt,
    getCategory: () => o.category ?? 'message',
    getParentMessageId: () => o.parentMessageId ?? 0,
  } as unknown as Msg;
}

describe('isPinned / isSaved — presence is the boolean', () => {
  it('reports not-pinned when the attribute is absent', () => {
    expect(isPinned(makeMessage())).toBe(false);
  });

  it('reports pinned when the attribute is present', () => {
    expect(isPinned(makeMessage({ pinnedAt: 1735689600 }))).toBe(true);
  });

  it('treats a pinnedAt of 0 as PINNED, not as unpinned', () => {
    // A cleared attribute is `undefined`, never 0. An implementation that used
    // `getPinnedAt() > 0` would wrongly report false here.
    expect(isPinned(makeMessage({ pinnedAt: 0 }))).toBe(true);
  });

  it('reports not-saved when the attribute is absent', () => {
    expect(isSaved(makeMessage())).toBe(false);
  });

  it('reports saved when the attribute is present', () => {
    expect(isSaved(makeMessage({ savedAt: 1735689600 }))).toBe(true);
  });

  it('treats a savedAt of 0 as SAVED', () => {
    expect(isSaved(makeMessage({ savedAt: 0 }))).toBe(true);
  });

  it('pin and save are independent', () => {
    const both = makeMessage({ pinnedAt: 1, savedAt: 2 });
    expect(isPinned(both)).toBe(true);
    expect(isSaved(both)).toBe(true);
  });

  it('degrades to false when the SDK build lacks the accessors', () => {
    const legacy = { getId: () => 1 } as unknown as Msg;
    expect(isPinned(legacy)).toBe(false);
    expect(isSaved(legacy)).toBe(false);
  });
});

describe('isSystemPinned', () => {
  it('is true for the app_system sentinel', () => {
    expect(isSystemPinned(makeMessage({ pinnedAt: 1, pinnedBy: 'app_system' }))).toBe(true);
  });

  it('is false for a member pin', () => {
    expect(isSystemPinned(makeMessage({ pinnedAt: 1, pinnedBy: 'alice' }))).toBe(false);
  });

  it('is false when not pinned at all', () => {
    expect(isSystemPinned(makeMessage({ pinnedBy: 'app_system' }))).toBe(false);
  });

  it('falls back to the sentinel comparison when isSystemPinned() is missing', () => {
    const noHelper = {
      getId: () => 1,
      isPinned: () => true,
      getPinnedAt: () => 1,
      getPinnedBy: () => 'app_system',
    } as unknown as Msg;
    expect(isSystemPinned(noHelper)).toBe(true);
  });
});

describe('getPinnedBy', () => {
  it('returns the pinner uid', () => {
    expect(getPinnedBy(makeMessage({ pinnedAt: 1, pinnedBy: 'alice' }))).toBe('alice');
  });

  it('returns an empty string when unset', () => {
    expect(getPinnedBy(makeMessage())).toBe('');
  });
});

describe('isPinSaveEligible', () => {
  const uid = 'me';

  it('accepts an ordinary text message', () => {
    expect(isPinSaveEligible(makeMessage(), uid)).toBe(true);
  });

  it('rejects an optimistic message with no server id', () => {
    expect(isPinSaveEligible(makeMessage({ id: 0 }), uid)).toBe(false);
  });

  it('rejects a deleted message', () => {
    expect(isPinSaveEligible(makeMessage({ deletedAt: 1735689600 }), uid)).toBe(false);
  });

  it('rejects action bubbles', () => {
    expect(isPinSaveEligible(makeMessage({ category: 'action' }), uid)).toBe(false);
  });

  it('rejects call bubbles', () => {
    expect(isPinSaveEligible(makeMessage({ category: 'call' }), uid)).toBe(false);
  });

  it('accepts a thread reply — replies are pinnable and savable', () => {
    expect(isPinSaveEligible(makeMessage({ parentMessageId: 55 }), uid)).toBe(true);
  });

  it('returns false instead of throwing on a message-like object missing accessors', () => {
    // Runs for every bubble on every render — a throw here would take down the
    // whole context menu, not just pin/save.
    expect(() => isPinSaveEligible({} as unknown as Msg, uid)).not.toThrow();
    expect(isPinSaveEligible({} as unknown as Msg, uid)).toBe(false);
  });

  it('tolerates a partial object that only implements getId', () => {
    const partial = { getId: () => 7 } as unknown as Msg;
    expect(() => isPinSaveEligible(partial, uid)).not.toThrow();
  });
});

describe('isThreadReply', () => {
  it('is true when a parent id is set', () => {
    expect(isThreadReply(makeMessage({ parentMessageId: 55 }))).toBe(true);
  });

  it('is false at the top level', () => {
    expect(isThreadReply(makeMessage())).toBe(false);
  });

  it('is false rather than throwing when the accessor is missing', () => {
    expect(isThreadReply({} as unknown as Msg)).toBe(false);
  });
});

describe('readLimitFromError (text extraction, the fallback source)', () => {
  it('returns null when the error carries no text', () => {
    expect(readLimitFromError({})).toBeNull();
  });

  it('extracts the cap from the error text', () => {
    expect(readLimitFromError({ message: 'reached the allowed limit of 5.' })).toBe(5);
  });

  describe('reading the cap out of the error text', () => {
    /** The shape the API actually returns today. */
    const realPayload = {
      error: {
        message:
          'The number of pinned messages for the conversation with id group_group_1785395639374 has reached the allowed limit of 5.',
        devMessage:
          'The number of pinned messages for the conversation with id group_group_1785395639374 has reached the allowed limit of 5.',
        source: 'chat-api',
        code: 'ERR_PINNED_MESSAGES_LIMIT_EXCEEDED',
      },
    };

    it('reads the cap from a nested error payload', () => {
      expect(readLimitFromError(realPayload)).toBe(5);
    });

    it('is not fooled by digits in the conversation id', () => {
      // `group_group_1785395639374` sits in the same sentence; the phrase match
      // is what keeps the cap from becoming a timestamp.
      expect(readLimitFromError(realPayload)).not.toBe(1785395639374);
    });

    it('reads the cap from a flat message', () => {
      expect(readLimitFromError({ message: 'has reached the allowed limit of 25.' })).toBe(25);
    });

    it('reads the cap from devMessage when message is absent', () => {
      expect(readLimitFromError({ devMessage: 'allowed limit of 7.' })).toBe(7);
    });

    it('reads a plain string error', () => {
      expect(readLimitFromError('limit of 3')).toBe(3);
    });

    it('falls back to a trailing number when the phrasing changes', () => {
      expect(readLimitFromError({ message: 'You may only save 42' })).toBe(42);
    });

    it('returns null when the text carries no number', () => {
      expect(readLimitFromError({ message: 'Something went wrong.' })).toBeNull();
    });

    it('tolerates a payload with no text at all', () => {
      expect(readLimitFromError({ code: 'ERR_PINNED_MESSAGES_LIMIT_EXCEEDED' })).toBeNull();
      expect(readLimitFromError(null)).toBeNull();
      expect(readLimitFromError(undefined)).toBeNull();
    });
  });
});

describe('isLimitError (exact error-code match)', () => {
  it('detects each of the three known cap codes', () => {
    expect(isLimitError({ code: 'ERR_PINNED_MESSAGES_LIMIT_EXCEEDED' })).toBe(true);
    expect(isLimitError({ code: 'ERR_SAVED_MESSAGES_LIMIT_EXCEEDED' })).toBe(true);
    expect(isLimitError({ code: 'ERR_PINNED_CONVERSATIONS_LIMIT_EXCEEDED' })).toBe(true);
  });

  it('reads the code out of a nested error payload', () => {
    expect(isLimitError({ error: { code: 'ERR_SAVED_MESSAGES_LIMIT_EXCEEDED' } })).toBe(true);
  });

  it('does NOT match by the message prose alone', () => {
    // Detection is by code now — the number still comes from the text, but a
    // message that merely says "limit" is not enough to show a limit toast.
    expect(isLimitError({ message: 'has reached the allowed limit of 5.' })).toBe(false);
  });

  it('does NOT match an unrelated *LIMIT* code (exact set only)', () => {
    expect(isLimitError({ code: 'ERR_SOME_OTHER_LIMIT_EXCEEDED' })).toBe(false);
  });

  it('is false for a non-limit failure', () => {
    expect(isLimitError({ code: 'ERR_SOMETHING', message: 'Network error' })).toBe(false);
    expect(isLimitError(null)).toBe(false);
    expect(isLimitError(undefined)).toBe(false);
  });
});

describe('isPermissionError', () => {
  it('recognises both SBAC/RBAC rejection codes', () => {
    expect(isPermissionError({ code: 'ERR_ACTION_NOT_ALLOWED' })).toBe(true);
    expect(isPermissionError({ code: 'ERR_PERMISSION_DENIED' })).toBe(true);
  });

  it('reads the code out of a nested error payload', () => {
    expect(isPermissionError({ error: { code: 'ERR_PERMISSION_DENIED' } })).toBe(true);
  });

  it('ignores other codes', () => {
    expect(isPermissionError({ code: 'ERR_SOMETHING_ELSE' })).toBe(false);
  });

  it('tolerates null / undefined', () => {
    expect(isPermissionError(null)).toBe(false);
    expect(isPermissionError(undefined)).toBe(false);
  });
});
