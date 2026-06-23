import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatThreadHeaderRoot } from '../CometChatThreadHeaderRoot';
import { useCometChatThreadHeaderContext } from '../CometChatThreadHeader.context';

// Mock dependencies
vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => {
      const translations: Record<string, string> = {
        thread_title: 'Thread',
        thread_reply: 'Reply',
        thread_replies: 'Replies',
        thread_close_hover: 'Close thread',
      };
      return translations[key] ?? key;
    },
    language: 'en-us',
  }),
}));

vi.mock('../../../hooks/useCometChatEvents', () => ({
  useCometChatEvents: vi.fn(),
}));

vi.mock('../useLoggedInUser', () => ({
  useLoggedInUser: () => ({
    getUid: () => 'logged-in-user',
    getName: () => 'Me',
  }),
}));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    CATEGORY_MESSAGE: 'message',
    CATEGORY_CUSTOM: 'custom',
    CATEGORY_ACTION: 'action',
    CATEGORY_CALL: 'call',
    CATEGORY_INTERACTIVE: 'interactive',
    MessageCategory: { AGENTIC: 'agentic' },
    ModerationStatus: {
      PENDING: 'pending',
      APPROVED: 'approved',
      DISAPPROVED: 'disapproved',
      UNMODERATED: 'unmoderated',
    },
    MESSAGE_TYPE: {
      TEXT: 'text',
      IMAGE: 'image',
      VIDEO: 'video',
      AUDIO: 'audio',
      FILE: 'file',
      ASSISTANT: 'assistant',
      TOOL_ARGUMENTS: 'tool_arguments',
      TOOL_RESULT: 'tool_result',
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
    GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
    CALL_MODE: {
      DEFAULT: 'default',
      GRID: 'grid',
      SINGLE: 'single',
      SPOTLIGHT: 'spotlight',
      TILE: 'tile',
    },
    GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
    GROUP_MEMBER_SCOPE: { ADMIN: 'admin', PARTICIPANT: 'participant', MODERATOR: 'moderator' },
    CALL_STATUS: {
      ONGOING: 'ongoing',
      ENDED: 'ended',
      INITIATED: 'initiated',
      CANCELLED: 'cancelled',
      REJECTED: 'rejected',
      UNANSWERED: 'unanswered',
      BUSY: 'busy',
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
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    MessageListener: vi.fn().mockImplementation(callbacks => callbacks),
    getLoggedinUser: () =>
      Promise.resolve({
        getUid: () => 'logged-in-user',
        getName: () => 'Me',
      }),
  },
}));

function createMockMessage(overrides: Record<string, unknown> = {}) {
  return {
    getId: () => overrides.id ?? 1001,
    getType: () => overrides.type ?? 'text',
    getCategory: () => 'message',
    getSender: () => ({
      getUid: () => overrides.senderUid ?? 'user-123',
      getName: () => overrides.senderName ?? 'John Doe',
      getAvatar: () => '',
    }),
    getReplyCount: () => overrides.replyCount ?? 5,
    getSentAt: () => Math.floor(Date.now() / 1000),
    getDeletedAt: () => null,
    getEditedAt: () => null,
    getReadAt: () => null,
    getDeliveredAt: () => null,
    getParentMessageId: () => 0,
    getText: () => overrides.text ?? 'Hello world',
    getReceiverType: () => 'user',
    getReceiver: () => ({ getUid: () => 'receiver-456', getName: () => 'Jane' }),
    getMuid: () => 'muid-1001',
    getConversationId: () => 'conv-1',
    getRawMessage: () => ({}),
    getMetadata: () => null,
    getData: () => ({}),
    getAttachments: () => [],
    getAttachment: () => null,
    getMentionedUsers: () => [],
    getReactions: () => [],
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage;
}

describe('CometChatThreadHeaderRoot', () => {
  it('renders default layout when no children provided', () => {
    render(<CometChatThreadHeaderRoot parentMessage={createMockMessage()} />);
    // Should render the thread title
    expect(screen.getByText('Thread')).toBeInTheDocument();
    // Should render sender name
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Should render close button
    expect(screen.getByRole('button', { name: 'Close thread' })).toBeInTheDocument();
  });

  it('renders children when provided (compound composition)', () => {
    render(
      <CometChatThreadHeaderRoot parentMessage={createMockMessage()}>
        <div data-testid="custom-child">Custom content</div>
      </CometChatThreadHeaderRoot>
    );
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.getByText('Custom content')).toBeInTheDocument();
  });

  it('provides context values to children', () => {
    function ContextConsumer() {
      const ctx = useCometChatThreadHeaderContext();
      return (
        <div>
          <span data-testid="sender">{ctx.senderName}</span>
          <span data-testid="count">{ctx.replyCount}</span>
        </div>
      );
    }

    render(
      <CometChatThreadHeaderRoot
        parentMessage={createMockMessage({ replyCount: 10 })}
        replyCount={10}
      >
        <ContextConsumer />
      </CometChatThreadHeaderRoot>
    );

    expect(screen.getByTestId('sender')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('count')).toHaveTextContent('10');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatThreadHeaderRoot parentMessage={createMockMessage()} className="my-custom-class" />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('my-custom-class');
  });

  it('has role="banner"', () => {
    render(<CometChatThreadHeaderRoot parentMessage={createMockMessage()} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('has aria-label with message preview and reply count', () => {
    render(<CometChatThreadHeaderRoot parentMessage={createMockMessage()} />);
    const banner = screen.getByRole('banner');
    expect(banner).toHaveAttribute('aria-label');
    expect(banner.getAttribute('aria-label')).toContain('Thread');
    expect(banner.getAttribute('aria-label')).toContain('replies');
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<CometChatThreadHeaderRoot parentMessage={createMockMessage()} onClose={onClose} />);
    const banner = screen.getByRole('banner');
    fireEvent.keyDown(banner, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose for other keys', () => {
    const onClose = vi.fn();
    render(<CometChatThreadHeaderRoot parentMessage={createMockMessage()} onClose={onClose} />);
    const banner = screen.getByRole('banner');
    fireEvent.keyDown(banner, { key: 'Enter' });
    fireEvent.keyDown(banner, { key: 'Tab' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
