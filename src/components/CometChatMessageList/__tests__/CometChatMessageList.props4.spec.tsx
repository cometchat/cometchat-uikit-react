/**
 * The public props of <CometChatMessageList /> that are callbacks, or that act on messages as they
 * arrive: what a click on a message reports, the incoming-message sound, scrolling on new
 * messages, reactions, and the AI smart replies and conversation starters. Each prop is set (or left
 * out) on the real list, and the test checks what it changes. Only the SDK is mocked; incoming
 * messages arrive the way the SDK's listeners deliver them (see helpers/messageListPropsHarness.tsx).
 */
import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageList } from '../CometChatMessageList';
import { covers } from '../../../testing/covers';
import {
  Kit,
  alice,
  asGroup,
  asUser,
  bob,
  bottomInView,
  bubbleText,
  chooseOption,
  conversation,
  events,
  history,
  installBrowser,
  layout,
  me,
  published,
  reactor,
  resetHarness,
  row,
  sdk,
  show,
  showGroup,
  signIn,
  team,
  tenDaysAgo,
  text,
} from './helpers/messageListPropsHarness';

vi.mock('@cometchat/chat-sdk-javascript', async () =>
  (await import('./helpers/messageListSdkMock')).mockSdkModule()
);

installBrowser();

beforeAll(async () => {
  await signIn();
});

beforeEach(() => {
  resetHarness();
});

/** A message from Bob arriving over the socket. */
const arrives = (message: CometChat.TextMessage) => {
  events.emit({ type: 'message/text-received', message });
};

describe('CometChatMessageList props: clicks on a message', () => {
  it('onAvatarClick gets the sender whose avatar was clicked', async () => {
    covers('CometChatMessageList.onAvatarClick', 'called');
    history(text({ id: 1, from: bob, text: 'Hi team', inGroup: true }));
    const onAvatarClick = vi.fn();
    showGroup({ onAvatarClick });
    await bubbleText('Hi team');
    fireEvent.click(screen.getByRole('button', { name: 'Avatar for Bob' }));
    expect(onAvatarClick).toHaveBeenCalledTimes(1);
    expect(onAvatarClick).toHaveBeenCalledWith(bob);
  });

  it("onAvatarClick on the list's View wins over the list's own", async () => {
    covers('CometChatMessageList.onAvatarClick', 'overrides-context');
    history(text({ id: 1, from: bob, text: 'Hi team', inGroup: true }));
    const fromList = vi.fn();
    const fromView = vi.fn();
    render(
      <Kit>
        <CometChatMessageList.Root group={asGroup(team)} onAvatarClick={fromList}>
          <CometChatMessageList.View onAvatarClick={fromView} />
        </CometChatMessageList.Root>
      </Kit>
    );
    await bubbleText('Hi team');
    fireEvent.click(screen.getByRole('button', { name: 'Avatar for Bob' }));
    expect(fromView).toHaveBeenCalledWith(bob);
    expect(fromList).not.toHaveBeenCalled();
  });

  it('onThreadRepliesClick gets the message whose replies, or "Reply in thread", was clicked', async () => {
    covers('CometChatMessageList.onThreadRepliesClick', 'called');
    const asked = text({ id: 1, from: bob, text: 'Lunch?', replyCount: 2 });
    history(asked);
    const onThreadRepliesClick = vi.fn();
    const { container } = show({ onThreadRepliesClick });
    await bubbleText('Lunch?');
    fireEvent.click(screen.getByRole('button', { name: '2 replies, view thread' }));
    expect(onThreadRepliesClick).toHaveBeenLastCalledWith(asked);
    chooseOption(row(container, 1), 'Reply in thread');
    expect(onThreadRepliesClick).toHaveBeenCalledTimes(2);
    expect(onThreadRepliesClick).toHaveBeenLastCalledWith(asked);
  });

  it("onThreadRepliesClick on the list's View wins over the list's own", async () => {
    covers('CometChatMessageList.onThreadRepliesClick', 'overrides-context');
    const asked = text({ id: 1, from: bob, text: 'Lunch?', replyCount: 2 });
    history(asked);
    const fromList = vi.fn();
    const fromView = vi.fn();
    render(
      <Kit>
        <CometChatMessageList.Root user={asUser(bob)} onThreadRepliesClick={fromList}>
          <CometChatMessageList.View onThreadRepliesClick={fromView} />
        </CometChatMessageList.Root>
      </Kit>
    );
    await bubbleText('Lunch?');
    fireEvent.click(screen.getByRole('button', { name: '2 replies, view thread' }));
    expect(fromView).toHaveBeenCalledWith(asked);
    expect(fromList).not.toHaveBeenCalled();
  });

  it('onEditMessage gets my message when I choose "Edit" (and the composer is told to edit it)', async () => {
    covers('CometChatMessageList.onEditMessage', 'called');
    const mine = text({ id: 2, from: me, text: 'Mine' });
    history(text({ id: 1, from: bob, text: 'Theirs' }), mine);
    const onEditMessage = vi.fn();
    const { container } = show({ onEditMessage });
    await bubbleText('Mine');
    chooseOption(row(container, 2), 'Edit');
    expect(onEditMessage).toHaveBeenCalledTimes(1);
    expect(onEditMessage).toHaveBeenCalledWith(mine);
    expect(published).toContainEqual(expect.objectContaining({ type: 'ui:compose/edit', message: mine }));
  });

  it('onReplyMessage gets the message I choose "Reply" on (and the composer is told to quote it)', async () => {
    covers('CometChatMessageList.onReplyMessage', 'called');
    const theirs = text({ id: 1, from: bob, text: 'Theirs' });
    history(theirs);
    const onReplyMessage = vi.fn();
    const { container } = show({ onReplyMessage });
    await bubbleText('Theirs');
    chooseOption(row(container, 1), 'Reply');
    expect(onReplyMessage).toHaveBeenCalledTimes(1);
    expect(onReplyMessage).toHaveBeenCalledWith(theirs);
    expect(published).toContainEqual(expect.objectContaining({ type: 'ui:compose/reply', message: theirs }));
  });
});

