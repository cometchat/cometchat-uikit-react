/**
 * The public props of <CometChatReactions.Root />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. Only the SDK is mocked: it serves who reacted,
 * for the hover card and for the full list behind "+N".
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactions } from '../CometChatReactions';
import type { CometChatMessageBubbleAlignment } from '../../../plugins/plugin.types';
import { buildTextMessage } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  newBuilder: vi.fn(),
  setLimit: vi.fn(),
  setMessageId: vi.fn(),
  setReaction: vi.fn(),
  fetchNext: vi.fn(),
}));

// The real SDK's classes and constants, with the calls the reactions make mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const actual = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>(
    '@cometchat/chat-sdk-javascript'
  );
  return {
    ...actual,
    CometChat: Object.assign({}, actual.CometChat, {
      isInitialized: () => true,
      getLoggedinUser: () => Promise.resolve({ getUid: () => 'me', getName: () => 'Me' }),
      ReactionsRequestBuilder: vi.fn(function (this: Record<string, unknown>) {
        sdk.newBuilder();
        this.setLimit = sdk.setLimit.mockReturnValue(this);
        this.setMessageId = sdk.setMessageId.mockReturnValue(this);
        this.setReaction = sdk.setReaction.mockReturnValue(this);
        this.build = () => ({ fetchNext: sdk.fetchNext });
      }),
    }),
  };
});

function person(uid: string, name: string) {
  const user = new CometChat.User(uid);
  user.setName(name);
  return user;
}
const me = person('me', 'Me');
const bob = person('bob', 'Bob');
const carol = person('carol', 'Carol');

/** Message 1, with these reaction counts: [emoji, count, reacted by me]. */
function reacted(...counts: [string, number, boolean][]) {
  const reactions = counts.map(([emoji, count, mine]) => new CometChat.ReactionCount(emoji, count, mine));
  return Object.assign(buildTextMessage({ id: 1 }), {
    getReactions: () => reactions,
  }) as unknown as CometChat.BaseMessage;
}

/** One person's reaction, as the SDK returns it. */
function reaction(emoji: string, by: CometChat.User) {
  return new CometChat.Reaction(`${by.getUid()}-${emoji}`, '1', emoji, by.getUid(), 1735689600, by);
}

/** A reactions request builder an app passes in, returning its own reactions. */
function appBuilder(reactions: CometChat.Reaction[]) {
  const fetchNext = vi.fn().mockResolvedValue(reactions);
  const builder = { setMessageId: vi.fn(), setReaction: vi.fn(), build: vi.fn(() => ({ fetchNext })) };
  builder.setMessageId.mockReturnValue(builder);
  builder.setReaction.mockReturnValue(builder);
  return builder;
}

const bar = () => screen.getByRole('group', { name: 'Reactions' });
const chip = (emoji: string, count: number) =>
  screen.getByRole('button', { name: `${emoji} reacted by ${String(count)}` });

beforeEach(() => {
  for (const fn of [sdk.newBuilder, sdk.setLimit, sdk.setMessageId, sdk.setReaction]) fn.mockClear();
  sdk.fetchNext.mockReset().mockResolvedValue([]);
});

