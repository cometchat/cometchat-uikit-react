import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatPollBubble } from '../CometChatPollBubble';

function mockMsg() {
  return {
    getId: () => 1,
    getMetadata: () => ({
      '@injected': {
        extensions: {
          polls: {
            id: 'p1',
            question: 'Best framework?',
            options: { '1': 'React', '2': 'Vue' },
            results: {
              total: 3,
              options: {
                '1': { count: 2, voters: { u1: { name: 'A' } } },
                '2': { count: 1, voters: {} },
              },
            },
          },
        },
      },
    }),
    getCustomData: () => ({}),
    getSender: () => ({ getUid: () => 'u2' }),
    getType: () => 'extension_poll',
    getCategory: () => 'custom',
    getDeletedAt: () => null,
  } as any;
}

describe('CometChatPollBubble', () => {
  it('renders the poll question', () => {
    render(<CometChatPollBubble message={mockMsg()} />);
    expect(screen.getByText('Best framework?')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<CometChatPollBubble message={mockMsg()} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
  });

  it('renders radio roles', () => {
    render(<CometChatPollBubble message={mockMsg()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(2);
  });

  it('renders progress bars', () => {
    render(<CometChatPollBubble message={mockMsg()} />);
    const bars = screen.getAllByRole('progressbar');
    expect(bars.length).toBe(2);
  });

  it('returns null for missing poll data', () => {
    const msg = { ...mockMsg(), getMetadata: () => ({}) };
    const { container } = render(<CometChatPollBubble message={msg} />);
    expect(container.innerHTML).toBe('');
  });

  it('applies incoming class by default', () => {
    const { container } = render(<CometChatPollBubble message={mockMsg()} />);
    expect(container.querySelector('[class*="incoming"]')).not.toBeNull();
  });

  it('applies outgoing class when alignment is right', () => {
    const { container } = render(<CometChatPollBubble message={mockMsg()} alignment="right" />);
    expect(container.querySelector('[class*="outgoing"]')).not.toBeNull();
  });
});
