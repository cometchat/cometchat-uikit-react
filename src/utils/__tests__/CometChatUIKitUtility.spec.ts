import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@cometchat/chat-sdk-javascript', () => {
  class User {
    private name: string;
    private uid: string;
    constructor(uid: string) {
      this.uid = uid;
      this.name = '';
    }
    getName() {
      return this.name;
    }
    setName(name: string) {
      this.name = name;
    }
    getUid() {
      return this.uid;
    }
  }

  class Group {
    private guid: string;
    private name: string;
    constructor(guid: string, name: string) {
      this.guid = guid;
      this.name = name;
    }
    getGuid() {
      return this.guid;
    }
    getName() {
      return this.name;
    }
  }

  class GroupMember extends User {
    private scope: string;
    constructor(uid: string, scope: string) {
      super(uid);
      this.scope = scope;
    }
    getScope() {
      return this.scope;
    }
  }

  class Action {
    private receiverId: string;
    private messageType: string;
    private receiverType: string;
    private category: string;
    private action = '';
    private actionBy: unknown = null;
    private sender: unknown = null;
    private message = '';
    private actionFor: unknown = null;
    private actionOn: unknown = null;
    private receiver: unknown = null;
    private conversationId = '';
    private muid = '';
    private sentAt = 0;
    private data: unknown = null;

    constructor(receiverId: string, messageType: string, receiverType: string, category: string) {
      this.receiverId = receiverId;
      this.messageType = messageType;
      this.receiverType = receiverType;
      this.category = category;
    }
    setAction(action: string) {
      this.action = action;
    }
    getAction() {
      return this.action;
    }
    setActionBy(user: unknown) {
      this.actionBy = user;
    }
    getActionBy() {
      return this.actionBy;
    }
    setSender(user: unknown) {
      this.sender = user;
    }
    getSender() {
      return this.sender;
    }
    setMessage(msg: string) {
      this.message = msg;
    }
    getMessage() {
      return this.message;
    }
    setActionFor(entity: unknown) {
      this.actionFor = entity;
    }
    getActionFor() {
      return this.actionFor;
    }
    setActionOn(entity: unknown) {
      this.actionOn = entity;
    }
    getActionOn() {
      return this.actionOn;
    }
    setReceiver(entity: unknown) {
      this.receiver = entity;
    }
    getReceiver() {
      return this.receiver;
    }
    setConversationId(id: string) {
      this.conversationId = id;
    }
    getConversationId() {
      return this.conversationId;
    }
    setMuid(muid: string) {
      this.muid = muid;
    }
    getMuid() {
      return this.muid;
    }
    setSentAt(time: number) {
      this.sentAt = time;
    }
    getSentAt() {
      return this.sentAt;
    }
    setReceiverType(type: string) {
      this.receiverType = type;
    }
    getReceiverType() {
      return this.receiverType;
    }
    setData(data: unknown) {
      this.data = data;
    }
    getData() {
      return this.data;
    }
    getReceiverId() {
      return this.receiverId;
    }
    getMessageType() {
      return this.messageType;
    }
    getCategory() {
      return this.category;
    }
  }

  return {
    CometChat: {
      User,
      Group,
      GroupMember,
      Action,
      CATEGORY_MESSAGE: 'message',
      CATEGORY_CUSTOM: 'custom',
      CATEGORY_ACTION: 'action',
      CATEGORY_CALL: 'call',
      CATEGORY_INTERACTIVE: 'interactive',
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
      RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
      USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
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
      ModerationStatus: {
        PENDING: 'pending',
        APPROVED: 'approved',
        DISAPPROVED: 'disapproved',
        UNMODERATED: 'unmoderated',
      },
      MessageCategory: { AGENTIC: 'agentic' },
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
  };
});

import { clone, generateId, getUnixTimestamp, createActionMessage } from '../CometChatUIKitUtility';
import { CometChat } from '@cometchat/chat-sdk-javascript';

