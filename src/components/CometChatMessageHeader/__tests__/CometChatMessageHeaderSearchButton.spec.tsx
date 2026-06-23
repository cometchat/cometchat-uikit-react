import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatMessageHeaderSearchButton } from '../CometChatMessageHeaderSearchButton';
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
    summaryGenerationMessageCount: 1000,
    ...overrides,
  };
}

function renderSearchButton(
  contextOverrides: Partial<CometChatMessageHeaderContextValue> = {},
  props: { onClick?: () => void; className?: string } = {}
) {
  const contextValue = createContextValue(contextOverrides);
  return {
    contextValue,
    ...render(
      <CometChatMessageHeaderContext.Provider value={contextValue}>
        <CometChatMessageHeaderSearchButton {...props} />
      </CometChatMessageHeaderContext.Provider>
    ),
  };
}

describe('CometChatMessageHeaderSearchButton', () => {
  it('renders a button with "Search" aria-label', () => {
    renderSearchButton();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('calls context onSearchOptionClicked when clicked', () => {
    const onSearchOptionClicked = vi.fn();
    renderSearchButton({ onSearchOptionClicked });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearchOptionClicked).toHaveBeenCalledTimes(1);
  });

  it('calls prop onClick instead of context onSearchOptionClicked when both provided', () => {
    const contextHandler = vi.fn();
    const propHandler = vi.fn();
    renderSearchButton({ onSearchOptionClicked: contextHandler }, { onClick: propHandler });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(propHandler).toHaveBeenCalledTimes(1);
    expect(contextHandler).not.toHaveBeenCalled();
  });

  it('does not throw when clicked without any handler', () => {
    renderSearchButton({ onSearchOptionClicked: undefined });
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    }).not.toThrow();
  });

  it('stops click propagation', () => {
    const parentClick = vi.fn();
    const contextValue = createContextValue();
    render(
      <CometChatMessageHeaderContext.Provider value={contextValue}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
        <div onClick={parentClick}>
          <CometChatMessageHeaderSearchButton />
        </div>
      </CometChatMessageHeaderContext.Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('responds to Enter key', () => {
    const onSearchOptionClicked = vi.fn();
    renderSearchButton({ onSearchOptionClicked });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Search' }), { key: 'Enter' });
    expect(onSearchOptionClicked).toHaveBeenCalledTimes(1);
  });

  it('responds to Space key', () => {
    const onSearchOptionClicked = vi.fn();
    renderSearchButton({ onSearchOptionClicked });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Search' }), { key: ' ' });
    expect(onSearchOptionClicked).toHaveBeenCalledTimes(1);
  });

  it('does not respond to other keys', () => {
    const onSearchOptionClicked = vi.fn();
    renderSearchButton({ onSearchOptionClicked });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Search' }), { key: 'Tab' });
    expect(onSearchOptionClicked).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = renderSearchButton({}, { className: 'my-search-class' });
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('my-search-class');
  });

  it('has correct displayName', () => {
    expect(CometChatMessageHeaderSearchButton.displayName).toBe(
      'CometChatMessageHeaderSearchButton'
    );
  });

  it('has tabIndex 0 for keyboard accessibility', () => {
    renderSearchButton();
    const button = screen.getByRole('button', { name: 'Search' });
    expect(button).toHaveAttribute('tabindex', '0');
  });

  it('renders icon span with aria-hidden', () => {
    const { container } = renderSearchButton();
    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });
});
