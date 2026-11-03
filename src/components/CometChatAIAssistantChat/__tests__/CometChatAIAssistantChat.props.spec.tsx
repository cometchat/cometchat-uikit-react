/**
 * The public props of <CometChatAIAssistantChat />, one case each: the prop is set (or left out) on
 * the real component, with its real header, message list, composer and history sidebar, and the test
 * checks what it changes. Only the SDK is mocked; the kit is initialised with an existing session and
 * rendered inside the real CometChatProvider, as an app does.
 */
import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantChat } from '../CometChatAIAssistantChat';
import { CometChatAIAssistantTools } from '../ai.types';
import type { CometChatAIAssistantChatProps } from '../ai.types';
import { CometChatProvider } from '../../../context/CometChatProvider';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { UIKitSettingsBuilder } from '../../../CometChatUIKit/UIKitSettings';
import { covers } from '../../../testing/covers';

type Handlers = Record<string, ((...args: unknown[]) => void) | undefined>;

const sdk = vi.hoisted(() => ({
  /** fetchPrevious of the history sidebar: the agent's top-level messages, by uid. */
  history: vi.fn(),
  /** fetchPrevious of the message list for one conversation: (parentMessageId, uid). */
  thread: vi.fn(),
  sendMessage: vi.fn(),
  getMessageDetails: vi.fn(),
  /** The AI assistant listener the chat registers, so a test can stream events into it. */
  ai: null as Handlers | null,
}));

// The real SDK (classes, constants), with the calls that would reach the network replaced.
vi.mock('@cometchat/chat-sdk-javascript', async importOriginal => {
  const actual = await importOriginal<typeof import('@cometchat/chat-sdk-javascript')>();
  const SDK = actual.CometChat;
  const patch = (name: string, value: unknown) => {
    Object.defineProperty(SDK, name, { configurable: true, writable: true, value });
  };
  const noop = () => undefined;
  const resolved = () => Promise.resolve();

  class MessagesRequestBuilder extends SDK.MessagesRequestBuilder {
    override build() {
      const config = this as unknown as { uid?: string; parentMessageId?: number };
      return {
        fetchPrevious: () =>
          config.parentMessageId
            ? sdk.thread(config.parentMessageId, config.uid)
            : sdk.history(config.uid),
        fetchNext: () => Promise.resolve([]),
      } as unknown as CometChat.MessagesRequest;
    }
  }
  patch('MessagesRequestBuilder', MessagesRequestBuilder);

  // Session: initialised, with a logged-in user.
  patch('init', () => Promise.resolve(true));
  patch('setSource', noop);
  patch('isInitialized', () => true);
  patch('getLoggedinUser', () => Promise.resolve(me()));
  patch('getConversationUpdateSettings', () => Promise.reject(new Error('not configured')));
  for (const limit of ['getPinnedMessagesLimit', 'getSavedMessagesLimit', 'getPinnedConversationsLimit']) {
    patch(limit, () => Promise.resolve(null));
  }
  patch('getMaxAttachmentCount', () => Promise.resolve(10));

  // Listeners: there is no socket in a test.
  for (const kind of ['Login', 'Message', 'User', 'Group', 'Call', 'Connection', 'Conversation']) {
    patch(`add${kind}Listener`, noop);
    patch(`remove${kind}Listener`, noop);
  }
  patch('addAIAssistantListener', (_id: string, listener: Handlers) => {
    sdk.ai = listener;
  });
  patch('removeAIAssistantListener', noop);

  // Messaging.
  patch('sendMessage', (message: unknown) => sdk.sendMessage(message));
  patch('getMessageDetails', (id: string) => sdk.getMessageDetails(id));
  patch('markAsDelivered', resolved);
  patch('markAsRead', resolved);
  patch('markConversationAsRead', resolved);
  return actual;
});

const SENT_AT = 1_761_800_000;

function me() {
  const user = new CometChat.User('me');
  user.setName('Me');
  return user;
}

function agentUser(metadata?: Record<string, unknown>, uid = 'agent-1', name = 'Trip Planner') {
  const user = new CometChat.User(uid);
  user.setName(name);
  if (metadata) user.setMetadata(metadata);
  return user;
}

function textMessage(
  id: number,
  text: string,
  { from = me(), parent }: { from?: CometChat.User; parent?: number } = {}
) {
  const message = new CometChat.TextMessage('agent-1', text, 'user');
  message.setId(id);
  message.setSender(from);
  message.setSentAt(SENT_AT);
  if (parent) message.setParentMessageId(parent);
  return message;
}

