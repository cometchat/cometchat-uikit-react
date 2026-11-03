/**
 * The public props of <CometChatConversations />, one case each: the prop is set (or left out) on
 * the real component and the test checks what it changes. The SDK and the sound player are mocked.
 *
 * `children` is covered in CometChatConversationsRoot.spec.tsx.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatConversations } from '../CometChatConversations';
import { CometChatConversationsManager } from '../CometChatConversationsManager';
import { GlobalConfigProvider } from '../../../context/GlobalConfigContext';
import { LocaleContext } from '../../../context/locale/LocaleContext';
import { resolvePinSaveFeatures, resetPinSaveFeatures } from '../../../utils/pinSaveFeatures';
import type { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  fetchNext: vi.fn(),
  setLimit: vi.fn(),
  setSearchKeyword: vi.fn(),
  getConversationFromMessage: vi.fn(),
  isPinConversationEnabled: vi.fn(),
  playSound: vi.fn(),
}));

// jsdom has no IntersectionObserver (used by the list's infinite scroll).
vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() }))
);

vi.mock('@cometchat/chat-sdk-javascript', () => ({
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
    CALL_MODE: {
      DEFAULT: 'default',
      GRID: 'grid',
      SINGLE: 'single',
      SPOTLIGHT: 'spotlight',
      TILE: 'tile',
    },
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
    ConversationsRequestBuilder: vi.fn(function (this: Record<string, unknown>) {
      this.setLimit = sdk.setLimit.mockReturnValue(this);
      this.setSearchKeyword = sdk.setSearchKeyword.mockReturnValue(this);
      this.build = () => ({ fetchNext: sdk.fetchNext });
    }),
    // Rows check `instanceof CometChat.User` to spot AI agent chats; these plain mocks aren't.
    User: vi.fn(),
    markAsDelivered: vi.fn(() => Promise.resolve()),
    isPinMessageEnabled: vi.fn(() => Promise.resolve(false)),
    isSaveMessageEnabled: vi.fn(() => Promise.resolve(false)),
    isPinConversationEnabled: sdk.isPinConversationEnabled,
    getLoggedinUser: vi.fn(() =>
      Promise.resolve({ getUid: () => 'user-1', getName: () => 'Test User' })
    ),
    getConversation: vi.fn(),
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addGroupListener: vi.fn(),
    removeGroupListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    MessageListener: vi.fn(),
    UserListener: vi.fn(),
    GroupListener: vi.fn(),
    ConnectionListener: vi.fn(),
    CometChatHelper: {
      getConversationFromMessage: sdk.getConversationFromMessage,
    },
  },
}));

vi.mock('../../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: { play: sdk.playSound },
}));

const ME = 'user-1';
const DAY = 24 * 60 * 60;
const tenDaysAgo = Math.floor(Date.now() / 1000) - 10 * DAY;

interface ConversationSpec {
  id: string;
  name: string;
  type?: 'user' | 'group';
  groupType?: string;
  text?: string;
  fromMe?: boolean;
  unread?: number;
  sentAt?: number;
}

function conversation({ id, name, type = 'user', groupType = 'public', text = 'Hi there', fromMe = false, unread = 0, sentAt = tenDaysAgo }: ConversationSpec) {
  let unreadCount = unread;
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
      getSender: () => ({ getUid: () => (fromMe ? ME : 'other'), getName: () => 'Other' }),
      getReceiverType: () => type,
      getReadAt: () => 0,
      getDeliveredAt: () => (fromMe ? sentAt : 0),
      getDeletedAt: () => null,
      getParentMessageId: () => 0,
    }),
    getUnreadMessageCount: () => unreadCount,
    setUnreadMessageCount: (n: number) => {
      unreadCount = n;
    },
    getTags: () => [],
  } as unknown as CometChat.Conversation;
}

const alice = conversation({ id: 'alice', name: 'Alice', unread: 3 });
const design = conversation({ id: 'design', name: 'Design', type: 'group', groupType: 'private', text: 'Shipped', fromMe: true });

/** A request builder an app passes in, returning its own conversations. */
function appBuilder(conversations: CometChat.Conversation[]) {
  const fetchNext = vi.fn().mockResolvedValue(conversations);
  const builder = { setSearchKeyword: vi.fn(), build: vi.fn(() => ({ fetchNext })) };
  builder.setSearchKeyword.mockReturnValue(builder);
  return builder;
}
const asBuilder = (b: ReturnType<typeof appBuilder>) => b as unknown as CometChat.ConversationsRequestBuilder;