describe('CometChatReactions props', () => {
  it("message's reactions are the chips: each emoji with its count, yours pressed; with none, nothing shows", () => {
    covers('CometChatReactions.message', 'set');
    const view = render(<CometChatReactions.Root message={reacted(['👍', 3, true], ['🎉', 1, false])} />);
    expect(within(bar()).getAllByRole('button').map(b => b.textContent)).toEqual(['👍3', '🎉1']);
    expect(chip('👍', 3)).toHaveAttribute('aria-pressed', 'true');
    expect(chip('🎉', 1)).toHaveAttribute('aria-pressed', 'false');
    view.unmount();

    const { container } = render(<CometChatReactions.Root message={reacted()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('onReactionClick gets the emoji and the message when a chip is clicked', () => {
    covers('CometChatReactions.onReactionClick', 'called');
    const message = reacted(['👍', 3, true], ['🎉', 1, false]);
    const onReactionClick = vi.fn();
    render(<CometChatReactions.Root message={message} onReactionClick={onReactionClick} />);
    fireEvent.click(chip('🎉', 1));
    expect(onReactionClick).toHaveBeenCalledTimes(1);
    expect(onReactionClick).toHaveBeenCalledWith('🎉', message);
  });

  it('children replace the default bar of chips', () => {
    covers('CometChatReactions.children', 'custom');
    const message = reacted(['👍', 3, true]);
    const view = render(<CometChatReactions.Root message={message} />);
    expect(bar()).toBeInTheDocument();
    view.unmount();

    render(
      <CometChatReactions.Root message={message}>
        <p>3 people liked this</p>
      </CometChatReactions.Root>
    );
    expect(screen.getByText('3 people liked this')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Reactions' })).toBeNull();
  });

  it('className is added to the root; by default it has only its own', () => {
    covers('CometChatReactions.className', 'set', 'default');
    const message = reacted(['👍', 3, true]);
    const view = render(<CometChatReactions.Root message={message} className="app-reactions" />);
    expect(view.container.firstElementChild).toHaveClass('cometchat-reactions', 'app-reactions');
    expect(view.container.firstElementChild).toContainElement(bar());
    view.unmount();
    const { container } = render(<CometChatReactions.Root message={message} />);
    expect(container.firstElementChild?.className).toBe('cometchat-reactions');
  });

  describe('who reacted', () => {
    it('without a builder, the hover card asks the SDK for the first three who reacted with that emoji', async () => {
      covers('CometChatReactions.reactionsRequestBuilder', 'default');
      sdk.fetchNext.mockResolvedValue([reaction('👍', bob), reaction('👍', me)]);
      render(<CometChatReactions.Root message={reacted(['👍', 2, true])} hoverDebounceTime={0} />);
      fireEvent.mouseEnter(chip('👍', 2));
      const card = await screen.findByRole('tooltip');
      await waitFor(() => {
        expect(card).toHaveTextContent('You, Bob');
      });
      expect(sdk.newBuilder).toHaveBeenCalledTimes(1);
      expect(sdk.setLimit).toHaveBeenCalledWith(3);
      expect(sdk.setMessageId).toHaveBeenCalledWith(1);
      expect(sdk.setReaction).toHaveBeenCalledWith('👍');
    });

    it("an app's builder is the one the hover card asks", async () => {
      covers('CometChatReactions.reactionsRequestBuilder', 'used');
      const builder = appBuilder([reaction('🎉', carol)]);
      render(
        <CometChatReactions.Root
          message={reacted(['🎉', 1, false])}
          reactionsRequestBuilder={builder as unknown as CometChat.ReactionsRequestBuilder}
          hoverDebounceTime={0}
        />
      );
      fireEvent.mouseEnter(chip('🎉', 1));
      const card = await screen.findByRole('tooltip');
      await waitFor(() => {
        expect(card).toHaveTextContent('Carol');
      });
      expect(builder.setMessageId).toHaveBeenCalledWith(1);
      expect(builder.setReaction).toHaveBeenCalledWith('🎉');
      expect(builder.build).toHaveBeenCalled();
      expect(sdk.newBuilder).not.toHaveBeenCalled();
    });

    it("an app's builder is also the one the full list behind \"+N\" fetches from", async () => {
      covers('CometChatReactions.reactionsRequestBuilder', 'used');
      const builder = appBuilder([reaction('🔥', carol)]);
      render(
        <CometChatReactions.Root
          message={reacted(['👍', 1, true], ['❤️', 1, false], ['😂', 1, false], ['🔥', 1, false])}
          reactionsRequestBuilder={builder as unknown as CometChat.ReactionsRequestBuilder}
        >
          <CometChatReactions.Bar maxVisible={3} />
        </CometChatReactions.Root>
      );
      fireEvent.click(screen.getByRole('button', { name: '2 more reactions' }));
      expect(await screen.findByRole('listitem', { name: 'Carol reacted with 🔥' })).toBeInTheDocument();
      expect(builder.setMessageId).toHaveBeenCalledWith(1);
      expect(sdk.newBuilder).not.toHaveBeenCalled();
    });
  });

  describe('alignment', () => {
    let layout: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      // jsdom has no layout: put every box mid-screen, so the list fits on either side of "+N".
      layout = vi
        .spyOn(Element.prototype, 'getBoundingClientRect')
        .mockReturnValue(DOMRect.fromRect({ x: 400, y: 300, width: 40, height: 20 }));
      sdk.fetchNext.mockResolvedValue([reaction('👍', me), reaction('❤️', bob)]);
    });
    afterEach(() => {
      layout.mockRestore();
    });

    /** Opens the list of everyone who reacted from "+2"; returns the side of the chips it opened on. */
    async function listSide(alignment?: CometChatMessageBubbleAlignment) {
      const view = render(
        <CometChatReactions.Root
          message={reacted(['👍', 1, true], ['❤️', 1, false], ['😂', 1, false], ['🔥', 1, false])}
          {...(alignment !== undefined && { alignment })}
        >
          <CometChatReactions.Bar maxVisible={3} />
        </CometChatReactions.Root>
      );
      fireEvent.click(screen.getByRole('button', { name: '2 more reactions' }));
      const list = await screen.findByRole('dialog', { name: 'Reaction list' });
      const popover = list.closest('.cometchat-popover__content');
      await waitFor(() => {
        expect(popover).toHaveClass('cometchat-popover__content--positioned');
      });
      const side = ['left', 'right', 'top', 'bottom'].find(p =>
        popover?.classList.contains(`cometchat-popover__content--${p}`)
      );
      view.unmount();
      return side;
    }

    it("left (the default): the list opens on the bubble's right", async () => {
      covers('CometChatReactions.alignment', 'left', 'default');
      expect(await listSide('left')).toBe('right');
      expect(await listSide()).toBe('right');
    });

    it("right: the list opens on the bubble's left", async () => {
      covers('CometChatReactions.alignment', 'right');
      expect(await listSide('right')).toBe('left');
    });

    it('center: the list opens on the left', async () => {
      covers('CometChatReactions.alignment', 'center');
      expect(await listSide('center')).toBe('left');
    });
  });
});
