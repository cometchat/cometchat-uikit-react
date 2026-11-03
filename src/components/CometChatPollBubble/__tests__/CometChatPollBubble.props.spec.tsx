/**
 * The public props of <CometChatPollBubble />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. Only the SDK is mocked: who is logged in, and
 * the polls extension a vote goes to.
 *
 * `onVoteError` is not claimed: the error it reports is not the SDK's (the known issue at the end).
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPollBubble } from '../CometChatPollBubble';
import type { CometChatPollVoteErrorEvent } from '../CometChatPollBubble.types';
import { buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({ getLoggedinUser: vi.fn(), callExtension: vi.fn() }));

// The real SDK's constants (the kit reads them on import), with the logged-in user and the
// extension call mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  return {
    CometChat: Object.assign({}, CometChat, {
      getLoggedinUser: sdk.getLoggedinUser,
      callExtension: sdk.callExtension,
    }),
  };
});

const me = buildUser({ uid: 'me', name: 'Me', avatar: '' });

/**
 * A poll from `senderUid` asking "Lunch?", with each option's voters as the polls extension reports
 * them. By default I voted Pizza, as did Bob, and Carol voted Sushi.
 */
function pollMessage(senderUid = 'alice', votes = { pizza: ['me', 'bob'], sushi: ['carol'] }) {
  const voters = (uids: string[]) => Object.fromEntries(uids.map(uid => [uid, { name: uid }]));
  return {
    getId: () => 501,
    getSender: () => buildUser({ uid: senderUid }),
    getMetadata: () => ({
      '@injected': {
        extensions: {
          polls: {
            id: 'poll-1',
            question: 'Lunch?',
            options: { '1': 'Pizza', '2': 'Sushi' },
            results: {
              total: votes.pizza.length + votes.sushi.length,
              options: {
                '1': { count: votes.pizza.length, voters: voters(votes.pizza) },
                '2': { count: votes.sushi.length, voters: voters(votes.sushi) },
              },
            },
          },
        },
      },
    }),
  } as unknown as CometChat.CustomMessage;
}

const option = (text: string) => screen.getByRole('radio', { name: new RegExp(`^${text},`) });
const polls = () => screen.getAllByRole('group', { name: 'Poll: Lunch?' });

/** The logged-in user arrives from the SDK after mount; it shows as my vote (Pizza) being checked. */
const myVoteShown = () =>
  waitFor(() => {
    expect(option('Pizza')).toBeChecked();
  });

beforeEach(() => {
  sdk.getLoggedinUser.mockReset().mockResolvedValue(me);
  sdk.callExtension.mockReset().mockResolvedValue({});
});

