import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatMessageInformationHeader } from '../CometChatMessageInformationHeader';
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
    isGroupMessage: false,
    messageInfoDateTimeFormat: {
      today: 'hh:mm A',
      yesterday: 'DD MMM, hh:mm A',
      otherDays: 'DD MMM, hh:mm A',
    },
    textFormatters: [],
    showScrollbar: false,
    onClose: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

function renderHeader(
  contextOverrides: Partial<CometChatMessageInformationContextValue> = {},
  props: { className?: string } = {}
) {
  const ctx = createMockContext(contextOverrides);
  return {
    ...render(
      <CometChatMessageInformationContext.Provider value={ctx}>
        <CometChatMessageInformationHeader {...props} />
      </CometChatMessageInformationContext.Provider>
    ),
    ctx,
  };
}

describe('CometChatMessageInformationHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title text', () => {
    renderHeader();
    expect(screen.getByText('message_information_title')).toBeInTheDocument();
  });

  it('renders the title with correct id for aria-labelledby', () => {
    renderHeader();
    const title = screen.getByText('message_information_title');
    expect(title).toHaveAttribute('id', 'cometchat-message-info-title');
  });

  it('renders a close button', () => {
    renderHeader();
    const closeButton = screen.getByRole('button', { name: 'message_information_close_hover' });
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const { ctx } = renderHeader();
    const closeButton = screen.getByRole('button', { name: 'message_information_close_hover' });
    fireEvent.click(closeButton);
    expect(ctx.onClose).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    const { container } = renderHeader({}, { className: 'my-header-class' });
    const header = container.firstChild as HTMLElement;
    expect(header.className).toContain('my-header-class');
  });

  it('close button has data-cometchat-message-info-close attribute', () => {
    renderHeader();
    const closeButton = screen.getByRole('button', { name: 'message_information_close_hover' });
    expect(closeButton).toHaveAttribute('data-cometchat-message-info-close');
  });

  it('close button has type="button"', () => {
    renderHeader();
    const closeButton = screen.getByRole('button', { name: 'message_information_close_hover' });
    expect(closeButton).toHaveAttribute('type', 'button');
  });

  it('renders an h2 heading element', () => {
    renderHeader();
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('message_information_title');
  });
});
