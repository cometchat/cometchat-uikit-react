import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CometChatDateContext } from '../CometChatDate.context';
import { CometChatDateText } from '../CometChatDateText';
import type { CometChatDateContextValue } from '../CometChatDate.types';

function createCtx(overrides: Partial<CometChatDateContextValue> = {}): CometChatDateContextValue {
  return {
    timestamp: 1713200000,
    formattedDate: '10:30 am',
    isoDate: '2024-04-15T16:33:20.000Z',
    fullDateLabel: 'April 15, 2024 at 10:30 am',
    variant: 'caption',
    ...overrides,
  };
}

describe('CometChatDateText', () => {
  it('renders the formatted date string from context', () => {
    render(
      <CometChatDateContext.Provider value={createCtx({ formattedDate: 'Yesterday' })}>
        <CometChatDateText />
      </CometChatDateContext.Provider>
    );
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CometChatDateContext.Provider value={createCtx()}>
        <CometChatDateText className="custom-text" />
      </CometChatDateContext.Provider>
    );
    expect(container.firstElementChild?.className).toContain('custom-text');
  });

  it('throws error when used outside of CometChatDate.Root', () => {
    expect(() => render(<CometChatDateText />)).toThrow(
      'useCometChatDateContext must be used within <CometChatDate.Root>'
    );
  });
});
