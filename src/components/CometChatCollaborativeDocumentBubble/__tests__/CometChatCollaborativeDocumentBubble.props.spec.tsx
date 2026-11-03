/**
 * The public props of <CometChatCollaborativeDocumentBubble />, one case each: the prop is set (or
 * left out) on the real component and the test checks what it changes. Only the SDK is mocked: it
 * answers who is logged in, which the default alignment is worked out from.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCollaborativeDocumentBubble } from '../CometChatCollaborativeDocumentBubble';
import { buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({ getLoggedinUser: vi.fn() }));

// The real SDK's constants (the kit reads them on import), with the logged-in user mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  return { CometChat: Object.assign({}, CometChat, { getLoggedinUser: sdk.getLoggedinUser }) };
});

const me = buildUser({ uid: 'me', name: 'Me' });

/** A collaborative-document message from `senderUid`, with `url` where the extension puts it (none for null). */
function documentMessage(senderUid: string, url: string | null = 'https://docs.example/d/1') {
  return {
    getSender: () => buildUser({ uid: senderUid }),
    getMetadata: () => (url === null ? {} : { '@injected': { extensions: { document: { document_url: url } } } }),
  } as unknown as CometChat.BaseMessage;
}

const bubbles = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('.cometchat-collaborative-bubble'));
const openButton = () => screen.getByRole('button', { name: 'Open Document' });

let windowOpen: MockInstance<typeof window.open>;

beforeEach(() => {
  // Nobody is logged in unless a test says so.
  sdk.getLoggedinUser.mockReset().mockResolvedValue(null);
  windowOpen = vi.spyOn(window, 'open').mockReturnValue(null);
});

afterEach(() => {
  windowOpen.mockRestore();
});