const row = (name: string) => screen.getByRole('option', { name: new RegExp(name) });
const loaded = () => screen.findByRole('option', { name: /Alice/ });
const count = (selector: string) => document.querySelectorAll(selector).length;

/** The labels of a row's menu, whatever shape it took (a dropdown, or icons when there are few). */
function rowOptionLabels(rowEl: HTMLElement): string[] {
  const trigger = rowEl.querySelector<HTMLElement>('.cometchat-context-menu__trigger');
  if (trigger) {
    fireEvent.click(trigger);
    return Array.from(document.querySelectorAll('.cometchat-context-menu__dropdown-item-title')).map(el => el.textContent ?? '');
  }
  return Array.from(rowEl.querySelectorAll('.cometchat-context-menu__top-menu-item')).map(el => el.getAttribute('aria-label') ?? '');
}

/** The app's own calendar format, as CometChatLocalize provides it. */
const Calendar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const locale = React.useContext(LocaleContext);
  return <LocaleContext.Provider value={{ ...locale, calendarObject: { otherDays: 'MM-YYYY' } }}>{children}</LocaleContext.Provider>;
};

let messageHandlers: Record<string, ((message: unknown) => void) | undefined> = {};

beforeEach(() => {
  sdk.fetchNext.mockReset().mockResolvedValue([alice, design]);
  sdk.setLimit.mockClear();
  sdk.setSearchKeyword.mockClear();
  sdk.getConversationFromMessage.mockReset();
  sdk.playSound.mockClear();
  sdk.isPinConversationEnabled.mockReset().mockResolvedValue(false);
  messageHandlers = {};
  vi.spyOn(CometChatConversationsManager, 'attachMessageListener').mockImplementation((_id, callbacks) => {
    messageHandlers = callbacks as typeof messageHandlers;
    return () => {};
  });
  vi.spyOn(CometChatConversationsManager, 'shouldLastMessageAndUnreadCountBeUpdated').mockReturnValue(true);
  resetPinSaveFeatures();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetPinSaveFeatures();
});

