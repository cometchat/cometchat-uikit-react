import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatMessageInformationErrorState } from '../CometChatMessageInformationErrorState';
import { CometChatMessageInformationContext } from '../CometChatMessageInformation.context';
import { buildTextMessage } from '../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageInformationContextValue } from '../CometChatMessageInformation.types';

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
    fetchState: 'error',
    userReceipts: [],
    oneOnOneReadAt: 0,
    oneOnOneDeliveredAt: 0,
    error: 'Something went wrong',
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

function renderErrorState(
  contextOverrides: Partial<CometChatMessageInformationContextValue> = {},
  props: { className?: string } = {}
) {
  const ctx = createMockContext(contextOverrides);
  return {
    ...render(
      <CometChatMessageInformationContext.Provider value={ctx}>
        <CometChatMessageInformationErrorState {...props} />
      </CometChatMessageInformationContext.Provider>
    ),
    ctx,
  };
}

describe('CometChatMessageInformationErrorState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the error text', () => {
    renderErrorState();
    expect(screen.getByText('message_information_error')).toBeInTheDocument();
  });

  it('renders a retry button', () => {
    renderErrorState();
    expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument();
  });

  it('calls retry when retry button is clicked', () => {
    const { ctx } = renderErrorState();
    fireEvent.click(screen.getByRole('button', { name: 'retry' }));
    expect(ctx.retry).toHaveBeenCalledOnce();
  });

  it('has role="alert" on the container', () => {
    renderErrorState();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderErrorState({}, { className: 'my-error-class' });
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('my-error-class');
  });

  it('renders without className when not provided', () => {
    const { container } = renderErrorState();
    const root = container.firstChild as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root.className).not.toContain('undefined');
  });

  it('retry button has type="button"', () => {
    renderErrorState();
    const retryButton = screen.getByRole('button', { name: 'retry' });
    expect(retryButton).toHaveAttribute('type', 'button');
  });
});
