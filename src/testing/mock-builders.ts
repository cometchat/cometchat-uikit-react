/**
 * Factory functions for building mock SDK entities in tests.
 *
 * Usage:
 *   import { buildUser, buildConversation, buildTextMessage, buildGroup } from '../testing/mock-builders';
 *   const user = buildUser({ uid: 'alice', name: 'Alice' });
 *
 * All builders return plain objects with getter methods matching the CometChat SDK
 * interface shape. They are NOT real SDK class instances — `instanceof` checks will
 * fail. Code uses getType()/getCategory() for type resolution, not instanceof.
 */

// ─── Users & Groups ─────────────────────────────────────────────────────────

interface MockUserOptions {
  uid?: string;
  name?: string;
  avatar?: string;
  status?: string;
  role?: string;
  lastActiveAt?: number;
}

export function buildUser(overrides: MockUserOptions = {}) {
  const uid = overrides.uid ?? `user-${String(Date.now())}`;
  const name = overrides.name ?? 'Test User';
  const avatar = overrides.avatar ?? 'https://example.com/avatar.png';
  const status = overrides.status ?? 'online';
  const role = overrides.role ?? 'default';
  const lastActiveAt = overrides.lastActiveAt ?? Date.now();

  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => avatar,
    getStatus: () => status,
    getRole: () => role,
    getLastActiveAt: () => lastActiveAt,
    getBlockedByMe: () => false,
    getHasBlockedMe: () => false,
  };
}

interface MockGroupOptions {
  guid?: string;
  name?: string;
  type?: string;
  membersCount?: number;
  icon?: string;
  description?: string;
}

export function buildGroup(overrides: MockGroupOptions = {}) {
  const guid = overrides.guid ?? `group-${String(Date.now())}`;
  const name = overrides.name ?? 'Test Group';
  const type = overrides.type ?? 'public';
  const membersCount = overrides.membersCount ?? 5;
  const icon = overrides.icon ?? 'https://example.com/group.png';
  const description = overrides.description ?? '';

  return {
    getGuid: () => guid,
    getName: () => name,
    getType: () => type,
    getIcon: () => icon,
    getMembersCount: () => membersCount,
    getDescription: () => description,
    getScope: () => 'participant',
    getOwner: () => 'user-1',
    getHasJoined: () => true,
  };
}

// ─── Messages ───────────────────────────────────────────────────────────────

interface MockTextMessageOptions {
  id?: number;
  text?: string;
  sender?: ReturnType<typeof buildUser>;
  receiverType?: string;
  receiverId?: string;
  sentAt?: number;
  readAt?: number;
  deliveredAt?: number;
  editedAt?: number;
  replyCount?: number;
  muid?: string;
  parentMessageId?: number;
}

export function buildTextMessage(overrides: MockTextMessageOptions = {}) {
  const id = overrides.id ?? Math.floor(Math.random() * 100000);
  const text = overrides.text ?? 'Hello world';
  const sender = overrides.sender ?? buildUser();
  const receiverType = overrides.receiverType ?? 'user';
  const receiverId = overrides.receiverId ?? 'user-2';
  const sentAt = overrides.sentAt ?? Date.now();
  const readAt = overrides.readAt ?? 0;
  const deliveredAt = overrides.deliveredAt ?? sentAt + 100;
  const editedAt = overrides.editedAt ?? 0;
  const replyCount = overrides.replyCount ?? 0;
  const muid = overrides.muid ?? `muid-${String(id)}`;
  const parentMessageId = overrides.parentMessageId ?? 0;

  return {
    getId: () => id,
    getText: () => text,
    getSender: () => sender,
    getReceiverType: () => receiverType,
    getReceiverId: () => receiverId,
    getType: () => 'text',
    getCategory: () => 'message',
    getSentAt: () => sentAt,
    getDeliveredAt: () => deliveredAt,
    getReadAt: () => readAt,
    getDeletedAt: () => 0,
    getEditedAt: () => editedAt,
    getReactions: () => [],
    setReactions: () => {
      /* noop */
    },
    getMetadata: () => ({}),
    getMuid: () => muid,
    getParentMessageId: () => parentMessageId,
    getReplyCount: () => replyCount,
    getMentionedUsers: () => [],
    getConversationId: () => `${receiverType}_${receiverId}`,
  };
}

