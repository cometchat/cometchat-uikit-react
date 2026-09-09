import { describe, it, expect } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  PIN_TIER,
  getPinTier,
  insertRespectingPinTiers,
  placeForNewActivity,
  repositionForPinChange,
  sortByPinTier,
  isConversationSystemPinned,
} from '../CometChatConversations.utils';

type Pin = 'global' | 'user' | 'none';

/** A conversation with the SDK's pin accessors. `sentAt` drives unpinned order. */
function conv(id: string, pin: Pin = 'none', sentAt = 0): CometChat.Conversation {
  const pinnedAt = pin === 'none' ? undefined : 100;
  return {
    getConversationId: () => id,
    getLastMessage: () => ({ getSentAt: () => sentAt }),
    getPinnedAt: () => pinnedAt,
    getPinnedBy: () => (pin === 'global' ? 'app_system' : pin === 'user' ? 'me' : undefined),
    isPinned: () => pin !== 'none',
    isSystemPinned: () => pin === 'global',
  } as unknown as CometChat.Conversation;
}

/** A conversation from an SDK build predating the pin accessors. */
function legacyConv(id: string): CometChat.Conversation {
  return {
    getConversationId: () => id,
    getLastMessage: () => undefined,
  } as unknown as CometChat.Conversation;
}

const ids = (list: CometChat.Conversation[]) => list.map(c => c.getConversationId());

describe('getPinTier', () => {
  it('bands a conversation by who pinned it', () => {
    expect(getPinTier(conv('a', 'global'))).toBe(PIN_TIER.GLOBAL);
    expect(getPinTier(conv('b', 'user'))).toBe(PIN_TIER.USER);
    expect(getPinTier(conv('c'))).toBe(PIN_TIER.NORMAL);
  });

  it('treats an SDK without the accessors as unpinned rather than throwing', () => {
    // Ordering must degrade, not explode, on an older SDK.
    expect(getPinTier(legacyConv('old'))).toBe(PIN_TIER.NORMAL);
    expect(isConversationSystemPinned(legacyConv('old'))).toBe(false);
  });
});

describe('insertRespectingPinTiers', () => {
  it('lands a brand-new conversation below every pin (§3 scenario 1)', () => {
    // Two global pins and a user pin — a first-ever message goes to index 3.
    const list = [conv('g1', 'global'), conv('g2', 'global'), conv('u1', 'user'), conv('n1')];
    const next = insertRespectingPinTiers(list, conv('new'));
    expect(ids(next)).toEqual(['g1', 'g2', 'u1', 'new', 'n1']);
  });

  it('moves a user-pinned conversation to the top of tier 1, still under globals (§3 scenario 3)', () => {
    const list = [conv('g1', 'global'), conv('u1', 'user'), conv('u2', 'user'), conv('n1')];
    const next = insertRespectingPinTiers(list, conv('u2', 'user'));
    expect(ids(next)).toEqual(['g1', 'u2', 'u1', 'n1']);
  });

  it('moves a global-pinned conversation to the very top (§3 scenario 4)', () => {
    const list = [conv('g1', 'global'), conv('g2', 'global'), conv('n1')];
    const next = insertRespectingPinTiers(list, conv('g2', 'global'));
    expect(ids(next)).toEqual(['g2', 'g1', 'n1']);
  });

  it('replaces rather than duplicates an existing entry', () => {
    const list = [conv('a'), conv('b'), conv('c')];
    const next = insertRespectingPinTiers(list, conv('c'));
    expect(ids(next)).toEqual(['c', 'a', 'b']);
    expect(next).toHaveLength(3);
  });

  it('prepends when nothing is pinned — the old behaviour, preserved', () => {
    const list = [conv('a'), conv('b')];
    expect(ids(insertRespectingPinTiers(list, conv('new')))).toEqual(['new', 'a', 'b']);
  });

  it('appends into an empty list', () => {
    expect(ids(insertRespectingPinTiers([], conv('only')))).toEqual(['only']);
  });

  it('appends when every existing conversation outranks it', () => {
    const list = [conv('g1', 'global'), conv('u1', 'user')];
    expect(ids(insertRespectingPinTiers(list, conv('n')))).toEqual(['g1', 'u1', 'n']);
  });

  it('does not mutate the input', () => {
    const list = [conv('a'), conv('b')];
    const before = ids(list);
    insertRespectingPinTiers(list, conv('c'));
    expect(ids(list)).toEqual(before);
  });
});

