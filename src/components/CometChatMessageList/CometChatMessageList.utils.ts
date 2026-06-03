import { CometChat } from '@cometchat/chat-sdk-javascript';

// ---------------------------------------------------------------------------
// Conversation Filter
// ---------------------------------------------------------------------------

/**
 * Determine whether a message belongs to the current conversation.
 *
 * - Thread mode: accepts messages whose parentMessageId matches the current thread.
 * - Non-thread mode: rejects thread replies, accepts messages matching the user/group.
 * - Sender exclusion: by default, rejects messages sent by the logged-in user (to avoid
 *   duplication with the optimistic send flow). Pass `excludeSender: false` to skip
 *   this check — used for detecting own messages sent from another tab/device.
 *
 * For 1:1 chats the sender UID *or* receiver ID must match the target user.
 * For group chats only the receiver ID (group GUID) is checked.
 */
export function isMessageForConversation(
  message: CometChat.BaseMessage,
  user: CometChat.User | undefined,
  group: CometChat.Group | undefined,
  parentMessageId: number | undefined,
  loggedInUserId: string,
  options?: { excludeSender?: boolean; isAgentChat?: boolean }
): boolean {
  const senderId = message.getSender().getUid();
  const excludeSender = options?.excludeSender ?? true;
  const isAgentChat = options?.isAgentChat ?? false;

  // Exclude messages sent by the logged-in user — they go through the optimistic flow.
  if (excludeSender && senderId === loggedInUserId) {
    return false;
  }

  const receiverId = message.getReceiverId();
  const receiverType = message.getReceiverType();
  const msgParentId = message.getParentMessageId() || 0;

  // --- Thread mode ---
  if (parentMessageId) {
    return msgParentId === parentMessageId;
  }

  // --- Non-thread mode: reject thread replies UNLESS isAgentChat ---
  // In agent chat, messages are threaded (have parentMessageId) but the list
  // has no parentMessageId set — it shows all messages for the conversation.
  if (msgParentId && !isAgentChat) {
    return false;
  }

  // --- Match conversation target ---
  if (user) {
    return receiverType === 'user' && (receiverId === user.getUid() || senderId === user.getUid());
  }

  if (group) {
    return receiverType === 'group' && receiverId === group.getGuid();
  }

  return false;
}

/**
 * Determine whether a message is a thread reply belonging to the current conversation
 * (but NOT the current thread view). Used to update reply counts on parent messages.
 *
 */
export function isThreadReplyForConversation(
  message: CometChat.BaseMessage,
  user: CometChat.User | undefined,
  group: CometChat.Group | undefined
): boolean {
  const msgParentId = message.getParentMessageId() || 0;
  if (!msgParentId) return false;

  const receiverId = message.getReceiverId();
  const senderId = message.getSender().getUid();

  if (user) {
    return receiverId === user.getUid() || senderId === user.getUid();
  }

  if (group) {
    return receiverId === group.getGuid();
  }

  return false;
}

/**
 * Determine whether a reaction event belongs to the current conversation.
 *
 * but uses the reaction event's reactedBy UID instead of sender UID for 1:1 matching.
 */
export function isReactionForConversation(
  event: CometChat.ReactionEvent,
  user: CometChat.User | undefined,
  group: CometChat.Group | undefined,
  parentMessageId: number | undefined
): boolean {
  const receiverId = event.getReceiverId();
  const receiverType = event.getReceiverType();
  const reactedById = event.getReaction().getReactedBy().getUid();
  const eventParentId = event.getParentMessageId() || 0;

  // --- Thread mode ---
  if (parentMessageId) {
    return eventParentId === parentMessageId;
  }

  // --- Non-thread mode: reject thread reactions ---
  if (eventParentId) {
    return false;
  }

  // --- Match conversation target ---
  if (user) {
    return (
      receiverType === 'user' && (receiverId === user.getUid() || reactedById === user.getUid())
    );
  }

  if (group) {
    return receiverType === 'group' && receiverId === group.getGuid();
  }

  return false;
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Remove duplicate messages by ID, keeping the last occurrence (most up-to-date).
 * Preserves the relative order of messages.
 *
 * Used when merging fetched pages with the existing list to handle overlapping IDs.
 */
export function deduplicateById(messages: CometChat.BaseMessage[]): CometChat.BaseMessage[] {
  // Build a map of ID → last index (skip id=0 which means pending/unsent)
  const lastIndex = new Map<number, number>();
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg) continue;
    const id = msg.getId();
    if (!id) continue; // Keep all pending messages (id=0 or undefined)
    lastIndex.set(id, i);
  }
  // Keep only the last occurrence of each non-zero ID; keep all id=0 messages.
  return messages.filter((_msg, i) => {
    const msg = messages[i];
    if (!msg) return false;
    const id = msg.getId();
    if (!id) return true; // Always keep pending messages
    return lastIndex.get(id) === i;
  });
}