/** Lets real time pass inside act. */
const wait = (ms: number) =>
  act(
    () =>
      new Promise<void>(resolve => {
        setTimeout(resolve, ms);
      })
  );

type Props = Partial<CometChatAIAssistantChatProps>;

async function show(props: Props = {}) {
  const view = render(
    <CometChatProvider>
      <CometChatAIAssistantChat user={agentUser()} {...props} />
    </CometChatProvider>
  );
  // Let the chat finish its first loads (history, list, composer).
  await wait(0);
  return view;
}

const banner = () => screen.getByRole('banner');
const messageList = () => screen.getByRole('region', { name: 'Message list' });
const greeting = () => screen.queryByText('I am here to assist you!');
/** Waits for the text in the message list (the chat remounts the list when it opens a conversation). */
const findInList = (text: string) => waitFor(() => within(messageList()).getByText(text));
const composerText = () => screen.getByRole('textbox', { name: 'Type a message' }).textContent;
const sent = (call = 0) => sdk.sendMessage.mock.calls[call]?.[0] as CometChat.TextMessage;

const ROUND_TRIP_MS = 10;

/** The server accepts a sent message after a short round trip, giving it this id. */
function serverAccepts(id: number) {
  sdk.sendMessage.mockImplementation(
    (message: CometChat.TextMessage) =>
      new Promise(resolve => {
        setTimeout(() => {
          message.setId(id);
          resolve(message);
        }, ROUND_TRIP_MS);
      })
  );
}

/** Types into the composer and presses send; returns once the server has answered. */
async function send(text: string) {
  const box = await screen.findByRole('textbox', { name: 'Type a message' });
  box.textContent = text;
  fireEvent.input(box);
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  // In two steps, as in the app: the message shows as pending, then the server's answer lands.
  await wait(0);
  await wait(ROUND_TRIP_MS * 2);
}

/** An AI assistant event from the socket; `getters` become the event's getter methods. */
function aiEvent(type: string, runId: string, getters: Record<string, unknown> = {}) {
  return {
    getType: () => type,
    getMessageId: () => runId,
    ...Object.fromEntries(Object.entries(getters).map(([name, value]) => [name, () => value])),
  };
}
function stream(event: ReturnType<typeof aiEvent>) {
  act(() => {
    sdk.ai?.onAIAssistantEventReceived?.(event);
  });
}

/** Sends a message and waits for the bubble the agent's answer streams into. */
async function askAndWaitForAnswer(props: Props = {}) {
  serverAccepts(101);
  const view = await show(props);
  await send('Plan a weekend');
  await screen.findByText('Thinking...');
  const bubble = view.container.querySelector('[data-message-id="-101"]');
  if (!(bubble instanceof HTMLElement)) throw new Error('no answer bubble');
  return bubble;
}

/** Streams the first chunk of the answer to the message sent by askAndWaitForAnswer(). */
function streamFirstChunk(text: string) {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  stream(aiEvent('run_started', '101'));
  stream(aiEvent('text_message_start', '101'));
  stream(aiEvent('text_message_content', '101', { getDelta: text }));
}

beforeAll(async () => {
  await CometChatUIKit.init(
    new UIKitSettingsBuilder().setAppId('app').setRegion('us').setAuthKey('key').build()
  );
});

