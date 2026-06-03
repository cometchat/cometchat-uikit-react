import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatThreadHeaderRoot } from '../CometChatThreadHeaderRoot';
import { useCometChatThreadHeaderContext } from '../CometChatThreadHeader.context';

// Mock dependencies
vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({
    t: (key: string) => {
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
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    MessageListener: vi.fn().mockImplementation(callbacks => callbacks),
    getLoggedinUser: () => ({
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
      <CometChatThreadHeaderRoot parentMessage={createMockMessage()} replyCount={10}>
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
