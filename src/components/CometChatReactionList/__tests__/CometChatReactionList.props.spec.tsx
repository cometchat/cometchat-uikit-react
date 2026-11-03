/**
 * The public props of <CometChatReactionList />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. Only the SDK is mocked: it serves who reacted.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionList } from '../CometChatReactionList';
import { buildTextMessage } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  newBuilder: vi.fn(),
  setLimit: vi.fn(),
  setMessageId: vi.fn(),
  setReaction: vi.fn(),
  fetchNext: vi.fn(),
}));

// The real SDK's classes and constants, with the calls the list makes mocked.
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

/** One person's reaction to message 7, as the SDK returns it. */
function reaction(emoji: string, by: CometChat.User) {
  return new CometChat.Reaction(`${by.getUid()}-${emoji}`, '7', emoji, by.getUid(), 1735689600, by);
}

const message = buildTextMessage({ id: 7, text: 'Lunch at noon?' }) as unknown as CometChat.BaseMessage;
const mine = reaction('👍', me);
const reactions = [mine, reaction('👍', bob), reaction('🎉', bob)];

/** A reactions request builder an app passes in, returning its own reactions. */
function appBuilder(page: CometChat.Reaction[]) {
  const fetchNext = vi.fn().mockResolvedValue(page);
  const builder = { setMessageId: vi.fn(), build: vi.fn(() => ({ fetchNext })) };
  builder.setMessageId.mockReturnValue(builder);
  return builder;
}

const list = () => screen.getByRole('dialog', { name: 'Reaction list' });
const rows = () => screen.findAllByRole('listitem');
const tabs = () => screen.getAllByRole('tab').map(tab => tab.textContent);
/** Your own row; it reads "You" once the list knows who is logged in. */
const yours = () => screen.findByRole('listitem', { name: 'You reacted with 👍. Click to remove' });

beforeEach(() => {
  for (const fn of [sdk.newBuilder, sdk.setLimit, sdk.setMessageId, sdk.setReaction]) fn.mockClear();
  sdk.fetchNext.mockReset().mockResolvedValue(reactions);
});

describe('CometChatReactionList props', () => {
  it("message is the one whose reactions are listed: a tab per emoji with its count, a row per person", async () => {
    covers('CometChatReactionList.message', 'set');
    render(<CometChatReactionList message={message} />);
    expect(await yours()).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(sdk.setMessageId).toHaveBeenCalledWith(7);
    expect(tabs()).toEqual(['All3', '👍2', '🎉1']);
    expect(screen.getByRole('listitem', { name: 'Bob reacted with 👍' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: 'Bob reacted with 🎉' })).toBeInTheDocument();
  });

  it('className is added to the list; by default it has only its own', async () => {
    covers('CometChatReactionList.className', 'set', 'default');
    const view = render(<CometChatReactionList message={message} className="app-reactors" />);
    await rows();
    expect(list()).toHaveClass('cometchat-reaction-list', 'app-reactors');
    view.unmount();
    render(<CometChatReactionList message={message} />);
    await rows();
    expect(list().className).toBe('cometchat-reaction-list');
  });

  it('children replace the default layout with the parts given', async () => {
    covers('CometChatReactionList.children', 'custom');
    const view = render(<CometChatReactionList message={message} />);
    await rows();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    view.unmount();

    render(
      <CometChatReactionList.Root message={message}>
        <p>Who reacted</p>
        <CometChatReactionList.Items />
      </CometChatReactionList.Root>
    );
    expect(await rows()).toHaveLength(3);
    expect(screen.getByText('Who reacted')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  describe('callbacks', () => {
    it('onItemClick gets your reaction and the message when you click it, and the row goes; others cannot be clicked', async () => {
      covers('CometChatReactionList.onItemClick', 'called');
      const onItemClick = vi.fn();
      render(<CometChatReactionList message={message} onItemClick={onItemClick} />);
      const own = await yours();
      fireEvent.click(screen.getByRole('listitem', { name: 'Bob reacted with 👍' }));
      expect(onItemClick).not.toHaveBeenCalled();

      fireEvent.click(own);
      expect(onItemClick).toHaveBeenCalledTimes(1);
      expect(onItemClick).toHaveBeenCalledWith(mine, message);
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(tabs()).toEqual(['All2', '👍1', '🎉1']);
    });

    it('onEmpty fires when you remove the last reaction, not before', async () => {
      covers('CometChatReactionList.onEmpty', 'called');
      const onEmpty = vi.fn();
      const view = render(<CometChatReactionList message={message} onEmpty={onEmpty} />);
      fireEvent.click(await yours());
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(onEmpty).not.toHaveBeenCalled();
      view.unmount();

      sdk.fetchNext.mockResolvedValue([mine]);
      render(<CometChatReactionList message={message} onEmpty={onEmpty} />);
      fireEvent.click(await yours());
      expect(onEmpty).toHaveBeenCalledTimes(1);
    });

    it('onError gets the error when the reactions cannot be fetched, and the list offers a retry', async () => {
      covers('CometChatReactionList.onError', 'called');
      const error = { code: 'ERR_NETWORK', message: 'offline' };
      sdk.fetchNext.mockRejectedValue(error);
      const onError = vi.fn();
      render(<CometChatReactionList message={message} onError={onError} />);
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
      expect(screen.getByRole('alert')).toHaveTextContent('Looks like something went wrong');
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });
  });

  describe('request builder', () => {
    it('without a builder, fetches every reaction to the message, 20 at a time', async () => {
      covers('CometChatReactionList.reactionsRequestBuilder', 'default');
      render(<CometChatReactionList message={message} />);
      expect(await rows()).toHaveLength(3);
      expect(sdk.newBuilder).toHaveBeenCalledTimes(1);
      expect(sdk.setLimit).toHaveBeenCalledWith(20);
      expect(sdk.setMessageId).toHaveBeenCalledWith(7);
      expect(sdk.setReaction).not.toHaveBeenCalled();
    });

    it("an app's builder is the one fetched from, for this message", async () => {
      covers('CometChatReactionList.reactionsRequestBuilder', 'used');
      const builder = appBuilder([reaction('🔥', carol)]);
      render(
        <CometChatReactionList
          message={message}
          reactionsRequestBuilder={builder as unknown as CometChat.ReactionsRequestBuilder}
        />
      );
      expect(await screen.findByRole('listitem', { name: 'Carol reacted with 🔥' })).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
      expect(builder.setMessageId).toHaveBeenCalledWith(7);
      expect(builder.build).toHaveBeenCalled();
      expect(sdk.newBuilder).not.toHaveBeenCalled();
    });
  });
});