describe('CometChatPollBubble props', () => {
  describe('alignment', () => {
    it("by default follows the sender: outgoing for my own poll, incoming for anyone else's", async () => {
      covers('CometChatPollBubble.alignment', 'default');
      render(
        <>
          <CometChatPollBubble message={pollMessage('me')} />
          <CometChatPollBubble message={pollMessage('alice')} />
        </>
      );
      const [mine, theirs] = polls();
      await waitFor(() => {
        expect(mine).toHaveClass('cometchat-poll-bubble--outgoing');
      });
      expect(mine).not.toHaveClass('cometchat-poll-bubble--incoming');
      expect(theirs).toHaveClass('cometchat-poll-bubble--incoming');
      expect(theirs).not.toHaveClass('cometchat-poll-bubble--outgoing');
    });

    it('"left" shows the bubble as incoming, even for my own poll', async () => {
      covers('CometChatPollBubble.alignment', 'left');
      render(<CometChatPollBubble message={pollMessage('me')} alignment="left" />);
      await myVoteShown();
      expect(polls()[0]).toHaveClass('cometchat-poll-bubble--incoming');
      expect(polls()[0]).not.toHaveClass('cometchat-poll-bubble--outgoing');
    });

    it('"right" shows the bubble as outgoing, even for someone else\'s poll', async () => {
      covers('CometChatPollBubble.alignment', 'right');
      render(<CometChatPollBubble message={pollMessage('alice')} alignment="right" />);
      await myVoteShown();
      expect(polls()[0]).toHaveClass('cometchat-poll-bubble--outgoing');
      expect(polls()[0]).not.toHaveClass('cometchat-poll-bubble--incoming');
    });
  });

  it('className is added to the bubble; by default it has only its own classes', async () => {
    covers('CometChatPollBubble.className', 'set', 'default');
    const message = pollMessage();
    const { rerender } = render(<CometChatPollBubble message={message} className="my-poll" />);
    await myVoteShown();
    expect(polls()[0]).toHaveClass('cometchat-poll-bubble', 'cometchat-poll-bubble--incoming', 'my-poll');

    rerender(<CometChatPollBubble message={message} />);
    expect(polls()[0]!.className).toBe('cometchat-poll-bubble cometchat-poll-bubble--incoming');
  });

  describe('disableInteraction', () => {
    it('true takes the options out of the tab order and ignores clicks and keys: no vote is sent', async () => {
      covers('CometChatPollBubble.disableInteraction', 'true');
      const onVoteSubmit = vi.fn();
      render(<CometChatPollBubble message={pollMessage()} disableInteraction onVoteSubmit={onVoteSubmit} />);
      await myVoteShown();
      expect(option('Pizza')).toHaveAttribute('tabindex', '-1');
      expect(option('Sushi')).toHaveAttribute('tabindex', '-1');

      fireEvent.click(option('Sushi'));
      fireEvent.keyDown(option('Sushi'), { key: 'Enter' });
      fireEvent.keyDown(option('Sushi'), { key: ' ' });
      expect(sdk.callExtension).not.toHaveBeenCalled();
      expect(option('Pizza')).toBeChecked();
      expect(option('Sushi')).not.toBeChecked();
      expect(option('Sushi')).toHaveAccessibleName('Sushi, 1 votes, 33%');
      expect(onVoteSubmit).not.toHaveBeenCalled();
    });

    it('false, and by default, a click or Enter on an option votes for it, and the bubble shows the vote at once', async () => {
      covers('CometChatPollBubble.disableInteraction', 'false', 'default');
      for (const props of [{ disableInteraction: false }, {}]) {
        sdk.callExtension.mockClear();
        const view = render(<CometChatPollBubble message={pollMessage()} {...props} />);
        await myVoteShown();
        expect(option('Sushi')).toHaveAttribute('tabindex', '0');

        fireEvent.click(option('Sushi'));
        // My vote moves from Pizza to Sushi before the extension answers.
        expect(option('Sushi')).toBeChecked();
        expect(option('Pizza')).not.toBeChecked();
        expect(option('Sushi')).toHaveAccessibleName('Sushi, 2 votes, 67%');
        expect(option('Pizza')).toHaveAccessibleName('Pizza, 1 votes, 33%');
        expect(sdk.callExtension).toHaveBeenCalledWith('polls', 'POST', 'v2/vote', { vote: '2', id: 'poll-1' });
        expect(await screen.findByText('Vote submitted for Sushi')).toBeInTheDocument();

        fireEvent.keyDown(option('Pizza'), { key: 'Enter' });
        expect(option('Pizza')).toBeChecked();
        expect(sdk.callExtension).toHaveBeenLastCalledWith('polls', 'POST', 'v2/vote', { vote: '1', id: 'poll-1' });
        expect(await screen.findByText('Vote submitted for Pizza')).toBeInTheDocument();
        view.unmount();
      }
    });
  });

  it('message is the poll shown: its question, options, vote counts and my vote; a newer message updates it', async () => {
    covers('CometChatPollBubble.message', 'set');
    const { rerender, unmount } = render(<CometChatPollBubble message={pollMessage()} />);
    expect(polls()[0]).toHaveTextContent('Lunch?');
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(option('Pizza')).toHaveAccessibleName('Pizza, 2 votes, 67%');
    expect(option('Sushi')).toHaveAccessibleName('Sushi, 1 votes, 33%');
    await myVoteShown();
    expect(option('Sushi')).not.toBeChecked();

    // The same poll after more votes came in, and mine moved.
    rerender(<CometChatPollBubble message={pollMessage('alice', { pizza: ['bob'], sushi: ['carol', 'me', 'dan'] })} />);
    expect(option('Pizza')).toHaveAccessibleName('Pizza, 1 votes, 25%');
    expect(option('Sushi')).toHaveAccessibleName('Sushi, 3 votes, 75%');
    expect(option('Sushi')).toBeChecked();
    expect(option('Pizza')).not.toBeChecked();
    unmount();

    // A message with no poll in it shows nothing, before and after the logged-in user arrives.
    const notAPoll = { getId: () => 502, getSender: () => buildUser({ uid: 'alice' }), getMetadata: () => ({}) };
    const { container } = render(<CometChatPollBubble message={notAPoll as unknown as CometChat.CustomMessage} />);
    expect(container).toBeEmptyDOMElement();
    await waitFor(() => {
      expect(sdk.getLoggedinUser).toHaveBeenCalledTimes(2);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('onVoteSubmit gets the poll, the option and the message once the extension has saved the vote', async () => {
    covers('CometChatPollBubble.onVoteSubmit', 'called');
    let saved!: (response: object) => void;
    sdk.callExtension.mockReturnValue(
      new Promise(resolve => {
        saved = resolve;
      })
    );
    const onVoteSubmit = vi.fn();
    const message = pollMessage();
    render(<CometChatPollBubble message={message} onVoteSubmit={onVoteSubmit} />);
    await myVoteShown();

    fireEvent.click(option('Sushi'));
    expect(onVoteSubmit).not.toHaveBeenCalled();
    saved({});
    await waitFor(() => {
      expect(onVoteSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onVoteSubmit).toHaveBeenCalledWith({ pollId: 'poll-1', optionId: '2', optionText: 'Sushi', message });
  });

  it('a failed vote is rolled back, and onVoteError is told which vote failed', async () => {
    // Not claimed as onVoteError:called; see the known issue below.
    const failure = new Error('vote failed');
    sdk.callExtension.mockRejectedValue(failure);
    const onVoteError = vi.fn();
    const onVoteSubmit = vi.fn();
    const message = pollMessage();
    render(<CometChatPollBubble message={message} onVoteError={onVoteError} onVoteSubmit={onVoteSubmit} />);
    await myVoteShown();

    fireEvent.click(option('Sushi'));
    expect(option('Sushi')).toBeChecked();
    await waitFor(() => {
      expect(onVoteError).toHaveBeenCalledTimes(1);
    });
    expect(onVoteError).toHaveBeenCalledWith({ pollId: 'poll-1', optionId: '2', error: failure, message });
    expect(option('Pizza')).toBeChecked();
    expect(option('Sushi')).not.toBeChecked();
    expect(option('Sushi')).toHaveAccessibleName('Sushi, 1 votes, 33%');
    expect(onVoteSubmit).not.toHaveBeenCalled();
  });

  // Known issue: the SDK rejects a failed call with a CometChatException, which is not an Error, so
  // the bubble wraps it as `new Error(String(error))` and onVoteError gets "[object Object]": the
  // SDK's code and message are lost. `it.fails` passes while the issue is there and fails as soon as
  // this is fixed; then change it back to `it` and claim CometChatPollBubble.onVoteError 'called'.
  it.fails("onVoteError passes on the SDK's error", async () => {
    sdk.callExtension.mockRejectedValue(
      new CometChat.CometChatException({ code: 'ERR_POLL_CLOSED', message: 'This poll is closed' })
    );
    const onVoteError = vi.fn<(event: CometChatPollVoteErrorEvent) => void>();
    render(<CometChatPollBubble message={pollMessage()} onVoteError={onVoteError} />);
    await myVoteShown();

    fireEvent.click(option('Sushi'));
    await waitFor(() => {
      expect(onVoteError).toHaveBeenCalledTimes(1);
    });
    expect(onVoteError.mock.calls[0]![0].error.message).toBe('This poll is closed');
  });
});
