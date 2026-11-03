// AI footer: conversation starters, smart replies (delayed, keyword-gated) and the event-driven summary panel.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageListAIFooter } from '../CometChatMessageListAIFooter';
import { CometChatMessageListProvider } from '../CometChatMessageList.context';
import type { CometChatUseMessageListReturn } from '../CometChatMessageList.types';
import { initialMessageListState } from '../CometChatMessageList.types';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type {
  CometChatEvent,
  CometChatEventsContextValue,
  CometChatUIEvent,
} from '../../../context/CometChatEvents.types';
import type { CometChatFetchState } from '../../../types';
import { buildGroup, buildMediaMessage, buildUser } from '../../../testing/mock-builders';
import { buildMockMessageListContext } from './helpers/mockMessageListContext';

const sdk = vi.hoisted(() => {
  class TextMessage {
    constructor(
      private readonly text: string,
      private readonly sender: unknown
    ) {}
    getText(): string {
      return this.text;
    }
    getSender(): unknown {
      return this.sender;
    }
  }
  return {
    TextMessage,
    getSmartReplies: vi.fn<(id: string, type: string) => Promise<unknown>>(),
    getConversationStarter: vi.fn<(id: string, type: string) => Promise<string[]>>(),
    getConversationSummary:
      vi.fn<(id: string, type: string, configuration?: object) => Promise<unknown>>(),
  };
});

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
    TextMessage: sdk.TextMessage,
    getSmartReplies: sdk.getSmartReplies,
    getConversationStarter: sdk.getConversationStarter,
    getConversationSummary: sdk.getConversationSummary,
    getLoggedinUser: () => Promise.resolve(null),
  },
}));

type Options = CometChatUseMessageListReturn['options'];

const BASE_OPTIONS: Options = buildMockMessageListContext().options;
const STARTERS_ON: Options = {
  ...BASE_OPTIONS,
  showConversationStarters: true,
};
const REPLIES_ON: Options = { ...BASE_OPTIONS, showSmartReplies: true };
const REPLIES_ANY: Options = { ...REPLIES_ON, smartRepliesKeywords: [] };
const REPLIES_URGENT: Options = {
  ...REPLIES_ON,
  smartRepliesKeywords: ['urgent'],
};
const REPLIES_QUESTION_ONLY: Options = {
  ...REPLIES_ON,
  smartRepliesKeywords: ['?'],
};

const ME = buildUser({ uid: 'me', name: 'Me' });
const BOB = buildUser({ uid: 'bob', name: 'Bob' });
const OTHER = buildUser({ uid: 'carol', name: 'Carol' });
const TEAM = buildGroup({ guid: 'team', name: 'Team' });
const LOGGED_IN = ME as unknown as CometChat.User;
const NO_MESSAGES: CometChat.BaseMessage[] = [];

function incoming(text: string, from: unknown = BOB): CometChat.BaseMessage {
  return new sdk.TextMessage(text, from) as unknown as CometChat.BaseMessage;
}

function outgoing(text: string): CometChat.BaseMessage {
  return incoming(text, ME);
}

interface Scenario {
  options?: Options;
  messages?: CometChat.BaseMessage[];
  fetchState?: CometChatFetchState;
  user?: CometChat.User;
  group?: CometChat.Group;
}

function createBus() {
  const handlers = new Set<(event: CometChatEvent) => void>();
  const publish = vi.fn<(event: CometChatUIEvent) => void>();
  const value: CometChatEventsContextValue = {
    subscribe: handler => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    publish,
  };
  const emit = (event: CometChatEvent) => {
    act(() => {
      handlers.forEach(h => {
        h(event);
      });
    });
  };
  return { value, publish, emit };
}