// ---------------------------------------------------------------------------
// Message Cloning
// ---------------------------------------------------------------------------

/**
 * Shallow-clone an SDK message, preserving its prototype so
 * `instanceof CometChat.TextMessage` / `MediaMessage` etc. still work.
 *
 * Why: the reducer is called twice under React.StrictMode. Any mutation
 * applied to an input message during the first invocation would make the
 * second invocation see "already updated" state and (incorrectly) short-
 * circuit the return. Cloning before mutating keeps the reducer pure — the
 * mutation is applied to a fresh object reference the reducer owns.
 *
 * The clone is intentionally shallow; nested SDK objects (sender, reactions,
 * attachments) are shared. We only flip the single scalar field the caller
 * cares about before returning.
 */
export function cloneMessage<T extends CometChat.BaseMessage>(message: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(message) as object) as T, message);
}

// ---------------------------------------------------------------------------
// Pending Message Factories
// ---------------------------------------------------------------------------

/**
 * Generate a unique muid for pending messages.
 * Format: `muid_<timestamp>_<random>` to ensure uniqueness.
 */
export function generateMuid(): string {
  return `muid_${String(Date.now())}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Build a real `CometChat.TextMessage` pre-populated with muid, sentAt and
 * sender. Mirrors flow (see CometChatMessageComposer.tsx).
 *
 * The returned message is a full SDK object — `instanceof CometChat.TextMessage`
 * is true — so moderation / receipt helpers work on it identically to a
 * server-returned message.
 *
 * The SDK will assign a real id and update sentAt once `CometChat.sendMessage`
 * resolves; at that point we replace this entry in state.messages by muid
 * (MESSAGE_SEND_SUCCESS).
 */
export function createPendingTextMessage(
  muid: string,
  text: string,
  loggedInUser: CometChat.User,
  receiverId: string,
  receiverType: string,
  parentMessageId?: number
): CometChat.TextMessage {
  const msg = new CometChat.TextMessage(receiverId, text, receiverType);
  msg.setMuid(muid);
  msg.setSender(loggedInUser);
  msg.setSentAt(Math.floor(Date.now() / 1000));
  if (parentMessageId) {
    msg.setParentMessageId(parentMessageId);
  }
  return msg;
}

/**
 * Build a real `CometChat.MediaMessage` pre-populated with muid, sentAt,
 * sender and a `file` metadata entry. Mirrors flow.
 */
export function createPendingMediaMessage(
  muid: string,
  file: File,
  type: string,
  loggedInUser: CometChat.User,
  receiverId: string,
  receiverType: string,
  parentMessageId?: number
): CometChat.MediaMessage {
  const msg = new CometChat.MediaMessage(receiverId, file, type, receiverType);
  msg.setMuid(muid);
  msg.setSender(loggedInUser);
  msg.setSentAt(Math.floor(Date.now() / 1000));
  if (parentMessageId) {
    msg.setParentMessageId(parentMessageId);
  }
  msg.setMetadata({
    file,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });
  return msg;
}

/**
 * Stamp an error onto a pending message's metadata so the bubble can surface
 * the permission-denied / moderation-style footer and red receipt.
 *
 * Mirrors
 *   message.setMetadata({ ...message.getMetadata(), error });
 *
 * Also sets the error on the message directly so both code paths in
 * receipt / bubble helpers (direct `.error` or `.metadata.error`) pick it up.
 */
export function attachErrorToMessage(message: CometChat.BaseMessage, error: unknown): void {
  // Store the raw error (like v6) so getMessageError can read .code directly
  // from the SDK exception object regardless of its class structure.
  const widened = message as unknown as {
    getMetadata?: () => unknown;
    setMetadata?: (metadata: unknown) => void;
    error?: unknown;
  };
  const current = (widened.getMetadata?.() as Record<string, unknown> | null | undefined) ?? {};
  widened.setMetadata?.({ ...current, error });
  widened.error = error;
}

// ---------------------------------------------------------------------------
// Receipt Utilities
// ---------------------------------------------------------------------------

/**
 * Batch-update deliveredAt or readAt on outgoing messages up to (and including)
 * the receipt's message ID.
 *
 * Each updated message is shallow-cloned so the reducer stays pure (safe
 * under React.StrictMode's double-invoke); the original objects in `messages`
 * are never mutated.
 *
 * @param messages     - The current message list.
 * @param receiptType  - 'delivered' or 'read'.
 * @param messageId    - The receipt's message ID (all outgoing messages with ID ≤ this are updated).
 * @param timestamp    - The timestamp to set (deliveredAt or readAt).
 * @param loggedInUserId - The logged-in user's UID (only outgoing messages are updated).
 * @returns A new array with updated messages, or the same reference if nothing changed.
 */
export function updateReceiptsOnMessages(
  messages: CometChat.BaseMessage[],
  receiptType: 'delivered' | 'read',
  messageId: number,
  timestamp: number,
  loggedInUserId: string
): CometChat.BaseMessage[] {
  // First check if any messages need updating
  const needsUpdate = messages.some(m => {
    const id = m.getId();
    const senderUid = m.getSender().getUid();
    if (id <= messageId && senderUid === loggedInUserId) {
      if (receiptType === 'delivered' && !m.getDeliveredAt()) return true;
      if (receiptType === 'read' && !m.getReadAt()) return true;
    }
    return false;
  });

  if (!needsUpdate) return messages;

  // Map to a new array; for every message that qualifies, clone before
  // flipping the receipt timestamp so we never mutate the input.
  return messages.map(m => {
    const id = m.getId();
    const senderUid = m.getSender().getUid();

    if (id <= messageId && senderUid === loggedInUserId) {
      const shouldSetDelivered = receiptType === 'delivered' && !m.getDeliveredAt();
      const shouldSetRead = receiptType === 'read' && !m.getReadAt();
      if (!shouldSetDelivered && !shouldSetRead) return m;

      const next = cloneMessage(m);
      if (shouldSetDelivered) next.setDeliveredAt(timestamp);
      else if (shouldSetRead) next.setReadAt(timestamp);
      return next;
    }
    return m;
  });
}

// ---------------------------------------------------------------------------
// Quoted Message Reference Update
// ---------------------------------------------------------------------------

/**
 * When a message is edited, update any messages in the list that reference
 * the edited message as a quoted message.
 *
 * ```
 * if (m.getQuotedMessageId() === message.getId()) {
 *   m.setQuotedMessage(message);
 * }
 * ```
 *
 * Returns a new array only if changes were made.
 */

/** Extension of BaseMessage for messages that support quoted message references. */
interface MessageWithQuote extends CometChat.BaseMessage {
  getQuotedMessageId(): number;
  setQuotedMessage(message: CometChat.BaseMessage): void;
}

export function updateQuotedMessageReferences(
  messages: CometChat.BaseMessage[],
  editedMessage: CometChat.BaseMessage
): CometChat.BaseMessage[] {
  const editedId = editedMessage.getId();

  // First check if any messages reference the edited message
  const needsUpdate = messages.some(
    m =>
      'getQuotedMessageId' in m &&
      typeof (m as MessageWithQuote).getQuotedMessageId === 'function' &&
      (m as MessageWithQuote).getQuotedMessageId() === editedId &&
      'setQuotedMessage' in m &&
      typeof (m as MessageWithQuote).setQuotedMessage === 'function'
  );

  if (!needsUpdate) return messages;

  // Clone each quoting message before updating its quoted reference so the
  // reducer stays pure under StrictMode's double-invoke.
  return messages.map(m => {
    if (
      !('getQuotedMessageId' in m) ||
      typeof (m as MessageWithQuote).getQuotedMessageId !== 'function' ||
      (m as MessageWithQuote).getQuotedMessageId() !== editedId ||
      !('setQuotedMessage' in m) ||
      typeof (m as MessageWithQuote).setQuotedMessage !== 'function'
    ) {
      return m;
    }
    const next = cloneMessage(m) as MessageWithQuote;
    next.setQuotedMessage(editedMessage);
    return next;
  });
}

// ---------------------------------------------------------------------------
// Unread Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a lastReadMessageId is within a message range.
 */
export function isLastReadInRange(
  messages: CometChat.BaseMessage[],
  lastReadId: number | null
): boolean {
  if (!lastReadId) return false;
  return messages.some(m => m.getId() === lastReadId);
}

/**
 * Determine if conversation should be marked as read based on fetched messages
 * and the lastReadMessageId position.
 *
 * the unread count fits in one page.
 */
export function shouldMarkConversationRead(
  messages: CometChat.BaseMessage[],
  lastReadId: number | null,
  unreadCount: number,
  parentMessageId: number | undefined
): boolean {
  // Never auto-mark in thread mode
  if (parentMessageId) return false;
  // No unread messages
  if (unreadCount === 0) return true;
  // No lastReadId — treat as all read
  if (!lastReadId) return true;
  // lastReadId is in the fetched range
  // SDK getId() may return string despite number type annotation — Number() ensures safe comparison
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
  if (messages.some(m => Number(m.getId()) === lastReadId)) return true;
  // lastReadId is above the fetched range (all fetched messages are newer)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
  if (messages.length > 0 && messages[0] && lastReadId < Number(messages[0].getId())) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

/** Check if two timestamps (in seconds) are on different calendar days. */
export function isDifferentDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1 * 1000);
  const d2 = new Date(ts2 * 1000);
  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
}
