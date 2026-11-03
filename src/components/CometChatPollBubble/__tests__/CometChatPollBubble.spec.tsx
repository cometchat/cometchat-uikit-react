import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPollBubble } from '../CometChatPollBubble';

// Localization — return the raw key so assertions stay stable.
vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

// Logged-in user — controllable per test so we can assert alignment + voted state.
let mockLoggedInUser: {
  getUid: () => string;
  getName: () => string;
  getAvatar: () => string;
} | null = {
  getUid: () => 'u2',
  getName: () => 'Me',
  getAvatar: () => '',
};

vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => mockLoggedInUser,
}));

function mockMsg(senderUid = 'u2') {
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
    getSender: () => ({ getUid: () => senderUid }),
    getType: () => 'extension_poll',
    getCategory: () => 'custom',
    getDeletedAt: () => null,
  } as any;
}

describe('CometChatPollBubble', () => {
  beforeEach(() => {
    mockLoggedInUser = { getUid: () => 'u2', getName: () => 'Me', getAvatar: () => '' };
  });

  it('extracts and renders the poll question from the message', () => {
    render(<CometChatPollBubble message={mockMsg()} />);
    expect(screen.getByText('Best framework?')).toBeInTheDocument();
  });

  it('extracts and renders all options', () => {
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

  it('extracts vote counts from the message', () => {
    render(<CometChatPollBubble message={mockMsg()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('marks the option voted by the logged-in user as checked', () => {
    // Logged-in user u1 voted option "1" (React) in the mock results.
    mockLoggedInUser = { getUid: () => 'u1', getName: () => 'A', getAvatar: () => '' };
    render(<CometChatPollBubble message={mockMsg()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]!.getAttribute('aria-checked')).toBe('true');
    expect(radios[1]!.getAttribute('aria-checked')).toBe('false');
  });

  it('returns null for missing poll data', () => {
    const msg = { ...mockMsg(), getMetadata: () => ({}) };
    const { container } = render(<CometChatPollBubble message={msg} />);
    expect(container.innerHTML).toBe('');
  });

  /** The bubble's side: exactly one of its two variant classes. */
  const side = (container: HTMLElement) => {
    const bubble = container.querySelector('.cometchat-poll-bubble');
    return ['outgoing', 'incoming'].filter(v => bubble?.classList.contains(`cometchat-poll-bubble--${v}`));
  };

  it('derives outgoing alignment when the logged-in user is the sender', () => {
    // Sender u2 === logged-in user u2 → outgoing, no alignment prop needed.
    const { container } = render(<CometChatPollBubble message={mockMsg('u2')} />);
    expect(side(container)).toEqual(['outgoing']);
  });

  it('derives incoming alignment when another user is the sender', () => {
    const { container } = render(<CometChatPollBubble message={mockMsg('other-user')} />);
    expect(side(container)).toEqual(['incoming']);
  });

  it('alignment prop overrides the derived alignment', () => {
    // Sender u2 === logged-in user u2 would derive outgoing, but prop forces incoming.
    const { container } = render(<CometChatPollBubble message={mockMsg('u2')} alignment="left" />);
    expect(side(container)).toEqual(['incoming']);
  });

  it('announces a submitted vote to screen readers, using the translated sentence', async () => {
    const callExtension = vi.spyOn(CometChat, 'callExtension').mockResolvedValue({});
    const { container } = render(<CometChatPollBubble message={mockMsg('other-user')} />);
    fireEvent.click(screen.getByRole('radio', { name: /^Vue/ }));

    const live = container.querySelector('[aria-live="polite"]');
    await waitFor(() => {
      expect(live).toHaveTextContent('accessibility_vote_submitted');
    });
    callExtension.mockRestore();
  });
});
