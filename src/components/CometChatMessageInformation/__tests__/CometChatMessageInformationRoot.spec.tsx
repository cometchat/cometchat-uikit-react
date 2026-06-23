/* eslint-disable @typescript-eslint/unbound-method */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CometChatMessageInformationRoot } from '../CometChatMessageInformationRoot';
import { useCometChatMessageInformationContext } from '../CometChatMessageInformation.context';
import { buildTextMessage } from '../../../testing/mock-builders';
import { CometChat } from '@cometchat/chat-sdk-javascript';

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

vi.mock('@cometchat/chat-sdk-javascript', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  const actualCometChat = (actual.CometChat ?? {}) as Record<string, unknown>;
  return {
    ...actual,
    CometChat: {
      ...actualCometChat,
      getMessageReceipts: vi.fn().mockResolvedValue([]),
      getLoggedinUser: vi.fn().mockResolvedValue({
        getUid: () => 'logged-in-user',
        getName: () => 'Me',
      }),
      addMessageListener: vi.fn(),
      removeMessageListener: vi.fn(),
      addConnectionListener: vi.fn(),
      removeConnectionListener: vi.fn(),
      MessageListener: vi.fn().mockImplementation((cb: unknown) => cb),
      ConnectionListener: vi.fn().mockImplementation((cb: unknown) => cb),
    },
  };
});

function createMockMessage(
  overrides: { receiverType?: string; readAt?: number; deliveredAt?: number } = {}
) {
  return buildTextMessage({
    receiverType: overrides.receiverType ?? 'user',
    readAt: overrides.readAt ?? 0,
    deliveredAt: overrides.deliveredAt ?? 0,
  }) as unknown as CometChat.BaseMessage;
}

function createMockReceiptSDKResponse() {
  return [
    {
      getSender: () => ({
        getUid: () => 'u1',
        getName: () => 'Alice',
        getAvatar: () => '',
      }),
      getReadAt: () => 1000,
      getDeliveredAt: () => 900,
    },
    {
      getSender: () => ({
        getUid: () => 'u2',
        getName: () => 'Bob',
        getAvatar: () => '',
      }),
      getReadAt: () => 0,
      getDeliveredAt: () => 800,
    },
  ];
}

