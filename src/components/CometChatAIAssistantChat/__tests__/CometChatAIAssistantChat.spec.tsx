/**
 * Unit tests for CometChatAIAssistantChat: how it wires the (mocked) header,
 * message list, composer and history sidebar, the greeting empty state, the
 * logged-in-user gate, SDK listeners, conversation threading (send / open from
 * history / new chat / delete) and the streaming-aware send button.
 */
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantChat } from '../CometChatAIAssistantChat';
import {
  getAIAssistantTools,
  getStreamSpeed,
  getStreamState,
  startStreamingMessage,
  stopStreamingMessage,
} from '../CometChatAIStreamingService';
import { CometChatAIAssistantTools } from '../ai.types';
import type { CometChatAIAssistantChatProps } from '../ai.types';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatEventsContextValue } from '../../../context/CometChatEvents.types';

type Props = Record<string, unknown>;
type Handlers = Record<string, (arg?: unknown) => void>;

const m = vi.hoisted(() => ({
  uikitUser: null as unknown,
  getLoggedinUser: null as unknown as ReturnType<typeof vi.fn>,
  addLoginListener: null as unknown as ReturnType<typeof vi.fn>,
  removeLoginListener: null as unknown as ReturnType<typeof vi.fn>,
  addAIAssistantListener: null as unknown as ReturnType<typeof vi.fn>,
  removeAIAssistantListener: null as unknown as ReturnType<typeof vi.fn>,
  loginHandlers: {} as Handlers,
  aiHandlers: {} as Handlers,
  header: null as Props | null,
  list: null as Props | null,
  listMounts: 0,
  composer: null as Props | null,
  composerMounts: 0,
  history: null as Props | null,
  addMessage: null as unknown as ReturnType<typeof vi.fn>,
  composerCtx: {} as Record<string, unknown>,
}));

vi.mock('@cometchat/chat-sdk-javascript', async importOriginal => {
  const actual = await importOriginal<typeof import('@cometchat/chat-sdk-javascript')>();
  const patch = (name: string, value: unknown) => {
    Object.defineProperty(actual.CometChat, name, { configurable: true, writable: true, value });
  };
  patch('getLoggedinUser', (...a: unknown[]) => (m.getLoggedinUser as (...x: unknown[]) => unknown)(...a));
  patch('addLoginListener', (id: string, l: Handlers) => {
    m.loginHandlers = l;
    m.addLoginListener(id);
  });
  patch('removeLoginListener', (id: string) => m.removeLoginListener(id));
  patch('addAIAssistantListener', (id: string, l: Handlers) => {
    m.aiHandlers = l;
    m.addAIAssistantListener(id);
  });
  patch('removeAIAssistantListener', (id: string) => m.removeAIAssistantListener(id));
  const HandlerBag = function (this: object, h: Handlers) {
    Object.assign(this, h);
  };
  patch('LoginListener', HandlerBag);
  patch('AIAssistantListener', HandlerBag);
  return actual;
});

vi.mock('../../../CometChatUIKit/CometChatUIKit', () => ({
  CometChatUIKit: { getLoggedInUser: () => m.uikitUser },
}));

vi.mock('../../../context/locale/LocaleContext', () => ({
  useLocale: () => ({ getLocalizedString: (key: string) => key }),
}));

vi.mock('../../CometChatMessageHeader/CometChatMessageHeader', () => ({
  CometChatMessageHeader: (props: Props) => {
    m.header = props;
    return <div data-testid="header">{props.auxiliaryButtonView as React.ReactNode}</div>;
  },
}));

vi.mock('../../CometChatMessageList/CometChatMessageList', () => ({
  CometChatMessageList: (props: Props) => {
    m.list = props;
    useEffect(() => {
      m.listMounts += 1;
    }, []);
    return (
      <div data-testid="message-list">
        {props.parentMessageId === undefined ? (props.emptyView as React.ReactNode) : null}
      </div>
    );
  },
}));

vi.mock('../../CometChatMessageComposer/CometChatMessageComposer', async () => {
  const { CometChatMessageComposerContext } = await import(
    '../../CometChatMessageComposer/CometChatMessageComposer.context'
  );
  return {
    CometChatMessageComposer: (props: Props) => {
      m.composer = props;
      useEffect(() => {
        m.composerMounts += 1;
      }, []);
      return (
        <div data-testid="composer">
          <textarea aria-label="composer input" />
          <CometChatMessageComposerContext.Provider value={m.composerCtx as never}>
            {props.sendButtonView as React.ReactNode}
          </CometChatMessageComposerContext.Provider>
        </div>
      );
    },
  };
});

