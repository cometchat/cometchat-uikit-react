/**
 * Mock CometChat SDK for testing.
 *
 * Usage in test files:
 *   import { mockCometChat, installMockSDK } from '../testing/mock-sdk';
 *   beforeEach(() => installMockSDK());
 */
import { vi } from 'vitest';

export const mockUser = {
  getUid: () => 'user-1',
  getName: () => 'Test User',
  getAvatar: () => 'https://example.com/avatar.png',
  getStatus: () => 'online',
  getRole: () => 'default',
  getLastActiveAt: () => Date.now(),
  getLink: () => '',
  getMetadata: () => ({}),
  getStatusMessage: () => '',
  getBlockedByMe: () => false,
  getHasBlockedMe: () => false,
  getDeactivatedAt: () => 0,
};

export const mockCometChat = {
  // Init & Auth
  init: vi.fn().mockResolvedValue(undefined),
  login: vi.fn().mockResolvedValue(mockUser),
  logout: vi.fn().mockResolvedValue({}),
  getLoggedinUser: vi.fn().mockResolvedValue(mockUser),
  getLoggedInUser: vi.fn().mockResolvedValue(mockUser),
  isInitialized: vi.fn().mockReturnValue(true),
  createUser: vi.fn().mockResolvedValue(mockUser),
  getConnectionStatus: vi.fn().mockReturnValue('connected'),
  setSource: vi.fn(),

  // Messaging
  sendMessage: vi.fn().mockImplementation((msg: unknown) => Promise.resolve(msg)),
  sendTextMessage: vi.fn().mockImplementation((msg: unknown) => Promise.resolve(msg)),
  sendMediaMessage: vi.fn().mockImplementation((msg: unknown) => Promise.resolve(msg)),
  sendCustomMessage: vi.fn().mockImplementation((msg: unknown) => Promise.resolve(msg)),
  deleteMessage: vi.fn().mockResolvedValue({}),
  editMessage: vi.fn().mockResolvedValue({}),
  markAsRead: vi.fn().mockResolvedValue(undefined),
  markAsDelivered: vi.fn().mockResolvedValue(undefined),

  // Listeners
  addMessageListener: vi.fn(),
  removeMessageListener: vi.fn(),
  addUserListener: vi.fn(),
  removeUserListener: vi.fn(),
  addGroupListener: vi.fn(),
  removeGroupListener: vi.fn(),
  addCallListener: vi.fn(),
  removeCallListener: vi.fn(),
  addConnectionListener: vi.fn(),
  removeConnectionListener: vi.fn(),

  // Typing
  startTyping: vi.fn(),
  endTyping: vi.fn(),

  // Conversations
  getConversation: vi.fn().mockResolvedValue({}),
  deleteConversation: vi.fn().mockResolvedValue(undefined),

  // Groups
  getGroup: vi.fn().mockResolvedValue({}),
  createGroup: vi.fn().mockResolvedValue({}),
  joinGroup: vi.fn().mockResolvedValue({}),
  leaveGroup: vi.fn().mockResolvedValue(undefined),
  deleteGroup: vi.fn().mockResolvedValue(undefined),

  // Reactions
  addReaction: vi.fn().mockResolvedValue({}),
  removeReaction: vi.fn().mockResolvedValue({}),

  // Constants
  RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
  MESSAGE_TYPE: {
    TEXT: 'text',
    FILE: 'file',
    IMAGE: 'image',
    AUDIO: 'audio',
    VIDEO: 'video',
    ASSISTANT: 'assistant',
    TOOL_ARGUMENTS: 'toolArguments',
    TOOL_RESULT: 'toolResults',
  },
  CATEGORY_MESSAGE: 'message',
  CATEGORY_CUSTOM: 'custom',
  CATEGORY_ACTION: 'action',
  CATEGORY_CALL: 'call',
  CATEGORY_INTERACTIVE: 'interactive',
  USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
  GROUP_TYPE: { PUBLIC: 'public', PRIVATE: 'private', PASSWORD: 'password' },
  GROUP_MEMBER_SCOPE: { ADMIN: 'admin', PARTICIPANT: 'participant', MODERATOR: 'moderator' },
  MessageCategory: { AGENTIC: 'agentic' },
  ModerationStatus: {
    PENDING: 'pending',
    APPROVED: 'approved',
    DISAPPROVED: 'disapproved',
    UNMODERATED: 'unmoderated',
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
  CALL_STATUS: {
    ONGOING: 'ongoing',
    ENDED: 'ended',
    INITIATED: 'initiated',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected',
    UNANSWERED: 'unanswered',
    BUSY: 'busy',
  },
  CALL_MODE: {
    DEFAULT: 'default',
    GRID: 'grid',
    SINGLE: 'single',
    SPOTLIGHT: 'spotlight',
    TILE: 'tile',
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

  // Constructors
  TextMessage: vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
    receiverId: string,
    text: string,
    receiverType: string
  ) {
    this.receiverId = receiverId;
    this.text = text;
    this.receiverType = receiverType;
    this.metadata = {};
    this.muid = '';
    this.sentAt = 0;
    this.parentMessageId = 0;
    this.mentionedUsers = [];
    this.getReceiverType = () => receiverType;
    this.getReceiverId = () => receiverId;
    this.getText = () => text;
    this.getId = () => this.id ?? 0;
    this.setId = (id: number) => {
      this.id = id;
    };
    this.getSender = () => ({ getUid: () => 'user-1', getName: () => 'Test User' });
    this.setSender = (s: unknown) => {
      this.sender = s;
    };
    this.setSentAt = (t: number) => {
      this.sentAt = t;
    };
    this.getSentAt = () => this.sentAt ?? 0;
    this.getMetadata = () => this.metadata ?? {};
    this.setMetadata = (m: Record<string, unknown>) => {
      this.metadata = m;
    };
    this.getMuid = () => this.muid ?? '';
    this.setMuid = (m: string) => {
      this.muid = m;
    };
    this.getParentMessageId = () => this.parentMessageId ?? 0;
    this.setParentMessageId = (id: number) => {
      this.parentMessageId = id;
    };
    this.getMentionedUsers = () => this.mentionedUsers ?? [];
    this.setMentionedUsers = (users: unknown[]) => {
      this.mentionedUsers = users;
    };
    this.getConversationId = () => `${receiverType}_${receiverId}`;
    this.getCategory = () => 'message';
    this.getType = () => 'text';
  }),
  User: vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
    opts: { uid: string; name: string }
  ) {
    this.uid = opts.uid;
    this.name = opts.name;
    this.getUid = () => this.uid;
    this.getName = () => this.name;
  }),
  TypingIndicator: vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
    receiverId: string,
    receiverType: string
  ) {
    this.receiverId = receiverId;
    this.receiverType = receiverType;
  }),
};

/**
 * Call this in beforeEach() to install the mock SDK globally.
 */
export function installMockSDK() {
  vi.mock('@cometchat/chat-sdk-javascript', () => ({
    CometChat: mockCometChat,
  }));
}
