import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import { CometChatMessageInformationEmptyState } from '../CometChatMessageInformationEmptyState';
import { CometChatMessageInformationContext } from '../CometChatMessageInformation.context';
import { buildTextMessage } from '../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageInformationContextValue } from '../CometChatMessageInformation.types';

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { GROUP: 'group', USER: 'user' },
  },
}));

function createMockContext(
  overrides: Partial<CometChatMessageInformationContextValue> = {}
): CometChatMessageInformationContextValue {
  return {
    message: buildTextMessage() as unknown as CometChat.BaseMessage,
    fetchState: 'loaded',
    userReceipts: [],
    oneOnOneReadAt: 0,
    oneOnOneDeliveredAt: 0,
    error: null,
    isGroupMessage: true,
    messageInfoDateTimeFormat: {},
    textFormatters: [],
    showScrollbar: false,
    onClose: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

/** Renders inside the panel's context, in this part's state unless overridden. */
function render(ui: React.ReactElement, overrides: Partial<CometChatMessageInformationContextValue> = {}) {
  const ctx = createMockContext(overrides);
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <CometChatMessageInformationContext.Provider value={ctx}>
        {children}
      </CometChatMessageInformationContext.Provider>
    ),
  });
}

describe('CometChatMessageInformationEmptyState', () => {
  it('renders the empty state text', () => {
    render(<CometChatMessageInformationEmptyState />);
    expect(screen.getByText('message_information_group_message_receipt_empty')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatMessageInformationEmptyState className="my-empty-class" />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('my-empty-class');
  });

  it('renders without className when not provided', () => {
    const { container } = render(<CometChatMessageInformationEmptyState />);
    const root = container.firstChild as HTMLElement;
    expect(root).toBeInTheDocument();
    // Should not contain extra whitespace from undefined className
    expect(root.className).not.toContain('undefined');
  });

  it('renders a span element with the empty text', () => {
    render(<CometChatMessageInformationEmptyState />);
    const span = screen.getByText('message_information_group_message_receipt_empty');
    expect(span.tagName).toBe('SPAN');
  });

  it('renders nothing while loading, on error, with receipts, or for a 1-on-1 message', () => {
    for (const overrides of [
      { fetchState: 'loading' as const },
      { fetchState: 'error' as const },
      { isGroupMessage: false },
      {
        userReceipts: [
          { user: {} as CometChat.User, readAt: 1, deliveredAt: 1 },
        ],
      },
    ]) {
      const { container, unmount } = render(<CometChatMessageInformationEmptyState />, overrides);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });
});