describe('CometChatMessageList props: what happens to the conversation', () => {
  it('onMessageDeleted gets the deleted message, whether I delete it or it is deleted elsewhere', async () => {
    covers('CometChatMessageList.onMessageDeleted', 'called');
    history(text({ id: 1, from: bob, text: 'Theirs' }), text({ id: 2, from: me, text: 'Mine' }));
    const deletedMine = Object.assign(text({ id: 2, from: me, text: 'Mine' }), { getDeletedAt: () => tenDaysAgo });
    sdk.deleteMessage.mockResolvedValue(deletedMine);
    const onMessageDeleted = vi.fn();
    const { container } = show({ onMessageDeleted });
    await bubbleText('Mine');

    chooseOption(row(container, 2), 'Delete');
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(onMessageDeleted).toHaveBeenCalledWith(deletedMine);
    });
    expect(sdk.deleteMessage).toHaveBeenCalledWith('2');

    const deletedTheirs = Object.assign(text({ id: 1, from: bob, text: 'Theirs' }), { getDeletedAt: () => tenDaysAgo });
    events.emit({ type: 'message/deleted', message: deletedTheirs });
    expect(onMessageDeleted).toHaveBeenLastCalledWith(deletedTheirs);
    expect(onMessageDeleted).toHaveBeenCalledTimes(2);
  });

  it('onConversationUpdated gets the conversation after I mark a message unread', async () => {
    covers('CometChatMessageList.onConversationUpdated', 'called');
    const theirs = text({ id: 1, from: bob, text: 'Theirs' });
    history(theirs);
    const updated = conversation(0, 1);
    sdk.markMessageAsUnread.mockResolvedValue(updated);
    const onConversationUpdated = vi.fn();
    const { container } = show({ showMarkAsUnreadOption: true, onConversationUpdated });
    await bubbleText('Theirs');
    chooseOption(row(container, 1), 'Mark Unread');
    await waitFor(() => {
      expect(onConversationUpdated).toHaveBeenCalledWith(updated);
    });
    expect(sdk.markMessageAsUnread).toHaveBeenCalledWith(theirs);
  });

  it('onMessageRead gets a message that arrives while I am at the end of the chat, as it is marked read', async () => {
    covers('CometChatMessageList.onMessageRead', 'called');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    const onMessageRead = vi.fn();
    show({ onMessageRead });
    await bubbleText('Hi');
    const latest = text({ id: 2, from: bob, text: 'Still there?' });
    arrives(latest);
    expect(await bubbleText('Still there?')).toBeInTheDocument();
    expect(onMessageRead).toHaveBeenCalledWith(latest);
    expect(sdk.markAsRead).toHaveBeenCalledWith(latest);
  });

  it('onConversationMarkedAsRead gets the conversation when I scroll down to a message I had not read', async () => {
    covers('CometChatMessageList.onConversationMarkedAsRead', 'called');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    const read = conversation(2, 0);
    sdk.getConversation.mockResolvedValue(read);
    const onConversationMarkedAsRead = vi.fn();
    show({ onConversationMarkedAsRead });
    await bubbleText('Hi');
    bottomInView(true);
    bottomInView(false);
    arrives(text({ id: 2, from: bob, text: 'Missed this' }));
    await bubbleText('Missed this');
    expect(onConversationMarkedAsRead).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Scroll to bottom, 1 new messages' }));
    await waitFor(() => {
      expect(onConversationMarkedAsRead).toHaveBeenCalledWith(read);
    });
    expect(sdk.markConversationAsRead).toHaveBeenLastCalledWith('bob', 'user');
  });

  it('scrollToBottomOnNewMessages takes me to a new message even when I had scrolled up', async () => {
    covers('CometChatMessageList.scrollToBottomOnNewMessages', 'true');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    show({ scrollToBottomOnNewMessages: true });
    await bubbleText('Hi');
    bottomInView(true);
    bottomInView(false);
    expect(screen.getByRole('button', { name: 'Scroll to bottom' })).toBeInTheDocument();
    arrives(text({ id: 2, from: bob, text: 'New one' }));
    await bubbleText('New one');
    expect(screen.queryByRole('button', { name: /^Scroll to bottom/ })).toBeNull();
  });

  it('without scrollToBottomOnNewMessages a new message waits below, counted on the scroll-down button', async () => {
    covers('CometChatMessageList.scrollToBottomOnNewMessages', 'false', 'default');
    for (const props of [{ scrollToBottomOnNewMessages: false }, {}]) {
      history(text({ id: 1, from: bob, text: 'Hi' }));
      const view = show(props);
      await bubbleText('Hi');
      bottomInView(true);
      bottomInView(false);
      arrives(text({ id: 2, from: bob, text: 'New one' }));
      await bubbleText('New one');
      expect(screen.getByRole('button', { name: 'Scroll to bottom, 1 new messages' })).toBeInTheDocument();
      view.unmount();
    }
  });
});

