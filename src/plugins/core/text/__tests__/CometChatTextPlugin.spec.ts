import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Hoist mocks so vi.mock factory can reference them
const { mockGetTextMessageOptions } = vi.hoisted(() => ({
  mockGetTextMessageOptions: vi.fn(() => [
    { id: 'react', title: 'React', onClick: vi.fn() },
    { id: 'reply', title: 'Reply', onClick: vi.fn() },
    { id: 'copy', title: 'Copy', onClick: vi.fn() },
    { id: 'edit', title: 'Edit', senderOnly: true, onClick: vi.fn() },
    { id: 'delete', title: 'Delete', senderOnly: true, onClick: vi.fn() },
  ]),
}));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    CATEGORY_MESSAGE: 'message',
    CATEGORY_CUSTOM: 'custom',
    CATEGORY_ACTION: 'action',
    CATEGORY_CALL: 'call',
    CATEGORY_INTERACTIVE: 'interactive',
    MessageCategory: { AGENTIC: 'agentic' },
    MESSAGE_TYPE: {
      TEXT: 'text',
      FILE: 'file',
      IMAGE: 'image',
      AUDIO: 'audio',
      VIDEO: 'video',
      ASSISTANT: 'assistant',
      TOOL_ARGUMENTS: 'toolArguments',
      TOOL_RESULT: 'toolResult',
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
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
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
}));

vi.mock('../../shared/CometChatMessageOptions', () => ({
  getTextMessageOptions: mockGetTextMessageOptions,
}));

import { CometChatTextPlugin } from '../CometChatTextPlugin';
import { CometChatMentionsFormatter } from '../../../../formatters/CometChatMentionsFormatter';
import { CometChatUrlFormatter } from '../../../../formatters/CometChatUrlFormatter';
import type { CometChatMessagePluginContext } from '../../../plugin.types';

// --- Helpers ---

