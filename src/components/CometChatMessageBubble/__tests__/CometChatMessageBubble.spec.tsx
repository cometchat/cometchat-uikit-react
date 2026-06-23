import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import { GlobalConfigProvider } from '../../../context/GlobalConfigContext';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => {
      const translations: Record<string, string> = {
        message_bubble_error: 'Error',
        message_bubble_sending: 'Sending',
        message_list_action_edited: '(edited)',
      };
      return translations[key] ?? key;
    },
    language: 'en-us',
  }),
}));

// --- Mock message factory ---
function mockMessage(
  overrides: Partial<{
    type: string;
    category: string;
    senderName: string;
    senderUid: string;
    senderAvatar: string;
    sentAt: number;
    deliveredAt: number;
    readAt: number;
    editedAt: number;
    deletedAt: number;
    replyCount: number;
  }> = {}
): CometChat.BaseMessage {
  return {
    getId: () => 1,
    getType: () => overrides.type ?? 'text',
    getCategory: () => overrides.category ?? 'message',
    getSender: () => ({
      getUid: () => overrides.senderUid ?? 'user1',
      getName: () => overrides.senderName ?? 'John',
      getAvatar: () => overrides.senderAvatar ?? '',
      getStatus: () => 'online',
    }),
    getSentAt: () => overrides.sentAt ?? 1000,
    getDeliveredAt: () => overrides.deliveredAt ?? 0,
    getReadAt: () => overrides.readAt ?? 0,
    getEditedAt: () => overrides.editedAt ?? 0,
    getDeletedAt: () => overrides.deletedAt ?? 0,
    getReplyCount: () => overrides.replyCount ?? 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMuid: () => 'muid-1',
  } as unknown as CometChat.BaseMessage;
}

function mockGroup(): CometChat.Group {
  return {
    getGuid: () => 'g1',
    getName: () => 'Team',
  } as unknown as CometChat.Group;
}

const defaultProps = {
  message: mockMessage(),
  alignment: 'right' as const,
  contentView: <span>Hello world</span>,
};