describe('CometChatMessageList props: reactions', () => {
  it("onReactionListItemClick gets my reaction from the message's reaction list, and the message", async () => {
    covers('CometChatMessageList.onReactionListItemClick', 'called');
    // Room for three chips: two show, and the other two go behind "+2".
    layout.width = 152;
    const reactions = ['👍', '❤️', '😂', '😮'].map(emoji => new CometChat.ReactionCount(emoji, 1, emoji === '😮'));
    const message = text({ id: 1, from: bob, text: 'Big news', reactions });
    history(message);
    const mine = reactor(me, '😮');
    sdk.fetchReactions.mockResolvedValue([mine, reactor(bob, '👍')]);
    const onReactionListItemClick = vi.fn();
    const { container } = show({ onReactionListItemClick });
    await bubbleText('Big news');
    fireEvent.click(await within(row(container, 1)).findByRole('button', { name: '2 more reactions' }));
    fireEvent.click(await screen.findByRole('listitem', { name: 'You reacted with 😮. Click to remove' }));
    expect(onReactionListItemClick).toHaveBeenCalledTimes(1);
    expect(onReactionListItemClick).toHaveBeenCalledWith(mine, message);
    // The app handles it: the list doesn't remove the reaction itself.
    expect(sdk.removeReaction).not.toHaveBeenCalled();
  });

  it("by default who reacted is fetched with the SDK's own reactions request", async () => {
    covers('CometChatMessageList.reactionsRequestBuilder', 'default');
    history(text({ id: 1, from: bob, text: 'Big news', reactions: [new CometChat.ReactionCount('👍', 1, false)] }));
    sdk.fetchReactions.mockResolvedValue([reactor(alice, '👍')]);
    const { container } = show();
    await bubbleText('Big news');
    const chip = await within(row(container, 1)).findByRole('button', { name: '👍 reacted by 1' });
    const trigger = chip.closest('.cometchat-popover__trigger');
    if (!trigger) throw new Error('the chip has no popover');
    fireEvent.mouseEnter(trigger);
    const tooltip = await screen.findByRole('tooltip', {}, { timeout: 2000 });
    expect(await within(tooltip).findByText('Alice')).toBeInTheDocument();
    expect(sdk.reactionRequests).toEqual([{ setLimit: [3], setMessageId: [1], setReaction: ['👍'] }]);
  });
});

