/**
 * The public props of <CometChatSearch />, one case each: the prop is set (or left out) on the real
 * component and the test checks what it changes. Only the SDK is mocked.
 *
 * Props that don't do what their JSDoc says are pinned with `it.fails` (see "known issues" below):
 * each passes while the issue is there and fails once it is fixed; then make it `it` and claim the
 * case with covers().
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearch } from '../CometChatSearch';
import { useCometChatSearchContext } from '../CometChatSearch.context';
import type { CometChatSearchProps } from '../CometChatSearch.types';
import { GlobalConfigProvider } from '../../../context/GlobalConfigContext';
import { LocaleProvider } from '../../../context/locale/LocaleProvider';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  conversations: {
    fetchNext: vi.fn(),
    setLimit: vi.fn(),
    setSearchKeyword: vi.fn(),
    setUnread: vi.fn(),
    setConversationType: vi.fn(),
  },
  messages: {
    fetchPrevious: vi.fn(),
    setLimit: vi.fn(),
    setSearchKeyword: vi.fn(),
    setUID: vi.fn(),
    setGUID: vi.fn(),
    hideDeletedMessages: vi.fn(),
    hasLinks: vi.fn(),
    setAttachmentTypes: vi.fn(),
  },
  getLoggedinUser: vi.fn(() => Promise.resolve({ getUid: () => 'me', getName: () => 'Me' })),
}));

vi.mock('@cometchat/chat-sdk-javascript', () => {
  /** Each setter records its call on the spy of the same name and returns the builder. */
  function chain(target: Record<string, unknown>, spies: Record<string, (...args: unknown[]) => unknown>) {
    for (const [name, spy] of Object.entries(spies)) {
      target[name] = (...args: unknown[]) => {
        spy(...args);
        return target;
      };
    }
  }
  return {
    CometChat: {
      CATEGORY_MESSAGE: 'message',
      CATEGORY_CUSTOM: 'custom',
      CATEGORY_ACTION: 'action',
      CATEGORY_CALL: 'call',
      CATEGORY_INTERACTIVE: 'interactive',
      MessageCategory: { AGENTIC: 'agentic' },
      ModerationStatus: {
        PENDING: 'pending',
        APPROVED: 'approved',
        DISAPPROVED: 'disapproved',
        UNMODERATED: 'unmoderated',
      },
      MESSAGE_TYPE: {
        TEXT: 'text',
        IMAGE: 'image',
        VIDEO: 'video',
        AUDIO: 'audio',
        FILE: 'file',
        ASSISTANT: 'assistant',
        TOOL_ARGUMENTS: 'tool_arguments',
        TOOL_RESULT: 'tool_result',
      },
      RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
      USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
      ACTION_TYPE: {
        MEMBER_JOINED: 'joined',
        MEMBER_LEFT: 'left',
        MEMBER_ADDED: 'added',
        MEMBER_BANNED: 'banned',
        MEMBER_UNBANNED: 'unbanned',
        MEMBER_KICKED: 'kicked',
        MEMBER_INVITED: 'invited',
        MEMBER_SCOPE_CHANGED: 'scopeChanged',
      },
      GROUP_MEMBER_SCOPE: { ADMIN: 'admin', MODERATOR: 'moderator', PARTICIPANT: 'participant' },
      GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
      CALL_STATUS: {
        ONGOING: 'ongoing',
        ENDED: 'ended',
        INITIATED: 'initiated',
        CANCELLED: 'cancelled',
        REJECTED: 'rejected',
        UNANSWERED: 'unanswered',
        BUSY: 'busy',
      },
      CALL_MODE: { DEFAULT: 'default', GRID: 'grid', SINGLE: 'single', SPOTLIGHT: 'spotlight', TILE: 'tile' },
      GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
      AI_ASSISTANT_EVENTS: {
        RUN_STARTED: 'run_started',
        TEXT_MESSAGE_START: 'text_message_start',
        TEXT_MESSAGE_CONTENT: 'text_message_content',
        TEXT_MESSAGE_END: 'text_message_end',
        RUN_FINISHED: 'run_finished',
        TOOL_CALL_STARTED: 'tool_call_start',
        TOOL_CALL_ENDED: 'tool_call_end',
        TOOL_CALL_ARGUMENT: 'tool_call_args',
        TOOL_CALL_RESULT: 'tool_call_result',
      },
      AttachmentType: { IMAGE: 'image', VIDEO: 'video', FILE: 'file', AUDIO: 'audio' },
      ConversationsRequestBuilder: vi.fn(function (this: Record<string, unknown>) {
        const { fetchNext, ...setters } = sdk.conversations;
        chain(this, setters);
        this.build = () => ({ fetchNext });
      }),
      MessagesRequestBuilder: vi.fn(function (this: Record<string, unknown>) {
        const { fetchPrevious, ...setters } = sdk.messages;
        chain(this, setters);
        this.build = () => ({ fetchPrevious });
      }),
      // Rows check `instanceof CometChat.User` to spot AI agent chats; these plain mocks aren't.
      User: vi.fn(),
      getLoggedinUser: sdk.getLoggedinUser,
      addMessageListener: vi.fn(),
      removeMessageListener: vi.fn(),
      addUserListener: vi.fn(),
      removeUserListener: vi.fn(),
      MessageListener: vi.fn(),
      UserListener: vi.fn(),
      CometChatHelper: { getConversationFromMessage: vi.fn() },
    },
  };
});