vi.mock('../CometChatAIAssistantChatHistory', () => ({
  CometChatAIAssistantChatHistory: forwardRef((props: Props, ref) => {
    m.history = props;
    useImperativeHandle(ref, () => ({ addMessage: m.addMessage }));
    return (
      <button type="button" onClick={props.onClose as () => void}>
        history close
      </button>
    );
  }),
}));

const ME = new CometChat.User('me');
const AGENT_UID = 'agent-uid';

function makeAgent(metadata?: Record<string, unknown>): CometChat.User {
  const u = new CometChat.User(AGENT_UID);
  u.setName('Trip Planner');
  if (metadata) u.setMetadata(metadata);
  return u;
}
const AGENT = makeAgent();

function textMsg(
  id: number,
  { to = AGENT_UID, from = ME, parent }: { to?: string; from?: CometChat.User; parent?: number } = {}
): CometChat.TextMessage {
  const msg = new CometChat.TextMessage(to, `msg ${String(id)}`, 'user');
  msg.setId(id);
  msg.setSender(from);
  if (parent) msg.setParentMessageId(parent);
  return msg;
}

function renderChat(props: Partial<CometChatAIAssistantChatProps> = {}) {
  const publish = vi.fn();
  const events = { subscribe: () => () => undefined, publish } as CometChatEventsContextValue;
  const utils = render(
    <CometChatEventsContext.Provider value={events}>
      <CometChatAIAssistantChat user={AGENT} {...props} />
    </CometChatEventsContext.Provider>
  );
  return { ...utils, publish };
}

const sendButton = () => screen.getByRole('button', { name: /accessibility_(send_message|stop_generating)/ });
const historyToggle = () => screen.getByRole('button', { name: 'ai_assistant_chat_history_title' });
const newChatButton = () => screen.getByRole('button', { name: 'ai_assistant_chat_new_chat' });
const call = (fn: unknown, ...args: unknown[]) => {
  act(() => {
    (fn as (...a: unknown[]) => void)(...args);
  });
};