interface MockMediaMessageOptions {
  id?: number;
  type?: 'image' | 'video' | 'audio' | 'file';
  sender?: ReturnType<typeof buildUser>;
  receiverType?: string;
  receiverId?: string;
  sentAt?: number;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  muid?: string;
  parentMessageId?: number;
}

export function buildMediaMessage(overrides: MockMediaMessageOptions = {}) {
  const id = overrides.id ?? Math.floor(Math.random() * 100000);
  const type = overrides.type ?? 'image';
  const sender = overrides.sender ?? buildUser();
  const receiverType = overrides.receiverType ?? 'user';
  const receiverId = overrides.receiverId ?? 'user-2';
  const sentAt = overrides.sentAt ?? Date.now();
  const url = overrides.url ?? 'https://example.com/media.jpg';
  const fileName = overrides.fileName ?? 'media.jpg';
  const fileSize = overrides.fileSize ?? 1024;
  const mimeType = overrides.mimeType ?? 'image/jpeg';
  const muid = overrides.muid ?? `muid-${String(id)}`;
  const parentMessageId = overrides.parentMessageId ?? 0;

  const attachment = {
    getUrl: () => url,
    getName: () => fileName,
    getSize: () => fileSize,
    getMimeType: () => mimeType,
    getExtension: () => fileName.split('.').pop() ?? '',
  };

  return {
    getId: () => id,
    getSender: () => sender,
    getReceiverType: () => receiverType,
    getReceiverId: () => receiverId,
    getType: () => type,
    getCategory: () => 'message',
    getSentAt: () => sentAt,
    getDeliveredAt: () => sentAt + 100,
    getReadAt: () => 0,
    getDeletedAt: () => 0,
    getEditedAt: () => 0,
    getReactions: () => [],
    setReactions: () => {
      /* noop */
    },
    getMetadata: () => ({}),
    getMuid: () => muid,
    getParentMessageId: () => parentMessageId,
    getReplyCount: () => 0,
    getAttachment: () => attachment,
    getAttachments: () => [attachment],
    getURL: () => url,
    getConversationId: () => `${receiverType}_${receiverId}`,
  };
}

interface MockDeletedMessageOptions {
  id?: number;
  sender?: ReturnType<typeof buildUser>;
  receiverType?: string;
  receiverId?: string;
  sentAt?: number;
  deletedAt?: number;
  originalType?: string;
}

export function buildDeletedMessage(overrides: MockDeletedMessageOptions = {}) {
  const id = overrides.id ?? Math.floor(Math.random() * 100000);
  const sender = overrides.sender ?? buildUser();
  const sentAt = overrides.sentAt ?? Date.now();
  const deletedAt = overrides.deletedAt ?? sentAt + 500;
  const originalType = overrides.originalType ?? 'text';

  return {
    getId: () => id,
    getSender: () => sender,
    getReceiverType: () => overrides.receiverType ?? 'user',
    getReceiverId: () => overrides.receiverId ?? 'user-2',
    getType: () => originalType,
    getCategory: () => 'message',
    getSentAt: () => sentAt,
    getDeliveredAt: () => sentAt + 100,
    getReadAt: () => 0,
    getDeletedAt: () => deletedAt,
    getEditedAt: () => 0,
    getReactions: () => [],
    setReactions: () => {
      /* noop */
    },
    getMetadata: () => ({}),
    getMuid: () => `muid-${String(id)}`,
    getParentMessageId: () => 0,
    getReplyCount: () => 0,
  };
}

// ─── Group Action Messages ──────────────────────────────────────────────────

interface MockActionMessageOptions {
  id?: number;
  actionText?: string;
  actionType?: string;
  actionBy?: ReturnType<typeof buildUser>;
  actionOn?: ReturnType<typeof buildUser>;
  sentAt?: number;
  groupId?: string;
}