const ME = 'me';
/** Local noon, so the date shown is 15 January 2025 whatever the machine's timezone. */
const JAN_15_2025 = new Date(2025, 0, 15, 12).getTime() / 1000;

interface ConversationSpec {
  id: string;
  name: string;
  type?: 'user' | 'group';
  groupType?: string;
  text?: string;
  fromMe?: boolean;
  sentAt?: number;
}

function conversation({ id, name, type = 'user', groupType = 'public', text = 'Hi team', fromMe = false, sentAt = JAN_15_2025 }: ConversationSpec) {
  return {
    getConversationId: () => id,
    getConversationType: () => type,
    getConversationWith: () =>
      type === 'user'
        ? { getUid: () => id, getName: () => name, getAvatar: () => '', getStatus: () => 'online', getBlockedByMe: () => false, getHasBlockedMe: () => false }
        : { getGuid: () => id, getName: () => name, getIcon: () => '', getType: () => groupType },
    getLastMessage: () => ({
      getId: () => 1,
      getType: () => 'text',
      getCategory: () => 'message',
      getText: () => text,
      getSentAt: () => sentAt,
      getSender: () => ({ getUid: () => (fromMe ? ME : 'other'), getName: () => (fromMe ? 'Me' : 'Other') }),
      getReceiverType: () => type,
      getReadAt: () => 0,
      getDeliveredAt: () => (fromMe ? sentAt : 0),
      getDeletedAt: () => null,
      getParentMessageId: () => 0,
    }),
    getUnreadMessageCount: () => 0,
    setUnreadMessageCount: () => undefined,
    getTags: () => [],
  } as unknown as CometChat.Conversation;
}

interface MessageSpec {
  id: number;
  text?: string;
  type?: string;
  sentAt?: number;
}

function message({ id, text = 'Hello team', type = 'text', sentAt = JAN_15_2025 }: MessageSpec) {
  return {
    getId: () => id,
    getType: () => type,
    getCategory: () => 'message',
    getText: () => text,
    getSentAt: () => sentAt,
    getMetadata: () => ({}),
    getParentMessageId: () => 0,
    getSender: () => ({ getUid: () => 'bob', getName: () => 'Bob' }),
    getReceiver: () => ({ getName: () => 'Design Team' }),
    getReceiverType: () => 'group',
    getAttachments: () => [],
    getCaption: () => '',
    getConversationId: () => 'group_design',
  } as unknown as CometChat.BaseMessage;
}

const alice = conversation({ id: 'alice', name: 'Alice' });
const design = conversation({ id: 'design', name: 'Design', type: 'group', groupType: 'private', text: 'Shipped', fromMe: true });
const hello = message({ id: 101 });

/** Resolves a fresh copy each call: the messages manager reverses the page in place. */
const pageOf = <T,>(items: T[]) => () => Promise.resolve([...items]);
const never = () => new Promise<never>(() => undefined);

/** A conversations builder an app passes in, returning its own conversations. */
function appConversationsBuilder(conversations: CometChat.Conversation[]) {
  const fetchNext = vi.fn(pageOf(conversations));
  const builder = { setLimit: vi.fn(), setSearchKeyword: vi.fn(), build: vi.fn(() => ({ fetchNext })) };
  builder.setLimit.mockReturnValue(builder);
  builder.setSearchKeyword.mockReturnValue(builder);
  return builder;
}

