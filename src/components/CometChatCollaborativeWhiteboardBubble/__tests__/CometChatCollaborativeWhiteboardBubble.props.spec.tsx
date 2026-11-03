/**
 * The public props of <CometChatCollaborativeWhiteboardBubble />, one case each: the prop is set (or
 * left out) on the real component and the test checks what it changes. Only the SDK is mocked: it
 * answers who is logged in, which the default alignment is worked out from.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCollaborativeWhiteboardBubble } from '../CometChatCollaborativeWhiteboardBubble';
import { buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({ getLoggedinUser: vi.fn() }));

// The real SDK's constants (the kit reads them on import), with the logged-in user mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  return { CometChat: Object.assign({}, CometChat, { getLoggedinUser: sdk.getLoggedinUser }) };
});

const me = buildUser({ uid: 'me', name: 'Me' });

/** A collaborative-whiteboard message from `senderUid`, with `url` where the extension puts it (none for null). */
function whiteboardMessage(senderUid: string, url: string | null = 'https://boards.example/b/1') {
  return {
    getSender: () => buildUser({ uid: senderUid }),
    getMetadata: () => (url === null ? {} : { '@injected': { extensions: { whiteboard: { board_url: url } } } }),
  } as unknown as CometChat.BaseMessage;
}

const bubbles = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('.cometchat-collaborative-bubble'));
const openButton = () => screen.getByRole('button', { name: 'Open Whiteboard' });

let windowOpen: MockInstance<typeof window.open>;

beforeEach(() => {
  // Nobody is logged in unless a test says so.
  sdk.getLoggedinUser.mockReset().mockResolvedValue(null);
  windowOpen = vi.spyOn(window, 'open').mockReturnValue(null);
});

afterEach(() => {
  windowOpen.mockRestore();
});

describe('CometChatCollaborativeWhiteboardBubble props', () => {
  describe('alignment', () => {
    it('by default follows the sender: outgoing for my own message, incoming for anyone else', async () => {
      covers('CometChatCollaborativeWhiteboardBubble.alignment', 'default');
      sdk.getLoggedinUser.mockResolvedValue(me);
      const { container } = render(
        <>
          <CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('me')} />
          <CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('alice')} />
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
      covers('CometChatCollaborativeWhiteboardBubble.alignment', 'left');
      sdk.getLoggedinUser.mockResolvedValue(me);
      const { container } = render(
        <>
          <CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('me')} />
          <CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('me')} alignment="left" />
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
      covers('CometChatCollaborativeWhiteboardBubble.alignment', 'right');
      sdk.getLoggedinUser.mockResolvedValue(me);
      const { container } = render(
        <>
          <CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('me')} />
          <CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('alice')} alignment="right" />
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
    covers('CometChatCollaborativeWhiteboardBubble.className', 'set', 'default');
    const { container, rerender } = render(
      <CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('alice')} className="my-whiteboard" />
    );
    expect(bubbles(container)[0]).toHaveClass(
      'cometchat-collaborative-bubble',
      'cometchat-collaborative-bubble--whiteboard',
      'my-whiteboard'
    );

    rerender(<CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('alice')} />);
    expect(bubbles(container)[0]!.className).toBe(
      'cometchat-collaborative-bubble cometchat-collaborative-bubble--incoming cometchat-collaborative-bubble--whiteboard'
    );
  });

  describe('disabled', () => {
    it('true turns the open button off: a click neither calls onButtonClick nor opens the board', () => {
      covers('CometChatCollaborativeWhiteboardBubble.disabled', 'true');
      const onButtonClick = vi.fn();
      const { rerender } = render(
        <CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('alice')} disabled onButtonClick={onButtonClick} />
      );
      expect(openButton()).toBeDisabled();
      fireEvent.click(openButton());
      expect(onButtonClick).not.toHaveBeenCalled();

      rerender(<CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('alice')} disabled />);
      expect(openButton()).toBeDisabled();
      fireEvent.click(openButton());
      expect(windowOpen).not.toHaveBeenCalled();
    });

    it('false leaves the button on: a click hands over the board link', () => {
      covers('CometChatCollaborativeWhiteboardBubble.disabled', 'false');
      const onButtonClick = vi.fn();
      render(
        <CometChatCollaborativeWhiteboardBubble
          message={whiteboardMessage('alice')}
          disabled={false}
          onButtonClick={onButtonClick}
        />
      );
      expect(openButton()).toBeEnabled();
      fireEvent.click(openButton());
      expect(onButtonClick).toHaveBeenCalledWith('https://boards.example/b/1');
    });

    it('by default the button is on, and a click opens the board in a new window', () => {
      covers('CometChatCollaborativeWhiteboardBubble.disabled', 'default');
      render(<CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('alice')} />);
      expect(openButton()).toBeEnabled();
      fireEvent.click(openButton());
      expect(windowOpen).toHaveBeenCalledTimes(1);
      expect(windowOpen).toHaveBeenCalledWith('https://boards.example/b/1', '', 'fullscreen=yes, scrollbars=auto');
    });
  });

  it('message is where the board link comes from; a message without one leaves the button off', () => {
    covers('CometChatCollaborativeWhiteboardBubble.message', 'set');
    const onButtonClick = vi.fn();
    const { rerender } = render(
      <CometChatCollaborativeWhiteboardBubble
        message={whiteboardMessage('alice', 'https://boards.example/b/42')}
        onButtonClick={onButtonClick}
      />
    );
    fireEvent.click(openButton());
    expect(onButtonClick).toHaveBeenLastCalledWith('https://boards.example/b/42');

    rerender(
      <CometChatCollaborativeWhiteboardBubble
        message={whiteboardMessage('alice', 'https://boards.example/b/43')}
        onButtonClick={onButtonClick}
      />
    );
    fireEvent.click(openButton());
    expect(onButtonClick).toHaveBeenLastCalledWith('https://boards.example/b/43');

    rerender(
      <CometChatCollaborativeWhiteboardBubble message={whiteboardMessage('alice', null)} onButtonClick={onButtonClick} />
    );
    expect(openButton()).toBeDisabled();
    fireEvent.click(openButton());
    expect(onButtonClick).toHaveBeenCalledTimes(2);
  });

  it('onButtonClick gets the board link, in place of opening a window', () => {
    covers('CometChatCollaborativeWhiteboardBubble.onButtonClick', 'called');
    const onButtonClick = vi.fn();
    render(
      <CometChatCollaborativeWhiteboardBubble
        message={whiteboardMessage('alice', 'https://boards.example/b/7')}
        onButtonClick={onButtonClick}
      />
    );
    fireEvent.click(openButton());
    expect(onButtonClick).toHaveBeenCalledTimes(1);
    expect(onButtonClick).toHaveBeenCalledWith('https://boards.example/b/7');
    expect(windowOpen).not.toHaveBeenCalled();
  });
});