describe('CometChatAIAssistantChat', () => {
  beforeEach(() => {
    m.uikitUser = ME;
    m.getLoggedinUser = vi.fn().mockResolvedValue(ME);
    m.addLoginListener = vi.fn();
    m.removeLoginListener = vi.fn();
    m.addAIAssistantListener = vi.fn();
    m.removeAIAssistantListener = vi.fn();
    m.addMessage = vi.fn();
    m.loginHandlers = {};
    m.aiHandlers = {};
    m.header = m.list = m.composer = m.history = null;
    m.listMounts = m.composerMounts = 0;
    m.composerCtx = {
      sendMessage: vi.fn(),
      editMessage: vi.fn(),
      canSend: true,
      isInEditMode: false,
    };
    stopStreamingMessage(AGENT_UID);
  });

  describe('logged-in user gate', () => {
    it('renders the message list for the cached logged-in user', () => {
      renderChat();
      expect(screen.getByTestId('message-list')).toBeInTheDocument();
      expect(m.list?.loggedInUser).toBe(ME);
      expect(m.getLoggedinUser).not.toHaveBeenCalled();
    });

    it('falls back to the SDK when the UI Kit has no cached user', async () => {
      m.uikitUser = null;
      renderChat();
      expect(screen.queryByTestId('message-list')).toBeNull();
      expect(await screen.findByTestId('message-list')).toBeInTheDocument();
      expect(m.list?.loggedInUser).toBe(ME);
    });

    it('waits for a login that completes after mount, and drops the list on logout', async () => {
      m.uikitUser = null;
      m.getLoggedinUser = vi.fn().mockResolvedValue(null);
      renderChat();
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.queryByTestId('message-list')).toBeNull();
      // Header and composer stay usable while waiting.
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('composer')).toBeInTheDocument();

      const late = new CometChat.User('late');
      call(m.loginHandlers.loginSuccess, late);
      expect(m.list?.loggedInUser).toBe(late);

      call(m.loginHandlers.logoutSuccess);
      expect(screen.queryByTestId('message-list')).toBeNull();
    });

    it('survives a failed user lookup', async () => {
      m.uikitUser = null;
      m.getLoggedinUser = vi.fn().mockRejectedValue(new Error('not initialised'));
      renderChat();
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.queryByTestId('message-list')).toBeNull();
      expect(screen.getByTestId('composer')).toBeInTheDocument();
    });

    it('registers its SDK listeners once and removes the same ids on unmount', () => {
      const { unmount } = renderChat();
      const loginId = m.addLoginListener.mock.calls[0]?.[0] as string;
      const aiId = m.addAIAssistantListener.mock.calls[0]?.[0] as string;
      expect(m.addLoginListener).toHaveBeenCalledTimes(1);
      expect(m.addAIAssistantListener).toHaveBeenCalledTimes(1);
      unmount();
      expect(m.removeLoginListener).toHaveBeenCalledWith(loginId);
      expect(m.removeAIAssistantListener).toHaveBeenCalledWith(aiId);
    });
  });

  describe('configuration', () => {
    it('routes AI assistant events into this agent’s stream', () => {
      renderChat();
      call(m.aiHandlers.onAIAssistantEventReceived, {
        getType: () => 'run_started',
        getMessageId: () => 'run-9',
      });
      expect(getStreamState(AGENT_UID)).toMatchObject({ hasStarted: true, currentRunId: 'run-9' });
      expect(sendButton()).toHaveAttribute('aria-label', 'accessibility_stop_generating');
    });

    it('applies streaming speed (default 30) and registers assistant tools', () => {
      const tools = new CometChatAIAssistantTools({ open: vi.fn() });
      const { rerender } = renderChat({ streamingSpeed: 5, aiAssistantTools: tools });
      expect(getStreamSpeed()).toBe(5);
      expect(getAIAssistantTools()).toBe(tools);
      rerender(<CometChatAIAssistantChat user={AGENT} />);
      expect(getStreamSpeed()).toBe(30);
    });

    it('adds the caller className to the root', () => {
      const { container } = renderChat({ className: 'my-assistant' });
      expect(container.firstElementChild).toHaveClass('cometchat', 'my-assistant');
    });
  });

  describe('message list wiring', () => {
    it('shows the agent chat with every message action hidden', () => {
      renderChat();
      expect(m.list).toMatchObject({
        user: AGENT,
        isAgentChat: true,
        loadLastAgentConversation: false,
        disableSoundForMessages: true,
        hideReplyOption: true,
        hideCopyMessageOption: true,
        hideDeleteMessageOption: true,
        hideEditMessageOption: true,
        hideReactionOption: true,
        hideReplyInThreadOption: true,
        hideMessageInfoOption: true,
        hideTranslateMessageOption: true,
        hideFlagMessageOption: true,
        hideDateSeparator: true,
        hideStickyDate: true,
        textFormatters: [],
      });
      expect(m.list).not.toHaveProperty('parentMessageId');
    });

    it('forwards custom list views and the error callback', () => {
      const onError = vi.fn();
      const loadingView = <p>loading</p>;
      const errorView = <p>error</p>;
      const emptyView = <p>custom empty</p>;
      renderChat({ onError, loadingView, errorView, emptyView });
      expect(m.list).toMatchObject({ onError, loadingView, errorView, emptyView });
      expect(m.history?.onError).toBe(onError);
      expect(screen.getByText('custom empty')).toBeInTheDocument();
    });

    it('opens straight into a given thread', () => {
      renderChat({ parentMessageId: 77 });
      expect(m.list?.parentMessageId).toBe(77);
      expect(m.composer?.parentMessageId).toBe(77);
      expect(m.history?.loadLastAgentConversation).toBe(false);
    });

    it('follows a parentMessageId prop that changes later', () => {
      const { rerender } = renderChat({ parentMessageId: 1 });
      rerender(<CometChatAIAssistantChat user={AGENT} parentMessageId={2} />);
      expect(m.list?.parentMessageId).toBe(2);
      expect(m.composer?.parentMessageId).toBe(2);
    });
  });

  describe('greeting empty state', () => {
    it('defaults to the agent name and a generic intro, with no suggestions', () => {
      const { container } = renderChat();
      expect(screen.getByText('Trip Planner')).toBeInTheDocument();
      expect(screen.getByText('I am here to assist you!')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'alt_ai_assistant' })).toBeInTheDocument();
      expect(
        container.querySelector('.cometchat-ai-assistant-chat__empty-state-suggested-messages')
      ).toBeNull();
    });

    it('uses greeting, intro and suggestions from the agent metadata', () => {
      render(
        <CometChatAIAssistantChat
          user={makeAgent({
            greetingMessage: 'Hi there!',
            introductoryMessage: 'I plan trips.',
            suggestedMessages: ['Plan a weekend'],
          })}
        />
      );
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
      expect(screen.getByText('I plan trips.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Plan a weekend' })).toBeInTheDocument();
    });

    it('prefers caller suggestions over metadata ones, and sends one into the composer on click', () => {
      const SUGGESTIONS = ['Find flights', 'Book a hotel'];
      const agent = makeAgent({ suggestedMessages: ['from metadata'] });
      const publish = vi.fn();
      render(
        <CometChatEventsContext.Provider
          value={{ subscribe: () => () => undefined, publish } as CometChatEventsContextValue}
        >
          <CometChatAIAssistantChat user={agent} suggestedMessages={SUGGESTIONS} />
        </CometChatEventsContext.Provider>
      );
      expect(screen.queryByText('from metadata')).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Book a hotel' }));
      expect(publish).toHaveBeenCalledWith({ type: 'ui:compose/text', text: 'Book a hotel' });
    });

    it('hides suggestions on request', () => {
      renderChat({ suggestedMessages: ['Find flights'], hideSuggestedMessages: true });
      expect(screen.queryByRole('button', { name: 'Find flights' })).toBeNull();
    });

    it('accepts custom image, greeting and intro views', () => {
      renderChat({
        emptyChatImageView: <span>my logo</span>,
        emptyChatGreetingView: <span>my greeting</span>,
        emptyChatIntroMessageView: <span>my intro</span>,
      });
      expect(screen.getByText('my logo')).toBeInTheDocument();
      expect(screen.getByText('my greeting')).toBeInTheDocument();
      expect(screen.getByText('my intro')).toBeInTheDocument();
      expect(screen.queryByText('Trip Planner')).toBeNull();
      expect(screen.queryByRole('img', { name: 'alt_ai_assistant' })).toBeNull();
    });
  });

  describe('header', () => {
    it('shows the agent header without call buttons or back button by default', () => {
      renderChat();
      expect(m.header).toMatchObject({
        user: AGENT,
        hideBackButton: true,
        hideVoiceCallButton: true,
        hideVideoCallButton: true,
      });
      expect(m.header).not.toHaveProperty('onBack');
      expect(newChatButton()).toBeInTheDocument();
      expect(historyToggle()).toBeInTheDocument();
    });

    it('shows a back button wired to onBackButtonClicked and forwards custom header views', () => {
      const onBack = vi.fn();
      const views = {
        headerLeadingView: <i>lead</i>,
        headerTitleView: <i>title</i>,
        headerSubtitleView: <i>sub</i>,
        headerTrailingView: <i>trail</i>,
      };
      renderChat({ showBackButton: true, onBackButtonClicked: onBack, ...views });
      expect(m.header).toMatchObject({
        hideBackButton: false,
        onBack,
        leadingView: views.headerLeadingView,
        titleView: views.headerTitleView,
        subtitleView: views.headerSubtitleView,
        trailingView: views.headerTrailingView,
      });
    });

    it('can hide the New Chat and History buttons', () => {
      renderChat({ hideNewChat: true, hideChatHistory: true });
      expect(screen.queryByRole('button', { name: 'ai_assistant_chat_new_chat' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'ai_assistant_chat_history_title' })).toBeNull();
      expect(m.history?.hideNewChat).toBe(true);
    });

    it('replaces the auxiliary buttons or the whole header with caller views', () => {
      const first = renderChat({ headerAuxiliaryButtonView: <span>aux</span> });
      expect(screen.getByText('aux')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'ai_assistant_chat_new_chat' })).toBeNull();
      first.unmount();

      m.header = null;
      renderChat({ headerItemView: <span>whole header</span> });
      expect(screen.getByText('whole header')).toBeInTheDocument();
      expect(screen.queryByTestId('header')).toBeNull();
      expect(m.header).toBeNull();
    });
  });

  describe('history sidebar', () => {
    it('toggles open and closed from the header, the overlay and the sidebar itself', () => {
      const { container } = renderChat();
      const sidebar = container.querySelector('.cometchat-ai-assistant-chat__sidebar');
      const overlay = () => container.querySelector('.cometchat-ai-assistant-chat__sidebar-overlay');

      expect(historyToggle()).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(historyToggle());
      expect(historyToggle()).toHaveAttribute('aria-expanded', 'true');
      expect(sidebar).toHaveClass('cometchat-ai-assistant-chat__sidebar--open');

      const openOverlay = overlay();
      expect(openOverlay).not.toBeNull();
      if (openOverlay) fireEvent.click(openOverlay);
      expect(sidebar).not.toHaveClass('cometchat-ai-assistant-chat__sidebar--open');
      expect(overlay()).toBeNull();

      fireEvent.click(historyToggle());
      fireEvent.click(screen.getByRole('button', { name: 'history close' }));
      expect(historyToggle()).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(historyToggle());
      fireEvent.click(historyToggle());
      expect(historyToggle()).toHaveAttribute('aria-expanded', 'false');
    });

    it('moves focus into the sidebar on open and back to the toggle on close', async () => {
      renderChat();
      fireEvent.click(historyToggle());
      await waitFor(() => {
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'history close' }));
      });
      fireEvent.click(screen.getByRole('button', { name: 'history close' }));
      expect(document.activeElement).toBe(historyToggle());
    });

    it('opening a past conversation shows its thread, threads the composer and closes the sidebar', () => {
      renderChat();
      fireEvent.click(historyToggle());
      const mountsBefore = m.listMounts;

      call(m.history?.onMessageClick, textMsg(42));
      expect(m.list?.parentMessageId).toBe(42);
      expect(m.composer?.parentMessageId).toBe(42);
      expect(m.listMounts).toBe(mountsBefore + 1);
      expect(historyToggle()).toHaveAttribute('aria-expanded', 'false');
    });

    it('opening a conversation abandons any answer still streaming', () => {
      renderChat();
      act(() => {
        startStreamingMessage(AGENT_UID, 1);
      });
      call(m.history?.onMessageClick, textMsg(42));
      expect(getStreamState(AGENT_UID).hasStarted).toBe(false);
    });

    it('passes loadLastAgentConversation to the list and history until history reports empty', () => {
      renderChat({ loadLastAgentConversation: true });
      expect(m.list?.loadLastAgentConversation).toBe(true);
      expect(m.history?.loadLastAgentConversation).toBe(true);
      call(m.history?.onEmpty);
      expect(m.list?.loadLastAgentConversation).toBe(false);
    });

    it('the history New Chat row resets to the greeting and closes the sidebar', () => {
      renderChat();
      call(m.history?.onMessageClick, textMsg(42));
      fireEvent.click(historyToggle());
      call(m.history?.onNewChatClick);
      expect(m.list).not.toHaveProperty('parentMessageId');
      expect(m.composer).not.toHaveProperty('parentMessageId');
      expect(historyToggle()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByText('Trip Planner')).toBeInTheDocument();
    });

    it('deleting the open conversation resets to a new chat; deleting another one does not', () => {
      renderChat();
      call(m.history?.onMessageClick, textMsg(42));

      call(m.history?.onNewChatClick, textMsg(7));
      expect(m.list?.parentMessageId).toBe(42);

      call(m.history?.onNewChatClick, textMsg(42));
      expect(m.list).not.toHaveProperty('parentMessageId');
      expect(m.composer).not.toHaveProperty('parentMessageId');
    });

    it('deleting a conversation while none is open leaves the new chat alone', () => {
      renderChat();
      const mountsBefore = m.listMounts;
      call(m.history?.onNewChatClick, textMsg(7));
      expect(m.listMounts).toBe(mountsBefore);
    });
  });

  describe('sending and threading', () => {
    it('the first message starts a thread, is added to history and is reported to the caller', () => {
      const onSendButtonClick = vi.fn();
      renderChat({ onSendButtonClick });
      const first = textMsg(100);
      call(m.composer?.onSendButtonClick, first);

      expect(m.composer?.parentMessageId).toBe(100);
      expect(m.addMessage).toHaveBeenCalledWith(first);
      expect(onSendButtonClick).toHaveBeenCalledWith(first);
      // The list keeps showing the live conversation rather than re-fetching a thread.
      expect(m.list).not.toHaveProperty('parentMessageId');
    });

    it('follow-up replies stay in the same thread and are not re-added to history', () => {
      renderChat();
      call(m.composer?.onSendButtonClick, textMsg(100));
      call(m.composer?.onSendButtonClick, textMsg(101, { parent: 100 }));
      expect(m.composer?.parentMessageId).toBe(100);
      expect(m.addMessage).toHaveBeenCalledTimes(1);
    });

    it('ignores messages for another conversation', () => {
      renderChat();
      call(m.composer?.onSendButtonClick, textMsg(100, { to: 'someone-else' }));
      expect(m.composer).not.toHaveProperty('parentMessageId');
      expect(m.addMessage).not.toHaveBeenCalled();
    });

    it('threads, but does not list in history, a top-level message not sent by the logged-in user', () => {
      renderChat();
      call(m.composer?.onSendButtonClick, textMsg(100, { from: new CometChat.User('ghost') }));
      expect(m.composer?.parentMessageId).toBe(100);
      expect(m.addMessage).not.toHaveBeenCalled();
    });

    it('New Chat drops the thread, remounts list and composer, and stops streaming', () => {
      renderChat();
      call(m.composer?.onSendButtonClick, textMsg(100));
      act(() => {
        startStreamingMessage(AGENT_UID, 100);
      });
      const listMounts = m.listMounts;
      const composerMounts = m.composerMounts;

      fireEvent.click(newChatButton());
      expect(m.composer).not.toHaveProperty('parentMessageId');
      expect(m.listMounts).toBe(listMounts + 1);
      expect(m.composerMounts).toBe(composerMounts + 1);
      expect(getStreamState(AGENT_UID).hasStarted).toBe(false);

      // The next message starts a fresh thread.
      call(m.composer?.onSendButtonClick, textMsg(200));
      expect(m.composer?.parentMessageId).toBe(200);
    });
  });

  describe('composer and send button', () => {
    it('configures a plain multiline composer and forwards errors', () => {
      const onError = vi.fn();
      renderChat({ onError });
      expect(m.composer).toMatchObject({
        user: AGENT,
        layout: 'multiline',
        placeholder: 'ai_assistant_chat_composer_placeholder',
        hideAttachmentButton: true,
        hideEmojiKeyboardButton: true,
        hideVoiceRecordingButton: true,
        hideStickersButton: true,
        hideAIButton: true,
        disableMentions: true,
        disableTypingEvents: true,
      });
      const err = new CometChat.CometChatException({ code: 'X', message: 'x' });
      call(m.composer?.onError, err);
      expect(onError).toHaveBeenCalledWith(err);
    });

    it('omits the composer error callback when the caller has none', () => {
      renderChat();
      expect(m.composer).not.toHaveProperty('onError');
    });

    it('sends on click, Enter and Space when idle', () => {
      renderChat();
      const btn = sendButton();
      expect(btn).toHaveClass('cometchat-ai-assistant-chat__send-button-view--active');
      expect(btn).toHaveAttribute('aria-disabled', 'false');
      fireEvent.click(btn);
      fireEvent.keyDown(btn, { key: 'Enter' });
      fireEvent.keyDown(btn, { key: ' ' });
      fireEvent.keyDown(btn, { key: 'a' });
      expect(m.composerCtx.sendMessage).toHaveBeenCalledTimes(3);
    });

    it('is not highlighted when there is nothing to send', () => {
      m.composerCtx.canSend = false;
      renderChat();
      expect(sendButton()).not.toHaveClass('cometchat-ai-assistant-chat__send-button-view--active');
    });

    it('saves an edit instead of sending while editing', () => {
      m.composerCtx.isInEditMode = true;
      renderChat();
      fireEvent.click(sendButton());
      expect(m.composerCtx.editMessage).toHaveBeenCalledTimes(1);
      expect(m.composerCtx.sendMessage).not.toHaveBeenCalled();
    });

    it('locks sending and typing while an answer streams, and unlocks when it finishes', () => {
      const { container } = renderChat();
      act(() => {
        startStreamingMessage(AGENT_UID, 1);
      });

      const btn = sendButton();
      expect(btn).toHaveAttribute('aria-label', 'accessibility_stop_generating');
      expect(btn).toHaveAttribute('aria-disabled', 'true');
      expect(btn).toHaveAttribute('tabindex', '-1');
      expect(btn).not.toHaveClass('cometchat-ai-assistant-chat__send-button-view--active');
      fireEvent.click(btn);
      fireEvent.keyDown(btn, { key: 'Enter' });
      expect(m.composerCtx.sendMessage).not.toHaveBeenCalled();

      expect(
        container.querySelector('.cometchat-ai-assistant-chat__message-composer-view--disabled')
      ).not.toBeNull();
      const typed = fireEvent.keyDown(screen.getByLabelText('composer input'), { key: 'h' });
      expect(typed).toBe(false);

      call(m.aiHandlers.onAIAssistantEventReceived, {
        getType: () => 'run_finished',
        getMessageId: () => '1',
      });
      expect(sendButton()).toHaveAttribute('aria-disabled', 'false');
      expect(fireEvent.keyDown(screen.getByLabelText('composer input'), { key: 'h' })).toBe(true);
      fireEvent.click(sendButton());
      expect(m.composerCtx.sendMessage).toHaveBeenCalledTimes(1);
    });
  });
});
