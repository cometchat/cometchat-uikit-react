/**
 * One own send, one bubble: a fetched page that carries the server's copy of a
 * send still in flight must not add a second row.
 *
 * The reconnect catch-up now reads the newest page even when the newest row is
 * an un-acked own send, so with a flaky network (offline on or off) the page can
 * answer before the send does. `deduplicateById` keeps every id-0 row, so the
 * list held the optimistic row and the server copy at once, and the later
 * `MESSAGE_SEND_SUCCESS` gave the optimistic row the same id — two bubbles under
 * one React key.
 *
 * Review: Aanshi B4 on #2460 ("please confirm with a test").
 */
import { describe, expect, it } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { initialMessageListState, messageListReducer } from '../CometChatMessageList.reducer';
import type { CometChatMessageListState } from '../CometChatMessageList.types';
import { buildTextMessage } from '../../../testing/mock-builders';

/** An own send as the composer adds it: no server id, its muid only. */
function pending(muid: string, text = 'hello'): CometChat.BaseMessage {
  return buildTextMessage({ id: 0, muid, text }) as unknown as CometChat.BaseMessage;
}

/** The server's copy of that send, as a fetched page carries it. */
function acked(id: number, muid: string, text = 'hello'): CometChat.BaseMessage {
  return buildTextMessage({ id, muid, text }) as unknown as CometChat.BaseMessage;
}

const stateWith = (messages: CometChat.BaseMessage[]): CometChatMessageListState => ({
  ...initialMessageListState,
  messages,
  fetchState: 'loaded',
});

const idsOf = (state: CometChatMessageListState) => state.messages.map(m => m.getId());

describe('a fetched page that already holds an own send still in flight', () => {
  it('the catch-up page replaces the optimistic row instead of adding one', () => {
    const state = messageListReducer(stateWith([acked(41, 'muid-41'), pending('muid-own')]), {
      type: 'FETCH_NEXT_SUCCESS',
      messages: [acked(42, 'muid-own')],
      hasMoreNewer: false,
    });

    expect(state.messages).toHaveLength(2);
    expect(idsOf(state)).toEqual([41, 42]);
    // The bubble keeps its place: the row the user is looking at does not move.
    expect(state.messages[1]?.getMuid()).toBe('muid-own');
  });

  it("the send's own answer then has nothing left to duplicate", () => {
    const fetched = messageListReducer(stateWith([pending('muid-own')]), {
      type: 'FETCH_NEXT_SUCCESS',
      messages: [acked(42, 'muid-own')],
      hasMoreNewer: false,
    });
    const state = messageListReducer(fetched, {
      type: 'MESSAGE_SEND_SUCCESS',
      muid: 'muid-own',
      confirmedMessage: acked(42, 'muid-own'),
    });

    expect(state.messages).toHaveLength(1);
    expect(idsOf(state)).toEqual([42]);
  });

  it('an older page that overlaps the send is folded the same way', () => {
    const state = messageListReducer(stateWith([pending('muid-own')]), {
      type: 'FETCH_PREVIOUS_SUCCESS',
      messages: [acked(40, 'muid-40'), acked(42, 'muid-own')],
      hasMore: false,
    });

    expect(state.messages).toHaveLength(2);
    expect(idsOf(state)).toEqual([40, 42]);
  });

  it('two confirmed messages that share a muid both stay', () => {
    // The muid is the client's: an integrator's backend or a bot sending through
    // REST can reuse one, another platform's scheme can collide with it, and a
    // resend after a lost ack gets a second server id under the first muid.
    // Collapsing them dropped a message the server holds, offline on or off.
    const state = messageListReducer(stateWith([acked(10, 'bot', 'first')]), {
      type: 'FETCH_NEXT_SUCCESS',
      messages: [acked(11, 'bot', 'second')],
      hasMoreNewer: false,
    });

    expect(idsOf(state)).toEqual([10, 11]);
  });

  it('a send still in flight after two confirmed rows of that muid folds into the later one', () => {
    const state = messageListReducer(stateWith([acked(10, 'bot', 'first'), acked(11, 'bot', 'second')]), {
      type: 'FETCH_NEXT_SUCCESS',
      messages: [acked(12, 'bot', 'third')],
      hasMoreNewer: false,
    });

    expect(idsOf(state)).toEqual([10, 11, 12]);
  });

  it('two different sends still in flight both stay', () => {
    const state = messageListReducer(stateWith([pending('muid-a', 'a'), pending('muid-b', 'b')]), {
      type: 'FETCH_NEXT_SUCCESS',
      messages: [acked(42, 'muid-a', 'a')],
      hasMoreNewer: false,
    });

    expect(state.messages).toHaveLength(2);
    expect(idsOf(state)).toEqual([42, 0]);
    expect(state.messages[1]?.getMuid()).toBe('muid-b');
  });
});
