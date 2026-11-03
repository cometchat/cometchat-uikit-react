import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import { CometChatMessageInformationLoadingState } from '../CometChatMessageInformationLoadingState';
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
    fetchState: 'loading',
    userReceipts: [],
    oneOnOneReadAt: 0,
    oneOnOneDeliveredAt: 0,
    error: null,
    isGroupMessage: false,
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

describe('CometChatMessageInformationLoadingState', () => {
  it('renders with role="status"', () => {
    render(<CometChatMessageInformationLoadingState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live="polite" for accessibility', () => {
    render(<CometChatMessageInformationLoadingState />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('renders a spinner element', () => {
    const { container } = render(<CometChatMessageInformationLoadingState />);
    const spinner = container.querySelector('[class*="spinner"]');
    expect(spinner).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatMessageInformationLoadingState className="my-loading-class" />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('my-loading-class');
  });

  it('renders without className when not provided', () => {
    const { container } = render(<CometChatMessageInformationLoadingState />);
    const root = container.firstChild as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root.className).not.toContain('undefined');
  });

  it('renders nothing once loaded, or when receipts are already shown', () => {
    const { container } = render(<CometChatMessageInformationLoadingState />, { fetchState: 'loaded' });
    expect(container).toBeEmptyDOMElement();
    const view = render(<CometChatMessageInformationLoadingState />, { oneOnOneReadAt: 1000 });
    expect(view.container).toBeEmptyDOMElement();
  });
});