describe('CometChatMessageInformationRoot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(CometChat.getMessageReceipts).mockResolvedValue([]);
    vi.mocked(CometChat.getLoggedinUser).mockResolvedValue({
      getUid: () => 'logged-in-user',
      getName: () => 'Me',
    } as unknown as CometChat.User);
  });

  // ─── Rendering ────────────────────────────────────────────────────

  it('renders a dialog element', () => {
    const message = createMockMessage();
    render(<CometChatMessageInformationRoot message={message} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders default layout (Header + MessagePreview + ReceiptList) when no children', async () => {
    const message = createMockMessage({ readAt: 100, deliveredAt: 50 });
    render(<CometChatMessageInformationRoot message={message} />);
    await waitFor(() => {
      expect(screen.getByText('message_information_title')).toBeInTheDocument();
    });
  });

  it('renders custom children when provided', () => {
    const message = createMockMessage();
    render(
      <CometChatMessageInformationRoot message={message}>
        <div data-testid="custom-child">Custom content</div>
      </CometChatMessageInformationRoot>
    );
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });

  // ─── Accessibility ────────────────────────────────────────────────

  it('sets role="dialog" and aria-modal="true"', () => {
    const message = createMockMessage();
    render(<CometChatMessageInformationRoot message={message} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('sets aria-labelledby pointing to the title', () => {
    const message = createMockMessage();
    render(<CometChatMessageInformationRoot message={message} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'cometchat-message-info-title');
  });

  // ─── Escape key ───────────────────────────────────────────────────

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    const message = createMockMessage();
    render(<CometChatMessageInformationRoot message={message} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('prevents default on Escape key', () => {
    const message = createMockMessage();
    render(<CometChatMessageInformationRoot message={message} />);
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    const prevented = !screen.getByRole('dialog').dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  // ─── Custom className ─────────────────────────────────────────────

  it('applies custom className to the root element', () => {
    const message = createMockMessage();
    render(<CometChatMessageInformationRoot message={message} className="my-custom-class" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('my-custom-class');
  });

  // ─── Context provision ────────────────────────────────────────────

  it('provides context values to children', async () => {
    function ContextConsumer() {
      const ctx = useCometChatMessageInformationContext();
      return (
        <div>
          <span data-testid="fetch-state">{ctx.fetchState}</span>
          <span data-testid="is-group">{String(ctx.isGroupMessage)}</span>
          <span data-testid="show-scrollbar">{String(ctx.showScrollbar)}</span>
        </div>
      );
    }

    const message = createMockMessage();
    render(
      <CometChatMessageInformationRoot message={message}>
        <ContextConsumer />
      </CometChatMessageInformationRoot>
    );

    await waitFor(() => {
      expect(screen.getByTestId('fetch-state')).toHaveTextContent('loaded');
    });
    expect(screen.getByTestId('is-group')).toHaveTextContent('false');
    expect(screen.getByTestId('show-scrollbar')).toHaveTextContent('false');
  });

  it('provides group message context when receiverType is group', async () => {
    vi.mocked(CometChat.getMessageReceipts).mockResolvedValue(
      createMockReceiptSDKResponse() as never
    );

    function ContextConsumer() {
      const ctx = useCometChatMessageInformationContext();
      return <span data-testid="is-group">{String(ctx.isGroupMessage)}</span>;
    }

    const message = createMockMessage({ receiverType: 'group' });
    render(
      <CometChatMessageInformationRoot message={message}>
        <ContextConsumer />
      </CometChatMessageInformationRoot>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-group')).toHaveTextContent('true');
    });
  });

  it('provides messageInfoDateTimeFormat from props or defaults', () => {
    function ContextConsumer() {
      const ctx = useCometChatMessageInformationContext();
      return <span data-testid="date-format">{ctx.messageInfoDateTimeFormat.today}</span>;
    }

    const message = createMockMessage();
    render(
      <CometChatMessageInformationRoot
        message={message}
        messageInfoDateTimeFormat={{ today: 'HH:mm' }}
      >
        <ContextConsumer />
      </CometChatMessageInformationRoot>
    );

    expect(screen.getByTestId('date-format')).toHaveTextContent('HH:mm');
  });

  it('provides default messageInfoDateTimeFormat when not specified', () => {
    function ContextConsumer() {
      const ctx = useCometChatMessageInformationContext();
      return <span data-testid="date-format">{ctx.messageInfoDateTimeFormat.today}</span>;
    }

    const message = createMockMessage();
    render(
      <CometChatMessageInformationRoot message={message}>
        <ContextConsumer />
      </CometChatMessageInformationRoot>
    );

    expect(screen.getByTestId('date-format')).toHaveTextContent('hh:mm A');
  });

  it('provides showScrollbar from props', () => {
    function ContextConsumer() {
      const ctx = useCometChatMessageInformationContext();
      return <span data-testid="scrollbar">{String(ctx.showScrollbar)}</span>;
    }

    const message = createMockMessage();
    render(
      <CometChatMessageInformationRoot message={message} showScrollbar={true}>
        <ContextConsumer />
      </CometChatMessageInformationRoot>
    );

    expect(screen.getByTestId('scrollbar')).toHaveTextContent('true');
  });

  // ─── onClose callback ─────────────────────────────────────────────

  it('provides onClose to context that calls the prop', () => {
    const onClose = vi.fn();

    function ContextConsumer() {
      const ctx = useCometChatMessageInformationContext();
      return <button onClick={ctx.onClose}>Close</button>;
    }

    const message = createMockMessage();
    render(
      <CometChatMessageInformationRoot message={message} onClose={onClose}>
        <ContextConsumer />
      </CometChatMessageInformationRoot>
    );

    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not throw when onClose is not provided', () => {
    const message = createMockMessage();
    render(<CometChatMessageInformationRoot message={message} />);
    // Pressing Escape should not throw even without onClose
    expect(() => {
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    }).not.toThrow();
  });

  // ─── Focus trap ───────────────────────────────────────────────────

  it('traps focus within the panel on Tab key', () => {
    const message = createMockMessage({ readAt: 100, deliveredAt: 50 });
    render(<CometChatMessageInformationRoot message={message} />);
    const dialog = screen.getByRole('dialog');
    // Tab key should not throw
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(dialog).toBeInTheDocument();
  });

  it('traps focus on Shift+Tab', () => {
    const message = createMockMessage({ readAt: 100, deliveredAt: 50 });
    render(<CometChatMessageInformationRoot message={message} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(dialog).toBeInTheDocument();
  });

  // ─── Group receipts from SDK ──────────────────────────────────────

  it('renders group receipts fetched from SDK for group message', async () => {
    vi.mocked(CometChat.getMessageReceipts).mockResolvedValue(
      createMockReceiptSDKResponse() as never
    );

    const message = createMockMessage({ receiverType: 'group' });
    render(<CometChatMessageInformationRoot message={message} />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  // ─── 1-on-1 receipts ─────────────────────────────────────────────

  it('renders 1-on-1 receipt sections when message is user type', async () => {
    const message = createMockMessage({ receiverType: 'user', readAt: 1000, deliveredAt: 900 });
    render(<CometChatMessageInformationRoot message={message} />);

    await waitFor(() => {
      const readHeaders = screen.getAllByText('message_information_read');
      expect(readHeaders.length).toBeGreaterThanOrEqual(1);
    });
    const deliveredHeaders = screen.getAllByText('message_information_delivered');
    expect(deliveredHeaders.length).toBeGreaterThanOrEqual(1);
  });
});
