import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatThreadHeaderReplyCount } from '../CometChatThreadHeaderReplyCount';
import { CometChatThreadHeaderContext } from '../CometChatThreadHeader.context';
import type { CometChatThreadHeaderContextValue } from '../CometChatThreadHeader.types';

// Mock useLocale
vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => {
      const translations: Record<string, string> = {
        thread_reply: 'Reply',
        thread_replies: 'Replies',
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

describe('CometChatThreadHeaderReplyCount', () => {
  it('displays correct count text (singular for 1)', () => {
    renderWithContext(<CometChatThreadHeaderReplyCount />, createMockContext({ replyCount: 1 }));
    expect(screen.getByText('1 Reply')).toBeInTheDocument();
  });

  it('displays correct count text (plural for > 1)', () => {
    renderWithContext(<CometChatThreadHeaderReplyCount />, createMockContext({ replyCount: 5 }));
    expect(screen.getByText('5 Replies')).toBeInTheDocument();
  });

  it('displays "999+" for counts > 999', () => {
    renderWithContext(<CometChatThreadHeaderReplyCount />, createMockContext({ replyCount: 1500 }));
    expect(screen.getByText('999+ Replies')).toBeInTheDocument();
  });

  it('displays "0 Replies" for zero', () => {
    renderWithContext(<CometChatThreadHeaderReplyCount />, createMockContext({ replyCount: 0 }));
    expect(screen.getByText('0 Replies')).toBeInTheDocument();
  });

  it('shows divider by default', () => {
    const { container } = renderWithContext(
      <CometChatThreadHeaderReplyCount />,
      createMockContext()
    );
    const divider = container.querySelector('[aria-hidden="true"]');
    expect(divider).toBeInTheDocument();
  });

  it('hides divider when showDivider={false}', () => {
    const { container } = renderWithContext(
      <CometChatThreadHeaderReplyCount showDivider={false} />,
      createMockContext()
    );
    const divider = container.querySelector('[aria-hidden="true"]');
    expect(divider).not.toBeInTheDocument();
  });

  it('has aria-live="polite"', () => {
    const { container } = renderWithContext(
      <CometChatThreadHeaderReplyCount />,
      createMockContext()
    );
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('has aria-atomic="true"', () => {
    const { container } = renderWithContext(
      <CometChatThreadHeaderReplyCount />,
      createMockContext()
    );
    const liveRegion = container.querySelector('[aria-atomic="true"]');
    expect(liveRegion).toBeInTheDocument();
  });
});