describe('CometChatCollaborativeDocumentBubble props', () => {
  describe('alignment', () => {
    it('by default follows the sender: outgoing for my own message, incoming for anyone else', async () => {
      covers('CometChatCollaborativeDocumentBubble.alignment', 'default');
      sdk.getLoggedinUser.mockResolvedValue(me);
      const { container } = render(
        <>
          <CometChatCollaborativeDocumentBubble message={documentMessage('me')} />
          <CometChatCollaborativeDocumentBubble message={documentMessage('alice')} />
        </>
      );
      const [mine, theirs] = bubbles(container);
      // The logged-in user arrives from the SDK after mount.
      await waitFor(() => {
        expect(mine).toHaveClass('cometchat-collaborative-bubble--outgoing');
      });
      expect(mine).not.toHaveClass('cometchat-collaborative-bubble--incoming');
      expect(theirs).toHaveClass('cometchat-collaborative-bubble--incoming');
      expect(theirs).not.toHaveClass('cometchat-collaborative-bubble--outgoing');
    });

    it('"left" shows the bubble as incoming, even for my own message', async () => {
      covers('CometChatCollaborativeDocumentBubble.alignment', 'left');
      sdk.getLoggedinUser.mockResolvedValue(me);
      const { container } = render(
        <>
          <CometChatCollaborativeDocumentBubble message={documentMessage('me')} />
          <CometChatCollaborativeDocumentBubble message={documentMessage('me')} alignment="left" />
        </>
      );
      const [derived, left] = bubbles(container);
      await waitFor(() => {
        expect(derived).toHaveClass('cometchat-collaborative-bubble--outgoing');
      });
      expect(left).toHaveClass('cometchat-collaborative-bubble--incoming');
      expect(left).not.toHaveClass('cometchat-collaborative-bubble--outgoing');
    });

    it('"right" shows the bubble as outgoing, even for someone else\'s message', async () => {
      covers('CometChatCollaborativeDocumentBubble.alignment', 'right');
      sdk.getLoggedinUser.mockResolvedValue(me);
      const { container } = render(
        <>
          <CometChatCollaborativeDocumentBubble message={documentMessage('me')} />
          <CometChatCollaborativeDocumentBubble message={documentMessage('alice')} alignment="right" />
        </>
      );
      const [mine, right] = bubbles(container);
      await waitFor(() => {
        expect(mine).toHaveClass('cometchat-collaborative-bubble--outgoing');
      });
      expect(right).toHaveClass('cometchat-collaborative-bubble--outgoing');
      expect(right).not.toHaveClass('cometchat-collaborative-bubble--incoming');
    });
  });

  it('className is added to the bubble; by default it has only its own classes', () => {
    covers('CometChatCollaborativeDocumentBubble.className', 'set', 'default');
    const { container, rerender } = render(
      <CometChatCollaborativeDocumentBubble message={documentMessage('alice')} className="my-document" />
    );
    expect(bubbles(container)[0]).toHaveClass(
      'cometchat-collaborative-bubble',
      'cometchat-collaborative-bubble--document',
      'my-document'
    );

    rerender(<CometChatCollaborativeDocumentBubble message={documentMessage('alice')} />);
    expect(bubbles(container)[0]!.className).toBe(
      'cometchat-collaborative-bubble cometchat-collaborative-bubble--incoming cometchat-collaborative-bubble--document'
    );
  });

  describe('disabled', () => {
    it('true turns the open button off: a click neither calls onButtonClick nor opens the document', () => {
      covers('CometChatCollaborativeDocumentBubble.disabled', 'true');
      const onButtonClick = vi.fn();
      const { rerender } = render(
        <CometChatCollaborativeDocumentBubble message={documentMessage('alice')} disabled onButtonClick={onButtonClick} />
      );
      expect(openButton()).toBeDisabled();
      fireEvent.click(openButton());
      expect(onButtonClick).not.toHaveBeenCalled();

      rerender(<CometChatCollaborativeDocumentBubble message={documentMessage('alice')} disabled />);
      expect(openButton()).toBeDisabled();
      fireEvent.click(openButton());
      expect(windowOpen).not.toHaveBeenCalled();
    });

    it('false leaves the button on: a click hands over the document link', () => {
      covers('CometChatCollaborativeDocumentBubble.disabled', 'false');
      const onButtonClick = vi.fn();
      render(
        <CometChatCollaborativeDocumentBubble
          message={documentMessage('alice')}
          disabled={false}
          onButtonClick={onButtonClick}
        />
      );
      expect(openButton()).toBeEnabled();
      fireEvent.click(openButton());
      expect(onButtonClick).toHaveBeenCalledWith('https://docs.example/d/1');
    });

    it('by default the button is on, and a click opens the document in a new window', () => {
      covers('CometChatCollaborativeDocumentBubble.disabled', 'default');
      render(<CometChatCollaborativeDocumentBubble message={documentMessage('alice')} />);
      expect(openButton()).toBeEnabled();
      fireEvent.click(openButton());
      expect(windowOpen).toHaveBeenCalledTimes(1);
      expect(windowOpen).toHaveBeenCalledWith('https://docs.example/d/1', '', 'fullscreen=yes, scrollbars=auto');
    });
  });

  it('message is where the document link comes from; a message without one leaves the button off', () => {
    covers('CometChatCollaborativeDocumentBubble.message', 'set');
    const onButtonClick = vi.fn();
    const { rerender } = render(
      <CometChatCollaborativeDocumentBubble
        message={documentMessage('alice', 'https://docs.example/d/42')}
        onButtonClick={onButtonClick}
      />
    );
    fireEvent.click(openButton());
    expect(onButtonClick).toHaveBeenLastCalledWith('https://docs.example/d/42');

    rerender(
      <CometChatCollaborativeDocumentBubble
        message={documentMessage('alice', 'https://docs.example/d/43')}
        onButtonClick={onButtonClick}
      />
    );
    fireEvent.click(openButton());
    expect(onButtonClick).toHaveBeenLastCalledWith('https://docs.example/d/43');

    rerender(<CometChatCollaborativeDocumentBubble message={documentMessage('alice', null)} onButtonClick={onButtonClick} />);
    expect(openButton()).toBeDisabled();
    fireEvent.click(openButton());
    expect(onButtonClick).toHaveBeenCalledTimes(2);
  });

  it('onButtonClick gets the document link, in place of opening a window', () => {
    covers('CometChatCollaborativeDocumentBubble.onButtonClick', 'called');
    const onButtonClick = vi.fn();
    render(
      <CometChatCollaborativeDocumentBubble
        message={documentMessage('alice', 'https://docs.example/d/7')}
        onButtonClick={onButtonClick}
      />
    );
    fireEvent.click(openButton());
    expect(onButtonClick).toHaveBeenCalledTimes(1);
    expect(onButtonClick).toHaveBeenCalledWith('https://docs.example/d/7');
    expect(windowOpen).not.toHaveBeenCalled();
  });
});