describe('repositionForPinChange', () => {
  it('puts a freshly pinned conversation at the top of its new tier (§3 scenario 5)', () => {
    const list = [conv('u1', 'user'), conv('n1', 'none', 500), conv('n2', 'none', 400)];
    const next = repositionForPinChange(list, conv('n2', 'user'));
    expect(ids(next)).toEqual(['n2', 'u1', 'n1']);
  });

  it('places an unpinned conversation by last activity, not at the top (§3 scenario 6)', () => {
    // Otherwise unpinning silently promotes a stale chat above newer ones.
    const list = [
      conv('u1', 'user'),
      conv('n1', 'none', 900),
      conv('n2', 'none', 500),
      conv('n3', 'none', 100),
    ];
    const next = repositionForPinChange(list, conv('u1', 'none', 300));
    expect(ids(next)).toEqual(['n1', 'n2', 'u1', 'n3']);
  });

  it('sends a stale unpinned conversation to the bottom', () => {
    const list = [conv('n1', 'none', 900), conv('n2', 'none', 800)];
    const next = repositionForPinChange(list, conv('old', 'none', 1));
    expect(ids(next)).toEqual(['n1', 'n2', 'old']);
  });

  it('keeps an unpinned conversation below the pinned block', () => {
    const list = [conv('g1', 'global'), conv('u1', 'user'), conv('n1', 'none', 100)];
    const next = repositionForPinChange(list, conv('was', 'none', 999));
    expect(ids(next)).toEqual(['g1', 'u1', 'was', 'n1']);
  });

  it('promotes a user pin to tier 0 when an admin global-pins it (§3 scenario 7)', () => {
    const list = [conv('g1', 'global'), conv('u1', 'user'), conv('n1')];
    const next = repositionForPinChange(list, conv('u1', 'global'));
    expect(ids(next)).toEqual(['u1', 'g1', 'n1']);
  });
});

describe('sortByPinTier', () => {
  it('re-asserts band order across a merged page', () => {
    const list = [conv('n1'), conv('g1', 'global'), conv('n2'), conv('u1', 'user')];
    expect(ids(sortByPinTier(list))).toEqual(['g1', 'u1', 'n1', 'n2']);
  });

  it('is stable within a tier, so the server ordering survives', () => {
    // Pins arrive pinnedAt DESC and normals by recency; we must not reshuffle either.
    const list = [conv('u1', 'user'), conv('u2', 'user'), conv('u3', 'user')];
    expect(ids(sortByPinTier(list))).toEqual(['u1', 'u2', 'u3']);
  });

  it('does not mutate the input', () => {
    const list = [conv('n1'), conv('g1', 'global')];
    sortByPinTier(list);
    expect(ids(list)).toEqual(['n1', 'g1']);
  });
});

describe('placeForNewActivity', () => {
  it('leaves a pinned conversation exactly where it is', () => {
    // Pinned order is by when each was pinned; a message is not a re-pin.
    const list = [conv('u1', 'user'), conv('u2', 'user'), conv('u3', 'user'), conv('n1')];
    const next = placeForNewActivity(list, conv('u2', 'user'));
    expect(ids(next)).toEqual(['u1', 'u2', 'u3', 'n1']);
  });

  it('leaves an admin-global pin where it is', () => {
    const list = [conv('g1', 'global'), conv('g2', 'global'), conv('n1')];
    expect(ids(placeForNewActivity(list, conv('g2', 'global')))).toEqual(['g1', 'g2', 'n1']);
  });

  it('still swaps in the updated object, so the row re-renders', () => {
    const list = [conv('u1', 'user'), conv('u2', 'user')];
    const updated = conv('u2', 'user');
    const next = placeForNewActivity(list, updated);
    expect(next[1]).toBe(updated);
    expect(next).not.toBe(list);
  });

  it('moves an unpinned conversation to the top of the unpinned band', () => {
    const list = [conv('u1', 'user'), conv('n1'), conv('n2'), conv('n3')];
    expect(ids(placeForNewActivity(list, conv('n3')))).toEqual(['u1', 'n3', 'n1', 'n2']);
  });

  it('inserts a conversation that is not listed yet', () => {
    const list = [conv('u1', 'user'), conv('n1')];
    expect(ids(placeForNewActivity(list, conv('new')))).toEqual(['u1', 'new', 'n1']);
  });

  it('inserts an unlisted PINNED conversation at the top of its tier', () => {
    // Nothing to hold position for — it has no position yet.
    const list = [conv('u1', 'user'), conv('n1')];
    expect(ids(placeForNewActivity(list, conv('u9', 'user')))).toEqual(['u9', 'u1', 'n1']);
  });
});