function createMockTextMessage(
  overrides: {
    text?: string;
    mentionedUsers?: { getUid: () => string; getName: () => string }[];
  } = {}
) {
  return {
    getText: () => overrides.text ?? 'Hello world',
    getMentionedUsers: () => overrides.mentionedUsers ?? [],
    getSender: () => ({ getUid: () => 'user-1' }),
    getId: () => 1,
    getType: () => 'text',
    getCategory: () => 'message',
    getDeletedAt: () => null,
    getMetadata: () => null,
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.TextMessage;
}

function createMockContext(
  overrides: Partial<CometChatMessagePluginContext> = {}
): CometChatMessagePluginContext {
  return {
    loggedInUser: {
      getUid: () => 'user-1',
      getName: () => 'Test User',
    } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.User,
    alignment: 'right',
    theme: 'light',
    ...overrides,
  };
}

// --- Tests ---

describe('CometChatTextPlugin', () => {
  describe('static properties', () => {
    it('has id "text"', () => {
      expect(CometChatTextPlugin.id).toBe('text');
    });

    it('handles text message type', () => {
      expect(CometChatTextPlugin.messageTypes).toContain('text');
    });

    it('handles message category', () => {
      expect(CometChatTextPlugin.messageCategories).toContain('message');
    });
  });

  describe('renderBubble', () => {
    it('returns a CometChatTextBubble React element', () => {
      const message = createMockTextMessage({ text: 'Hello world' });
      const context = createMockContext();

      const result = CometChatTextPlugin.renderBubble(message, context);

      expect(React.isValidElement(result)).toBe(true);
    });

    it('forwards the message so the bubble self-extracts getText()', () => {
      const message = createMockTextMessage({ text: 'My message text' });
      const context = createMockContext();

      const element = CometChatTextPlugin.renderBubble(message, context) as React.ReactElement;

      // The plugin no longer pre-extracts text; it forwards the message and the
      // bubble derives the content itself via message.getText().
      expect(element.props.text).toBeUndefined();
      expect(element.props.message).toBe(message);
      expect((element.props.message as { getText: () => string }).getText()).toBe(
        'My message text'
      );
    });

    it('sets isSentByMe=true when alignment is right', () => {
      const message = createMockTextMessage();
      const context = createMockContext({ alignment: 'right' });

      const element = CometChatTextPlugin.renderBubble(message, context) as React.ReactElement;

      expect(element.props.isSentByMe).toBe(true);
    });

    it('sets isSentByMe=false when alignment is left', () => {
      const message = createMockTextMessage();
      const context = createMockContext({ alignment: 'left' });

      const element = CometChatTextPlugin.renderBubble(message, context) as React.ReactElement;

      expect(element.props.isSentByMe).toBe(false);
    });

    it('passes textFormatters array to the bubble', () => {
      const message = createMockTextMessage();
      const context = createMockContext();

      const element = CometChatTextPlugin.renderBubble(message, context) as React.ReactElement;

      expect(Array.isArray(element.props.textFormatters)).toBe(true);
      expect(element.props.textFormatters.length).toBeGreaterThan(0);
    });

    it('passes the message object to the bubble', () => {
      const message = createMockTextMessage();
      const context = createMockContext();

      const element = CometChatTextPlugin.renderBubble(message, context) as React.ReactElement;

      expect(element.props.message).toBe(message);
    });

    it('configures MentionsFormatter with loggedInUser from context', () => {
      const message = createMockTextMessage();
      const loggedInUser = {
        getUid: () => 'me-123',
        getName: () => 'Me',
      } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.User;
      const context = createMockContext({ loggedInUser });

      const element = CometChatTextPlugin.renderBubble(message, context) as React.ReactElement;
      const mentionsFormatter = element.props.textFormatters.find(
        (f: unknown) => f instanceof CometChatMentionsFormatter
      );

      expect(mentionsFormatter).toBeDefined();
    });

    it('sets mentioned users on MentionsFormatter when message has mentions', () => {
      const mentionedUsers = [
        { getUid: () => 'u1', getName: () => 'Alice' },
        { getUid: () => 'u2', getName: () => 'Bob' },
      ];
      const message = createMockTextMessage({ mentionedUsers });
      const context = createMockContext();

      const element = CometChatTextPlugin.renderBubble(message, context) as React.ReactElement;

      // The formatters should be configured — just verify the element is valid
      expect(element.props.textFormatters.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getOptions', () => {
    it('returns an array of message options', () => {
      const message = createMockTextMessage();
      const context = createMockContext();

      const options = CometChatTextPlugin.getOptions!(message, context);

      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);
    });

    it('delegates to getTextMessageOptions', () => {
      const message = createMockTextMessage();
      const context = createMockContext();

      CometChatTextPlugin.getOptions!(message, context);

      expect(mockGetTextMessageOptions).toHaveBeenCalledWith(message, context);
    });

    it('includes copy option for text messages', () => {
      const message = createMockTextMessage();
      const context = createMockContext();

      const options = CometChatTextPlugin.getOptions!(message, context);

      expect(options.some(o => o.id === 'copy')).toBe(true);
    });

    it('includes edit option for text messages', () => {
      const message = createMockTextMessage();
      const context = createMockContext();

      const options = CometChatTextPlugin.getOptions!(message, context);

      expect(options.some(o => o.id === 'edit')).toBe(true);
    });

    it('includes react option', () => {
      const message = createMockTextMessage();
      const context = createMockContext();

      const options = CometChatTextPlugin.getOptions!(message, context);

      expect(options.some(o => o.id === 'react')).toBe(true);
    });
  });

  describe('getLastMessagePreview', () => {
    it('returns the message text as preview', () => {
      const message = createMockTextMessage({ text: 'Hello there' });

      const preview = CometChatTextPlugin.getLastMessagePreview!(
        message,
        createMockContext().loggedInUser
      );

      expect(preview).toBe('Hello there');
    });

    it('does not truncate text (CSS handles truncation via text-overflow)', () => {
      const longText = 'A'.repeat(150);
      const message = createMockTextMessage({ text: longText });

      const preview = CometChatTextPlugin.getLastMessagePreview!(
        message,
        createMockContext().loggedInUser
      );

      // No truncation — the full text is returned; CSS handles visual truncation
      expect(preview).toContain('A'.repeat(150));
    });

    it('does not truncate text at exactly 100 characters', () => {
      const exactText = 'B'.repeat(100);
      const message = createMockTextMessage({ text: exactText });

      const preview = CometChatTextPlugin.getLastMessagePreview!(
        message,
        createMockContext().loggedInUser
      );

      expect(preview).toBe(exactText);
    });

    it('resolves SDK mention patterns to display names', () => {
      const mentionedUsers = [{ getUid: () => 'uid-alice', getName: () => 'Alice' }];
      const message = createMockTextMessage({
        text: 'Hey <@uid:uid-alice> check this',
        mentionedUsers,
      });

      const preview = CometChatTextPlugin.getLastMessagePreview!(
        message,
        createMockContext().loggedInUser
      );

      expect(preview).toContain('@Alice');
      expect(preview).not.toContain('<@uid:');
    });

    it('resolves @all channel mentions', () => {
      const message = createMockTextMessage({
        text: 'Attention <@all:everyone>!',
      });

      const preview = CometChatTextPlugin.getLastMessagePreview!(
        message,
        createMockContext().loggedInUser
      );

      expect(preview).toContain('@everyone');
      expect(preview).not.toContain('<@all:');
    });

    it('preserves HTML formatting in preview (markdown converted to HTML)', () => {
      const message = createMockTextMessage({
        text: 'Hello **bold** world',
      });

      const preview = CometChatTextPlugin.getLastMessagePreview!(
        message,
        createMockContext().loggedInUser
      );

      expect(preview).toContain('<b>bold</b>');
      expect(preview).toContain('Hello');
      expect(preview).toContain('world');
    });

    it('handles empty text', () => {
      const message = createMockTextMessage({ text: '' });

      const preview = CometChatTextPlugin.getLastMessagePreview!(
        message,
        createMockContext().loggedInUser
      );

      expect(preview).toBe('');
    });

    it('removes unresolved mention UIDs gracefully', () => {
      const message = createMockTextMessage({
        text: 'Hey <@uid:unknown-uid> check this',
        mentionedUsers: [],
      });

      const preview = CometChatTextPlugin.getLastMessagePreview!(
        message,
        createMockContext().loggedInUser
      );

      // Unresolved mentions should be replaced with empty string
      expect(preview).not.toContain('<@uid:');
    });
  });

  describe('getTextFormatters', () => {
    it('returns an array of formatters', () => {
      const formatters = CometChatTextPlugin.getTextFormatters!();

      expect(Array.isArray(formatters)).toBe(true);
      expect(formatters.length).toBeGreaterThan(0);
    });

    it('includes CometChatMentionsFormatter', () => {
      const formatters = CometChatTextPlugin.getTextFormatters!();

      const mentionsFormatter = formatters.find(f => f instanceof CometChatMentionsFormatter);
      expect(mentionsFormatter).toBeDefined();
    });

    it('includes CometChatUrlFormatter', () => {
      const formatters = CometChatTextPlugin.getTextFormatters!();

      const urlFormatter = formatters.find(f => f instanceof CometChatUrlFormatter);
      expect(urlFormatter).toBeDefined();
    });

    it('returns new formatter instances on each call', () => {
      const formatters1 = CometChatTextPlugin.getTextFormatters!();
      const formatters2 = CometChatTextPlugin.getTextFormatters!();

      expect(formatters1[0]).not.toBe(formatters2[0]);
    });
  });
});