/** A messages builder an app passes in, returning its own messages. */
function appMessagesBuilder(messages: CometChat.BaseMessage[]) {
  const fetchPrevious = vi.fn(pageOf(messages));
  const builder = {
    setLimit: vi.fn(),
    setSearchKeyword: vi.fn(),
    hideDeletedMessages: vi.fn(),
    build: vi.fn(() => ({ fetchPrevious })),
  };
  builder.setLimit.mockReturnValue(builder);
  builder.setSearchKeyword.mockReturnValue(builder);
  builder.hideDeletedMessages.mockReturnValue(builder);
  return builder;
}

/** The real component, inside the kit's own locale provider (which every app has). */
function show(props: CometChatSearchProps = {}, wrap: (ui: React.ReactElement) => React.ReactElement = ui => ui) {
  return render(<LocaleProvider>{wrap(<CometChatSearch {...props} />)}</LocaleProvider>);
}

const conversationRow = (id: string) => screen.findByTestId(`search-conversation-item-${id}`);
const messageRow = (id: number) => screen.findByTestId(`search-message-item-${String(id)}`);
const chips = () =>
  within(screen.getByRole('toolbar'))
    .getAllByRole('button')
    .map(chip => chip.textContent);
const region = (name: 'Conversations' | 'Messages') => screen.queryByRole('region', { name });
const count = (container: HTMLElement, selector: string) => container.querySelectorAll(selector).length;