describe('CometChatConversations props', () => {
  describe('request builders and search', () => {
    it('without a builder, fetches 30 conversations at a time with no search keyword', async () => {
      covers('CometChatConversations.conversationsRequestBuilder', 'default');
      covers('CometChatConversations.searchKeyword', 'default');
      render(<CometChatConversations />);
      await loaded();
      expect(sdk.setLimit).toHaveBeenCalledWith(30);
      expect(sdk.setSearchKeyword).not.toHaveBeenCalled();
      expect(screen.getAllByRole('option')).toHaveLength(2);
    });

    it("an app's conversations builder is the one fetched from", async () => {
      covers('CometChatConversations.conversationsRequestBuilder', 'used');
      const builder = appBuilder([conversation({ id: 'carol', name: 'Carol' })]);
      render(<CometChatConversations conversationsRequestBuilder={asBuilder(builder)} />);
      expect(await screen.findByRole('option', { name: /Carol/ })).toBeInTheDocument();
      expect(sdk.fetchNext).not.toHaveBeenCalled();
    });

    it("a search uses the app's search builder; without one, the default builder", async () => {
      covers('CometChatConversations.searchRequestBuilder', 'used', 'default');
      const search = appBuilder([conversation({ id: 'dana', name: 'Dana' })]);
      const view = render(<CometChatConversations searchKeyword="da" searchRequestBuilder={asBuilder(search)} />);
      expect(await screen.findByRole('option', { name: /Dana/ })).toBeInTheDocument();
      expect(sdk.fetchNext).not.toHaveBeenCalled();
      view.unmount();

      render(<CometChatConversations searchKeyword="da" />);
      await loaded();
      expect(sdk.fetchNext).toHaveBeenCalled();
    });

    // Known issue: the keyword is never set on any builder, so searchKeyword (and typing in the
    // search bar) fetches every conversation. `it.fails` passes while the issue is there and fails
    // as soon as this is fixed: then make it `it` and add covers('CometChatConversations.searchKeyword', 'set').
    it.fails('searchKeyword filters the fetch, on the default builder or the search builder', async () => {
      const view = render(<CometChatConversations searchKeyword="al" />);
      await loaded();
      expect(sdk.setSearchKeyword).toHaveBeenCalledWith('al');
      view.unmount();

      const search = appBuilder([conversation({ id: 'dana', name: 'Dana' })]);
      render(<CometChatConversations searchKeyword="da" searchRequestBuilder={asBuilder(search)} />);
      await screen.findByRole('option', { name: /Dana/ });
      expect(search.setSearchKeyword).toHaveBeenCalledWith('da');
    });
  });

  describe('callbacks', () => {
    it('onItemClick gets the clicked conversation', async () => {
      covers('CometChatConversations.onItemClick', 'called');
      const onItemClick = vi.fn();
      render(<CometChatConversations onItemClick={onItemClick} />);
      fireEvent.click(await loaded());
      expect(onItemClick).toHaveBeenCalledWith(alice);
    });

    it('onSelect reports a selection and a deselection', async () => {
      covers('CometChatConversations.onSelect', 'called');
      const onSelect = vi.fn();
      render(<CometChatConversations selectionMode="multiple" onSelect={onSelect} />);
      fireEvent.click(await loaded());
      expect(onSelect).toHaveBeenLastCalledWith(alice, true);
      fireEvent.click(row('Alice'));
      expect(onSelect).toHaveBeenLastCalledWith(alice, false);
    });

    it('onError gets the error when fetching fails', async () => {
      covers('CometChatConversations.onError', 'called');
      const error = { code: 'ERR', message: 'no network' };
      sdk.fetchNext.mockRejectedValue(error);
      const onError = vi.fn();
      render(<CometChatConversations onError={onError} />);
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('onEmpty fires when the first fetch finds nothing', async () => {
      covers('CometChatConversations.onEmpty', 'called');
      sdk.fetchNext.mockResolvedValue([]);
      const onEmpty = vi.fn();
      render(<CometChatConversations onEmpty={onEmpty} />);
      await waitFor(() => {
        expect(onEmpty).toHaveBeenCalled();
      });
    });

    it('onSearchBarClicked makes the search bar a button that calls it', async () => {
      covers('CometChatConversations.onSearchBarClicked', 'called');
      const onSearchBarClicked = vi.fn();
      render(<CometChatConversations onSearchBarClicked={onSearchBarClicked} />);
      await loaded();
      fireEvent.click(screen.getByRole('searchbox'));
      expect(onSearchBarClicked).toHaveBeenCalled();
    });
  });

  describe('selection', () => {
    it('by default rows have no checkbox or radio button', async () => {
      covers('CometChatConversations.selectionMode', 'default', 'none');
      for (const props of [{ selectionMode: 'none' as const }, {}]) {
        const view = render(<CometChatConversations {...props} />);
        await loaded();
        expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
        expect(screen.queryAllByRole('radio')).toHaveLength(0);
        view.unmount();
      }
    });

    it('single gives each row a radio button, and picking another moves the selection', async () => {
      covers('CometChatConversations.selectionMode', 'single');
      render(<CometChatConversations selectionMode="single" />);
      fireEvent.click(await loaded());
      expect(within(row('Alice')).getByRole('radio')).toBeChecked();
      fireEvent.click(row('Design'));
      expect(within(row('Alice')).getByRole('radio')).not.toBeChecked();
      expect(within(row('Design')).getByRole('radio')).toBeChecked();
    });

    it('multiple gives each row a checkbox and keeps every pick', async () => {
      covers('CometChatConversations.selectionMode', 'multiple');
      render(<CometChatConversations selectionMode="multiple" />);
      fireEvent.click(await loaded());
      fireEvent.click(row('Design'));
      expect(within(row('Alice')).getByRole('checkbox')).toBeChecked();
      expect(within(row('Design')).getByRole('checkbox')).toBeChecked();
    });

    it('activeConversation highlights that row; by default none is', async () => {
      covers('CometChatConversations.activeConversation', 'set', 'default');
      const view = render(<CometChatConversations activeConversation={design} />);
      await loaded();
      expect(row('Design')).toHaveClass('cometchat-conversations__item--active');
      expect(row('Alice')).not.toHaveClass('cometchat-conversations__item--active');
      view.unmount();

      render(<CometChatConversations />);
      await loaded();
      expect(count('.cometchat-conversations__item--active')).toBe(0);
    });
  });

  describe('row content', () => {
    const BADGE = '.cometchat-conversations__item-unread-badge';
    const RECEIPT = '.cometchat-conversations__item-receipt';
    const STATUS = '.cometchat-avatar__status-indicator';
    const GROUP_TYPE = '.cometchat-conversations__item-group-type';

    it.each([
      ['hideUnreadCount', BADGE],
      ['hideUserStatus', STATUS],
      ['hideGroupType', GROUP_TYPE],
    ] as const)('%s hides that part of the row; shown by default', async (prop, selector) => {
      covers('CometChatConversations.hideUnreadCount', 'true', 'false', 'default');
      covers('CometChatConversations.hideUserStatus', 'true', 'false', 'default');
      covers('CometChatConversations.hideGroupType', 'true', 'false', 'default');
      let view = render(<CometChatConversations {...{ [prop]: true }} />);
      await loaded();
      expect(count(selector)).toBe(0);
      view.unmount();
      for (const props of [{ [prop]: false }, {}]) {
        view = render(<CometChatConversations {...props} />);
        await loaded();
        expect(count(selector)).toBe(1);
        view.unmount();
      }
    });

    it('hideReceipts hides the tick on your own last message; shown by default', async () => {
      covers('CometChatConversations.hideReceipts', 'true', 'false', 'default');
      let view = render(<CometChatConversations hideReceipts />);
      await loaded();
      await act(() => Promise.resolve());
      expect(count(RECEIPT)).toBe(0);
      view.unmount();
      for (const props of [{ hideReceipts: false }, {}]) {
        view = render(<CometChatConversations {...props} />);
        await loaded();
        await waitFor(() => {
          expect(count(RECEIPT)).toBe(1);
        });
        view.unmount();
      }
    });

    it("the props win over the app's global settings for status and receipts", async () => {
      covers('CometChatConversations.hideUserStatus', 'overrides-context');
      covers('CometChatConversations.hideReceipts', 'overrides-context');
      let view = render(
        <GlobalConfigProvider config={{ hideUserStatus: true, hideReceipts: true }}>
          <CometChatConversations />
        </GlobalConfigProvider>
      );
      await loaded();
      await act(() => Promise.resolve());
      expect(count(STATUS)).toBe(0);
      expect(count(RECEIPT)).toBe(0);
      view.unmount();

      view = render(
        <GlobalConfigProvider config={{ hideUserStatus: true, hideReceipts: true }}>
          <CometChatConversations hideUserStatus={false} hideReceipts={false} />
        </GlobalConfigProvider>
      );
      await loaded();
      expect(count(STATUS)).toBe(1);
      await waitFor(() => {
        expect(count(RECEIPT)).toBe(1);
      });
    });

    it("a row's own props win over the list's", async () => {
      covers('CometChatConversations.hideUnreadCount', 'overrides-context');
      covers('CometChatConversations.options', 'overrides-context');
      const listOption = vi.fn();
      const rowOption = vi.fn();
      render(
        <CometChatConversations
          hideUnreadCount
          options={() => [{ id: 'list', title: 'From list', onClick: listOption }]}
          itemView={c => (
            <CometChatConversations.Item
              conversation={c}
              hideUnreadCount={false}
              options={() => [{ id: 'row', title: 'From row', onClick: rowOption }]}
            />
          )}
        />
      );
      await loaded();
      expect(count(BADGE)).toBe(1);
      expect(rowOptionLabels(row('Alice'))).toEqual(['From row']);
    });

    it("options replaces the row menu with the app's, acting on that conversation; by default it offers Delete", async () => {
      covers('CometChatConversations.options', 'set', 'default');
      let view = render(<CometChatConversations />);
      await loaded();
      expect(rowOptionLabels(row('Alice'))).toEqual(['Delete conversation']);
      view.unmount();

      const onClick = vi.fn();
      view = render(<CometChatConversations options={() => [{ id: 'mute', title: 'Mute', onClick }]} />);
      await loaded();
      expect(rowOptionLabels(row('Design'))).toEqual(['Mute']);
      const mute = Array.from(document.querySelectorAll<HTMLElement>('.cometchat-context-menu__dropdown-item, .cometchat-context-menu__top-menu-item')).find(
        el => (el.textContent ?? '').includes('Mute') || el.getAttribute('aria-label') === 'Mute'
      );
      if (!mute) throw new Error('the Mute option was not rendered');
      fireEvent.click(mute);
      expect(onClick).toHaveBeenCalledWith(design);
    });

    it('hideDeleteConversation removes Delete from the row menu; offered by default', async () => {
      covers('CometChatConversations.hideDeleteConversation', 'true', 'false', 'default');
      let view = render(<CometChatConversations hideDeleteConversation />);
      await loaded();
      expect(rowOptionLabels(row('Alice'))).toEqual([]);
      view.unmount();
      for (const props of [{ hideDeleteConversation: false }, {}]) {
        view = render(<CometChatConversations {...props} />);
        await loaded();
        expect(rowOptionLabels(row('Alice'))).toContain('Delete conversation');
        view.unmount();
      }
    });

    it('hidePinConversation removes Pin from the row menu when the app has pinning; offered by default', async () => {
      covers('CometChatConversations.hidePinConversation', 'true', 'false', 'default');
      sdk.isPinConversationEnabled.mockResolvedValue(true);
      await resolvePinSaveFeatures();
      let view = render(<CometChatConversations hidePinConversation />);
      await loaded();
      expect(rowOptionLabels(row('Alice'))).not.toContain('Pin conversation');
      view.unmount();
      for (const props of [{ hidePinConversation: false }, {}]) {
        view = render(<CometChatConversations {...props} />);
        await loaded();
        expect(rowOptionLabels(row('Alice'))).toContain('Pin conversation');
        view.unmount();
      }
    });

    it("textFormatters rewrite the last message's preview; by default it shows as sent", async () => {
      covers('CometChatConversations.textFormatters', 'set', 'default');
      let view = render(<CometChatConversations />);
      await loaded();
      expect(row('Alice')).toHaveTextContent('Hi there');
      view.unmount();

      const shout = { priority: 1, format: (text: string) => text.toUpperCase() } as unknown as CometChatTextFormatter;
      view = render(<CometChatConversations textFormatters={[shout]} />);
      await loaded();
      expect(row('Alice')).toHaveTextContent('HI THERE');
    });

    it('lastMessageDateTimeFormat sets how older messages are dated, over the global format; by default day/month/year', async () => {
      covers('CometChatConversations.lastMessageDateTimeFormat', 'set', 'default');
      const date = () => within(row('Alice')).getByRole('time', { hidden: true }).textContent ?? '';
      const year = String(new Date(tenDaysAgo * 1000).getFullYear());

      let view = render(<CometChatConversations />);
      await loaded();
      expect(date()).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      view.unmount();

      view = render(<CometChatConversations lastMessageDateTimeFormat={{ otherDays: 'YYYY' }} />);
      await loaded();
      expect(date()).toBe(year);
      view.unmount();

      // The app's calendar format applies, and the prop wins over it.
      view = render(
        <Calendar>
          <CometChatConversations />
        </Calendar>
      );
      await loaded();
      expect(date()).toMatch(/^\d{2}-\d{4}$/);
      view.unmount();
      render(
        <Calendar>
          <CometChatConversations lastMessageDateTimeFormat={{ otherDays: 'YYYY' }} />
        </Calendar>
      );
      await loaded();
      expect(date()).toBe(year);
    });
  });

  describe('search bar', () => {
    it('showSearchBar shows the search box, and does by default', async () => {
      covers('CometChatConversations.showSearchBar', 'true', 'false', 'default');
      let view = render(<CometChatConversations showSearchBar={false} />);
      await loaded();
      expect(screen.queryByRole('searchbox')).toBeNull();
      view.unmount();
      for (const props of [{ showSearchBar: true }, {}]) {
        view = render(<CometChatConversations {...props} />);
        await loaded();
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
        view.unmount();
      }
    });

    it('searchView replaces the search box', async () => {
      covers('CometChatConversations.searchView', 'custom');
      render(<CometChatConversations searchView={<button type="button">Find</button>} />);
      await loaded();
      expect(screen.getByRole('button', { name: 'Find' })).toBeInTheDocument();
      expect(screen.queryByRole('searchbox')).toBeNull();
    });
  });

  describe('sound for new messages', () => {
    /** A text message from someone else arrives. */
    async function receive() {
      await waitFor(() => {
        expect(messageHandlers.onTextMessageReceived).toBeDefined();
      });
      const incoming = conversation({ id: 'alice', name: 'Alice' });
      sdk.getConversationFromMessage.mockResolvedValue(incoming);
      const message = {
        getSender: () => ({ getUid: () => 'other' }),
        getReceiverType: () => 'user',
        getReadAt: () => 0,
        getDeliveredAt: () => 0,
      };
      await act(async () => {
        messageHandlers.onTextMessageReceived?.(message);
        await Promise.resolve();
      });
    }

    it('plays the default sound by default, and when disableSoundForMessages is false', async () => {
      covers('CometChatConversations.disableSoundForMessages', 'false', 'default');
      covers('CometChatConversations.customSoundForMessages', 'default');
      for (const props of [{ disableSoundForMessages: false }, {}]) {
        sdk.playSound.mockClear();
        const view = render(<CometChatConversations {...props} />);
        await loaded();
        await receive();
        await waitFor(() => {
          expect(sdk.playSound).toHaveBeenCalledWith('incomingMessage', undefined);
        });
        view.unmount();
      }
    });

    it('disableSoundForMessages keeps it quiet', async () => {
      covers('CometChatConversations.disableSoundForMessages', 'true');
      render(<CometChatConversations disableSoundForMessages />);
      await loaded();
      await receive();
      await waitFor(() => {
        expect(sdk.getConversationFromMessage).toHaveBeenCalled();
      });
      await act(() => Promise.resolve());
      expect(sdk.playSound).not.toHaveBeenCalled();
    });

    it('customSoundForMessages plays that sound instead', async () => {
      covers('CometChatConversations.customSoundForMessages', 'set');
      render(<CometChatConversations customSoundForMessages="ding.mp3" />);
      await loaded();
      await receive();
      await waitFor(() => {
        expect(sdk.playSound).toHaveBeenCalledWith('incomingMessage', 'ding.mp3');
      });
    });

    it("the props win over the app's global sound settings", async () => {
      covers('CometChatConversations.disableSoundForMessages', 'overrides-context');
      covers('CometChatConversations.customSoundForMessages', 'overrides-context');
      render(
        <GlobalConfigProvider config={{ disableSoundForMessages: true, customSoundForMessages: 'global.mp3' }}>
          <CometChatConversations disableSoundForMessages={false} customSoundForMessages="ding.mp3" />
        </GlobalConfigProvider>
      );
      await loaded();
      await receive();
      await waitFor(() => {
        expect(sdk.playSound).toHaveBeenCalledWith('incomingMessage', 'ding.mp3');
      });
    });
  });

  describe('views', () => {
    it('custom loading, error and empty views fill those states', async () => {
      covers('CometChatConversations.loadingView', 'custom');
      covers('CometChatConversations.errorView', 'custom');
      covers('CometChatConversations.emptyView', 'custom');
      const views = { loadingView: <i>wait</i>, errorView: <i>broken</i>, emptyView: <i>nothing yet</i> };

      sdk.fetchNext.mockReturnValueOnce(new Promise(() => {}));
      let view = render(<CometChatConversations {...views} />);
      expect(await screen.findByText('wait')).toBeInTheDocument();
      view.unmount();

      sdk.fetchNext.mockRejectedValueOnce(new Error('Fail'));
      view = render(<CometChatConversations {...views} />);
      expect(await screen.findByText('broken')).toBeInTheDocument();
      view.unmount();

      sdk.fetchNext.mockResolvedValueOnce([]);
      render(<CometChatConversations {...views} />);
      expect(await screen.findByText('nothing yet')).toBeInTheDocument();
    });

    it('a custom header replaces the default one', async () => {
      covers('CometChatConversations.headerView', 'custom');
      render(<CometChatConversations headerView={<h2>Inbox</h2>} />);
      await loaded();
      expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Chats' })).toBeNull();
    });

    it('a custom item view draws each row', async () => {
      covers('CometChatConversations.itemView', 'custom');
      render(<CometChatConversations itemView={c => <p>row {c.getConversationId()}</p>} />);
      expect(await screen.findByText('row alice')).toBeInTheDocument();
      expect(screen.getByText('row design')).toBeInTheDocument();
    });

    it('slot views fill their place in the default row', async () => {
      covers('CometChatConversations.leadingView', 'custom');
      covers('CometChatConversations.titleView', 'custom');
      covers('CometChatConversations.subtitleView', 'custom');
      covers('CometChatConversations.trailingView', 'custom');
      render(
        <CometChatConversations
          leadingView={c => <span>L-{c.getConversationId()}</span>}
          titleView={c => <span>T-{c.getConversationId()}</span>}
          subtitleView={c => <span>S-{c.getConversationId()}</span>}
          trailingView={c => <span>R-{c.getConversationId()}</span>}
        />
      );
      for (const text of ['L-alice', 'T-alice', 'S-alice', 'R-alice']) {
        expect(await screen.findByText(text)).toBeInTheDocument();
      }
      expect(row('alice')).not.toHaveTextContent('Hi there');
    });
  });
});