export function buildActionMessage(overrides: MockActionMessageOptions = {}) {
  const id = overrides.id ?? Math.floor(Math.random() * 100000);
  const actionText = overrides.actionText ?? 'Alice joined the group';
  const actionType = overrides.actionType ?? 'joined';
  const actionBy = overrides.actionBy ?? buildUser({ name: 'Alice', uid: 'alice' });
  const actionOn = overrides.actionOn ?? buildUser({ name: 'Alice', uid: 'alice' });
  const sentAt = overrides.sentAt ?? Date.now();
  const groupId = overrides.groupId ?? 'group-1';

  return {
    getId: () => id,
    getSender: () => actionBy,
    getReceiverType: () => 'group',
    getReceiverId: () => groupId,
    getType: () => 'groupMember',
    getCategory: () => 'action',
    getSentAt: () => sentAt,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getDeletedAt: () => 0,
    getEditedAt: () => 0,
    getReactions: () => [],
    setReactions: () => {
      /* noop */
    },
    getMetadata: () => ({}),
    getMuid: () => `muid-${String(id)}`,
    getParentMessageId: () => 0,
    getReplyCount: () => 0,
    getMessage: () => actionText,
    getAction: () => actionType,
    getActionBy: () => actionBy,
    getActionOn: () => actionOn,
    getActionFor: () => ({ getGuid: () => groupId }),
  };
}

// ─── Receipts & Typing ─────────────────────────────────────────────────────

interface MockMessageReceiptOptions {
  messageId?: number;
  sender?: ReturnType<typeof buildUser>;
  receiverType?: string;
  receiverId?: string;
  timestamp?: number;
  receiptType?: 'delivered' | 'read';
}

export function buildMessageReceipt(overrides: MockMessageReceiptOptions = {}) {
  const messageId = overrides.messageId ?? Math.floor(Math.random() * 100000);
  const sender = overrides.sender ?? buildUser();
  const timestamp = overrides.timestamp ?? Date.now();
  const receiptType = overrides.receiptType ?? 'delivered';

  return {
    getMessageId: () => messageId,
    getSender: () => sender,
    getReceiverType: () => overrides.receiverType ?? 'user',
    getReceiverId: () => overrides.receiverId ?? 'user-2',
    getTimestamp: () => timestamp,
    getReceiptType: () => receiptType,
    getReadAt: () => (receiptType === 'read' ? timestamp : 0),
    getDeliveredAt: () => timestamp,
  };
}

interface MockTypingIndicatorOptions {
  senderUid?: string;
  senderName?: string;
  receiverType?: string;
  receiverId?: string;
}

export function buildTypingIndicator(overrides: MockTypingIndicatorOptions = {}) {
  const sender = buildUser({
    uid: overrides.senderUid ?? 'user-2',
    name: overrides.senderName ?? 'Other User',
  });

  return {
    getSender: () => sender,
    getReceiverType: () => overrides.receiverType ?? 'user',
    getReceiverId: () => overrides.receiverId ?? 'user-1',
  };
}

// ─── Conversations ──────────────────────────────────────────────────────────

interface MockConversationOptions {
  id?: string;
  type?: string;
  user?: ReturnType<typeof buildUser>;
  group?: ReturnType<typeof buildGroup>;
  lastMessage?: ReturnType<typeof buildTextMessage>;
  unreadCount?: number;
}

export function buildConversation(overrides: MockConversationOptions = {}) {
  const type = overrides.type ?? 'user';
  const user = overrides.user ?? buildUser();
  const group = overrides.group ?? buildGroup();
  const lastMessage = overrides.lastMessage ?? buildTextMessage();
  const unreadCount = overrides.unreadCount ?? 0;
  const id =
    overrides.id ?? (type === 'user' ? `user_${user.getUid()}` : `group_${group.getGuid()}`);

  return {
    getConversationId: () => id,
    getConversationType: () => type,
    getConversationWith: () => (type === 'user' ? user : group),
    getLastMessage: () => lastMessage,
    getUnreadMessageCount: () => unreadCount,
    getUpdatedAt: () => Date.now(),
    getTags: () => [],
  };
}
