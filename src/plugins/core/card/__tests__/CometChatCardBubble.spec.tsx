/**
 * Unit tests for CometChatCardBubble: the raw card payload goes to the card
 * renderer untouched, actions reach the app by callback and UI event, and a
 * message without a card falls back to text.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

const mocks = vi.hoisted(() => ({
  publish: vi.fn(),
  translate: vi.fn((key: string) => key),
  viewProps: undefined as Record<string, unknown> | undefined,
}));

vi.mock('@cometchat/cards-react', () => ({
  CometChatCardView: (props: Record<string, unknown> & { onAction: (e: unknown) => void }) => {
    mocks.viewProps = props;
    return (
      <button
        type="button"
        onClick={() => props.onAction({ action: { type: 'openUrl', url: 'https://x.test' } })}
      >
        card
      </button>
    );
  },
}));
vi.mock('../../../../hooks/usePublishEvent', () => ({ usePublishEvent: () => mocks.publish }));
vi.mock('../../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: mocks.translate }),
}));

import { CometChatCardBubble } from '../CometChatCardBubble';

interface CardOptions {
  card?: unknown;
  fallbackText?: string;
  text?: string;
  throws?: boolean;
}

function cardMessage({ card, fallbackText = '', text = '', throws = false }: CardOptions) {
  return {
    getCard: () => {
      if (throws) throw new Error('bad card');
      return card;
    },
    getFallbackText: () => fallbackText,
    getText: () => text,
  } as unknown as CometChat.CardMessage;
}

const fallback = () => document.querySelector('.cometchat-card-bubble__fallback');

describe('CometChatCardBubble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.viewProps = undefined;
    mocks.translate.mockImplementation((key: string) => key);
  });

  it('hands the card payload to the renderer as JSON, with the theme', () => {
    const card = { version: 1, body: [{ type: 'text', text: 'Hi' }] };
    const override = { primaryColor: '#123456' };
    render(
      <CometChatCardBubble
        message={cardMessage({ card })}
        themeMode="dark"
        themeOverride={override as never}
      />
    );
    expect(mocks.viewProps).toMatchObject({
      cardJson: JSON.stringify(card),
      themeMode: 'dark',
      themeOverride: override,
    });
    expect(fallback()).toBeNull();
  });

  it('defaults to the automatic theme', () => {
    render(<CometChatCardBubble message={cardMessage({ card: { a: 1 } })} />);
    expect(mocks.viewProps).toMatchObject({ themeMode: 'auto' });
  });

  it('sends a card action to the callback and as a UI event', () => {
    const message = cardMessage({ card: { a: 1 } });
    const onCardAction = vi.fn();
    render(<CometChatCardBubble message={message} onCardAction={onCardAction} />);
    fireEvent.click(screen.getByText('card'));
    const action = { type: 'openUrl', url: 'https://x.test' };
    expect(onCardAction).toHaveBeenCalledWith(message, action);
    expect(mocks.publish).toHaveBeenCalledWith({ type: 'ui:card/action', message, action });
  });

  it('publishes the action even without a callback', () => {
    render(<CometChatCardBubble message={cardMessage({ card: { a: 1 } })} />);
    fireEvent.click(screen.getByText('card'));
    expect(mocks.publish).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['no card', { card: null }],
    ['an unreadable card', { throws: true }],
  ])('with %s, shows the fallback text instead of the renderer', (_label, options) => {
    render(
      <CometChatCardBubble
        message={cardMessage({ ...options, fallbackText: 'Your order shipped' })}
      />
    );
    expect(mocks.viewProps).toBeUndefined();
    expect(fallback()).toHaveTextContent('Your order shipped');
  });

  it('falls back to the message text, then the localized label, then "Card Message"', () => {
    const { unmount } = render(
      <CometChatCardBubble message={cardMessage({ text: 'plain text' })} />
    );
    expect(fallback()).toHaveTextContent('plain text');
    unmount();

    mocks.translate.mockImplementation(() => 'Tarjeta');
    const second = render(<CometChatCardBubble message={cardMessage({})} />);
    expect(fallback()).toHaveTextContent('Tarjeta');
    second.unmount();

    mocks.translate.mockImplementation(() => '');
    render(<CometChatCardBubble message={cardMessage({})} />);
    expect(fallback()).toHaveTextContent('Card Message');
  });
});