function setup(initial: Scenario) {
  const bus = createBus();
  const tree = (s: Scenario) => (
    <CometChatEventsContext.Provider value={bus.value}>
      <CometChatMessageListProvider
        value={buildMockMessageListContext({
          options: s.options ?? BASE_OPTIONS,
          allMessages: s.messages ?? NO_MESSAGES,
          loggedInUser: LOGGED_IN,
          user: 'group' in s ? undefined : (s.user ?? (BOB as unknown as CometChat.User)),
          group: s.group,
          state: {
            ...initialMessageListState,
            fetchState: s.fetchState ?? 'loaded',
          },
        })}
      >
        <CometChatMessageListAIFooter />
      </CometChatMessageListProvider>
    </CometChatEventsContext.Provider>
  );
  const utils = render(tree({ ...initial, fetchState: 'loading', messages: NO_MESSAGES }));
  const update = (s: Scenario) => {
    utils.rerender(tree(s));
  };
  update(initial);
  return { ...utils, ...bus, update };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  sdk.getSmartReplies.mockResolvedValue({
    positive: 'Sounds good',
    neutral: 'Maybe',
    negative: ' ',
  });
  sdk.getConversationStarter.mockResolvedValue(['Hi there!', 'How was your day?']);
  sdk.getConversationSummary.mockResolvedValue('You discussed the launch plan.');
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('CometChatMessageListAIFooter — idle', () => {
  it('renders nothing when no AI feature is active', () => {
    const { container } = setup({ messages: [incoming('how?')] });
    expect(container).toBeEmptyDOMElement();
  });
});

describe('CometChatMessageListAIFooter — conversation starters', () => {
  it('offers starters for an empty one-to-one conversation and fetches them for the user', async () => {
    setup({ options: STARTERS_ON, fetchState: 'empty' });

    const starters = await screen.findByRole('group', {
      name: 'Conversation starters',
    });
    expect(await within(starters).findByRole('button', { name: 'Hi there!' })).toBeInTheDocument();
    expect(within(starters).getByRole('button', { name: 'How was your day?' })).toBeInTheDocument();
    expect(sdk.getConversationStarter).toHaveBeenCalledWith('bob', 'user');
  });

  it('fetches starters for a group conversation by its guid', async () => {
    setup({
      options: STARTERS_ON,
      fetchState: 'empty',
      group: TEAM as unknown as CometChat.Group,
    });
    await screen.findByRole('button', { name: 'Hi there!' });
    expect(sdk.getConversationStarter).toHaveBeenCalledWith('team', 'group');
  });

  it('shows no starter buttons and skips the SDK when there is no conversation target', async () => {
    setup({ options: STARTERS_ON, fetchState: 'empty', group: undefined });
    expect(screen.getByRole('group', { name: 'Conversation starters' })).toBeInTheDocument();
    await flush();
    expect(screen.queryByRole('button')).toBeNull();
    expect(sdk.getConversationStarter).not.toHaveBeenCalled();
  });

  it('sends a picked starter to the composer and hides the starters', async () => {
    const { publish } = setup({ options: STARTERS_ON, fetchState: 'empty' });

    fireEvent.click(await screen.findByRole('button', { name: 'How was your day?' }));

    expect(publish).toHaveBeenCalledWith({
      type: 'ui:compose/text',
      text: 'How was your day?',
    });
    expect(screen.queryByRole('group', { name: 'Conversation starters' })).toBeNull();
  });

  it('hides the starters once the conversation has messages', async () => {
    const { update } = setup({ options: STARTERS_ON, fetchState: 'empty' });
    await screen.findByRole('group', { name: 'Conversation starters' });

    update({
      options: STARTERS_ON,
      fetchState: 'loaded',
      messages: [outgoing('hello')],
    });

    expect(screen.queryByRole('group', { name: 'Conversation starters' })).toBeNull();
  });

  it('hides the starters when the feature is switched off', async () => {
    const { update } = setup({ options: STARTERS_ON, fetchState: 'empty' });
    await screen.findByRole('group', { name: 'Conversation starters' });

    update({ options: BASE_OPTIONS, fetchState: 'empty' });

    expect(screen.queryByRole('group', { name: 'Conversation starters' })).toBeNull();
  });

  it('does not offer starters while the list is still loading', () => {
    setup({ options: STARTERS_ON, fetchState: 'loading' });
    expect(screen.queryByRole('group', { name: 'Conversation starters' })).toBeNull();
  });

  // Known issue: the "reset panels on conversation change" effect runs after the starters effect on mount and wipes it, so a footer mounted into an already-empty conversation never shows starters.
  it.fails('offers starters when mounted into a conversation that is already empty', async () => {
    render(
      <CometChatMessageListProvider
        value={buildMockMessageListContext({
          options: STARTERS_ON,
          allMessages: NO_MESSAGES,
          loggedInUser: LOGGED_IN,
          user: BOB as unknown as CometChat.User,
          state: { ...initialMessageListState, fetchState: 'empty' },
        })}
      >
        <CometChatMessageListAIFooter />
      </CometChatMessageListProvider>
    );
    expect(await screen.findByRole('group', { name: 'Conversation starters' })).toBeInTheDocument();
  });
});

describe('CometChatMessageListAIFooter — smart replies', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  async function waitForDelay(ms = 10000) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  }

  it('suggests replies only after the delay for a received question', async () => {
    const { update } = setup({
      options: REPLIES_ON,
      messages: [outgoing('hey')],
    });
    update({
      options: REPLIES_ON,
      messages: [outgoing('hey'), incoming('How are you')],
    });

    await waitForDelay(9999);
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();

    await waitForDelay(1);
    const panel = screen.getByRole('region', { name: 'Suggest a reply' });
    expect(within(panel).getByRole('button', { name: 'Sounds good' })).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Maybe' })).toBeInTheDocument();
    expect(within(panel).getAllByRole('button')).toHaveLength(3);
    expect(sdk.getSmartReplies).toHaveBeenCalledWith('bob', 'user');
  });

  it('triggers on a question mark and matches keywords case-insensitively', async () => {
    setup({ options: REPLIES_ON, messages: [incoming('Lunch at noon?')] });
    await waitForDelay();
    expect(screen.getByRole('region', { name: 'Suggest a reply' })).toBeInTheDocument();
  });

  it('ignores received messages without a keyword', async () => {
    setup({ options: REPLIES_ON, messages: [incoming('see you tomorrow')] });
    await waitForDelay();
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('matches whole words only', async () => {
    setup({ options: REPLIES_ON, messages: [incoming('somewhat later')] });
    await waitForDelay();
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('suggests replies for every received text when no keywords are configured', async () => {
    setup({ options: REPLIES_ANY, messages: [incoming('see you tomorrow')] });
    await waitForDelay();
    expect(screen.getByRole('region', { name: 'Suggest a reply' })).toBeInTheDocument();
  });

  it('matches custom keywords', async () => {
    setup({ options: REPLIES_URGENT, messages: [incoming('This is URGENT')] });
    await waitForDelay();
    expect(screen.getByRole('region', { name: 'Suggest a reply' })).toBeInTheDocument();
  });

  // Known issue: the keyword regex always appends `|\?`, so a question mark triggers smart replies even when '?' is not among the configured keywords.
  it.fails('does not trigger on a question mark when "?" is not a configured keyword', async () => {
    setup({ options: REPLIES_URGENT, messages: [incoming('ok?')] });
    await waitForDelay();
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  // Known issue: with '?' as the only keyword the word group becomes the empty `\b()\b`, which matches any word boundary, so every received message triggers.
  it.fails('with only "?" configured, ignores messages without a question mark', async () => {
    setup({
      options: REPLIES_QUESTION_ONLY,
      messages: [incoming('see you tomorrow')],
    });
    await waitForDelay();
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('ignores received media messages', async () => {
    const media = buildMediaMessage({
      sender: BOB,
    }) as unknown as CometChat.BaseMessage;
    setup({ options: REPLIES_ANY, messages: [media] });
    await waitForDelay();
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('only considers the latest received message', async () => {
    const first = incoming('how?');
    const { update } = setup({ options: REPLIES_ON, messages: [first] });
    await waitForDelay(5000);
    update({ options: REPLIES_ON, messages: [first, incoming('never mind')] });

    await waitForDelay();
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('cancels a pending suggestion and hides the panel when the user replies', async () => {
    const question = incoming('how?');
    const { update } = setup({ options: REPLIES_ON, messages: [question] });
    await waitForDelay(5000);
    update({ options: REPLIES_ON, messages: [question, outgoing('fine')] });
    await waitForDelay();
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();

    const next = incoming('and you?');
    update({
      options: REPLIES_ON,
      messages: [question, outgoing('fine'), next],
    });
    await waitForDelay();
    expect(screen.getByRole('region', { name: 'Suggest a reply' })).toBeInTheDocument();

    update({
      options: REPLIES_ON,
      messages: [question, outgoing('fine'), next, outgoing('good')],
    });
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('does not re-trigger when messages are removed or unchanged', async () => {
    const a = incoming('ok');
    const b = outgoing('fine');
    const { update } = setup({ options: REPLIES_ON, messages: [a, b] });
    update({ options: REPLIES_ON, messages: [incoming('how?')] });
    await waitForDelay();
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('stays closed when options change without a new message', async () => {
    const messages = [incoming('how?')];
    const { update } = setup({ options: REPLIES_ON, messages });
    await waitForDelay();
    fireEvent.click(screen.getByRole('button', { name: 'Close smart replies' }));

    update({ options: REPLIES_ANY, messages });
    await waitForDelay();
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('ignores messages without a sender', async () => {
    setup({ options: REPLIES_ANY, messages: [incoming('how?', null)] });
    await waitForDelay();
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('sends a picked reply to the composer and hides the panel', async () => {
    const { publish } = setup({
      options: REPLIES_ON,
      messages: [incoming('how?')],
    });
    await waitForDelay();

    fireEvent.click(screen.getByRole('button', { name: 'Sounds good' }));

    expect(publish).toHaveBeenCalledWith({
      type: 'ui:compose/text',
      text: 'Sounds good',
    });
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('closes from the close button and with Escape', async () => {
    const first = incoming('how?');
    const { update } = setup({ options: REPLIES_ON, messages: [first] });
    await waitForDelay();
    fireEvent.click(screen.getByRole('button', { name: 'Close smart replies' }));
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();

    update({ options: REPLIES_ON, messages: [first, incoming('why?')] });
    await waitForDelay();
    fireEvent.keyDown(screen.getByRole('region', { name: 'Suggest a reply' }), {
      key: 'Escape',
    });
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('shows the empty state when the SDK returns no usable replies', async () => {
    sdk.getSmartReplies.mockResolvedValue(null);
    setup({ options: REPLIES_ON, messages: [incoming('how?')] });
    await waitForDelay();
    expect(screen.getByText('No Suggestions Available')).toBeInTheDocument();
  });

  it('fetches replies for a group conversation', async () => {
    setup({
      options: REPLIES_ON,
      messages: [incoming('how?')],
      group: TEAM as unknown as CometChat.Group,
    });
    await waitForDelay();
    expect(sdk.getSmartReplies).toHaveBeenCalledWith('team', 'group');
  });

  it('skips the SDK when there is no conversation target', async () => {
    setup({
      options: REPLIES_ON,
      messages: [incoming('how?')],
      group: undefined,
    });
    await waitForDelay();
    expect(screen.getByText('No Suggestions Available')).toBeInTheDocument();
    expect(sdk.getSmartReplies).not.toHaveBeenCalled();
  });

  it('hides the panel when the feature is switched off', async () => {
    const messages = [incoming('how?')];
    const { update } = setup({ options: REPLIES_ON, messages });
    await waitForDelay();
    update({ options: BASE_OPTIONS, messages });
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('resets when the conversation changes', async () => {
    const messages = [incoming('how?')];
    const { update } = setup({ options: REPLIES_ON, messages });
    await waitForDelay();
    update({
      options: REPLIES_ON,
      messages,
      user: OTHER as unknown as CometChat.User,
    });
    expect(screen.queryByRole('region', { name: 'Suggest a reply' })).toBeNull();
  });

  it('drops a pending suggestion timer on unmount', async () => {
    const { unmount } = setup({
      options: REPLIES_ON,
      messages: [incoming('how?')],
    });
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    await waitForDelay();
    expect(sdk.getSmartReplies).not.toHaveBeenCalled();
  });
});

describe('CometChatMessageListAIFooter — conversation summary', () => {
  const SHOW_SUMMARY: CometChatEvent = {
    type: 'ui:panel/show',
    position: 'messageListFooter',
    panel: 'conversationSummary',
  };

  it('opens the summary on a footer panel event and shows the fetched summary', async () => {
    const { emit } = setup({ messages: [incoming('hi')] });
    emit(SHOW_SUMMARY);

    const panel = screen.getByRole('region', { name: 'Conversation summary' });
    expect(await within(panel).findByText('You discussed the launch plan.')).toBeInTheDocument();
    expect(sdk.getConversationSummary).toHaveBeenCalledWith('bob', 'user');
  });

  it('summarises only the last messages the opener asks for', async () => {
    const { emit } = setup({ messages: [incoming('hi')] });
    emit({ ...SHOW_SUMMARY, messageCount: 50 });
    expect(await screen.findByText('You discussed the launch plan.')).toBeInTheDocument();
    expect(sdk.getConversationSummary).toHaveBeenCalledWith('bob', 'user', { lastNMessages: 50 });
  });

  it('ignores panel events for other positions', () => {
    const { emit } = setup({});
    emit({
      type: 'ui:panel/show',
      position: 'messageListHeader',
      panel: 'conversationSummary',
    });
    expect(screen.queryByRole('region', { name: 'Conversation summary' })).toBeNull();
  });

  it('closes on its close button and announces the hide', async () => {
    const { emit, publish } = setup({});
    emit(SHOW_SUMMARY);
    await screen.findByText('You discussed the launch plan.');

    fireEvent.click(screen.getByRole('button', { name: 'Close conversation summary' }));

    expect(screen.queryByRole('region', { name: 'Conversation summary' })).toBeNull();
    expect(publish).toHaveBeenCalledWith({
      type: 'ui:panel/hide',
      position: 'messageListFooter',
    });
  });

  it('closes on a footer hide event but not on a header hide event', async () => {
    const { emit } = setup({});
    emit(SHOW_SUMMARY);
    await flush();

    emit({ type: 'ui:panel/hide', position: 'messageListHeader' });
    expect(screen.getByRole('region', { name: 'Conversation summary' })).toBeInTheDocument();

    emit({ type: 'ui:panel/hide', position: 'messageListFooter' });
    expect(screen.queryByRole('region', { name: 'Conversation summary' })).toBeNull();
  });

  it('takes priority over conversation starters and hands back to them when closed', async () => {
    const { emit } = setup({ options: STARTERS_ON, fetchState: 'empty' });
    await screen.findByRole('group', { name: 'Conversation starters' });

    emit(SHOW_SUMMARY);
    expect(screen.queryByRole('group', { name: 'Conversation starters' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Conversation summary' })).toBeInTheDocument();
    await flush();

    emit({ type: 'ui:panel/hide', position: 'messageListFooter' });
    const starters = screen.getByRole('group', {
      name: 'Conversation starters',
    });
    expect(await within(starters).findByRole('button', { name: 'Hi there!' })).toBeInTheDocument();
  });

  it('shows the empty state when the SDK returns no summary text', async () => {
    sdk.getConversationSummary.mockResolvedValue({ unexpected: true });
    const { emit } = setup({ group: TEAM as unknown as CometChat.Group });
    emit(SHOW_SUMMARY);
    expect(await screen.findByText('No Summary Available')).toBeInTheDocument();
    expect(sdk.getConversationSummary).toHaveBeenCalledWith('team', 'group');
  });

  it('skips the SDK when there is no conversation target', async () => {
    const { emit } = setup({ group: undefined });
    emit(SHOW_SUMMARY);
    expect(await screen.findByText('No Summary Available')).toBeInTheDocument();
    expect(sdk.getConversationSummary).not.toHaveBeenCalled();
  });

  it('closes when the conversation changes', async () => {
    const { emit, update } = setup({});
    emit(SHOW_SUMMARY);
    await flush();
    update({ user: OTHER as unknown as CometChat.User });
    expect(screen.queryByRole('region', { name: 'Conversation summary' })).toBeNull();
  });
});
