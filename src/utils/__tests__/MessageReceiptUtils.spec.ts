import { describe, it, expect, vi } from 'vitest';

vi.mock('@cometchat/chat-sdk-javascript', () => {
  class BaseMessage {
    protected _id = 0;
    protected _sentAt = 0;
    protected _deliveredAt = 0;
    protected _readAt = 0;
    protected _sender: { getUid: () => string } = { getUid: () => '' };
    protected _metadata: Record<string, unknown> | null = null;

    getId() {
      return this._id;
    }
    setId(id: number) {
      this._id = id;
    }
    getSentAt() {
      return this._sentAt;
    }
    setSentAt(t: number) {
      this._sentAt = t;
    }
    getDeliveredAt() {
      return this._deliveredAt;
    }
    setDeliveredAt(t: number) {
      this._deliveredAt = t;
    }
    getReadAt() {
      return this._readAt;
    }
    setReadAt(t: number) {
      this._readAt = t;
    }
    getSender() {
      return this._sender;
    }
    setSender(s: { getUid: () => string }) {
      this._sender = s;
    }
    getMetadata() {
      return this._metadata;
    }
    setMetadata(m: Record<string, unknown> | null) {
      this._metadata = m;
    }
  }

  class TextMessage extends BaseMessage {
    protected _moderationStatus = '';
    getModerationStatus() {
      return this._moderationStatus;
    }
    setModerationStatus(s: string) {
      this._moderationStatus = s;
    }
  }

  class MediaMessage extends BaseMessage {
    protected _moderationStatus = '';
    getModerationStatus() {
      return this._moderationStatus;
    }
    setModerationStatus(s: string) {
      this._moderationStatus = s;
    }
  }

  return {
    CometChat: {
      BaseMessage,
      TextMessage,
      MediaMessage,
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

import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getReceiptStatus,
  getMessageError,
  hasMessageError,
  isMessageModerated,
  isPermissionDeniedError,
  isMessagePendingModeration,
} from '../MessageReceiptUtils';

function createTextMessage(
  overrides: {
    id?: number;
    sentAt?: number;
    deliveredAt?: number;
    readAt?: number;
    moderationStatus?: string;
    senderUid?: string;
    metadata?: Record<string, unknown> | null;
    error?: unknown;
    _ccError?: unknown;
  } = {}
): CometChat.TextMessage {
  const msg = new CometChat.TextMessage();
  if (overrides.id !== undefined) msg.setId(overrides.id);
  if (overrides.sentAt !== undefined) msg.setSentAt(overrides.sentAt);
  if (overrides.deliveredAt !== undefined) msg.setDeliveredAt(overrides.deliveredAt);
  if (overrides.readAt !== undefined) msg.setReadAt(overrides.readAt);
  if (overrides.moderationStatus !== undefined) msg.setModerationStatus(overrides.moderationStatus);
  if (overrides.senderUid !== undefined) {
    msg.setSender({ getUid: () => overrides.senderUid! });
  }
  if (overrides.metadata !== undefined) msg.setMetadata(overrides.metadata);
  if (overrides.error !== undefined) {
    (msg as unknown as Record<string, unknown>).error = overrides.error;
  }
  if (overrides._ccError !== undefined) {
    (msg as unknown as Record<string, unknown>)._ccError = overrides._ccError;
  }
  return msg;
}

function createMediaMessage(
  overrides: {
    id?: number;
    sentAt?: number;
    deliveredAt?: number;
    readAt?: number;
    moderationStatus?: string;
    senderUid?: string;
    metadata?: Record<string, unknown> | null;
    error?: unknown;
    _ccError?: unknown;
  } = {}
): CometChat.MediaMessage {
  const msg = new CometChat.MediaMessage();
  if (overrides.id !== undefined) msg.setId(overrides.id);
  if (overrides.sentAt !== undefined) msg.setSentAt(overrides.sentAt);
  if (overrides.deliveredAt !== undefined) msg.setDeliveredAt(overrides.deliveredAt);
  if (overrides.readAt !== undefined) msg.setReadAt(overrides.readAt);
  if (overrides.moderationStatus !== undefined) msg.setModerationStatus(overrides.moderationStatus);
  if (overrides.senderUid !== undefined) {
    msg.setSender({ getUid: () => overrides.senderUid! });
  }
  if (overrides.metadata !== undefined) msg.setMetadata(overrides.metadata);
  if (overrides.error !== undefined) {
    (msg as unknown as Record<string, unknown>).error = overrides.error;
  }
  if (overrides._ccError !== undefined) {
    (msg as unknown as Record<string, unknown>)._ccError = overrides._ccError;
  }
  return msg;
}

function createBaseMessage(
  overrides: {
    id?: number;
    sentAt?: number;
    deliveredAt?: number;
    readAt?: number;
    senderUid?: string;
    metadata?: Record<string, unknown> | null;
    error?: unknown;
    _ccError?: unknown;
  } = {}
): CometChat.BaseMessage {
  const msg = new CometChat.BaseMessage();
  if (overrides.id !== undefined) msg.setId(overrides.id);
  if (overrides.sentAt !== undefined) msg.setSentAt(overrides.sentAt);
  if (overrides.deliveredAt !== undefined) msg.setDeliveredAt(overrides.deliveredAt);
  if (overrides.readAt !== undefined) msg.setReadAt(overrides.readAt);
  if (overrides.senderUid !== undefined) {
    msg.setSender({ getUid: () => overrides.senderUid! });
  }
  if (overrides.metadata !== undefined) msg.setMetadata(overrides.metadata);
  if (overrides.error !== undefined) {
    (msg as unknown as Record<string, unknown>).error = overrides.error;
  }
  if (overrides._ccError !== undefined) {
    (msg as unknown as Record<string, unknown>)._ccError = overrides._ccError;
  }
  return msg;
}

describe('MessageReceiptUtils', () => {
  describe('getReceiptStatus', () => {
    it('should return "error" when moderation status is disapproved', () => {
      const msg = createTextMessage({ moderationStatus: 'disapproved', sentAt: 100, id: 1 });
      expect(getReceiptStatus(msg)).toBe('error');
    });

    it('should return "error" when message has a direct error', () => {
      const msg = createTextMessage({
        sentAt: 100,
        id: 1,
        error: { code: 'SOME_ERROR', message: 'failed' },
      });
      expect(getReceiptStatus(msg)).toBe('error');
    });

    it('should return "read" when readAt is set', () => {
      const msg = createTextMessage({ sentAt: 100, deliveredAt: 200, readAt: 300, id: 1 });
      expect(getReceiptStatus(msg)).toBe('read');
    });

    it('should return "delivered" when deliveredAt is set but not readAt', () => {
      const msg = createTextMessage({ sentAt: 100, deliveredAt: 200, id: 1 });
      expect(getReceiptStatus(msg)).toBe('delivered');
    });

    it('should return "sent" when sentAt and id are set', () => {
      const msg = createTextMessage({ sentAt: 100, id: 1 });
      expect(getReceiptStatus(msg)).toBe('sent');
    });

    it('should return "wait" when no sentAt or id', () => {
      const msg = createTextMessage({});
      expect(getReceiptStatus(msg)).toBe('wait');
    });

    it('should return "error" for moderation even if readAt is set', () => {
      const msg = createTextMessage({
        moderationStatus: 'disapproved',
        readAt: 300,
        sentAt: 100,
        id: 1,
      });
      expect(getReceiptStatus(msg)).toBe('error');
    });
  });

  describe('getMessageError', () => {
    it('should return undefined when no error', () => {
      const msg = createTextMessage({ sentAt: 100, id: 1 });
      expect(getMessageError(msg)).toBeUndefined();
    });

    it('should extract error from _ccError', () => {
      const msg = createTextMessage({ _ccError: { code: 'ERR_TEST', message: 'test error' } });
      expect(getMessageError(msg)).toEqual({ code: 'ERR_TEST', message: 'test error' });
    });

    it('should extract error from direct .error property', () => {
      const msg = createTextMessage({ error: { code: 'ERR_DIRECT', message: 'direct error' } });
      expect(getMessageError(msg)).toEqual({ code: 'ERR_DIRECT', message: 'direct error' });
    });

    it('should extract error from metadata.error', () => {
      const msg = createTextMessage({
        metadata: { error: { code: 'ERR_META', message: 'meta error' } },
      });
      expect(getMessageError(msg)).toEqual({ code: 'ERR_META', message: 'meta error' });
    });

    it('should handle string error', () => {
      const msg = createTextMessage({ _ccError: 'something failed' });
      expect(getMessageError(msg)).toEqual({ message: 'something failed' });
    });

    it('should extract nested error code from error.error.code', () => {
      const msg = createTextMessage({
        _ccError: { error: { code: 'NESTED_CODE' } },
      });
      const result = getMessageError(msg);
      expect(result?.code).toBe('NESTED_CODE');
    });

    it('should return default message for truthy non-string non-object error', () => {
      const msg = createTextMessage({ _ccError: true });
      expect(getMessageError(msg)).toEqual({ message: 'Send failed' });
    });
  });

  describe('hasMessageError', () => {
    it('should return true when error exists', () => {
      const msg = createTextMessage({ error: { code: 'ERR', message: 'fail' } });
      expect(hasMessageError(msg)).toBe(true);
    });

    it('should return false when no error', () => {
      const msg = createTextMessage({ sentAt: 100, id: 1 });
      expect(hasMessageError(msg)).toBe(false);
    });
  });

  describe('isMessageModerated', () => {
    it('should return true for disapproved TextMessage from matching uid', () => {
      const msg = createTextMessage({
        moderationStatus: 'disapproved',
        senderUid: 'user1',
      });
      expect(isMessageModerated(msg, 'user1')).toBe(true);
    });

    it('should return false for disapproved TextMessage from different uid', () => {
      const msg = createTextMessage({
        moderationStatus: 'disapproved',
        senderUid: 'user2',
      });
      expect(isMessageModerated(msg, 'user1')).toBe(false);
    });

    it('should return true for disapproved MediaMessage from matching uid', () => {
      const msg = createMediaMessage({
        moderationStatus: 'disapproved',
        senderUid: 'user1',
      });
      expect(isMessageModerated(msg, 'user1')).toBe(true);
    });

    it('should return false for non-disapproved status', () => {
      const msg = createTextMessage({
        moderationStatus: 'approved',
        senderUid: 'user1',
      });
      expect(isMessageModerated(msg, 'user1')).toBe(false);
    });

    it('should return false for BaseMessage (not Text or Media)', () => {
      const msg = createBaseMessage({ senderUid: 'user1' });
      expect(isMessageModerated(msg, 'user1')).toBe(false);
    });
  });

  describe('isPermissionDeniedError', () => {
    it('should return true for ERR_PERMISSION_DENIED from _ccError', () => {
      const msg = createTextMessage({
        _ccError: { code: 'ERR_PERMISSION_DENIED' },
        senderUid: 'user1',
      });
      expect(isPermissionDeniedError(msg, 'user1')).toBe(true);
    });

    it('should return true for ERR_FILE_TYPE_NOT_ALLOWED from direct error', () => {
      const msg = createMediaMessage({
        error: { code: 'ERR_FILE_TYPE_NOT_ALLOWED' },
        senderUid: 'user1',
      });
      expect(isPermissionDeniedError(msg, 'user1')).toBe(true);
    });

    it('should return true for ERR_PERMISSION_DENIED from metadata error', () => {
      const msg = createTextMessage({
        metadata: { error: { code: 'ERR_PERMISSION_DENIED' } },
        senderUid: 'user1',
      });
      expect(isPermissionDeniedError(msg, 'user1')).toBe(true);
    });

    it('should return false for a different error code', () => {
      const msg = createTextMessage({
        _ccError: { code: 'ERR_OTHER' },
        senderUid: 'user1',
      });
      expect(isPermissionDeniedError(msg, 'user1')).toBe(false);
    });

    it('should return false for BaseMessage (not Text or Media)', () => {
      const msg = createBaseMessage({
        _ccError: { code: 'ERR_PERMISSION_DENIED' },
        senderUid: 'user1',
      });
      expect(isPermissionDeniedError(msg as CometChat.BaseMessage, 'user1')).toBe(false);
    });

    it('should return true when sender uid is undefined (optimistic message)', () => {
      const msg = createTextMessage({
        _ccError: { code: 'ERR_PERMISSION_DENIED' },
      });
      // sender getUid returns '' which is falsy
      expect(isPermissionDeniedError(msg, 'user1')).toBe(true);
    });

    it('should return false when sender uid does not match logged-in user', () => {
      const msg = createTextMessage({
        _ccError: { code: 'ERR_PERMISSION_DENIED' },
        senderUid: 'other_user',
      });
      expect(isPermissionDeniedError(msg, 'user1')).toBe(false);
    });
  });

  describe('isMessagePendingModeration', () => {
    it('should return true for TextMessage with pending status', () => {
      const msg = createTextMessage({ moderationStatus: 'pending' });
      expect(isMessagePendingModeration(msg)).toBe(true);
    });

    it('should return true for MediaMessage with pending status', () => {
      const msg = createMediaMessage({ moderationStatus: 'pending' });
      expect(isMessagePendingModeration(msg)).toBe(true);
    });

    it('should return false for approved status', () => {
      const msg = createTextMessage({ moderationStatus: 'approved' });
      expect(isMessagePendingModeration(msg)).toBe(false);
    });

    it('should return false for BaseMessage', () => {
      const msg = createBaseMessage({});
      expect(isMessagePendingModeration(msg)).toBe(false);
    });
  });
});
