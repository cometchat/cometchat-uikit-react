import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatThreadHeaderSenderName } from '../CometChatThreadHeaderSenderName';
import { CometChatThreadHeaderContext } from '../CometChatThreadHeader.context';
import type { CometChatThreadHeaderContextValue } from '../CometChatThreadHeader.types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({
    t: (key: string) => key,
    language: 'en-us',
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CometChatThreadHeaderSenderName', () => {
  it('renders the sender name from context', () => {
    const ctx = createMockContext({ senderName: 'Alice' });
    renderWithContext(<CometChatThreadHeaderSenderName />, ctx);

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders nothing when senderName is empty', () => {
    const ctx = createMockContext({ senderName: '' });
    const { container } = renderWithContext(<CometChatThreadHeaderSenderName />, ctx);

    expect(container.firstChild).toBeNull();
  });

  it('applies custom className', () => {
    const ctx = createMockContext({ senderName: 'Bob' });
    renderWithContext(<CometChatThreadHeaderSenderName className="custom-sender" />, ctx);

    const element = screen.getByText('Bob');
    expect(element.className).toContain('custom-sender');
  });

  it('renders as a <span> element', () => {
    const ctx = createMockContext({ senderName: 'Charlie' });
    renderWithContext(<CometChatThreadHeaderSenderName />, ctx);

    const element = screen.getByText('Charlie');
    expect(element.tagName).toBe('SPAN');
  });

  it('has the correct displayName', () => {
    expect(CometChatThreadHeaderSenderName.displayName).toBe('CometChatThreadHeaderSenderName');
  });

  it('throws when used outside of CometChatThreadHeader.Root', () => {
    // Suppress console.error for the expected error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<CometChatThreadHeaderSenderName />);
    }).toThrow('useCometChatThreadHeaderContext: must be used within a CometChatThreadHeader.Root');

    consoleSpy.mockRestore();
  });
});
