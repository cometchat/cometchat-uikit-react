import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CometChatThreadHeaderCloseButton } from '../CometChatThreadHeaderCloseButton';
import { CometChatThreadHeaderContext } from '../CometChatThreadHeader.context';
import type { CometChatThreadHeaderContextValue } from '../CometChatThreadHeader.types';

// Mock useLocale
vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => {
      const translations: Record<string, string> = {
        thread_close_hover: 'Close thread',
      };
      return translations[key] ?? key;
    },
    language: 'en-us',
  }),
}));

function createMockContext(
  overrides: Partial<CometChatThreadHeaderContextValue> = {}
): CometChatThreadHeaderContextValue {
  return {
    parentMessage: {} as CometChatThreadHeaderContextValue['parentMessage'],
    replyCount: 5,
    senderName: 'John Doe',
    onClose: vi.fn(),
    ...overrides,
  };
}

function renderWithContext(
  ui: React.ReactElement,
  contextValue: CometChatThreadHeaderContextValue
) {
  return render(
    <CometChatThreadHeaderContext.Provider value={contextValue}>
      {ui}
    </CometChatThreadHeaderContext.Provider>
  );
}

describe('CometChatThreadHeaderCloseButton', () => {
  it('renders as a <button> element', () => {
    const ctx = createMockContext();
    renderWithContext(<CometChatThreadHeaderCloseButton />, ctx);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('has aria-label with localized text', () => {
    const ctx = createMockContext();
    renderWithContext(<CometChatThreadHeaderCloseButton />, ctx);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close thread');
  });

  it('calls onClose from context on click', () => {
    const onClose = vi.fn();
    const ctx = createMockContext({ onClose });
    renderWithContext(<CometChatThreadHeaderCloseButton />, ctx);

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Enter key', () => {
    const onClose = vi.fn();
    const ctx = createMockContext({ onClose });
    renderWithContext(<CometChatThreadHeaderCloseButton />, ctx);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Space key', () => {
    const onClose = vi.fn();
    const ctx = createMockContext({ onClose });
    renderWithContext(<CometChatThreadHeaderCloseButton />, ctx);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: ' ' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on other keys', () => {
    const onClose = vi.fn();
    const ctx = createMockContext({ onClose });
    renderWithContext(<CometChatThreadHeaderCloseButton />, ctx);

    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Tab' });
    fireEvent.keyDown(button, { key: 'Escape' });
    fireEvent.keyDown(button, { key: 'a' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('has type="button" attribute', () => {
    const ctx = createMockContext();
    renderWithContext(<CometChatThreadHeaderCloseButton />, ctx);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('is focusable (tabIndex=0)', () => {
    const ctx = createMockContext();
    renderWithContext(<CometChatThreadHeaderCloseButton />, ctx);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('tabindex', '0');
  });
});