beforeEach(() => {
  sdk.history.mockReset().mockResolvedValue([]);
  sdk.thread.mockReset().mockResolvedValue([]);
  sdk.sendMessage.mockReset();
  sdk.getMessageDetails.mockReset().mockRejectedValue(new Error('not found'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CometChatAIAssistantChat props', () => {
  describe('the agent and the conversation', () => {
    it("user is the agent: the header, greeting, history and every message are that agent's", async () => {
      covers('CometChatAIAssistantChat.user', 'set');
      serverAccepts(101);
      await show({ user: agentUser(undefined, 'chef-bot', 'Chef Bot') });

      expect(within(banner()).getByText('Chef Bot')).toBeInTheDocument();
      expect(within(messageList()).getByText('Chef Bot')).toBeInTheDocument();
      expect(screen.queryByText('Trip Planner')).toBeNull();
      await waitFor(() => {
        expect(sdk.history).toHaveBeenCalledWith('chef-bot');
      });

      await send('What can I cook?');
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalled();
      });
      expect(sent().getReceiverId()).toBe('chef-bot');
    });

    it('parentMessageId opens that conversation and keeps replying in it', async () => {
      covers('CometChatAIAssistantChat.parentMessageId', 'set');
      sdk.thread.mockResolvedValue([
        textMessage(78, 'Day one: the Louvre', { from: agentUser(), parent: 77 }),
      ]);
      sdk.getMessageDetails.mockResolvedValue(textMessage(77, 'Plan a weekend in Paris'));
      serverAccepts(79);
      await show({ parentMessageId: 77 });

      expect(await findInList('Day one: the Louvre')).toBeInTheDocument();
      expect(within(messageList()).getByText('Plan a weekend in Paris')).toBeInTheDocument();
      expect(sdk.thread).toHaveBeenCalledWith(77, 'agent-1');
      expect(greeting()).toBeNull();

      await send('And day two?');
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalled();
      });
      expect(sent().getParentMessageId()).toBe(77);
    });

    it('without parentMessageId the chat opens on the greeting; the first message starts a conversation', async () => {
      covers('CometChatAIAssistantChat.parentMessageId', 'default');
      serverAccepts(101);
      await show();

      expect(greeting()).toBeInTheDocument();
      await send('Plan a weekend');
      await waitFor(() => {
        expect(sdk.sendMessage).toHaveBeenCalled();
      });
      expect(sent().getParentMessageId()).toBeFalsy();
      expect(sdk.thread).not.toHaveBeenCalled();
    });

    it('loadLastAgentConversation opens the latest conversation from the history', async () => {
      covers('CometChatAIAssistantChat.loadLastAgentConversation', 'true');
      sdk.history.mockResolvedValue([textMessage(55, 'Plan a weekend in Paris')]);
      sdk.thread.mockResolvedValue([
        textMessage(56, 'Day one: the Louvre', { from: agentUser(), parent: 55 }),
      ]);
      sdk.getMessageDetails.mockResolvedValue(textMessage(55, 'Plan a weekend in Paris'));
      await show({ loadLastAgentConversation: true });

      expect(await findInList('Day one: the Louvre')).toBeInTheDocument();
      expect(sdk.thread).toHaveBeenCalledWith(55, 'agent-1');
      expect(greeting()).toBeNull();
    });

    it('with loadLastAgentConversation off, or by default, the chat opens on the greeting', async () => {
      covers('CometChatAIAssistantChat.loadLastAgentConversation', 'false', 'default');
      sdk.history.mockResolvedValue([textMessage(55, 'Plan a weekend in Paris')]);
      for (const props of [{ loadLastAgentConversation: false }, {}]) {
        sdk.thread.mockClear();
        const view = await show(props);
        // The history has the past conversation, but it is not opened.
        expect(
          await screen.findByRole('option', { name: /Plan a weekend in Paris/ })
        ).toBeInTheDocument();
        expect(greeting()).toBeInTheDocument();
        expect(within(messageList()).queryByText('Plan a weekend in Paris')).toBeNull();
        expect(sdk.thread).not.toHaveBeenCalled();
        view.unmount();
      }
    });
  });

  describe('callbacks', () => {
    it('onSendButtonClick gets the message once the server has it', async () => {
      covers('CometChatAIAssistantChat.onSendButtonClick', 'called');
      serverAccepts(101);
      const onSendButtonClick = vi.fn();
      await show({ onSendButtonClick });

      await send('Plan a weekend');
      await waitFor(() => {
        expect(onSendButtonClick).toHaveBeenCalledTimes(1);
      });
      const message = onSendButtonClick.mock.calls[0]?.[0] as CometChat.TextMessage;
      expect(message.getId()).toBe(101);
      expect(message.getText()).toBe('Plan a weekend');
      expect(message.getReceiverId()).toBe('agent-1');
    });

    it('onError gets the error when the history fails to load and when a message fails to send', async () => {
      covers('CometChatAIAssistantChat.onError', 'called');
      const historyError = new CometChat.CometChatException({ code: 'ERR_HISTORY', message: 'down' });
      const sendError = new CometChat.CometChatException({ code: 'ERR_SEND', message: 'rejected' });
      sdk.history.mockRejectedValue(historyError);
      sdk.sendMessage.mockRejectedValue(sendError);
      const onError = vi.fn();
      await show({ onError });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(historyError);
      });
      await send('Plan a weekend');
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(sendError);
      });
    });

    it('showBackButton shows a back button that calls onBackButtonClicked', async () => {
      covers('CometChatAIAssistantChat.showBackButton', 'true');
      covers('CometChatAIAssistantChat.onBackButtonClicked', 'called');
      const onBackButtonClicked = vi.fn();
      await show({ showBackButton: true, onBackButtonClicked });
      fireEvent.click(within(banner()).getByRole('button', { name: 'Back' }));
      expect(onBackButtonClicked).toHaveBeenCalledTimes(1);
    });

    it('there is no back button when showBackButton is off, or by default', async () => {
      covers('CometChatAIAssistantChat.showBackButton', 'false', 'default');
      for (const props of [{ showBackButton: false }, {}]) {
        const view = await show({ ...props, onBackButtonClicked: vi.fn() });
        expect(within(banner()).queryByRole('button', { name: 'Back' })).toBeNull();
        view.unmount();
      }
    });
  });

  describe('header buttons', () => {
    it('hideChatHistory removes the history button', async () => {
      covers('CometChatAIAssistantChat.hideChatHistory', 'true');
      await show({ hideChatHistory: true });
      expect(within(banner()).queryByRole('button', { name: 'Chat History' })).toBeNull();
      expect(within(banner()).getByRole('button', { name: 'New Chat' })).toBeInTheDocument();
    });

    it('the history button opens the history sidebar when hideChatHistory is off, or by default', async () => {
      covers('CometChatAIAssistantChat.hideChatHistory', 'false', 'default');
      for (const props of [{ hideChatHistory: false }, {}]) {
        const view = await show(props);
        const toggle = within(banner()).getByRole('button', { name: 'Chat History' });
        const sidebar = view.container.querySelector('.cometchat-ai-assistant-chat__sidebar');
        expect(sidebar).not.toHaveClass('cometchat-ai-assistant-chat__sidebar--open');
        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(sidebar).toHaveClass('cometchat-ai-assistant-chat__sidebar--open');
        view.unmount();
      }
    });

    it('hideNewChat removes New Chat from the header and from the history sidebar', async () => {
      covers('CometChatAIAssistantChat.hideNewChat', 'true');
      await show({ hideNewChat: true });
      expect(screen.queryByRole('button', { name: 'New Chat' })).toBeNull();
      expect(within(banner()).getByRole('button', { name: 'Chat History' })).toBeInTheDocument();
    });

    it('New Chat is in the header and the sidebar, and leaves the open conversation; hideNewChat off or default', async () => {
      covers('CometChatAIAssistantChat.hideNewChat', 'false', 'default');
      sdk.thread.mockResolvedValue([
        textMessage(78, 'Day one: the Louvre', { from: agentUser(), parent: 77 }),
      ]);
      for (const props of [{ hideNewChat: false }, {}]) {
        const view = await show({ parentMessageId: 77, ...props });
        expect(screen.getAllByRole('button', { name: 'New Chat' })).toHaveLength(2);
        await findInList('Day one: the Louvre');
        fireEvent.click(within(banner()).getByRole('button', { name: 'New Chat' }));
        expect(await screen.findByText('I am here to assist you!')).toBeInTheDocument();
        expect(within(messageList()).queryByText('Day one: the Louvre')).toBeNull();
        view.unmount();
      }
    });
  });

  describe('suggested messages', () => {
    it("suggestedMessages shows those suggestions instead of the agent's; a picked one goes into the composer", async () => {
      covers('CometChatAIAssistantChat.suggestedMessages', 'set');
      await show({
        user: agentUser({ suggestedMessages: ['From the agent'] }),
        suggestedMessages: ['Find flights', 'Book a hotel'],
      });
      expect(screen.getByRole('button', { name: 'Find flights' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'From the agent' })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Book a hotel' }));
      await waitFor(() => {
        expect(composerText()).toBe('Book a hotel');
      });
    });

    it("by default the suggestions are the agent's own, if it has any", async () => {
      covers('CometChatAIAssistantChat.suggestedMessages', 'default');
      let view = await show({ user: agentUser({ suggestedMessages: ['From the agent'] }) });
      expect(screen.getByRole('button', { name: 'From the agent' })).toBeInTheDocument();
      view.unmount();
      view = await show();
      expect(
        view.container.querySelector('.cometchat-ai-assistant-chat__suggested-message-pill')
      ).toBeNull();
    });

    it('hideSuggestedMessages hides the suggestions', async () => {
      covers('CometChatAIAssistantChat.hideSuggestedMessages', 'true');
      await show({
        user: agentUser({ suggestedMessages: ['From the agent'] }),
        suggestedMessages: ['Find flights'],
        hideSuggestedMessages: true,
      });
      expect(screen.queryByRole('button', { name: 'Find flights' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'From the agent' })).toBeNull();
      expect(greeting()).toBeInTheDocument();
    });

    it('the suggestions show when hideSuggestedMessages is off, or by default', async () => {
      covers('CometChatAIAssistantChat.hideSuggestedMessages', 'false', 'default');
      for (const props of [{ hideSuggestedMessages: false }, {}]) {
        const view = await show({ suggestedMessages: ['Find flights'], ...props });
        expect(screen.getByRole('button', { name: 'Find flights' })).toBeInTheDocument();
        view.unmount();
      }
    });
  });

  describe('streaming', () => {
    it('streamingSpeed is how long each streamed chunk of the answer waits before it shows', async () => {
      covers('CometChatAIAssistantChat.streamingSpeed', 'set');
      const answer = await askAndWaitForAnswer({ streamingSpeed: 400 });
      streamFirstChunk('Day one: the Louvre');
      await act(() => vi.advanceTimersByTimeAsync(399));
      expect(within(answer).queryByText('Day one: the Louvre')).toBeNull();
      await act(() => vi.advanceTimersByTimeAsync(1));
      expect(within(answer).getByText('Day one: the Louvre')).toBeInTheDocument();
    });

    it('by default each streamed chunk waits 30 ms', async () => {
      covers('CometChatAIAssistantChat.streamingSpeed', 'default');
      const answer = await askAndWaitForAnswer();
      streamFirstChunk('Day one: the Louvre');
      await act(() => vi.advanceTimersByTimeAsync(29));
      expect(within(answer).queryByText('Day one: the Louvre')).toBeNull();
      await act(() => vi.advanceTimersByTimeAsync(1));
      expect(within(answer).getByText('Day one: the Louvre')).toBeInTheDocument();
    });

    it("aiAssistantTools runs the app's handler for a tool the agent calls, with the agent's arguments", async () => {
      covers('CometChatAIAssistantChat.aiAssistantTools', 'set');
      const openMap = vi.fn();
      const bookHotel = vi.fn();
      const aiAssistantTools = new CometChatAIAssistantTools({ open_map: openMap, book_hotel: bookHotel });
      await show({ aiAssistantTools });

      stream(aiEvent('run_started', 'run-1'));
      stream(aiEvent('tool_call_start', 'run-1', { getToolCallName: 'open_map' }));
      stream(aiEvent('tool_call_args', 'run-1', { getDelta: '{"city":' }));
      stream(aiEvent('tool_call_args', 'run-1', { getDelta: '"Paris"}' }));
      expect(openMap).not.toHaveBeenCalled();
      stream(aiEvent('tool_call_end', 'run-1'));
      expect(openMap).toHaveBeenCalledWith({ city: 'Paris' });
      expect(bookHotel).not.toHaveBeenCalled();
    });
  });

  describe('views', () => {
    it('className is added to the root; by default it has only the kit class', async () => {
      covers('CometChatAIAssistantChat.className', 'set', 'default');
      const root = (container: HTMLElement) =>
        container.querySelector('.cometchat-ai-assistant-chat__wrapper')?.parentElement;
      let view = await show({ className: 'travel-assistant' });
      expect(root(view.container)).toHaveClass('cometchat', 'travel-assistant');
      view.unmount();
      view = await show();
      expect(root(view.container)?.className).toBe('cometchat');
    });

    it('the empty chat image, greeting and intro views replace those parts of the greeting', async () => {
      covers('CometChatAIAssistantChat.emptyChatImageView', 'custom');
      covers('CometChatAIAssistantChat.emptyChatGreetingView', 'custom');
      covers('CometChatAIAssistantChat.emptyChatIntroMessageView', 'custom');
      await show({
        suggestedMessages: ['Find flights'],
        emptyChatImageView: <span>app logo</span>,
        emptyChatGreetingView: <span>Bonjour!</span>,
        emptyChatIntroMessageView: <span>I plan trips.</span>,
      });
      const list = within(messageList());
      expect(list.getByText('app logo')).toBeInTheDocument();
      expect(list.getByText('Bonjour!')).toBeInTheDocument();
      expect(list.getByText('I plan trips.')).toBeInTheDocument();
      expect(list.queryByRole('img', { name: 'AI Assistant' })).toBeNull();
      expect(list.queryByText('Trip Planner')).toBeNull();
      expect(greeting()).toBeNull();
      // The rest of the greeting stays.
      expect(list.getByRole('button', { name: 'Find flights' })).toBeInTheDocument();
    });

    it('emptyView replaces the whole greeting', async () => {
      covers('CometChatAIAssistantChat.emptyView', 'custom');
      await show({ suggestedMessages: ['Find flights'], emptyView: <p>Ask me about trips</p> });
      const list = within(messageList());
      expect(list.getByText('Ask me about trips')).toBeInTheDocument();
      expect(list.queryByRole('img', { name: 'AI Assistant' })).toBeNull();
      expect(greeting()).toBeNull();
      expect(list.queryByRole('button', { name: 'Find flights' })).toBeNull();
    });

    it('loadingView shows while a conversation loads, instead of the shimmer', async () => {
      covers('CometChatAIAssistantChat.loadingView', 'custom');
      sdk.thread.mockReturnValue(new Promise(() => undefined));
      await show({ parentMessageId: 77, loadingView: <p>Fetching your trip…</p> });
      expect(within(messageList()).getByText('Fetching your trip…')).toBeInTheDocument();
      expect(screen.queryByRole('status', { name: 'Loading messages' })).toBeNull();
    });

    it("errorView shows when a conversation can't be loaded, instead of the kit's error", async () => {
      covers('CometChatAIAssistantChat.errorView', 'custom');
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      sdk.thread.mockRejectedValue(new Error('down'));
      await show({ parentMessageId: 77, errorView: <p>Trip not found</p> });
      expect(await findInList('Trip not found')).toBeInTheDocument();
      expect(within(messageList()).queryByRole('button', { name: 'Retry' })).toBeNull();
    });

    it('headerItemView replaces the whole header', async () => {
      covers('CometChatAIAssistantChat.headerItemView', 'custom');
      await show({ headerItemView: <div>Trips header</div> });
      expect(screen.getByText('Trips header')).toBeInTheDocument();
      expect(screen.queryByRole('banner')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Chat History' })).toBeNull();
      expect(messageList()).toBeInTheDocument();
    });

    it('the header leading, title and subtitle views replace the avatar, name and status', async () => {
      covers('CometChatAIAssistantChat.headerLeadingView', 'custom');
      covers('CometChatAIAssistantChat.headerTitleView', 'custom');
      covers('CometChatAIAssistantChat.headerSubtitleView', 'custom');
      await show({
        headerLeadingView: <span>app avatar</span>,
        headerTitleView: <span>My travel agent</span>,
        headerSubtitleView: <span>Always on</span>,
      });
      const header = within(banner());
      expect(header.getByText('app avatar')).toBeInTheDocument();
      expect(header.getByText('My travel agent')).toBeInTheDocument();
      expect(header.getByText('Always on')).toBeInTheDocument();
      expect(header.queryByRole('img', { name: 'Trip Planner' })).toBeNull();
      expect(header.queryByText('Trip Planner')).toBeNull();
      expect(header.queryByText('Offline')).toBeNull();
      // The buttons stay.
      expect(header.getByRole('button', { name: 'Chat History' })).toBeInTheDocument();
    });

    it("headerTrailingView replaces the header's buttons", async () => {
      covers('CometChatAIAssistantChat.headerTrailingView', 'custom');
      await show({ headerTrailingView: <button type="button">Share trip</button> });
      const header = within(banner());
      expect(header.getByRole('button', { name: 'Share trip' })).toBeInTheDocument();
      expect(header.queryByRole('button', { name: 'New Chat' })).toBeNull();
      expect(header.queryByRole('button', { name: 'Chat History' })).toBeNull();
      expect(header.getByText('Trip Planner')).toBeInTheDocument();
    });

    it('headerAuxiliaryButtonView replaces the New Chat and history buttons', async () => {
      covers('CometChatAIAssistantChat.headerAuxiliaryButtonView', 'custom');
      await show({ headerAuxiliaryButtonView: <button type="button">Share trip</button> });
      const header = within(banner());
      expect(header.getByRole('button', { name: 'Share trip' })).toBeInTheDocument();
      expect(header.queryByRole('button', { name: 'New Chat' })).toBeNull();
      expect(header.queryByRole('button', { name: 'Chat History' })).toBeNull();
      expect(header.getByText('Trip Planner')).toBeInTheDocument();
    });
  });
});
