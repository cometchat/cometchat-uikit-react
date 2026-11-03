/**
 * The public props of <CometChatMessageList /> that decide what is fetched and which chat is open:
 * request builders, types and categories, user / group / thread, where the list opens, agent chat,
 * and the session callbacks. Each prop is set (or left out) on the real list, and the test checks
 * what it changes. Only the SDK is mocked (helpers/messageListSdkMock.ts); the harness renders the
 * real list with real bubbles in a real logged-in session.
 *
 * The display props are in CometChatMessageList.props2.spec.tsx, the message options in
 * .props3.spec.tsx, and callbacks, sound and AI features in .props4.spec.tsx.
 */
import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageList } from '../CometChatMessageList';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatTextPlugin } from '../../../plugins/core/text/CometChatTextPlugin';
import type { CometChatMessagePlugin } from '../../../plugins/plugin.types';
import { covers } from '../../../testing/covers';
import {
  Kit,
  asUser,
  bob,
  bubbleText,
  chooseOption,
  conversation,
  history,
  installBrowser,
  me,
  optionTitles,
  registry,
  resetHarness,
  row,
  scrolledIntoView,
  sdk,
  show,
  showGroup,
  signIn,
  team,
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

const emptyState = (container: HTMLElement) =>
  container.querySelector('.cometchat-message-list__empty-state');

describe('CometChatMessageList props: what is fetched', () => {
  it("by default fetches the newest 30 messages of the chat, of the types and categories the app's plugins handle", async () => {
    covers('CometChatMessageList.messagesRequestBuilder', 'default');
    covers('CometChatMessageList.messageTypes', 'default');
    covers('CometChatMessageList.messageCategories', 'default');
    covers('CometChatMessageList.parentMessage', 'default');
    covers('CometChatMessageList.parentMessageId', 'default');
    covers('CometChatMessageList.goToMessageId', 'default');
    history(text({ id: 1, from: bob, text: 'Older' }), text({ id: 2, from: bob, text: 'Newest' }));
    const { container } = show();
    await bubbleText('Newest');

    // One request, built by the list: the latest page of the 1:1 chat, top-level messages only.
    expect(sdk.messageRequests).toEqual([
      {
        setLimit: [30],
        hideDeletedMessages: [true],
        setUID: ['bob'],
        hideReplies: [true],
        setTypes: [['text', 'groupMember']],
        setCategories: [['message', 'action']],
      },
    ]);
    expect(registry.getAllMessageTypes()).toEqual(['text', 'groupMember']);
    expect(registry.getAllMessageCategories()).toEqual(['message', 'action']);
    // It opens at the newest message: nothing fetched around a message, nothing highlighted.
    expect(sdk.getMessageDetails).not.toHaveBeenCalled();
    expect(container.querySelector('.cometchat-message-list__bubble-highlight')).toBeNull();
  });

  it("an app's messagesRequestBuilder is the one fetched from; the list builds no request of its own", async () => {
    covers('CometChatMessageList.messagesRequestBuilder', 'used');
    const fetchPrevious = vi.fn().mockResolvedValue([text({ id: 1, from: bob, text: 'From the app' })]);
    const builder = {
      setMessageId: vi.fn(),
      build: vi.fn(() => ({ fetchPrevious, fetchNext: vi.fn().mockResolvedValue([]) })),
    };
    show({ messagesRequestBuilder: builder as unknown as CometChat.MessagesRequestBuilder });
    expect(await bubbleText('From the app')).toBeInTheDocument();
    expect(builder.build).toHaveBeenCalled();
    expect(fetchPrevious).toHaveBeenCalled();
    expect(sdk.messageRequests).toHaveLength(0);
    expect(sdk.fetchPrevious).not.toHaveBeenCalled();
  });

  it('messageTypes and messageCategories are the types and categories fetched', async () => {
    covers('CometChatMessageList.messageTypes', 'set');
    covers('CometChatMessageList.messageCategories', 'set');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    show({ messageTypes: ['text'], messageCategories: ['message'] });
    await bubbleText('Hi');
    expect(sdk.messageRequests[0]?.setTypes).toEqual([['text']]);
    expect(sdk.messageRequests[0]?.setCategories).toEqual([['message']]);
  });

  it("messageTypes and messageCategories win over the types the app's plugins add", async () => {
    covers('CometChatMessageList.messageTypes', 'overrides-context');
    covers('CometChatMessageList.messageCategories', 'overrides-context');
    const polls: CometChatMessagePlugin = {
      id: 'polls',
      messageTypes: ['extension_poll'],
      messageCategories: ['custom'],
      renderBubble: () => null,
    };
    const withPolls = new CometChatPluginRegistry([CometChatTextPlugin, polls]);
    const inApp = (list: React.ReactNode) => (
      <Kit>
        <CometChatPluginRegistryContext.Provider value={withPolls}>{list}</CometChatPluginRegistryContext.Provider>
      </Kit>
    );

    // The plugins alone: polls are fetched too.
    const view = render(inApp(<CometChatMessageList user={asUser(bob)} />));
    await waitFor(() => {
      expect(sdk.messageRequests).toHaveLength(1);
    });
    expect(sdk.messageRequests[0]?.setTypes).toEqual([['text', 'extension_poll']]);
    expect(sdk.messageRequests[0]?.setCategories).toEqual([['message', 'custom']]);
    view.unmount();

    // The props replace what the plugins ask for.
    render(
      inApp(<CometChatMessageList user={asUser(bob)} messageTypes={['text']} messageCategories={['message']} />)
    );
    await waitFor(() => {
      expect(sdk.messageRequests).toHaveLength(2);
    });
    expect(sdk.messageRequests[1]?.setTypes).toEqual([['text']]);
    expect(sdk.messageRequests[1]?.setCategories).toEqual([['message']]);
  });
});

describe('CometChatMessageList props: which chat', () => {
  it('user opens the 1:1 chat with that user: fetched and read by uid, bubbles without sender names', async () => {
    covers('CometChatMessageList.user', 'set');
    history(text({ id: 1, from: bob, text: 'Hi from Bob' }));
    const { container } = show();
    await bubbleText('Hi from Bob');
    expect(sdk.messageRequests[0]?.setUID).toEqual(['bob']);
    expect(sdk.messageRequests[0]?.setGUID).toBeUndefined();
    expect(sdk.getConversation).toHaveBeenCalledWith('bob', 'user');
    expect(container.querySelector('.cometchat-message-bubble__sender-name')).toBeNull();
  });

  it('group opens the group chat: fetched and read by guid, incoming bubbles named after their sender', async () => {
    covers('CometChatMessageList.group', 'set');
    history(text({ id: 1, from: bob, text: 'Hi team', inGroup: true }));
    const { container } = showGroup();
    await bubbleText('Hi team');
    expect(sdk.messageRequests[0]?.setGUID).toEqual([team.getGuid()]);
    expect(sdk.messageRequests[0]?.setUID).toBeUndefined();
    expect(sdk.getConversation).toHaveBeenCalledWith('team', 'group');
    expect(container.querySelector('.cometchat-message-bubble__sender-name')).toHaveTextContent('Bob');
  });

  it('with neither a user nor a group there is no chat: nothing is fetched', async () => {
    covers('CometChatMessageList.user', 'default');
    covers('CometChatMessageList.group', 'default');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    render(
      <Kit>
        <CometChatMessageList />
      </Kit>
    );
    await act(() => Promise.resolve());
    expect(sdk.messageRequests).toHaveLength(0);
    expect(sdk.getConversation).not.toHaveBeenCalled();
    expect(screen.queryByText('Hi')).toBeNull();
  });

  it("parentMessage turns the list into that message's thread: its replies are fetched, without the parent", async () => {
    covers('CometChatMessageList.parentMessage', 'set');
    const parent = text({ id: 50, from: bob, text: 'Lunch?', replyCount: 1 });
    history(text({ id: 51, from: bob, text: 'Sure', parentId: 50 }));
    const { container } = show({ parentMessage: parent });
    await bubbleText('Sure');
    expect(sdk.messageRequests[0]).toMatchObject({
      setParentMessageId: [50],
      hideReplies: [false],
      withParent: [false],
    });
    expect(screen.queryByText('Lunch?')).toBeNull();
    // A thread has no unread banner to fetch, and its replies can't open another thread.
    expect(sdk.getConversation).not.toHaveBeenCalled();
    expect(optionTitles(row(container, 51))).not.toContain('Reply in thread');
  });

  it('parentMessageId (deprecated) still opens that thread', async () => {
    covers('CometChatMessageList.parentMessageId', 'set');
    history(text({ id: 51, from: bob, text: 'Sure', parentId: 50 }));
    show({ parentMessageId: 50 });
    await bubbleText('Sure');
    expect(sdk.messageRequests[0]).toMatchObject({ setParentMessageId: [50], hideReplies: [false] });
    expect(sdk.getConversation).not.toHaveBeenCalled();
  });
});

describe('CometChatMessageList props: where the list opens', () => {
  it('goToMessageId opens the chat at that message: fetched around it, scrolled to and highlighted', async () => {
    covers('CometChatMessageList.goToMessageId', 'set');
    sdk.fetchPrevious.mockResolvedValue([text({ id: 4, from: bob, text: 'Before' })]);
    sdk.getMessageDetails.mockResolvedValue(text({ id: 5, from: bob, text: 'Target' }));
    sdk.fetchNext.mockResolvedValue([text({ id: 6, from: bob, text: 'After' })]);
    const { container } = show({ goToMessageId: 5 });
    await bubbleText('Target');
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
    expect(sdk.getMessageDetails).toHaveBeenCalledWith('5');
    expect(sdk.messageRequests.filter(request => request.setMessageId?.[0] === 5)).toHaveLength(2);
    await waitFor(() => {
      expect(row(container, 5)).toHaveClass('cometchat-message-list__bubble-highlight');
    });
    expect(scrolledIntoView()).toContain(row(container, 5));
  });

  it('startFromUnreadMessages opens at the last message read, with a "New" divider after it', async () => {
    covers('CometChatMessageList.startFromUnreadMessages', 'true');
    sdk.getConversation.mockResolvedValue(conversation(1, 1));
    sdk.fetchPrevious.mockResolvedValue([]);
    sdk.getMessageDetails.mockResolvedValue(text({ id: 1, from: bob, text: 'Read already' }));
    sdk.fetchNext.mockResolvedValue([text({ id: 2, from: bob, text: 'Not read yet' })]);
    const { container } = show({ startFromUnreadMessages: true });
    await bubbleText('Not read yet');
    expect(sdk.messageRequests.some(request => request.setMessageId?.[0] === 1)).toBe(true);
    const divider = screen.getByRole('separator', { name: 'New' });
    expect(row(container, 1).nextElementSibling).toBe(divider);
  });

  it('without startFromUnreadMessages the chat opens at the newest message, with no divider', async () => {
    covers('CometChatMessageList.startFromUnreadMessages', 'false', 'default');
    for (const props of [{ startFromUnreadMessages: false }, {}]) {
      sdk.messageRequests.length = 0;
      sdk.getConversation.mockResolvedValue(conversation(1, 1));
      history(text({ id: 1, from: bob, text: 'Read already' }), text({ id: 2, from: bob, text: 'Not read yet' }));
      const view = show(props);
      await bubbleText('Not read yet');
      expect(sdk.messageRequests.some(request => request.setMessageId !== undefined)).toBe(false);
      expect(screen.queryByRole('separator', { name: 'New' })).toBeNull();
      view.unmount();
    }
  });
});

describe('CometChatMessageList props: agent chat', () => {
  it('isAgentChat with no thread open shows the empty state without fetching; an ordinary chat fetches', async () => {
    covers('CometChatMessageList.isAgentChat', 'true', 'false', 'default');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    let view = show({ isAgentChat: true });
    await waitFor(() => {
      expect(emptyState(view.container)).not.toBeNull();
    });
    expect(sdk.messageRequests).toHaveLength(0);
    view.unmount();

    for (const props of [{ isAgentChat: false }, {}]) {
      view = show(props);
      await bubbleText('Hi');
      expect(emptyState(view.container)).toBeNull();
      view.unmount();
    }
    expect(sdk.messageRequests).toHaveLength(2);
  });

  it("isAgentChat fetches an agent thread with its parent message; an ordinary thread leaves it to the thread's header", async () => {
    covers('CometChatMessageList.isAgentChat', 'true', 'false', 'default');
    const parent = text({ id: 50, from: me, text: 'Plan my trip' });
    for (const [props, withParent] of [
      [{ isAgentChat: true }, true],
      [{ isAgentChat: false }, false],
      [{}, false],
    ] as const) {
      sdk.messageRequests.length = 0;
      history(text({ id: 51, from: bob, text: 'Here is a plan', parentId: 50 }));
      const view = show({ ...props, parentMessage: parent });
      await bubbleText('Here is a plan');
      expect(sdk.messageRequests[0]?.withParent).toEqual([withParent]);
      view.unmount();
    }
  });

  it("isAgentChat on the list's View wins over the list's own: agent bubbles get an avatar and no thread link", async () => {
    covers('CometChatMessageList.isAgentChat', 'overrides-context');
    const answer = text({ id: 1, from: bob, text: 'Answer', replyCount: 2 });
    const thread = () => screen.queryByRole('button', { name: '2 replies, view thread' });
    const avatar = () => screen.queryByRole('button', { name: 'Avatar for Bob' });

    history(answer);
    let view = render(
      <Kit>
        <CometChatMessageList.Root user={asUser(bob)} isAgentChat={false}>
          <CometChatMessageList.View />
        </CometChatMessageList.Root>
      </Kit>
    );
    await bubbleText('Answer');
    expect(thread()).not.toBeNull();
    expect(avatar()).toBeNull();
    view.unmount();

    view = render(
      <Kit>
        <CometChatMessageList.Root user={asUser(bob)} isAgentChat={false}>
          <CometChatMessageList.View isAgentChat />
        </CometChatMessageList.Root>
      </Kit>
    );
    await bubbleText('Answer');
    expect(thread()).toBeNull();
    expect(avatar()).not.toBeNull();
  });

  it('loadLastAgentConversation keeps an agent chat loading until its last conversation is opened', async () => {
    covers('CometChatMessageList.loadLastAgentConversation', 'true');
    const { container } = show({ isAgentChat: true, loadLastAgentConversation: true });
    expect(await screen.findByRole('status', { name: 'Loading messages' })).toBeInTheDocument();
    await act(() => Promise.resolve());
    expect(emptyState(container)).toBeNull();
    expect(sdk.messageRequests).toHaveLength(0);
  });

  it('without loadLastAgentConversation an agent chat with no thread shows its empty state at once', async () => {
    covers('CometChatMessageList.loadLastAgentConversation', 'false', 'default');
    for (const props of [{ loadLastAgentConversation: false }, {}]) {
      const view = show({ isAgentChat: true, ...props });
      await waitFor(() => {
        expect(emptyState(view.container)).not.toBeNull();
      });
      expect(screen.queryByRole('status', { name: 'Loading messages' })).toBeNull();
      view.unmount();
    }
  });
});

describe('CometChatMessageList props: session and callbacks', () => {
  it('without loggedInUser the list works as the user the app logged in with', async () => {
    covers('CometChatMessageList.loggedInUser', 'default');
    const mine = text({ id: 1, from: me, text: 'Mine' });
    const theirs = text({ id: 2, from: bob, text: 'Theirs' });
    history(mine, theirs);
    const seenAs = vi.fn();
    show({
      bubbleView: (message, loggedInUser) => {
        seenAs(loggedInUser.getUid());
        return <p>{(message as CometChat.TextMessage).getText()}</p>;
      },
    });
    expect(await screen.findByText('Theirs')).toBeInTheDocument();
    expect(new Set(seenAs.mock.calls.map(([uid]) => uid as string))).toEqual(new Set(['me']));
    // Bob's message, not mine, is the one acknowledged as delivered.
    await waitFor(() => {
      expect(sdk.markAsDelivered).toHaveBeenCalledWith(theirs);
    });
    expect(sdk.markAsDelivered).not.toHaveBeenCalledWith(mine);
  });

  it('onActiveChatChanged reports the chat once it has loaded: who, its last message, its unread count', async () => {
    covers('CometChatMessageList.onActiveChatChanged', 'called');
    const last = text({ id: 2, from: bob, text: 'Latest' });
    history(text({ id: 1, from: bob, text: 'Earlier' }), last);
    sdk.getConversation.mockResolvedValue(conversation(1, 3));
    const onActiveChatChanged = vi.fn();
    show({ onActiveChatChanged });
    await waitFor(() => {
      expect(onActiveChatChanged).toHaveBeenCalledTimes(1);
    });
    expect(onActiveChatChanged).toHaveBeenCalledWith({ user: bob, message: last, unreadMessageCount: 3 });
  });

  it('onError gets the error when an action on a message fails', async () => {
    covers('CometChatMessageList.onError', 'called');
    history(text({ id: 1, from: me, text: 'Oops' }));
    const error = { code: 'ERR_NETWORK', message: 'offline' };
    sdk.deleteMessage.mockRejectedValue(error);
    const onError = vi.fn();
    const { container } = show({ onError });
    await bubbleText('Oops');
    chooseOption(row(container, 1), 'Delete');
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
    expect(sdk.deleteMessage).toHaveBeenCalledWith('1');
  });
});

