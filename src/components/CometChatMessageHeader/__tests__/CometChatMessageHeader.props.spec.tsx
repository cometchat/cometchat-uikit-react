/**
 * The public props of <CometChatMessageHeader />, one case each: the prop is set (or left out) on the real
 * component and the test checks what it changes. Only the SDK is mocked; kit events go through a small
 * in-memory bus, and calling is switched on in the kit's settings so the call buttons show.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageHeader } from '../CometChatMessageHeader';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatEvent } from '../../../context/CometChatEvents.types';
import { GlobalConfigProvider } from '../../../context/GlobalConfigContext';
import { LocaleProvider } from '../../../context/locale/LocaleProvider';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/CometChatLocalize';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import type { UIKitSettings } from '../../../CometChatUIKit/UIKitSettings';
import { resetPinSaveFeatures, resolvePinSaveFeatures } from '../../../utils/pinSaveFeatures';
import { buildGroup, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

/** The presence callbacks the SDK calls on a user listener. */
type PresenceListener = Partial<Record<'onUserOnline' | 'onUserOffline', (user: CometChat.User) => void>>;

const sdk = vi.hoisted(() => ({
  initiateCall: vi.fn(),
  callButtons: vi.fn(),
  /** The user listeners attached, by id, as the SDK holds them. */
  userListeners: new Map<string, PresenceListener>(),
}));

// The real SDK's constants (the kit reads them on import), with the calls the header makes mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  const listener = vi.fn((callbacks: unknown) => callbacks);
  return {
    CometChat: Object.assign({}, CometChat, {
      getLoggedinUser: () => Promise.resolve({ getUid: () => 'me', getName: () => 'Me' }),
      UserListener: listener,
      MessageListener: listener,
      GroupListener: listener,
      ConnectionListener: listener,
      CallListener: listener,
      addUserListener: (id: string, userListener: PresenceListener) => {
        sdk.userListeners.set(id, userListener);
      },
      removeUserListener: (id: string) => {
        sdk.userListeners.delete(id);
      },
      addMessageListener: vi.fn(),
      removeMessageListener: vi.fn(),
      addGroupListener: vi.fn(),
      removeGroupListener: vi.fn(),
      addConnectionListener: vi.fn(),
      removeConnectionListener: vi.fn(),
      addCallListener: vi.fn(),
      removeCallListener: vi.fn(),
      initiateCall: sdk.initiateCall,
      isPinMessageEnabled: () => Promise.resolve(true),
    }),
  };
});

// The real call buttons, with what the header hands them recorded.
vi.mock('../../CometChatCallButtons/CometChatCallButtons', async () => {
  const actual = await vi.importActual<typeof import('../../CometChatCallButtons/CometChatCallButtons')>(
    '../../CometChatCallButtons/CometChatCallButtons'
  );
  const Recorded = (props: React.ComponentProps<typeof actual.CometChatCallButtons>) => {
    sdk.callButtons(props);
    return <actual.CometChatCallButtons {...props} />;
  };
  return { CometChatCallButtons: Recorded };
});

const alice = buildUser({ uid: 'alice', name: 'Alice', status: 'online' }) as unknown as CometChat.User;
const design = buildGroup({ guid: 'design', name: 'Design', membersCount: 4 }) as unknown as CometChat.Group;

/** The kit's event bus, in memory, with what was published. */
const published: CometChatEvent[] = [];
const handlers = new Set<(event: CometChatEvent) => void>();
const events = {
  subscribe: (handler: (event: CometChatEvent) => void) => {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  },
  publish: (event: CometChatEvent) => {
    published.push(event);
    handlers.forEach(handler => {
      handler(event);
    });
  },
};

type Props = Partial<React.ComponentProps<typeof CometChatMessageHeader>>;
function show(props: Props = {}) {
  return render(
    <CometChatEventsContext.Provider value={events}>
      <CometChatMessageHeader user={alice} {...props} />
    </CometChatEventsContext.Provider>
  );
}