describe('CometChatMessageList props: sound', () => {
  const DEFAULT_SOUND = 'https://assets.cc-cluster-2.io/uikits/static/audio/incomingmessage.wav';
  let played: string[];
  let play: { mockRestore: () => void } | undefined;

  // jsdom can't play audio: record what the list asks to play instead.
  beforeEach(() => {
    played = [];
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
      played.push(this.src);
      return Promise.resolve();
    });
  });

  afterEach(() => {
    play?.mockRestore();
  });

  async function newMessageSounds(props: Parameters<typeof show>[0]) {
    played = [];
    history(text({ id: 1, from: bob, text: 'Hi' }));
    const view = show(props);
    await bubbleText('Hi');
    arrives(text({ id: 2, from: bob, text: 'Ping' }));
    await bubbleText('Ping');
    view.unmount();
    return played;
  }

  it('an incoming message plays the default sound; disableSoundForMessages silences it', async () => {
    covers('CometChatMessageList.disableSoundForMessages', 'true', 'false', 'default');
    covers('CometChatMessageList.customSoundForMessages', 'default');
    expect(await newMessageSounds({ disableSoundForMessages: true })).toEqual([]);
    expect(await newMessageSounds({ disableSoundForMessages: false })).toEqual([DEFAULT_SOUND]);
    expect(await newMessageSounds({})).toEqual([DEFAULT_SOUND]);
  });

  it('customSoundForMessages is the sound an incoming message plays', async () => {
    covers('CometChatMessageList.customSoundForMessages', 'set');
    expect(await newMessageSounds({ customSoundForMessages: 'https://example.com/ding.mp3' })).toEqual([
      'https://example.com/ding.mp3',
    ]);
  });
});