class HashtagFormatter extends CometChatTextFormatter {
  readonly id = 'test-hashtag';
  override customLogicToFormatText(text: string): string {
    return text.replace(/#(\w+)/g, '<span class="test-hashtag">#$1</span>');
  }
}

beforeEach(() => {
  sdk.conversations.fetchNext.mockReset().mockImplementation(pageOf([alice, design]));
  sdk.messages.fetchPrevious.mockReset().mockImplementation(pageOf([hello]));
  for (const spy of [
    sdk.conversations.setLimit,
    sdk.conversations.setSearchKeyword,
    sdk.conversations.setUnread,
    sdk.conversations.setConversationType,
    sdk.messages.setLimit,
    sdk.messages.setSearchKeyword,
    sdk.messages.setUID,
    sdk.messages.setGUID,
    sdk.messages.hideDeletedMessages,
    sdk.messages.hasLinks,
    sdk.messages.setAttachmentTypes,
  ]) {
    spy.mockClear();
  }
});

describe('CometChatSearch props', () => {
  describe('search text, scope and filters', () => {
    it('defaultSearchText fills the box and searches conversations and messages for it at once', async () => {
      covers('CometChatSearch.defaultSearchText', 'set');
      show({ defaultSearchText: 'team' });
      expect(screen.getByRole('searchbox')).toHaveValue('team');
      expect(await conversationRow('alice')).toBeInTheDocument();
      expect(await messageRow(101)).toBeInTheDocument();
      expect(sdk.conversations.setSearchKeyword).toHaveBeenCalledWith('team');
      expect(sdk.messages.setSearchKeyword).toHaveBeenCalledWith('team');
    });

    it('by default the box is empty, the start view shows and nothing is fetched', () => {
      covers('CometChatSearch.defaultSearchText', 'default');
      show();
      expect(screen.getByRole('searchbox')).toHaveValue('');
      expect(screen.getByText('Start Your Search')).toBeInTheDocument();
      expect(sdk.conversations.fetchNext).not.toHaveBeenCalled();
      expect(sdk.messages.fetchPrevious).not.toHaveBeenCalled();
    });

    it('searchIn limits the results and the filters to the scopes it names', async () => {
      covers('CometChatSearch.searchIn', 'set');
      let view = show({ searchIn: ['messages'], defaultSearchText: 'team' });
      expect(await messageRow(101)).toBeInTheDocument();
      expect(region('Conversations')).toBeNull();
      expect(sdk.conversations.fetchNext).not.toHaveBeenCalled();
      expect(chips()).toEqual(['Audio', 'Documents', 'Photos', 'Videos', 'Links']);
      view.unmount();

      sdk.messages.fetchPrevious.mockClear();
      view = show({ searchIn: ['conversations'], defaultSearchText: 'team' });
      expect(await conversationRow('alice')).toBeInTheDocument();
      expect(region('Messages')).toBeNull();
      expect(sdk.messages.fetchPrevious).not.toHaveBeenCalled();
      expect(chips()).toEqual(['Groups', 'Unread']);
    });

    it('by default both scopes are searched, with the seven standard filter chips', async () => {
      covers('CometChatSearch.searchIn', 'default');
      covers('CometChatSearch.searchFilters', 'default');
      show({ defaultSearchText: 'team' });
      expect(await conversationRow('alice')).toBeInTheDocument();
      expect(await messageRow(101)).toBeInTheDocument();
      expect(region('Conversations')).toBeInTheDocument();
      expect(region('Messages')).toBeInTheDocument();
      expect(chips()).toEqual(['Audio', 'Documents', 'Groups', 'Photos', 'Videos', 'Links', 'Unread']);
    });

    it('searchFilters picks the filter chips, in its order', () => {
      covers('CometChatSearch.searchFilters', 'set');
      show({ searchFilters: ['unread', 'photos'] });
      expect(chips()).toEqual(['Unread', 'Photos']);
    });

    it('initialSearchFilter starts with that filter on and searches by it', async () => {
      covers('CometChatSearch.initialSearchFilter', 'set');
      show({ initialSearchFilter: 'photos' });
      expect(screen.getByRole('button', { name: 'Photos' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText('Start Your Search')).toBeNull();
      expect(await messageRow(101)).toBeInTheDocument();
      expect(sdk.messages.setAttachmentTypes).toHaveBeenCalledWith(['image']);
      expect(sdk.messages.setSearchKeyword).not.toHaveBeenCalled();
    });

    it('by default no filter is on', () => {
      covers('CometChatSearch.initialSearchFilter', 'default');
      show();
      for (const chip of within(screen.getByRole('toolbar')).getAllByRole('button')) {
        expect(chip).toHaveAttribute('aria-pressed', 'false');
      }
      expect(screen.getByText('Start Your Search')).toBeInTheDocument();
    });

    it("uid searches only that user's chat: its messages, titled by sender, without conversation results", async () => {
      covers('CometChatSearch.uid', 'set');
      show({ uid: 'bob', defaultSearchText: 'team' });
      const row = await messageRow(101);
      expect(sdk.messages.setUID).toHaveBeenCalledWith('bob');
      expect(sdk.messages.setGUID).not.toHaveBeenCalled();
      expect(within(row).getByText('Bob')).toBeInTheDocument();
      expect(region('Conversations')).toBeNull();
      expect(sdk.conversations.fetchNext).not.toHaveBeenCalled();
      expect(chips()).not.toContain('Groups');
      expect(chips()).not.toContain('Unread');
    });

    it("guid searches only that group's chat: its messages, titled by sender, without conversation results", async () => {
      covers('CometChatSearch.guid', 'set');
      show({ guid: 'design', defaultSearchText: 'team' });
      const row = await messageRow(101);
      expect(sdk.messages.setGUID).toHaveBeenCalledWith('design');
      expect(sdk.messages.setUID).not.toHaveBeenCalled();
      expect(within(row).getByText('Bob')).toBeInTheDocument();
      expect(region('Conversations')).toBeNull();
      expect(sdk.conversations.fetchNext).not.toHaveBeenCalled();
      expect(chips()).not.toContain('Groups');
    });

    it('without uid or guid, every chat is searched and message rows are titled by their chat', async () => {
      covers('CometChatSearch.uid', 'default');
      covers('CometChatSearch.guid', 'default');
      show({ defaultSearchText: 'team' });
      const row = await messageRow(101);
      expect(within(row).getByText('Design Team')).toBeInTheDocument();
      expect(sdk.messages.setUID).not.toHaveBeenCalled();
      expect(sdk.messages.setGUID).not.toHaveBeenCalled();
      expect(await conversationRow('alice')).toBeInTheDocument();
      expect(chips()).toContain('Groups');
    });
  });

  describe('request builders', () => {
    it("an app's conversations builder is the one searched", async () => {
      covers('CometChatSearch.conversationsRequestBuilder', 'used');
      const builder = appConversationsBuilder([conversation({ id: 'carol', name: 'Carol' })]);
      show({ defaultSearchText: 'car', conversationsRequestBuilder: builder as unknown as CometChat.ConversationsRequestBuilder });
      expect(await conversationRow('carol')).toBeInTheDocument();
      expect(builder.setSearchKeyword).toHaveBeenCalledWith('car');
      expect(builder.build).toHaveBeenCalled();
      expect(sdk.conversations.fetchNext).not.toHaveBeenCalled();
    });

    it('without one, the SDK builder searches by the keyword, three at a time', async () => {
      covers('CometChatSearch.conversationsRequestBuilder', 'default');
      show({ defaultSearchText: 'team' });
      expect(await conversationRow('alice')).toBeInTheDocument();
      expect(sdk.conversations.setLimit).toHaveBeenCalledWith(3);
      expect(sdk.conversations.setSearchKeyword).toHaveBeenCalledWith('team');
    });

    it("an app's messages builder is the one searched, keeping its own page size", async () => {
      covers('CometChatSearch.messagesRequestBuilder', 'used');
      const builder = appMessagesBuilder([message({ id: 202, text: 'from the app builder' })]);
      show({ defaultSearchText: 'team', messagesRequestBuilder: builder as unknown as CometChat.MessagesRequestBuilder });
      expect(await messageRow(202)).toBeInTheDocument();
      expect(builder.setSearchKeyword).toHaveBeenCalledWith('team');
      expect(builder.setLimit).not.toHaveBeenCalled();
      expect(sdk.messages.fetchPrevious).not.toHaveBeenCalled();
    });

    it('without one, the SDK builder searches by the keyword, three at a time, skipping deleted messages', async () => {
      covers('CometChatSearch.messagesRequestBuilder', 'default');
      show({ defaultSearchText: 'team' });
      expect(await messageRow(101)).toBeInTheDocument();
      expect(sdk.messages.hideDeletedMessages).toHaveBeenCalledWith(true);
      expect(sdk.messages.setLimit).toHaveBeenCalledWith(3);
      expect(sdk.messages.setSearchKeyword).toHaveBeenCalledWith('team');
    });
  });

  describe('callbacks', () => {
    it('onBack fires from the back button', () => {
      covers('CometChatSearch.onBack', 'called');
      const onBack = vi.fn();
      show({ onBack });
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(onBack).toHaveBeenCalledTimes(1);
      expect(onBack).toHaveBeenCalledWith();
    });

    it('onConversationClicked gets the conversation and the keyword', async () => {
      covers('CometChatSearch.onConversationClicked', 'called');
      const onConversationClicked = vi.fn();
      show({ defaultSearchText: 'team', onConversationClicked });
      fireEvent.click(await conversationRow('alice'));
      expect(onConversationClicked).toHaveBeenCalledWith({ conversation: alice, searchKeyword: 'team' });
    });

    it('onMessageClicked gets the message and the keyword', async () => {
      covers('CometChatSearch.onMessageClicked', 'called');
      const onMessageClicked = vi.fn();
      show({ defaultSearchText: 'team', onMessageClicked });
      fireEvent.click(await messageRow(101));
      expect(onMessageClicked).toHaveBeenCalledWith({ message: hello, searchKeyword: 'team' });
    });

    it('onError gets the error when a search fails', async () => {
      covers('CometChatSearch.onError', 'called');
      const conversationsError = { code: 'ERR_CONVERSATIONS', message: 'no network' };
      const messagesError = { code: 'ERR_MESSAGES', message: 'no network' };
      sdk.conversations.fetchNext.mockRejectedValue(conversationsError);
      sdk.messages.fetchPrevious.mockRejectedValue(messagesError);
      const onError = vi.fn();
      show({ defaultSearchText: 'team', onError });
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(conversationsError);
        expect(onError).toHaveBeenCalledWith(messagesError);
      });
    });
  });

  describe('display', () => {
    it('hideBackButton removes the back button; it is shown by default', () => {
      covers('CometChatSearch.hideBackButton', 'true', 'false', 'default');
      const view = show({ hideBackButton: true });
      expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
      view.unmount();
      for (const props of [{ hideBackButton: false }, {}]) {
        const next = show(props);
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
        next.unmount();
      }
    });

    it("hideUserStatus removes the online dot from conversation results; shown by default; the prop wins over the app's global setting", async () => {
      covers('CometChatSearch.hideUserStatus', 'true', 'false', 'default', 'overrides-context');
      const DOT = '.cometchat-avatar__status-indicator';
      const cases: [CometChatSearchProps, { hideUserStatus?: boolean } | null, number][] = [
        [{ hideUserStatus: true }, null, 0],
        [{ hideUserStatus: false }, null, 1],
        [{}, null, 1],
        // The global setting alone hides it; the prop set to false shows it again.
        [{}, { hideUserStatus: true }, 0],
        [{ hideUserStatus: false }, { hideUserStatus: true }, 1],
      ];
      for (const [props, config, dots] of cases) {
        const view = show({ ...props, defaultSearchText: 'team' }, ui =>
          config ? <GlobalConfigProvider config={config}>{ui}</GlobalConfigProvider> : ui
        );
        await conversationRow('alice');
        expect(count(view.container, DOT)).toBe(dots);
        view.unmount();
      }
    });

    it('a private group shows its group-type badge when hideGroupType is false or left out', async () => {
      covers('CometChatSearch.hideGroupType', 'false', 'default');
      for (const props of [{ hideGroupType: false }, {}]) {
        const view = show({ ...props, defaultSearchText: 'team' });
        const row = await conversationRow('design');
        expect(row.querySelector('.cometchat-conversations__item-group-type--private')).not.toBeNull();
        view.unmount();
      }
    });

    it("conversationOptions gives each conversation a menu whose items act on it; no menu by default", async () => {
      covers('CometChatSearch.conversationOptions', 'set', 'default');
      const onArchive = vi.fn();
      const onConversationClicked = vi.fn();
      const options = vi.fn(() => [{ id: 'archive', title: 'Archive', onClick: onArchive }]);
      const view = show({ defaultSearchText: 'team', conversationOptions: options, onConversationClicked });
      const row = await conversationRow('design');
      expect(options).toHaveBeenCalledWith(design);
      fireEvent.click(within(row).getByRole('button', { name: 'More options' }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Archive' }));
      expect(onArchive).toHaveBeenCalledWith(design);
      // Picking an option doesn't also open the conversation.
      expect(onConversationClicked).not.toHaveBeenCalled();
      view.unmount();

      show({ defaultSearchText: 'team' });
      const plain = await conversationRow('design');
      expect(within(plain).queryByRole('button', { name: 'More options' })).toBeNull();
      expect(plain.querySelector('.cometchat-conversations__item-menu-view')).toBeNull();
    });

    it("textFormatters format the message results' previews; by default previews are left as they are", async () => {
      covers('CometChatSearch.textFormatters', 'default');
      sdk.messages.fetchPrevious.mockImplementation(pageOf([message({ id: 303, text: 'Ship #design today' })]));
      const preview = async () =>
        (await messageRow(303)).querySelector('.cometchat-search__messages-list-item-subtitle-content');

      let view = show({ defaultSearchText: 'design', textFormatters: [new HashtagFormatter()] });
      expect((await preview())?.querySelector('.test-hashtag')).toHaveTextContent('#design');
      view.unmount();

      view = show({ defaultSearchText: 'design' });
      const plain = await preview();
      expect(plain).toHaveTextContent('Bob: Ship #design today');
      expect(plain?.querySelector('.test-hashtag')).toBeNull();
    });

    it('a message result shows its sent date, day month and year, by default', async () => {
      covers('CometChatSearch.messageSentAtDateTimeFormat', 'default');
      const { container } = show({ defaultSearchText: 'team' });
      await messageRow(101);
      expect(container.querySelector('.cometchat-search__messages-trailing-view--date')).toHaveTextContent('Jan 15, 2025');
    });
  });

  describe('views', () => {
    it('initialView replaces the start view', () => {
      covers('CometChatSearch.initialView', 'custom');
      show({ initialView: <div>Find anything</div> });
      expect(screen.getByText('Find anything')).toBeInTheDocument();
      expect(screen.queryByText('Start Your Search')).toBeNull();
    });

    it('loadingView replaces the shimmer while a search is running', async () => {
      covers('CometChatSearch.loadingView', 'custom');
      sdk.conversations.fetchNext.mockImplementation(never);
      sdk.messages.fetchPrevious.mockImplementation(never);
      const { container } = show({ defaultSearchText: 'team', loadingView: <div>Searching…</div> });
      expect(await screen.findAllByText('Searching…')).toHaveLength(2);
      expect(container.querySelector('.cometchat-search__shimmer')).toBeNull();
    });

    it('emptyView replaces the no-results view', async () => {
      covers('CometChatSearch.emptyView', 'custom');
      sdk.conversations.fetchNext.mockImplementation(pageOf([]));
      sdk.messages.fetchPrevious.mockImplementation(pageOf([]));
      show({ defaultSearchText: 'zzz', emptyView: <div>Nothing matches</div> });
      expect(await screen.findByText('Nothing matches')).toBeInTheDocument();
      expect(screen.queryByText('No Results')).toBeNull();
    });

    it('errorView replaces the error view', async () => {
      covers('CometChatSearch.errorView', 'custom');
      sdk.conversations.fetchNext.mockRejectedValue(new Error('offline'));
      sdk.messages.fetchPrevious.mockRejectedValue(new Error('offline'));
      show({ defaultSearchText: 'team', errorView: <div>Search is down</div> });
      expect(await screen.findByText('Search is down')).toBeInTheDocument();
      expect(screen.queryByText('OOPS!')).toBeNull();
    });

    it('children replace the default layout and read the search state from context', () => {
      covers('CometChatSearch.children', 'custom');
      function SearchingFor() {
        const { searchText } = useCometChatSearchContext();
        return <output>Searching for {searchText}</output>;
      }
      render(
        <LocaleProvider>
          <CometChatSearch.Root defaultSearchText="team">
            <SearchingFor />
          </CometChatSearch.Root>
        </LocaleProvider>
      );
      expect(screen.getByRole('status')).toHaveTextContent('Searching for team');
      expect(screen.queryByRole('searchbox')).toBeNull();
      expect(screen.queryByRole('toolbar')).toBeNull();
    });

    it('conversationItemView replaces the whole conversation row', async () => {
      covers('CometChatSearch.conversationItemView', 'custom');
      const itemView = (c: CometChat.Conversation) => <span>Chat {c.getConversationId()}</span>;
      show({ defaultSearchText: 'team', conversationItemView: itemView });
      const row = await conversationRow('alice');
      expect(row).toHaveTextContent('Chat alice');
      expect(row.querySelector('.cometchat-conversations__item')).toBeNull();
    });

    it('the conversation leading, title, subtitle and trailing views replace those parts of the row', async () => {
      covers('CometChatSearch.conversationLeadingView', 'custom');
      covers('CometChatSearch.conversationTitleView', 'custom');
      covers('CometChatSearch.conversationSubtitleView', 'custom');
      covers('CometChatSearch.conversationTrailingView', 'custom');
      show({
        defaultSearchText: 'team',
        conversationLeadingView: c => <span>lead {c.getConversationId()}</span>,
        conversationTitleView: c => <span>title {c.getConversationId()}</span>,
        conversationSubtitleView: c => <span>subtitle {c.getConversationId()}</span>,
        conversationTrailingView: c => <span>trail {c.getConversationId()}</span>,
      });
      const row = await conversationRow('alice');
      for (const part of ['lead', 'title', 'subtitle', 'trail']) {
        expect(within(row).getByText(`${part} alice`)).toBeInTheDocument();
      }
      expect(row.querySelector('.cometchat-conversations__item-avatar')).toBeNull();
      expect(row.querySelector('.cometchat-conversations__item-title')).toBeNull();
      expect(row.querySelector('.cometchat-conversations__item-subtitle')).toBeNull();
      expect(row.querySelector('.cometchat-date')).toBeNull();
    });

    it('messageItemView replaces the whole message row', async () => {
      covers('CometChatSearch.messageItemView', 'custom');
      show({ defaultSearchText: 'team', messageItemView: m => <span>Message {String(m.getId())}</span> });
      expect(await screen.findByText('Message 101')).toBeInTheDocument();
      expect(screen.queryByTestId('search-message-item-101')).toBeNull();
    });

    it('the message leading, title, subtitle and trailing views replace those parts of the row', async () => {
      covers('CometChatSearch.messageLeadingView', 'custom');
      covers('CometChatSearch.messageTitleView', 'custom');
      covers('CometChatSearch.messageSubtitleView', 'custom');
      covers('CometChatSearch.messageTrailingView', 'custom');
      // A link message, so the built-in leading view (a link icon) has something to show.
      sdk.messages.fetchPrevious.mockImplementation(pageOf([message({ id: 404, text: 'see https://example.com' })]));
      show({
        defaultSearchText: 'see',
        messageLeadingView: m => <span>lead {String(m.getId())}</span>,
        messageTitleView: m => <span>title {String(m.getId())}</span>,
        messageSubtitleView: m => <span>subtitle {String(m.getId())}</span>,
        messageTrailingView: m => <span>trail {String(m.getId())}</span>,
      });
      const row = await messageRow(404);
      for (const part of ['lead', 'title', 'subtitle', 'trail']) {
        expect(within(row).getByText(`${part} 404`)).toBeInTheDocument();
      }
      expect(row.querySelector('.cometchat-search__messages-leading-view--link')).toBeNull();
      expect(within(row).queryByText('Design Team')).toBeNull();
      expect(row.querySelector('.cometchat-search__messages-list-item-subtitle-content')).toBeNull();
      expect(row.querySelector('.cometchat-search__messages-trailing-view--date')).toBeNull();
    });
  });

  /**
   * Known issues: these props don't do what their JSDoc says. Each `it.fails` passes while the
   * issue is there; once fixed, make it `it` and claim the case with covers().
   */
  describe('known issues', () => {
    // CometChatConversationsItem reads the logged-in user for receipts only from the Conversations
    // context, which Search doesn't provide, so a result never shows a receipt and hideReceipts
    // has nothing to hide (cases: true, false, default, overrides-context).
    it.fails("shows the receipt on the user's own last message unless hideReceipts; the prop wins over the global setting", async () => {
      const RECEIPT = '.cometchat-conversations__item-receipt';
      const cases: [CometChatSearchProps, { hideReceipts?: boolean } | null, number][] = [
        [{}, null, 1],
        [{ hideReceipts: false }, null, 1],
        [{ hideReceipts: false }, { hideReceipts: true }, 1],
        [{ hideReceipts: true }, null, 0],
      ];
      for (const [props, config, receipts] of cases) {
        const view = show({ ...props, defaultSearchText: 'team' }, ui =>
          config ? <GlobalConfigProvider config={config}>{ui}</GlobalConfigProvider> : ui
        );
        await conversationRow('design');
        await waitFor(() => {
          expect(count(view.container, RECEIPT)).toBe(receipts);
        });
        view.unmount();
      }
    });

    // The Root puts hideGroupType in context, but nothing in Search reads it: the row reads it only
    // from the Conversations context (case: true).
    it.fails('hideGroupType removes the group-type badge', async () => {
      show({ hideGroupType: true, defaultSearchText: 'team' });
      const row = await conversationRow('design');
      expect(row.querySelector('.cometchat-conversations__item-group-type')).toBeNull();
    });

    // Never passed on to the row, which reads the format only from the Conversations context
    // (case: set).
    it.fails("lastMessageDateTimeFormat sets the conversation row's date", async () => {
      show({ defaultSearchText: 'team', lastMessageDateTimeFormat: { otherDays: 'YYYY' } });
      const row = await conversationRow('alice');
      expect(row.querySelector('.cometchat-date__text')).toHaveTextContent(/^2025$/);
    });

    // The JSDoc promises DD/MM/YYYY "for all date ranges in search context", but the row shows the
    // time for today and the weekday within the last week (case: default).
    it.fails('by default a conversation row dates even a message from today as DD/MM/YYYY', async () => {
      const today = conversation({ id: 'today', name: 'Today', sentAt: Math.floor(Date.now() / 1000) });
      sdk.conversations.fetchNext.mockImplementation(pageOf([today]));
      show({ defaultSearchText: 'team' });
      const row = await conversationRow('today');
      expect(row.querySelector('.cometchat-date__text')?.textContent).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    // Passed to the messages hook, which drops it; the row formats the date itself (case: set).
    it.fails("messageSentAtDateTimeFormat sets a message result's date", async () => {
      const { container } = show({ defaultSearchText: 'team', messageSentAtDateTimeFormat: { otherDays: 'DD/MM/YYYY' } });
      await messageRow(101);
      expect(container.querySelector('.cometchat-search__messages-trailing-view--date')).toHaveTextContent('15/01/2025');
    });

    // The JSDoc says the formatters apply to conversation subtitles, but they reach only message
    // results; the row reads formatters only from the Conversations context (case: set).
    it.fails("textFormatters format the conversation results' subtitles", async () => {
      sdk.conversations.fetchNext.mockImplementation(pageOf([conversation({ id: 'tagged', name: 'Tagged', text: 'Ship #design today' })]));
      show({ defaultSearchText: 'design', textFormatters: [new HashtagFormatter()] });
      const row = await conversationRow('tagged');
      expect(row.querySelector('.cometchat-conversations__item-subtitle-text .test-hashtag')).toHaveTextContent('#design');
    });
  });
});
