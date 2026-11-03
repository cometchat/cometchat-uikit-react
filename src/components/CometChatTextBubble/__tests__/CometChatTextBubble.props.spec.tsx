/**
 * The public props of <CometChatTextBubble />, one case each: the prop is set (or left out) on the real
 * component and the test checks what it changes. The bubble makes no SDK call of its own; the logged-in
 * user it looks up is mocked to "nobody", and jsdom's missing layout is stubbed where truncation needs it.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTextBubble } from '../CometChatTextBubble';
import { CometChatUrlFormatter } from '../../../formatters/CometChatUrlFormatter';
import { buildTextMessage } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

/** A text message whose metadata carries a link preview and a translation, as the extensions add them. */
function messageWithExtras(text: string) {
  return {
    ...buildTextMessage({ id: 7, text }),
    getMetadata: () => ({
      translated_message: 'Lies den Beitrag',
      '@injected': {
        extensions: {
          'link-preview': { links: [{ url: 'https://example.com/post', title: 'The post' }] },
        },
      },
    }),
  } as unknown as CometChat.BaseMessage;
}

const root = (container: HTMLElement) => container.firstElementChild as HTMLElement;
const textBox = (container: HTMLElement) => container.querySelector('.cometchat-text-bubble__text');

/** Wait for the next frames, after the bubble has measured its text. */
const frames = () =>
  act(
    () =>
      new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      })
  );

/** jsdom has no layout: make the text taller than its clamped box, as a long message is. */
function overflowingText() {
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockReturnValue(400);
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(100);
}

beforeEach(() => {
  vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null as unknown as CometChat.User);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CometChatTextBubble props', () => {
  it('className is added to the bubble; by default it has only its own', () => {
    covers('CometChatTextBubble.className', 'set', 'default');
    const view = render(<CometChatTextBubble text="Hi" className="app-text" />);
    expect(root(view.container)).toHaveClass('app-text', 'cometchat-text-bubble');
    view.unmount();

    const { container } = render(<CometChatTextBubble text="Hi" />);
    expect([...root(container).classList]).toEqual([
      'cometchat-text-bubble',
      'cometchat-text-bubble--outgoing',
      'cometchat-text-bubble-outgoing',
    ]);
  });

  it('isSentByMe styles the bubble as outgoing (the default) or incoming', () => {
    covers('CometChatTextBubble.isSentByMe', 'true', 'false', 'default');
    for (const [props, mine, other] of [
      [{ isSentByMe: true }, 'outgoing', 'incoming'],
      [{}, 'outgoing', 'incoming'],
      [{ isSentByMe: false }, 'incoming', 'outgoing'],
    ] as const) {
      const { container, unmount } = render(<CometChatTextBubble text="Hi" {...props} />);
      expect(root(container)).toHaveClass(`cometchat-text-bubble--${mine}`, `cometchat-text-bubble-${mine}`);
      expect(root(container)).not.toHaveClass(`cometchat-text-bubble--${other}`);
      unmount();
    }
  });

  it('a long text is clamped behind "Read more" by default, and expands when it is clicked', async () => {
    covers('CometChatTextBubble.disableTruncation', 'false', 'default');
    overflowingText();
    for (const props of [{ disableTruncation: false }, {}]) {
      const { container, unmount } = render(<CometChatTextBubble text="A long story" {...props} />);
      expect(textBox(container)).not.toHaveClass('cometchat-text-bubble__text--no-truncation');
      const more = await screen.findByRole('button', { name: 'Read more' });
      expect(more).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(more);
      expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
      expect(textBox(container)).toHaveClass('cometchat-text-bubble__text--expanded');
      unmount();
    }
  });

  it('disableTruncation shows the whole text with no "Read more"', async () => {
    covers('CometChatTextBubble.disableTruncation', 'true');
    overflowingText();
    const { container } = render(<CometChatTextBubble text="A long story" disableTruncation />);
    await frames();
    expect(textBox(container)).toHaveClass('cometchat-text-bubble__text--no-truncation');
    expect(screen.queryByRole('button', { name: 'Read more' })).toBeNull();
  });

  it("message supplies the text when no `text` is given, with the preview card and translation it carries", () => {
    covers('CometChatTextBubble.message', 'set');
    covers('CometChatTextBubble.text', 'default');
    const { container } = render(<CometChatTextBubble message={messageWithExtras('Read https://example.com/post')} />);
    expect(textBox(container)).toHaveTextContent('Read https://example.com/post');
    expect(screen.getByRole('article', { name: 'Link preview for example.com' })).toHaveTextContent('The post');
    expect(screen.getByText('Translated Message')).toBeInTheDocument();
    expect(container.querySelector('.cometchat-text-bubble__translation-text')).toHaveTextContent('Lies den Beitrag');
  });

  it('without a message only the given text is drawn: no preview card, no translation', () => {
    covers('CometChatTextBubble.message', 'default');
    const { container } = render(<CometChatTextBubble text="Read https://example.com/post" />);
    expect(textBox(container)).toHaveTextContent('Read https://example.com/post');
    expect(screen.queryByRole('article')).toBeNull();
    expect(container.querySelector('.cometchat-text-bubble__translation-container')).toBeNull();
  });

  it("text is shown instead of the message's own text", () => {
    covers('CometChatTextBubble.text', 'set');
    const message = buildTextMessage({ text: 'From the message' }) as unknown as CometChat.BaseMessage;
    const { container } = render(<CometChatTextBubble message={message} text="A caption" />);
    expect(textBox(container)).toHaveTextContent('A caption');
    expect(screen.queryByText('From the message')).toBeNull();
  });

  it('textFormatters format the text; with none the text is drawn as written', () => {
    covers('CometChatTextBubble.textFormatters', 'set', 'default');
    const view = render(<CometChatTextBubble text="Visit https://example.com" textFormatters={[new CometChatUrlFormatter()]} />);
    expect(screen.getByRole('link', { name: 'https://example.com' })).toHaveAttribute('href', 'https://example.com');
    view.unmount();

    const { container } = render(<CometChatTextBubble text="Visit https://example.com **now**" />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.querySelector('strong')).toBeNull();
    expect(textBox(container)).toHaveTextContent('Visit https://example.com **now**');
  });
});