describe('CometChatMessageBubble', () => {
  it('renders contentView inside the bubble body', () => {
    render(<CometChatMessageBubble {...defaultProps} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows avatar for left-aligned messages in group context', () => {
    render(<CometChatMessageBubble {...defaultProps} alignment="left" group={mockGroup()} />);
    expect(screen.getByLabelText(/accessibility_avatar_for/)).toBeInTheDocument();
  });

  it('hides avatar for right-aligned messages', () => {
    render(<CometChatMessageBubble {...defaultProps} alignment="right" group={mockGroup()} />);
    expect(screen.queryByLabelText(/accessibility_avatar_for/)).toBeNull();
  });

  it('hides avatar when hideAvatar is true', () => {
    render(
      <CometChatMessageBubble
        {...defaultProps}
        alignment="left"
        group={mockGroup()}
        hideAvatar={true}
      />
    );
    expect(screen.queryByLabelText(/accessibility_avatar_for/)).toBeNull();
  });

  it('shows sender name for left-aligned messages in group context', () => {
    render(<CometChatMessageBubble {...defaultProps} alignment="left" group={mockGroup()} />);
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('hides sender name when hideSenderName is true', () => {
    render(
      <CometChatMessageBubble
        {...defaultProps}
        alignment="left"
        group={mockGroup()}
        hideSenderName={true}
      />
    );
    // "John" should not appear as sender name (it may appear in aria-label)
    const senderNameEl = document.querySelector('[class*="sender-name"]');
    expect(senderNameEl).toBeNull();
  });

  it('shows timestamp via CometChatDate', () => {
    render(<CometChatMessageBubble {...defaultProps} />);
    // CometChatDate renders a <time> element
    const timeEl = document.querySelector('time');
    expect(timeEl).toBeTruthy();
  });

  it('hides timestamp when hideTimestamp is true', () => {
    render(<CometChatMessageBubble {...defaultProps} hideTimestamp={true} />);
    const timeEl = document.querySelector('time');
    expect(timeEl).toBeNull();
  });

  it('shows receipts for outgoing messages', () => {
    render(
      <CometChatMessageBubble
        {...defaultProps}
        alignment="right"
        message={mockMessage({ readAt: 1000 })}
      />
    );
    expect(screen.getByRole('img', { name: 'message_bubble_read' })).toBeInTheDocument();
  });

  it('hides receipts when hideReceipts prop is true', () => {
    render(<CometChatMessageBubble {...defaultProps} alignment="right" hideReceipts={true} />);
    expect(
      screen.queryByRole('img', {
        name: /message_bubble_sent|message_bubble_delivered|message_bubble_read/,
      })
    ).toBeNull();
  });

  it('hides receipts when GlobalConfig hideReceipts is true', () => {
    render(
      <GlobalConfigProvider config={{ hideReceipts: true }}>
        <CometChatMessageBubble {...defaultProps} alignment="right" />
      </GlobalConfigProvider>
    );
    expect(
      screen.queryByRole('img', {
        name: /message_bubble_sent|message_bubble_delivered|message_bubble_read/,
      })
    ).toBeNull();
  });

  it('prop hideReceipts overrides GlobalConfig', () => {
    render(
      <GlobalConfigProvider config={{ hideReceipts: true }}>
        <CometChatMessageBubble
          {...defaultProps}
          alignment="right"
          hideReceipts={false}
          message={mockMessage({ readAt: 1000 })}
        />
      </GlobalConfigProvider>
    );
    expect(screen.getByRole('img', { name: 'message_bubble_read' })).toBeInTheDocument();
  });

  it('shows "(edited)" when message has editedAt', () => {
    render(<CometChatMessageBubble {...defaultProps} message={mockMessage({ editedAt: 1000 })} />);
    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });

  it('shows error receipt when showError is true', () => {
    render(<CometChatMessageBubble {...defaultProps} alignment="right" showError={true} />);
    expect(screen.getByRole('img', { name: 'Error' })).toBeInTheDocument();
  });

  it('shows correct receipt state — sent', () => {
    render(<CometChatMessageBubble {...defaultProps} alignment="right" />);
    expect(screen.getByRole('img', { name: 'message_bubble_sent' })).toBeInTheDocument();
  });

  it('shows correct receipt state — delivered', () => {
    render(
      <CometChatMessageBubble
        {...defaultProps}
        alignment="right"
        message={mockMessage({ deliveredAt: 1000 })}
      />
    );
    expect(screen.getByRole('img', { name: 'message_bubble_delivered' })).toBeInTheDocument();
  });

  it('shows thread view when message has reply count', () => {
    const { container } = render(
      <CometChatMessageBubble {...defaultProps} message={mockMessage({ replyCount: 3 })} />
    );
    expect(container.querySelector('[class*="thread-view"]')).toBeTruthy();
  });

  it('shows thread view for count of 1', () => {
    const { container } = render(
      <CometChatMessageBubble {...defaultProps} message={mockMessage({ replyCount: 1 })} />
    );
    expect(container.querySelector('[class*="thread-view"]')).toBeTruthy();
  });

  it('hides thread view when hideThreadView is true', () => {
    const { container } = render(
      <CometChatMessageBubble
        {...defaultProps}
        message={mockMessage({ replyCount: 3 })}
        hideThreadView={true}
      />
    );
    expect(container.querySelector('[class*="thread-view"]')).toBeNull();
  });

  it('applies outgoing CSS class for right alignment', () => {
    const { container } = render(<CometChatMessageBubble {...defaultProps} alignment="right" />);
    expect(container.querySelector('[class*="outgoing"]')).toBeTruthy();
  });

  it('applies incoming CSS class for left alignment', () => {
    const { container } = render(<CometChatMessageBubble {...defaultProps} alignment="left" />);
    expect(container.querySelector('[class*="incoming"]')).toBeTruthy();
  });

  it('applies action CSS class for center alignment', () => {
    const { container } = render(<CometChatMessageBubble {...defaultProps} alignment="center" />);
    expect(container.querySelector('[class*="action"]')).toBeTruthy();
  });

  it('calls onAvatarClick when avatar is clicked', () => {
    const onAvatarClick = vi.fn();
    render(
      <CometChatMessageBubble
        {...defaultProps}
        alignment="left"
        group={mockGroup()}
        onAvatarClick={onAvatarClick}
      />
    );
    fireEvent.click(screen.getByLabelText(/accessibility_avatar_for/));
    expect(onAvatarClick).toHaveBeenCalledOnce();
  });

  it('calls onThreadRepliesClick when thread view is clicked', () => {
    const onThreadRepliesClick = vi.fn();
    render(
      <CometChatMessageBubble
        {...defaultProps}
        message={mockMessage({ replyCount: 2 })}
        onThreadRepliesClick={onThreadRepliesClick}
      />
    );
    const threadRoot = document.querySelector('[class*="cometchat-thread-view"]');
    if (threadRoot) {
      fireEvent.click(threadRoot);
    }
    expect(onThreadRepliesClick).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatMessageBubble {...defaultProps} className="my-custom" />
    );
    expect(container.firstElementChild?.className).toContain('my-custom');
  });

  it('hides status info for center-aligned (action) messages', () => {
    const { container } = render(<CometChatMessageBubble {...defaultProps} alignment="center" />);
    expect(container.querySelector('[class*="status-info"]')).toBeNull();
  });
});
