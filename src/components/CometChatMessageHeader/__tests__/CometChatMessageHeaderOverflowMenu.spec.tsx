import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatMessageHeaderOverflowMenu } from '../CometChatMessageHeaderOverflowMenu';
import { CometChatMessageHeaderContext } from '../CometChatMessageHeader.context';
import type { CometChatMessageHeaderContextValue } from '../CometChatMessageHeader.types';

// Mock the CometChatContextMenu compound component so we can test
// the OverflowMenu's rendering and click behavior in isolation.
vi.mock('../../base/CometChatContextMenu', () => {
  const Root: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <div data-testid="context-menu-root">{children}</div>
  );
  const Trigger: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <div data-testid="context-menu-trigger">{children}</div>
  );
  const Dropdown: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
    <div data-testid="context-menu-dropdown">{children}</div>
  );
  const Item: React.FC<{
    item: { id: string; title: string; onClick?: () => void };
  }> = ({ item }) => (
    <button
      data-testid={`context-menu-item-${item.id}`}
      type="button"
      onClick={() => item.onClick?.()}
    >
      {item.title}
    </button>
  );

  return {
    CometChatContextMenu: {
      Root,
      Trigger,
      Dropdown,
      Item,
    },
  };
});

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

function renderOverflowMenu(
  contextOverrides: Partial<CometChatMessageHeaderContextValue> = {},
  props: { className?: string } = {}
) {
  const contextValue = createContextValue(contextOverrides);
  return {
    contextValue,
    ...render(
      <CometChatMessageHeaderContext.Provider value={contextValue}>
        <CometChatMessageHeaderOverflowMenu {...props} />
      </CometChatMessageHeaderContext.Provider>
    ),
  };
}

describe('CometChatMessageHeaderOverflowMenu', () => {
  it('renders the context menu root', () => {
    renderOverflowMenu();
    expect(screen.getByTestId('context-menu-root')).toBeInTheDocument();
  });

  it('renders a trigger button with "More options" aria-label', () => {
    renderOverflowMenu();
    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
  });

  it('renders the dropdown container', () => {
    renderOverflowMenu();
    expect(screen.getByTestId('context-menu-dropdown')).toBeInTheDocument();
  });

  it('renders Search and Conversation Summary menu items', () => {
    renderOverflowMenu();
    expect(screen.getByTestId('context-menu-item-search')).toBeInTheDocument();
    expect(screen.getByTestId('context-menu-item-summary')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Conversation Summary')).toBeInTheDocument();
  });

  it('calls onSearchOptionClicked when Search item is clicked', () => {
    const onSearchOptionClicked = vi.fn();
    renderOverflowMenu({ onSearchOptionClicked });
    fireEvent.click(screen.getByTestId('context-menu-item-search'));
    expect(onSearchOptionClicked).toHaveBeenCalledTimes(1);
  });

  it('calls onSummaryClick when Conversation Summary item is clicked', () => {
    const onSummaryClick = vi.fn();
    renderOverflowMenu({ onSummaryClick });
    fireEvent.click(screen.getByTestId('context-menu-item-summary'));
    expect(onSummaryClick).toHaveBeenCalledTimes(1);
  });

  it('does not throw when Search is clicked without onSearchOptionClicked', () => {
    renderOverflowMenu({ onSearchOptionClicked: undefined });
    expect(() => {
      fireEvent.click(screen.getByTestId('context-menu-item-search'));
    }).not.toThrow();
  });

  it('does not throw when Summary is clicked without onSummaryClick', () => {
    renderOverflowMenu({ onSummaryClick: undefined });
    expect(() => {
      fireEvent.click(screen.getByTestId('context-menu-item-summary'));
    }).not.toThrow();
  });

  it('stops click propagation on the root container', () => {
    const parentClick = vi.fn();
    const contextValue = createContextValue();
    render(
      <CometChatMessageHeaderContext.Provider value={contextValue}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
        <div onClick={parentClick}>
          <CometChatMessageHeaderOverflowMenu />
        </div>
      </CometChatMessageHeaderContext.Provider>
    );
    // Click on the root presentation div of the overflow menu
    const root = screen.getByRole('presentation');
    fireEvent.click(root);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('stops Escape key propagation on the root container', () => {
    const parentKeyDown = vi.fn();
    const contextValue = createContextValue();
    render(
      <CometChatMessageHeaderContext.Provider value={contextValue}>
        {}
        <div onKeyDown={parentKeyDown}>
          <CometChatMessageHeaderOverflowMenu />
        </div>
      </CometChatMessageHeaderContext.Provider>
    );
    const root = screen.getByRole('presentation');
    fireEvent.keyDown(root, { key: 'Escape' });
    expect(parentKeyDown).not.toHaveBeenCalled();
  });

  it('does not stop non-Escape key propagation', () => {
    const parentKeyDown = vi.fn();
    const contextValue = createContextValue();
    render(
      <CometChatMessageHeaderContext.Provider value={contextValue}>
        {}
        <div onKeyDown={parentKeyDown}>
          <CometChatMessageHeaderOverflowMenu />
        </div>
      </CometChatMessageHeaderContext.Provider>
    );
    const root = screen.getByRole('presentation');
    fireEvent.keyDown(root, { key: 'Tab' });
    expect(parentKeyDown).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = renderOverflowMenu({}, { className: 'my-overflow-class' });
    const root = container.querySelector('[role="presentation"]')!;
    expect(root.className).toContain('my-overflow-class');
  });

  it('has correct displayName', () => {
    expect(CometChatMessageHeaderOverflowMenu.displayName).toBe(
      'CometChatMessageHeaderOverflowMenu'
    );
  });
});
