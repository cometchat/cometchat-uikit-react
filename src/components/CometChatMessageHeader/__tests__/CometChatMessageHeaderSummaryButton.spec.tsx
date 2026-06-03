import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatMessageHeaderSummaryButton } from '../CometChatMessageHeaderSummaryButton';
import { CometChatMessageHeaderContext } from '../CometChatMessageHeader.context';
import type { CometChatMessageHeaderContextValue } from '../CometChatMessageHeader.types';

function createContextValue(
  overrides: Partial<CometChatMessageHeaderContextValue> = {}
): CometChatMessageHeaderContextValue {
  return {
    user: null,
    group: null,
    userStatus: 'offline',
    lastActiveAt: null,
    isTyping: false,
    typingText: '',
    groupMemberCount: 0,
    hideUserStatus: false,
    displayName: '',
    avatarImage: '',
    avatarName: '',
    isUserConversation: false,
    isGroupConversation: false,
    callButtonsDisabled: false,
    showOutgoingCallScreen: false,
    showOngoingCall: false,
    callSessionId: '',
    isDirectCalling: false,
    isGroupAudioCall: false,
    activeCall: null,
    initiateAudioCall: vi.fn().mockResolvedValue(undefined),
    initiateVideoCall: vi.fn().mockResolvedValue(undefined),
    cancelOutgoingCall: vi.fn().mockResolvedValue(undefined),
    resetCallState: vi.fn(),
    ...overrides,
  };
}

function renderSummaryButton(
  contextOverrides: Partial<CometChatMessageHeaderContextValue> = {},
  props: { onClick?: () => void; className?: string } = {}
) {
  const contextValue = createContextValue(contextOverrides);
  return {
    contextValue,
    ...render(
      <CometChatMessageHeaderContext.Provider value={contextValue}>
        <CometChatMessageHeaderSummaryButton {...props} />
      </CometChatMessageHeaderContext.Provider>
    ),
  };
}

describe('CometChatMessageHeaderSummaryButton', () => {
  it('renders a button with "Conversation summary" aria-label', () => {
    renderSummaryButton();
    expect(screen.getByRole('button', { name: 'Conversation summary' })).toBeInTheDocument();
  });

  it('calls context onSummaryClick when clicked', () => {
    const onSummaryClick = vi.fn();
    renderSummaryButton({ onSummaryClick });
    fireEvent.click(screen.getByRole('button', { name: 'Conversation summary' }));
    expect(onSummaryClick).toHaveBeenCalledTimes(1);
  });

  it('calls prop onClick instead of context onSummaryClick when both provided', () => {
    const contextHandler = vi.fn();
    const propHandler = vi.fn();
    renderSummaryButton({ onSummaryClick: contextHandler }, { onClick: propHandler });
    fireEvent.click(screen.getByRole('button', { name: 'Conversation summary' }));
    expect(propHandler).toHaveBeenCalledTimes(1);
    expect(contextHandler).not.toHaveBeenCalled();
  });

  it('does not throw when clicked without any handler', () => {
    renderSummaryButton({ onSummaryClick: undefined });
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Conversation summary' }));
    }).not.toThrow();
  });

  it('stops click propagation', () => {
    const parentClick = vi.fn();
    const contextValue = createContextValue();
    render(
      <CometChatMessageHeaderContext.Provider value={contextValue}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
        <div onClick={parentClick}>
          <CometChatMessageHeaderSummaryButton />
        </div>
      </CometChatMessageHeaderContext.Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Conversation summary' }));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('responds to Enter key', () => {
    const onSummaryClick = vi.fn();
    renderSummaryButton({ onSummaryClick });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Conversation summary' }), {
      key: 'Enter',
    });
    expect(onSummaryClick).toHaveBeenCalledTimes(1);
  });

  it('responds to Space key', () => {
    const onSummaryClick = vi.fn();
    renderSummaryButton({ onSummaryClick });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Conversation summary' }), {
      key: ' ',
    });
    expect(onSummaryClick).toHaveBeenCalledTimes(1);
  });

  it('does not respond to other keys', () => {
    const onSummaryClick = vi.fn();
    renderSummaryButton({ onSummaryClick });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Conversation summary' }), {
      key: 'Tab',
    });
    expect(onSummaryClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = renderSummaryButton({}, { className: 'my-summary-class' });
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('my-summary-class');
  });

  it('has correct displayName', () => {
    expect(CometChatMessageHeaderSummaryButton.displayName).toBe(
      'CometChatMessageHeaderSummaryButton'
    );
  });

  it('has tabIndex 0 for keyboard accessibility', () => {
    renderSummaryButton();
    const button = screen.getByRole('button', { name: 'Conversation summary' });
    expect(button).toHaveAttribute('tabindex', '0');
  });

  it('renders icon span with aria-hidden', () => {
    const { container } = renderSummaryButton();
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });
});