const header = (container: HTMLElement) => container.querySelector('.cometchat-message-header');
const button = (name: RegExp | string) => screen.queryByRole('button', { name });
const voice = () => button('Voice call');
const video = () => button('Video call');
const search = () => button('Search');
const summary = () => button('Conversation summary');
const more = () => button('More options');
async function menuItems() {
  const toggle = more();
  if (!toggle) return [];
  fireEvent.click(toggle);
  const items = await screen.findAllByRole('menuitem');
  return items.map(item => item.textContent);
}

const DAY_MS = 24 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');
/** The time after "Last seen", once the header shows it. */
const lastSeen = async () => (await screen.findByText('Last seen')).nextElementSibling?.textContent;

/** A presence event, delivered as the SDK delivers one: to every user listener attached. */
function presence(event: keyof PresenceListener, user: CometChat.User) {
  act(() => {
    sdk.userListeners.forEach(listener => {
      listener[event]?.(user);
    });
  });
}

beforeEach(async () => {
  published.length = 0;
  handlers.clear();
  sdk.userListeners.clear();
  sdk.initiateCall.mockReset();
  sdk.callButtons.mockClear();
  vi.spyOn(CometChatUIKit, 'getSettings').mockReturnValue({ isCallingEnabled: () => true } as unknown as UIKitSettings);
  resetPinSaveFeatures();
  await resolvePinSaveFeatures();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CometChatMessageHeader props', () => {
  describe('who the header is for', () => {
    it("user shows the user's name and status; group the group's name and members; by default neither", async () => {
      covers('CometChatMessageHeader.user', 'set', 'default');
      covers('CometChatMessageHeader.group', 'set', 'default');
      let view = show();
      expect(await screen.findByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
      view.unmount();

      view = show({ user: undefined, group: design });
      expect(await screen.findByText('Design')).toBeInTheDocument();
      expect(screen.getByText('4 Members')).toBeInTheDocument();
      view.unmount();

      view = show({ user: undefined });
      expect(view.container.querySelector('.cometchat-message-header__title')?.textContent ?? '').toBe('');
    });

    it('className is added to the header; by default it has only its own', () => {
      covers('CometChatMessageHeader.className', 'set', 'default');
      let view = show({ className: 'app-header' });
      expect(header(view.container)).toHaveClass('app-header');
      view.unmount();
      view = show();
      expect(header(view.container)?.className).toBe('cometchat-message-header cometchat-message-header');
    });

    it("hideUserStatus hides the user's status; shown by default", async () => {
      covers('CometChatMessageHeader.hideUserStatus', 'true', 'false', 'default');
      for (const [props, shown] of [
        [{ hideUserStatus: true }, false],
        [{ hideUserStatus: false }, true],
        [{}, true],
      ] as const) {
        const view = show(props);
        await screen.findByText('Alice');
        expect(screen.queryByText('Online') !== null).toBe(shown);
        view.unmount();
      }
    });

    it("hideUserStatus on the header wins over the app's global setting", async () => {
      covers('CometChatMessageHeader.hideUserStatus', 'overrides-context');
      const inApp = (props: Props) =>
        render(
          <GlobalConfigProvider config={{ hideUserStatus: true }}>
            <CometChatEventsContext.Provider value={events}>
              <CometChatMessageHeader user={alice} {...props} />
            </CometChatEventsContext.Provider>
          </GlobalConfigProvider>
        );
      let view = inApp({});
      await screen.findByText('Alice');
      expect(screen.queryByText('Online')).toBeNull();
      view.unmount();
      view = inApp({ hideUserStatus: false });
      expect(await screen.findByText('Online')).toBeInTheDocument();
    });

    it("an offline user is last seen in the app's calendar format; lastActiveAtDateTimeFormat wins over it", async () => {
      // The SDK's users give their last active time in seconds.
      const tenDaysAgo = Math.floor((Date.now() - 10 * DAY_MS) / 1000);
      const bob = buildUser({ uid: 'bob', name: 'Bob', status: 'offline', lastActiveAt: tenDaysAgo }) as unknown as CometChat.User;
      const date = new Date(tenDaysAgo * 1000);
      // An app sets its date formats once, on the kit's CometChatLocalize, and the LocaleProvider
      // every app has passes them on.
      const localize = new CometChatLocalize();
      localize.init({ calendarObject: { otherDays: 'MM-YYYY' } });
      const inApp = (props: Props) =>
        render(
          <LocaleProvider localizeInstance={localize}>
            <CometChatEventsContext.Provider value={events}>
              <CometChatMessageHeader user={bob} {...props} />
            </CometChatEventsContext.Provider>
          </LocaleProvider>
        );

      const view = inApp({});
      expect(await lastSeen()).toBe(`${pad(date.getMonth() + 1)}-${String(date.getFullYear())}`);
      view.unmount();
      inApp({ lastActiveAtDateTimeFormat: { otherDays: 'YYYY' } });
      expect(await lastSeen()).toBe(String(date.getFullYear()));
    });

    it('a user who goes offline is last seen on the date the presence event gives, in milliseconds', async () => {
      // Older times read as a full date, last week's too, so a time read in the wrong unit shows
      // as a date far off.
      show({ lastActiveAtDateTimeFormat: { lastWeek: 'DD/MM/YYYY', otherDays: 'DD/MM/YYYY' } });
      expect(await screen.findByText('Online')).toBeInTheDocument();

      // A presence event gives the time in milliseconds; the SDK's users give it in seconds.
      const tenDaysAgo = Date.now() - 10 * DAY_MS;
      presence('onUserOffline', buildUser({ uid: 'alice', name: 'Alice', status: 'offline', lastActiveAt: tenDaysAgo }) as unknown as CometChat.User);

      const date = new Date(tenDaysAgo);
      expect(await lastSeen()).toBe(`${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear())}`);
    });

    it('a user last seen yesterday reads "Dün" in Turkish, not with its D read as the day', async () => {
      // A fixed now, so the time is always yesterday and more than a day ago (no "hours ago").
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 9, 31, 15, 0));
      try {
        const lastActiveAt = Math.floor(new Date(2026, 9, 30, 9, 0).getTime() / 1000);
        const bob = buildUser({ uid: 'bob', name: 'Bob', status: 'offline', lastActiveAt }) as unknown as CometChat.User;
        const { container } = render(
          <LocaleProvider localizeInstance={new CometChatLocalize({ language: 'tr' })}>
            <CometChatEventsContext.Provider value={events}>
              <CometChatMessageHeader user={bob} lastActiveAtDateTimeFormat={{ otherDays: 'DD/MM/YYYY' }} />
            </CometChatEventsContext.Provider>
          </LocaleProvider>
        );
        await waitFor(() => {
          expect(container.querySelector('.cometchat-message-header__subtitle--last-active > span:last-child')).toHaveTextContent(/^Dün$/);
        });
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('navigation', () => {
    it('hideBackButton removes the back button; shown by default', () => {
      covers('CometChatMessageHeader.hideBackButton', 'true', 'false', 'default');
      for (const [props, shown] of [
        [{ hideBackButton: true }, false],
        [{ hideBackButton: false }, true],
        [{}, true],
      ] as const) {
        const view = show(props);
        expect(button('Back') !== null).toBe(shown);
        view.unmount();
      }
    });

    it('onBack fires from the back button', () => {
      covers('CometChatMessageHeader.onBack', 'called');
      const onBack = vi.fn();
      show({ onBack });
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(onBack).toHaveBeenCalled();
    });

    it('onItemClick gets the user or group when the name area is clicked', async () => {
      covers('CometChatMessageHeader.onItemClick', 'called');
      const onItemClick = vi.fn();
      let view = show({ onItemClick });
      fireEvent.click(await screen.findByText('Alice'));
      expect(onItemClick).toHaveBeenLastCalledWith(alice);
      view.unmount();
      view = show({ user: undefined, group: design, onItemClick });
      fireEvent.click(await screen.findByText('Design'));
      expect(onItemClick).toHaveBeenLastCalledWith(design);
    });
  });

  describe('options: search, conversation summary, pinned messages', () => {
    it('showSearchOption shows a search button; shown by default', () => {
      covers('CometChatMessageHeader.showSearchOption', 'true', 'false', 'default');
      for (const [props, shown] of [
        [{ showSearchOption: true }, true],
        [{ showSearchOption: false }, false],
        [{}, true],
      ] as const) {
        const view = show(props);
        expect(search() !== null).toBe(shown);
        view.unmount();
      }
    });

    it('onSearchOptionClicked fires from the search button', () => {
      covers('CometChatMessageHeader.onSearchOptionClicked', 'called');
      const onSearchOptionClicked = vi.fn();
      show({ onSearchOptionClicked });
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      expect(onSearchOptionClicked).toHaveBeenCalled();
    });

    it('showConversationSummaryButton offers the summary, alongside search in a menu; not by default', async () => {
      covers('CometChatMessageHeader.showConversationSummaryButton', 'true', 'false', 'default');
      let view = show({ showConversationSummaryButton: true, showSearchOption: false });
      expect(summary()).toBeInTheDocument();
      view.unmount();
      view = show({ showConversationSummaryButton: true });
      expect(await menuItems()).toEqual(['Search', 'Conversation summary']);
      view.unmount();
      for (const props of [{ showConversationSummaryButton: false }, {}]) {
        view = show(props);
        expect(summary()).toBeNull();
        expect(more()).toBeNull();
        view.unmount();
      }
    });

    it('onSummaryClick fires from the summary button instead of opening the kit summary', () => {
      covers('CometChatMessageHeader.onSummaryClick', 'called');
      const onSummaryClick = vi.fn();
      show({ showConversationSummaryButton: true, showSearchOption: false, onSummaryClick });
      fireEvent.click(screen.getByRole('button', { name: 'Conversation summary' }));
      expect(onSummaryClick).toHaveBeenCalled();
      expect(published.filter(e => e.type === 'ui:panel/show')).toHaveLength(0);
    });

    it('summaryGenerationMessageCount is how many messages the kit summary covers; 1000 by default', () => {
      covers('CometChatMessageHeader.summaryGenerationMessageCount', 'set', 'default');
      for (const [props, count] of [
        [{ summaryGenerationMessageCount: 50 }, 50],
        [{}, 1000],
      ] as const) {
        published.length = 0;
        const view = show({ showConversationSummaryButton: true, showSearchOption: false, ...props });
        fireEvent.click(screen.getByRole('button', { name: 'Conversation summary' }));
        expect(published).toContainEqual({
          type: 'ui:panel/show',
          position: 'messageListFooter',
          panel: 'conversationSummary',
          messageCount: count,
        });
        view.unmount();
      }
    });

    it('enableAutoSummaryGeneration opens the summary when a chat opens with 15+ unread; off by default', () => {
      covers('CometChatMessageHeader.enableAutoSummaryGeneration', 'true', 'false', 'default');
      for (const [props, opens] of [
        [{ enableAutoSummaryGeneration: true }, true],
        [{ enableAutoSummaryGeneration: false }, false],
        [{}, false],
      ] as const) {
        const onSummaryClick = vi.fn();
        const view = show({ showConversationSummaryButton: true, onSummaryClick, ...props });
        act(() => {
          events.publish({ type: 'ui:active-chat/changed', unreadMessageCount: 15 } as unknown as CometChatEvent);
        });
        expect(onSummaryClick).toHaveBeenCalledTimes(opens ? 1 : 0);
        view.unmount();
      }
    });

    it('hidePinnedMessagesOption removes Pinned Messages from the menu; offered by default', async () => {
      covers('CometChatMessageHeader.hidePinnedMessagesOption', 'true', 'false', 'default');
      const onPinnedMessagesClicked = vi.fn();
      for (const [props, offered] of [
        [{ hidePinnedMessagesOption: true }, false],
        [{ hidePinnedMessagesOption: false }, true],
        [{}, true],
      ] as const) {
        const view = show({ onPinnedMessagesClicked, ...props });
        const items = await menuItems();
        expect(items.includes('Pinned Messages')).toBe(offered);
        view.unmount();
      }
    });

    it('onPinnedMessagesClicked fires from the menu', async () => {
      covers('CometChatMessageHeader.onPinnedMessagesClicked', 'called');
      const onPinnedMessagesClicked = vi.fn();
      show({ onPinnedMessagesClicked });
      await menuItems();
      fireEvent.click(screen.getByRole('menuitem', { name: 'Pinned Messages' }));
      expect(onPinnedMessagesClicked).toHaveBeenCalled();
    });
  });

  describe('calls', () => {
    it('hideVoiceCallButton removes the voice call button; shown by default', () => {
      covers('CometChatMessageHeader.hideVoiceCallButton', 'true', 'false', 'default');
      for (const [props, shown] of [
        [{ hideVoiceCallButton: true }, false],
        [{ hideVoiceCallButton: false }, true],
        [{}, true],
      ] as const) {
        const view = show(props);
        expect(voice() !== null).toBe(shown);
        expect(video()).not.toBeNull();
        view.unmount();
      }
    });

    it('hideVideoCallButton removes the video call button; shown by default', () => {
      covers('CometChatMessageHeader.hideVideoCallButton', 'true', 'false', 'default');
      for (const [props, shown] of [
        [{ hideVideoCallButton: true }, false],
        [{ hideVideoCallButton: false }, true],
        [{}, true],
      ] as const) {
        const view = show(props);
        expect(video() !== null).toBe(shown);
        expect(voice()).not.toBeNull();
        view.unmount();
      }
    });

    it('onVoiceCallClick and onVideoCallClick get the user instead of the kit starting a call', () => {
      covers('CometChatMessageHeader.onVoiceCallClick', 'called');
      covers('CometChatMessageHeader.onVideoCallClick', 'called');
      const onVoiceCallClick = vi.fn();
      const onVideoCallClick = vi.fn();
      show({ onVoiceCallClick, onVideoCallClick });
      fireEvent.click(screen.getByRole('button', { name: 'Voice call' }));
      fireEvent.click(screen.getByRole('button', { name: 'Video call' }));
      expect(onVoiceCallClick).toHaveBeenCalledWith(alice);
      expect(onVideoCallClick).toHaveBeenCalledWith(alice);
      expect(sdk.initiateCall).not.toHaveBeenCalled();
    });

    it('the call buttons are hidden when calling is not enabled', () => {
      vi.spyOn(CometChatUIKit, 'getSettings').mockReturnValue({ isCallingEnabled: () => false } as unknown as UIKitSettings);
      show();
      expect(voice()).toBeNull();
      expect(video()).toBeNull();
    });

    it("the call buttons follow the header's props when an app places them itself", () => {
      const onVoiceCallClick = vi.fn();
      render(
        <CometChatEventsContext.Provider value={events}>
          <CometChatMessageHeader.Root user={alice} hideVideoCallButton onVoiceCallClick={onVoiceCallClick}>
            <CometChatMessageHeader.CallButtons />
          </CometChatMessageHeader.Root>
        </CometChatEventsContext.Provider>
      );
      expect(video()).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Voice call' }));
      expect(onVoiceCallClick).toHaveBeenCalledWith(alice);
      expect(sdk.initiateCall).not.toHaveBeenCalled();
    });

    it('onError gets the error when starting a call fails', async () => {
      covers('CometChatMessageHeader.onError', 'called');
      const error = { code: 'ERR_CALL', message: 'busy line' };
      sdk.initiateCall.mockRejectedValue(error);
      const onError = vi.fn();
      show({ onError });
      fireEvent.click(screen.getByRole('button', { name: 'Voice call' }));
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('callSettingsBuilder goes to the call buttons; by default they get none and use the global one', () => {
      covers('CometChatMessageHeader.callSettingsBuilder', 'set', 'default');
      const settings = { tag: 'app settings' };
      let view = show({ callSettingsBuilder: settings });
      expect(sdk.callButtons).toHaveBeenLastCalledWith(expect.objectContaining({ callSettingsBuilder: settings }));
      view.unmount();
      sdk.callButtons.mockClear();
      view = show();
      expect(sdk.callButtons).toHaveBeenCalled();
      expect(sdk.callButtons.mock.lastCall?.[0]).toHaveProperty('callSettingsBuilder', undefined);
    });
  });

  describe('views', () => {
    it('leadingView, titleView and subtitleView replace the avatar, name and status, and stay clickable', () => {
      covers('CometChatMessageHeader.leadingView', 'custom');
      covers('CometChatMessageHeader.titleView', 'custom');
      covers('CometChatMessageHeader.subtitleView', 'custom');
      const onItemClick = vi.fn();
      const { container } = show({
        onItemClick,
        leadingView: <b>app-lead</b>,
        titleView: <span>app-title</span>,
        subtitleView: <i>app-sub</i>,
      });
      expect(screen.queryByText('Alice')).toBeNull();
      expect(screen.queryByText('Online')).toBeNull();
      expect(container.querySelector('.cometchat-message-header__content .cometchat-avatar')).toBeNull();
      fireEvent.click(screen.getByText('app-title'));
      expect(onItemClick).toHaveBeenCalledWith(alice);
      expect(screen.getByText('app-lead')).toBeInTheDocument();
      expect(screen.getByText('app-sub')).toBeInTheDocument();
    });

    it('with a view set, the rest of the header still follows its props', () => {
      const onVideoCallClick = vi.fn();
      show({
        subtitleView: <i>app-sub</i>,
        hideVoiceCallButton: true,
        onVideoCallClick,
        showConversationSummaryButton: true,
        showSearchOption: false,
      });
      expect(voice()).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Video call' }));
      expect(onVideoCallClick).toHaveBeenCalledWith(alice);
      expect(summary()).toBeInTheDocument();
      expect(search()).toBeNull();
    });

    it('trailingView replaces the call buttons and options', () => {
      covers('CometChatMessageHeader.trailingView', 'custom');
      const { container } = show({ trailingView: <button type="button">app-trailing</button> });
      const trailing = container.querySelector('.cometchat-message-header__trailing');
      if (!(trailing instanceof HTMLElement)) throw new Error('no trailing area');
      expect(within(trailing).getByRole('button', { name: 'app-trailing' })).toBeInTheDocument();
      expect(voice()).toBeNull();
      expect(video()).toBeNull();
      expect(search()).toBeNull();
    });

    it("auxiliaryButtonView adds the app's buttons after the kit's, which stay", () => {
      covers('CometChatMessageHeader.auxiliaryButtonView', 'custom');
      const { container } = show({ auxiliaryButtonView: <button type="button">app-aux</button> });
      const trailing = container.querySelector('.cometchat-message-header__trailing');
      const buttons = Array.from(trailing?.querySelectorAll('button') ?? []).map(b => b.getAttribute('aria-label') ?? b.textContent);
      expect(buttons).toEqual(['Voice call', 'Video call', 'Search', 'app-aux']);
    });

    it("the Root's children replace its whole layout", () => {
      covers('CometChatMessageHeader.children', 'custom');
      render(
        <CometChatEventsContext.Provider value={events}>
          <CometChatMessageHeader.Root user={alice}>
            <CometChatMessageHeader.Title />
            <p>Only this</p>
          </CometChatMessageHeader.Root>
        </CometChatEventsContext.Provider>
      );
      expect(screen.getByText('Only this')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(button('Back')).toBeNull();
      expect(voice()).toBeNull();
      expect(search()).toBeNull();
    });
  });
});
