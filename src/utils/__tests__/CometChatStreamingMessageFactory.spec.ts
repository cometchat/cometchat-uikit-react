import { describe, it, expect, vi } from 'vitest';

vi.mock('@cometchat/chat-sdk-javascript', () => {
  return {
    CometChat: {
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

import { createStreamingMessage } from '../CometChatStreamingMessageFactory';
import { CometChat } from '@cometchat/chat-sdk-javascript';

describe('CometChatStreamingMessageFactory', () => {
  const mockSender = {
    getName: () => 'AI Bot',
    getUid: () => 'ai-bot',
  } as unknown as CometChat.User;
  const mockReceiver = {
    getName: () => 'User',
    getUid: () => 'user1',
  } as unknown as CometChat.User;

  describe('createStreamingMessage', () => {
    it('should return an object with negative ID based on originalMessageId', () => {
      const msg = createStreamingMessage({
        originalMessageId: 42,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      expect(msg.getId()).toBe(-42);
      expect(msg.getMessageId()).toBe(-42);
    });

    it('should return the provided sender via getSender', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      expect(msg.getSender()).toBe(mockSender);
    });

    it('should return the provided receiver via getReceiver', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      expect(msg.getReceiver()).toBe(mockReceiver);
    });

    it('should return "custom" for getCategory', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      expect(msg.getCategory()).toBe('custom');
    });

    it('should return "run_started" for getType', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      expect(msg.getType()).toBe('run_started');
    });

    it('should return chatId from getReceiverId', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'my_chat_id',
      });
      expect(msg.getReceiverId()).toBe('my_chat_id');
    });

    it('should return data with runId from getData', () => {
      const msg = createStreamingMessage({
        originalMessageId: 99,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      const data = msg.getData() as { runId: number; threadId: string };
      expect(data.runId).toBe(99);
      expect(data.threadId).toBe('');
    });

    it('should return "user" for getReceiverType', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      expect(msg.getReceiverType()).toBe('user');
    });

    it('should return empty string for getText', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      expect(msg.getText()).toBe('');
    });

    it('should return 0 for getParentMessageId', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      expect(msg.getParentMessageId()).toBe(0);
    });

    it('should return empty array for getReactions', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      expect(msg.getReactions()).toEqual([]);
    });

    it('should have all setter methods as callable noops', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });

      // These should all be callable without throwing
      expect(() => msg.setId(123)).not.toThrow();
      expect(() => msg.setSender({} as CometChat.User)).not.toThrow();
      expect(() => msg.setReceiverType('group')).not.toThrow();
      expect(() => msg.setReceiver({} as CometChat.User)).not.toThrow();
      expect(() => msg.setCategory('message' as CometChat.MessageCategory)).not.toThrow();
      expect(() => msg.setType('text')).not.toThrow();
      expect(() => msg.setText('hello')).not.toThrow();
      expect(() => msg.setParentMessageId(5)).not.toThrow();
      expect(() => msg.setSentAt(1000)).not.toThrow();
      expect(() => msg.setMuid('muid_123')).not.toThrow();
      expect(() => msg.setConversationId('conv_1')).not.toThrow();
      expect(() => msg.setStatus('sent')).not.toThrow();
      expect(() => msg.setDeliveredAt(2000)).not.toThrow();
      expect(() => msg.setReadAt(3000)).not.toThrow();
      expect(() => msg.setEditedAt(4000)).not.toThrow();
      expect(() => msg.setEditedBy('user1')).not.toThrow();
      expect(() => msg.setDeletedAt(5000)).not.toThrow();
      expect(() => msg.setDeletedBy('user1')).not.toThrow();
      expect(() => msg.setReplyCount(3)).not.toThrow();
      expect(() => msg.setRawMessage({})).not.toThrow();
      expect(() => msg.setData({})).not.toThrow();

      // After calling setters, getters should still return original values (noops)
      expect(msg.getId()).toBe(-1);
      expect(msg.getSender()).toBe(mockSender);
    });

    it('should return false for hasMentionedMe', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      expect(msg.hasMentionedMe()).toBe(false);
    });

    it('should return empty object for getCustomData', () => {
      const msg = createStreamingMessage({
        originalMessageId: 1,
        sender: mockSender,
        receiver: mockReceiver,
        chatId: 'chat_123',
      });
      expect(msg.getCustomData()).toEqual({});
    });
  });
});