describe('CometChatMessageList props: smart replies', () => {
  const panel = () => screen.queryByRole('region', { name: 'Suggest a reply' });

  beforeEach(() => {
    sdk.getSmartReplies.mockResolvedValue({ positive: 'Noon works', neutral: 'Let me check' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Wait (in fake time) for a smart-reply delay to run out. */
  const wait = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  it('showSmartReplies suggests replies to a question I received', async () => {
    covers('CometChatMessageList.showSmartReplies', 'true');
    history(text({ id: 1, from: bob, text: 'What time is lunch?' }));
    show({ showSmartReplies: true, smartRepliesDelayDuration: 0 });
    await bubbleText('What time is lunch?');
    expect(await screen.findByRole('button', { name: 'Noon works' })).toBeInTheDocument();
    expect(panel()).not.toBeNull();
    expect(sdk.getSmartReplies).toHaveBeenCalledWith('bob', 'user');
  });

  it('without showSmartReplies no replies are suggested', async () => {
    covers('CometChatMessageList.showSmartReplies', 'false', 'default');
    for (const props of [{ showSmartReplies: false }, {}]) {
      history(text({ id: 1, from: bob, text: 'What time is lunch?' }));
      const view = show({ ...props, smartRepliesDelayDuration: 0 });
      await bubbleText('What time is lunch?');
      await act(() => new Promise(resolve => setTimeout(resolve, 20)));
      expect(panel()).toBeNull();
      view.unmount();
    }
    expect(sdk.getSmartReplies).not.toHaveBeenCalled();
  });

  it('by default replies are suggested ten seconds after the question arrives', async () => {
    covers('CometChatMessageList.smartRepliesDelayDuration', 'default');
    vi.useFakeTimers({ shouldAdvanceTime: true });
    history(text({ id: 1, from: bob, text: 'What time is lunch?' }));
    show({ showSmartReplies: true });
    await bubbleText('What time is lunch?');
    await wait(9000);
    expect(panel()).toBeNull();
    await wait(1000);
    expect(await screen.findByRole('button', { name: 'Noon works' })).toBeInTheDocument();
  });

  it('smartRepliesDelayDuration is how long after the question replies are suggested', async () => {
    covers('CometChatMessageList.smartRepliesDelayDuration', 'set');
    vi.useFakeTimers({ shouldAdvanceTime: true });
    history(text({ id: 1, from: bob, text: 'What time is lunch?' }));
    show({ showSmartReplies: true, smartRepliesDelayDuration: 3000 });
    await bubbleText('What time is lunch?');
    await wait(2000);
    expect(panel()).toBeNull();
    await wait(1000);
    expect(await screen.findByRole('button', { name: 'Noon works' })).toBeInTheDocument();
  });

  it('by default a message asking what, when, why, who, where or how gets suggestions; other messages do not', async () => {
    covers('CometChatMessageList.smartRepliesKeywords', 'default');
    for (const [message, suggested] of [
      ['What time works', true],
      ['When are you free', true],
      ['Why not', true],
      ['Who is coming', true],
      ['Where shall we meet', true],
      ['How was it', true],
      ['Are you free?', true],
      ['See you soon', false],
    ] as const) {
      sdk.getSmartReplies.mockClear();
      history(text({ id: 1, from: bob, text: message }));
      const view = show({ showSmartReplies: true, smartRepliesDelayDuration: 0 });
      await bubbleText(message);
      await act(() => new Promise(resolve => setTimeout(resolve, 20)));
      expect({ message, suggested: panel() !== null }).toEqual({ message, suggested });
      view.unmount();
    }
  });
});

describe('CometChatMessageList props: conversation starters', () => {
  const starters = () => screen.queryByRole('group', { name: 'Conversation starters' });

  it('showConversationStarters suggests how to start an empty chat', async () => {
    covers('CometChatMessageList.showConversationStarters', 'true');
    history();
    sdk.getConversationStarter.mockResolvedValue(['Say hi', 'Ask about the trip']);
    show({ showConversationStarters: true });
    expect(await screen.findByRole('button', { name: 'Say hi' })).toBeInTheDocument();
    expect(starters()).not.toBeNull();
    expect(sdk.getConversationStarter).toHaveBeenCalledWith('bob', 'user');
    fireEvent.click(screen.getByRole('button', { name: 'Ask about the trip' }));
    expect(published).toContainEqual({ type: 'ui:compose/text', text: 'Ask about the trip' });
  });

  it('without showConversationStarters an empty chat suggests nothing', async () => {
    covers('CometChatMessageList.showConversationStarters', 'false', 'default');
    for (const props of [{ showConversationStarters: false }, {}]) {
      history();
      const view = show(props);
      await waitFor(() => {
        expect(view.container.querySelector('.cometchat-message-list__empty-state')).not.toBeNull();
      });
      await act(() => Promise.resolve());
      expect(starters()).toBeNull();
      view.unmount();
    }
    expect(sdk.getConversationStarter).not.toHaveBeenCalled();
  });
});