describe('CometChatUIKitUtility', () => {
  describe('clone', () => {
    it('should pass through null', () => {
      expect(clone(null)).toBeNull();
    });

    it('should pass through undefined', () => {
      expect(clone(undefined)).toBeUndefined();
    });

    it('should pass through numbers', () => {
      expect(clone(42)).toBe(42);
      expect(clone(0)).toBe(0);
      expect(clone(-1)).toBe(-1);
    });

    it('should pass through strings', () => {
      expect(clone('hello')).toBe('hello');
      expect(clone('')).toBe('');
    });

    it('should deep clone plain objects', () => {
      const original = { a: 1, b: 'two', c: true };
      const cloned = clone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);

      // Mutating clone should not affect original
      cloned.a = 99;
      expect(original.a).toBe(1);
    });

    it('should deep clone arrays', () => {
      const original = [1, 2, 3, 'four'];
      const cloned = clone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);

      // Mutating clone should not affect original
      cloned[0] = 999;
      expect(original[0]).toBe(1);
    });

    it('should deep clone nested objects and arrays', () => {
      const original = {
        name: 'test',
        nested: { deep: { value: [1, 2, { three: 3 }] } },
        list: [{ a: 1 }, { b: 2 }],
      };
      const cloned = clone(original);
      expect(cloned).toEqual(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.deep).not.toBe(original.nested.deep);
      expect(cloned.nested.deep.value).not.toBe(original.nested.deep.value);
      expect(cloned.list[0]).not.toBe(original.list[0]);
    });

    it('should preserve prototype', () => {
      class MyClass {
        value: number;
        constructor(v: number) {
          this.value = v;
        }
        double() {
          return this.value * 2;
        }
      }
      const original = new MyClass(5);
      const cloned = clone(original);
      expect(Object.getPrototypeOf(cloned)).toBe(Object.getPrototypeOf(original));
      expect(cloned.double()).toBe(10);
    });

    it('should preserve property descriptors (getters)', () => {
      const original: Record<string, unknown> = {};
      Object.defineProperty(original, 'computed', {
        get() {
          return 42;
        },
        enumerable: true,
        configurable: true,
      });
      const cloned = clone(original);
      expect(cloned.computed).toBe(42);
      const descriptor = Object.getOwnPropertyDescriptor(cloned, 'computed');
      expect(typeof descriptor?.get).toBe('function');
      expect(descriptor).not.toHaveProperty('value');
    });
  });

  describe('generateId', () => {
    it('should return a string starting with underscore', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id[0]).toBe('_');
    });

    it('should have sufficient length (at least 5 chars)', () => {
      const id = generateId();
      expect(id.length).toBeGreaterThanOrEqual(5);
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('getUnixTimestamp', () => {
    it('should return a number', () => {
      expect(typeof getUnixTimestamp()).toBe('number');
    });

    it('should return a value close to current time in seconds', () => {
      const before = Math.floor(Date.now() / 1000);
      const result = getUnixTimestamp();
      const after = Math.ceil(Date.now() / 1000);
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });

  describe('createActionMessage', () => {
    let loggedInUser: CometChat.User;
    let targetMember: CometChat.GroupMember;
    let group: CometChat.Group;

    beforeEach(() => {
      loggedInUser = new CometChat.User('user1');
      loggedInUser.setName('Alice');

      targetMember = new CometChat.GroupMember('user2', 'participant');
      targetMember.setName('Bob');

      group = new CometChat.Group('group1', 'Test Group');
    });

    it('should create an action message with correct action', () => {
      const msg = createActionMessage(targetMember, 'kicked', group, loggedInUser);
      expect(msg.getAction()).toBe('kicked');
    });

    it('should set the sender as the logged in user', () => {
      const msg = createActionMessage(targetMember, 'kicked', group, loggedInUser);
      const sender = msg.getSender() as CometChat.User;
      expect(sender.getName()).toBe('Alice');
    });

    it('should set the message string describing the action', () => {
      const msg = createActionMessage(targetMember, 'kicked', group, loggedInUser);
      expect(msg.getMessage()).toBe('Alice kicked Bob');
    });

    it('should set conversation id with group_ prefix', () => {
      const msg = createActionMessage(targetMember, 'banned', group, loggedInUser);
      expect(msg.getConversationId()).toBe('group_group1');
    });

    it('should set receiver type to group', () => {
      const msg = createActionMessage(targetMember, 'added', group, loggedInUser);
      expect(msg.getReceiverType()).toBe('group');
    });

    it('should set scope data when actionOn is a GroupMember', () => {
      const msg = createActionMessage(targetMember, 'scopeChanged', group, loggedInUser);
      const data = msg.getData() as { extras: { scope: { new: string } } };
      expect(data.extras.scope.new).toBe('participant');
    });

    it('should set muid and sentAt', () => {
      const msg = createActionMessage(targetMember, 'kicked', group, loggedInUser);
      expect(msg.getMuid()).toBeTruthy();
      expect(msg.getSentAt()).toBeGreaterThan(0);
    });
  });
});
