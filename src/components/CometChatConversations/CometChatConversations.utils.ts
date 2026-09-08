import type { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Where a conversation sits in the list's three-band ordering.
 *
 * The server returns the first page already in this order — admin-global pins,
 * then the user's own, then everything else. These helpers exist to keep that
 * invariant true through realtime updates, which is where a blind prepend would
 * otherwise shove a normal chat above the pinned block.
 */
export const PIN_TIER = {
  /** Pinned by an admin for every user. Cannot be unpinned from the client. */
  GLOBAL: 0,
  /** Pinned by the logged-in user, private to them. */
  USER: 1,
  /** Not pinned. */
  NORMAL: 2,
} as const;

export type ConversationPinTier = (typeof PIN_TIER)[keyof typeof PIN_TIER];

/** Is this conversation pinned, by anyone? */
export function isConversationPinned(conversation: CometChat.Conversation): boolean {
  // Guarded throughout: an older SDK build predates these accessors entirely, and
  // ordering must degrade to "nothing is pinned" rather than throwing.
  const probe = conversation as unknown as { isPinned?: () => boolean };
  return typeof probe.isPinned === 'function' ? probe.isPinned() : false;
}

/**
 * Was the pin placed by an admin for everyone, rather than by this user?
 *
 * The server resolves precedence and sends only the winning pin, so this is read,
 * never inferred: a conversation pinned both globally and by the user arrives as
 * system-pinned.
 */
export function isConversationSystemPinned(conversation: CometChat.Conversation): boolean {
  if (!isConversationPinned(conversation)) return false;
  const probe = conversation as unknown as { isSystemPinned?: () => boolean };
  return typeof probe.isSystemPinned === 'function' ? probe.isSystemPinned() : false;
}

/** When the pin was placed. 0 when not pinned. */
export function getConversationPinnedAt(conversation: CometChat.Conversation): number {
  return conversation.getPinnedAt() ?? 0;
}

export function getPinTier(conversation: CometChat.Conversation): ConversationPinTier {
  if (!isConversationPinned(conversation)) return PIN_TIER.NORMAL;
  return isConversationSystemPinned(conversation) ? PIN_TIER.GLOBAL : PIN_TIER.USER;
}

/** Last activity, used to place a conversation within the unpinned band. */
function lastActivityOf(conversation: CometChat.Conversation): number {
  const message = conversation.getLastMessage() as { getSentAt?: () => number } | undefined;
  return typeof message?.getSentAt === 'function' ? message.getSentAt() : 0;
}

function idOf(conversation: CometChat.Conversation): string {
  return conversation.getConversationId();
}

/**
 * Place a conversation at the top of its own tier, preserving the tier invariant.
 *
 * Replaces any existing entry with the same id, then splices in ahead of the first
 * conversation belonging to a lower band. This is what every realtime path uses in
 * place of a prepend: a message arriving in an unpinned chat must land above the
 * other unpinned chats but below every pin.
 */
export function insertRespectingPinTiers(
  list: CometChat.Conversation[],
  conversation: CometChat.Conversation
): CometChat.Conversation[] {
  const id = idOf(conversation);
  const rest = list.filter(c => idOf(c) !== id);
  const tier = getPinTier(conversation);

  // Ahead of the first conversation in its own band (`>=`, not `>`): the point is
  // to reach the TOP of its tier. `>` would place it at the bottom, below every
  // peer, which is the opposite of "move to top".
  const index = rest.findIndex(c => getPinTier(c) >= tier);
  const at = index === -1 ? rest.length : index;

  return [...rest.slice(0, at), conversation, ...rest.slice(at)];
}

/**
 * Place a conversation that has just received activity — a new message.
 *
 * A PINNED conversation holds its slot. The pinned block is ordered by when each
 * was pinned, and a message is not a re-pin: promoting it would reshuffle the
 * user's deliberate ordering every time someone typed, and would disagree with the
 * order the server returns on the next load.
 *
 * An unpinned conversation moves to the top of the unpinned band, as always.
 */
export function placeForNewActivity(
  list: CometChat.Conversation[],
  conversation: CometChat.Conversation
): CometChat.Conversation[] {
  const id = idOf(conversation);
  const index = list.findIndex(c => idOf(c) === id);

  if (index !== -1 && getPinTier(conversation) !== PIN_TIER.NORMAL) {
    const next = [...list];
    next[index] = conversation;
    return next;
  }

  return insertRespectingPinTiers(list, conversation);
}

/**
 * Re-place a conversation after its pin state changed.
 *
 * Pinning puts it at the top of its new tier — it was just acted on, so the top is
 * where the user expects it. Unpinning is different: dropping it at the top of the
 * unpinned band would silently promote a stale chat above conversations with newer
 * messages, so it is placed by last activity instead.
 */
export function repositionForPinChange(
  list: CometChat.Conversation[],
  conversation: CometChat.Conversation
): CometChat.Conversation[] {
  if (isConversationPinned(conversation)) {
    return insertRespectingPinTiers(list, conversation);
  }

  const id = idOf(conversation);
  const rest = list.filter(c => idOf(c) !== id);
  const activity = lastActivityOf(conversation);

  const index = rest.findIndex(
    c => getPinTier(c) === PIN_TIER.NORMAL && lastActivityOf(c) <= activity
  );
  const at = index === -1 ? rest.length : index;

  return [...rest.slice(0, at), conversation, ...rest.slice(at)];
}

/**
 * Re-assert the tier invariant across a whole list.
 *
 * Used after a page merge. The sort is stable, so within a tier the server's own
 * ordering survives — pins by `pinnedAt DESC`, the rest by recency — and this only
 * corrects entries that ended up in the wrong band.
 */
export function sortByPinTier(list: CometChat.Conversation[]): CometChat.Conversation[] {
  return [...list].sort((a, b) => getPinTier(a) - getPinTier(b));
}

/**
 * Copy pin attributes from the conversation already in the list onto a
 * replacement.
 *
 * Realtime paths often hand us a conversation rebuilt from a MESSAGE
 * (`CometChatHelper.getConversationFromMessage`), and a message payload carries
 * no conversation-level pin state. Swapping that in wholesale reads as "not
 * pinned" and drops the row out of its tier — a pinned chat would fall to the top
 * of the normal band the moment someone sent to it.
 *
 * Only ever fills gaps: a replacement that asserts its own pin state keeps it, and
 * genuine pin/unpin arrives through `CONVERSATION_PIN_CHANGED`.
 */
export function carryConversationPinForward(
  previous: CometChat.Conversation,
  next: CometChat.Conversation
): void {
  if (!isConversationPinned(previous) || isConversationPinned(next)) return;

  next.setPinnedAt(previous.getPinnedAt());
  next.setPinnedBy(previous.getPinnedBy());
}
