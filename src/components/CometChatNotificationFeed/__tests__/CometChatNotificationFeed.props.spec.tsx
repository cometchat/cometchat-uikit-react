/**
 * The public props of <CometChatNotificationFeed /> (and its Root), one case each: the prop is set (or
 * left out) on the real component, whose cards go through the real card renderer, and the test checks
 * what it changes. Only the SDK is mocked; jsdom's missing matchMedia is stubbed so a test can choose
 * the system colour scheme the cards follow in `auto` mode.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatNotificationFeed } from '../CometChatNotificationFeed';
import type {
  CometChatNotificationFeedProps,
  NotificationFeedItem,
} from '../CometChatNotificationFeed.types';
import { CometChatProvider } from '../../../context/CometChatProvider';
import { covers } from '../../../testing/covers';

interface FeedRequestConfig {
  limit: number;
  category: string | null;
}

const sdk = vi.hoisted(() => ({
  /** fetchNext of a feed request built with the SDK's builder, given that request's settings. */
  feed: vi.fn(),
  feedRequests: [] as FeedRequestConfig[],
  /** fetchNext of a categories request built with the SDK's builder. */
  categories: vi.fn(),
  categoryRequests: [] as { limit: number }[],
  reportFeedEngagement: vi.fn(),
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

  class NotificationFeedRequestBuilder extends SDK.NotificationFeedRequestBuilder {
    override build() {
      const config = { limit: this.getLimit(), category: this.getCategoryFilter() };
      sdk.feedRequests.push(config);
      return { fetchNext: () => sdk.feed(config) } as unknown as CometChat.NotificationFeedRequest;
    }
  }
  class NotificationCategoriesRequestBuilder extends SDK.NotificationCategoriesRequestBuilder {
    override build() {
      const config = { limit: this.getLimit() };
      sdk.categoryRequests.push(config);
      return {
        fetchNext: () => sdk.categories(config),
      } as unknown as CometChat.NotificationCategoriesRequest;
    }
  }
  patch('NotificationFeedRequestBuilder', NotificationFeedRequestBuilder);
  patch('NotificationCategoriesRequestBuilder', NotificationCategoriesRequestBuilder);
  patch('getNotificationFeedUnreadCount', () => Promise.resolve({ count: 0 }));
  patch('markFeedItemAsDelivered', resolved);
  patch('markFeedItemAsRead', resolved);
  patch('reportFeedEngagement', (item: unknown, type: unknown) => {
    sdk.reportFeedEngagement(item, type);
    return Promise.resolve();
  });
  patch('addNotificationFeedListener', noop);
  patch('removeNotificationFeedListener', noop);
  return actual;
});

const SENT_AT = Math.floor(Date.now() / 1000);

const TRACK = { type: 'openUrl', url: 'https://example.com/track/42' };

/** A card in the Card Schema: a headline, optionally with a button. */
function card(headline: string, withButton = false) {
  return {
    version: '1.0',
    body: [
      { type: 'text', id: 'headline', content: headline },
      ...(withButton ? [{ type: 'button', id: 'track', label: 'Track order', action: TRACK }] : []),
    ],
  };
}

function feedItem(id: string, category: string, content: Record<string, unknown>) {
  return new CometChat.NotificationFeedItem({ id, category, content, sentAt: SENT_AT, readAt: null });
}

const shipped = feedItem('n1', 'Orders', card('Your order shipped', true));
const sale = feedItem('n2', 'Promos', card('20% off this weekend'));

const ordersCategory = new CometChat.NotificationCategory({ id: 'orders', label: 'Orders' });
const promosCategory = new CometChat.NotificationCategory({ id: 'promos', label: 'Promos' });

/** The colour scheme the system reports to `prefers-color-scheme` (cards follow it in auto mode). */
let systemScheme: 'light' | 'dark' = 'light';

// The card renderer's default text colours (@cometchat/cards DEFAULT_THEME.textColor).
const LIGHT_TEXT = '#141414';
const DARK_TEXT = '#E8E8E8';

type Props = Partial<CometChatNotificationFeedProps>;
function show(props: Props = {}) {
  return render(<CometChatNotificationFeed {...props} />);
}

const headline = (text = 'Your order shipped') => screen.findByText(text);
const backButton = () => screen.queryByRole('button', { name: 'Back' });
const title = () => screen.queryByRole('heading', { level: 2 });
const chips = () => screen.queryByRole('tablist', { name: 'Filter notifications by category' });

beforeEach(() => {
  sdk.feed.mockReset().mockResolvedValue([shipped]);
  sdk.feedRequests.length = 0;
  sdk.categories.mockReset().mockResolvedValue([ordersCategory, promosCategory]);
  sdk.categoryRequests.length = 0;
  sdk.reportFeedEngagement.mockReset();
  systemScheme = 'light';
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' && systemScheme === 'dark',
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
});

describe('CometChatNotificationFeed props', () => {
  describe('what the feed fetches', () => {
    it('by default the feed and its categories come from the SDK: 10 items a page, 50 categories', async () => {
      covers('CometChatNotificationFeed.notificationFeedRequestBuilder', 'default');
      covers('CometChatNotificationFeed.notificationCategoriesRequestBuilder', 'default');
      show();
      expect(await headline()).toBeInTheDocument();
      expect(await screen.findByRole('tab', { name: 'Orders' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Promos' })).toBeInTheDocument();
      expect(sdk.feedRequests).toEqual([{ limit: 10, category: null }]);
      expect(sdk.categoryRequests).toEqual([{ limit: 50 }]);
    });

    it("notificationFeedRequestBuilder: the app's request is the one the feed is fetched from", async () => {
      covers('CometChatNotificationFeed.notificationFeedRequestBuilder', 'used');
      sdk.feed.mockImplementation((request: FeedRequestConfig) =>
        Promise.resolve(request.category === 'Promos' ? [sale] : [shipped])
      );
      const promosOnly = new CometChat.NotificationFeedRequestBuilder()
        .setLimit(5)
        .setCategory('Promos')
        .build();
      show({ notificationFeedRequestBuilder: promosOnly });
      expect(await headline('20% off this weekend')).toBeInTheDocument();
      expect(screen.queryByText('Your order shipped')).toBeNull();
      // The kit built no request of its own.
      expect(sdk.feedRequests).toEqual([{ limit: 5, category: 'Promos' }]);
    });

    it("notificationCategoriesRequestBuilder: the app's request gives the filter chips", async () => {
      covers('CometChatNotificationFeed.notificationCategoriesRequestBuilder', 'used');
      sdk.categories.mockImplementation((request: { limit: number }) =>
        Promise.resolve(request.limit === 1 ? [promosCategory] : [ordersCategory, promosCategory])
      );
      const firstCategoryOnly = new CometChat.NotificationCategoriesRequestBuilder().setLimit(1).build();
      show({ notificationCategoriesRequestBuilder: firstCategoryOnly });
      expect(await screen.findByRole('tab', { name: 'Promos' })).toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: 'Orders' })).toBeNull();
      expect(sdk.categoryRequests).toEqual([{ limit: 1 }]);
    });
  });

  describe('callbacks', () => {
    it('onItemClick gets the clicked notification', async () => {
      covers('CometChatNotificationFeed.onItemClick', 'called');
      const onItemClick = vi.fn();
      show({ onItemClick });
      fireEvent.click(await screen.findByRole('article', { name: 'Notification from Orders' }));
      expect(onItemClick).toHaveBeenCalledTimes(1);
      expect(onItemClick).toHaveBeenCalledWith(shipped);
      expect(sdk.reportFeedEngagement).toHaveBeenCalledWith(shipped, 'clicked');
    });

    it('onError gets the error when the feed fails to load', async () => {
      covers('CometChatNotificationFeed.onError', 'called');
      const error = new CometChat.CometChatException({ code: 'ERR_FEED', message: 'down' });
      sdk.feed.mockRejectedValue(error);
      const onError = vi.fn();
      show({ onError });
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
      expect(await screen.findByText('Oops!')).toBeInTheDocument();
    });

    it('showBackButton shows a back button that calls onBackPress', async () => {
      covers('CometChatNotificationFeed.showBackButton', 'true');
      covers('CometChatNotificationFeed.onBackPress', 'called');
      const onBackPress = vi.fn();
      show({ showBackButton: true, onBackPress });
      await headline();
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(onBackPress).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(screen.getByRole('button', { name: 'Back' }), { key: 'Enter' });
      expect(onBackPress).toHaveBeenCalledTimes(2);
    });

    it('there is no back button when showBackButton is off, or by default', async () => {
      covers('CometChatNotificationFeed.showBackButton', 'false', 'default');
      for (const props of [{ showBackButton: false }, {}]) {
        const view = show({ ...props, onBackPress: vi.fn() });
        await headline();
        expect(backButton()).toBeNull();
        expect(title()).toHaveTextContent('Notifications');
        view.unmount();
      }
    });

    it("the header's own showBackButton and onBackPress win over the feed's", async () => {
      covers('CometChatNotificationFeed.showBackButton', 'overrides-context');
      covers('CometChatNotificationFeed.onBackPress', 'overrides-context');
      const fromFeed = vi.fn();
      const fromHeader = vi.fn();
      let view = show({
        showBackButton: true,
        onBackPress: fromFeed,
        headerView: <CometChatNotificationFeed.Header onBackPress={fromHeader} />,
      });
      await headline();
      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(fromHeader).toHaveBeenCalledTimes(1);
      expect(fromFeed).not.toHaveBeenCalled();
      view.unmount();

      view = show({
        showBackButton: true,
        headerView: <CometChatNotificationFeed.Header showBackButton={false} />,
      });
      await headline();
      expect(backButton()).toBeNull();
      view.unmount();

      show({ headerView: <CometChatNotificationFeed.Header showBackButton /> });
      await headline();
      expect(backButton()).toBeInTheDocument();
    });
  });

  describe('header and chips', () => {
    it('title is the header title; by default "Notifications"', async () => {
      covers('CometChatNotificationFeed.title', 'set', 'default');
      let view = show({ title: 'Inbox' });
      await headline();
      expect(title()).toHaveTextContent('Inbox');
      view.unmount();
      view = show();
      await headline();
      expect(title()).toHaveTextContent('Notifications');
    });

    it("title wins over the app's language and the header's own title wins over it", async () => {
      covers('CometChatNotificationFeed.title', 'overrides-context');
      // In German, the default title is translated...
      let view = render(
        <CometChatProvider locale="de">
          <CometChatNotificationFeed />
        </CometChatProvider>
      );
      await headline();
      expect(title()).toHaveTextContent('Benachrichtigungen');
      view.unmount();
      // ...but the app's title is not.
      view = render(
        <CometChatProvider locale="de">
          <CometChatNotificationFeed title="Inbox" />
        </CometChatProvider>
      );
      await headline();
      expect(title()).toHaveTextContent('Inbox');
      view.unmount();

      show({ title: 'Inbox', headerView: <CometChatNotificationFeed.Header title="Alerts" /> });
      await headline();
      expect(title()).toHaveTextContent('Alerts');
    });

    it('showHeader={false} hides the header', async () => {
      covers('CometChatNotificationFeed.showHeader', 'false');
      show({ showHeader: false, showBackButton: true });
      await headline();
      expect(title()).toBeNull();
      expect(backButton()).toBeNull();
      expect(chips()).toBeInTheDocument();
    });

    it('the header shows when showHeader is on, or by default', async () => {
      covers('CometChatNotificationFeed.showHeader', 'true', 'default');
      for (const props of [{ showHeader: true }, {}]) {
        const view = show(props);
        await headline();
        expect(title()).toHaveTextContent('Notifications');
        view.unmount();
      }
    });

    it('showFilterChips={false} hides the category chips', async () => {
      covers('CometChatNotificationFeed.showFilterChips', 'false');
      show({ showFilterChips: false });
      await headline();
      await waitFor(() => {
        expect(sdk.categories).toHaveBeenCalled();
      });
      expect(chips()).toBeNull();
      expect(screen.queryByRole('tab')).toBeNull();
    });

    it('the category chips show when showFilterChips is on, or by default', async () => {
      covers('CometChatNotificationFeed.showFilterChips', 'true', 'default');
      for (const props of [{ showFilterChips: true }, {}]) {
        const view = show(props);
        await headline();
        const tabs = within(await screen.findByRole('tablist'));
        expect(await tabs.findByRole('tab', { name: 'Orders' })).toBeInTheDocument();
        expect(tabs.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true');
        view.unmount();
      }
    });
  });

  describe('card theme', () => {
    const headlineColour = async () => getComputedStyle(await headline()).color;
    const rgb = (hex: string) => {
      const probe = document.createElement('p');
      probe.style.color = hex;
      return probe.style.color;
    };

    it('cardThemeMode="light" renders the cards light, whatever the system scheme', async () => {
      covers('CometChatNotificationFeed.cardThemeMode', 'light');
      systemScheme = 'dark';
      show({ cardThemeMode: 'light' });
      expect(await headlineColour()).toBe(rgb(LIGHT_TEXT));
    });

    it('cardThemeMode="dark" renders the cards dark, whatever the system scheme', async () => {
      covers('CometChatNotificationFeed.cardThemeMode', 'dark');
      systemScheme = 'light';
      show({ cardThemeMode: 'dark' });
      expect(await headlineColour()).toBe(rgb(DARK_TEXT));
    });

    it('cardThemeMode="auto", the default, follows the system scheme', async () => {
      covers('CometChatNotificationFeed.cardThemeMode', 'auto', 'default');
      for (const props of [{ cardThemeMode: 'auto' as const }, {}]) {
        for (const [scheme, colour] of [
          ['dark', DARK_TEXT],
          ['light', LIGHT_TEXT],
        ] as const) {
          systemScheme = scheme;
          const view = show(props);
          expect(await headlineColour()).toBe(rgb(colour));
          view.unmount();
        }
      }
    });

    it("an item's own cardThemeMode wins over the feed's", async () => {
      covers('CometChatNotificationFeed.cardThemeMode', 'overrides-context');
      show({
        cardThemeMode: 'dark',
        itemView: (item: NotificationFeedItem) => (
          <CometChatNotificationFeed.Item item={item} cardThemeMode="light" />
        ),
      });
      expect(await headlineColour()).toBe(rgb(LIGHT_TEXT));
    });

    it("cardThemeOverride restyles the cards; by default they use the renderer's theme", async () => {
      covers('CometChatNotificationFeed.cardThemeOverride', 'set', 'default');
      const green = { textColor: { light: '#0A6E3C', dark: '#7CE0A8' } };
      let view = show({ cardThemeMode: 'light', cardThemeOverride: green });
      expect(await headlineColour()).toBe(rgb('#0A6E3C'));
      view.unmount();
      view = show({ cardThemeMode: 'dark', cardThemeOverride: green });
      expect(await headlineColour()).toBe(rgb('#7CE0A8'));
      view.unmount();
      show({ cardThemeMode: 'light' });
      expect(await headlineColour()).toBe(rgb(LIGHT_TEXT));
    });

    it("an item's own cardThemeOverride wins over the feed's", async () => {
      covers('CometChatNotificationFeed.cardThemeOverride', 'overrides-context');
      show({
        cardThemeMode: 'light',
        cardThemeOverride: { textColor: { light: '#0A6E3C', dark: '#7CE0A8' } },
        itemView: (item: NotificationFeedItem) => (
          <CometChatNotificationFeed.Item
            item={item}
            cardThemeOverride={{ textColor: { light: '#8A1C1C', dark: '#F2A0A0' } }}
          />
        ),
      });
      expect(await headlineColour()).toBe(rgb('#8A1C1C'));
    });
  });

  describe('views', () => {
    it('loadingView shows while the feed loads, instead of the spinner', async () => {
      covers('CometChatNotificationFeed.loadingView', 'custom');
      sdk.feed.mockReturnValue(new Promise(() => undefined));
      show({ loadingView: <p>Checking for news…</p> });
      expect(await screen.findByText('Checking for news…')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).toBeNull();
    });

    it("errorView shows when the feed can't load, instead of the kit's error", async () => {
      covers('CometChatNotificationFeed.errorView', 'custom');
      sdk.feed.mockRejectedValue(new CometChat.CometChatException({ code: 'ERR', message: 'down' }));
      show({ errorView: <p>No news right now</p> });
      expect(await screen.findByText('No news right now')).toBeInTheDocument();
      expect(screen.queryByText('Oops!')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Retry loading notifications' })).toBeNull();
    });

    it("emptyView shows when there are no notifications, instead of the kit's", async () => {
      covers('CometChatNotificationFeed.emptyView', 'custom');
      sdk.feed.mockResolvedValue([]);
      show({ emptyView: <p>All caught up</p> });
      expect(await screen.findByText('All caught up')).toBeInTheDocument();
      expect(screen.queryByText('Nothing here yet')).toBeNull();
    });

    it('headerView replaces the header', async () => {
      covers('CometChatNotificationFeed.headerView', 'custom');
      show({ headerView: <h3>Updates</h3>, showBackButton: true });
      await headline();
      expect(screen.getByRole('heading', { name: 'Updates' })).toBeInTheDocument();
      expect(title()).toBeNull();
      expect(backButton()).toBeNull();
      expect(chips()).toBeInTheDocument();
    });

    it('itemView renders each notification', async () => {
      covers('CometChatNotificationFeed.itemView', 'custom');
      sdk.feed.mockResolvedValue([shipped, sale]);
      show({
        itemView: (item: NotificationFeedItem) => <p>{`${item.getCategory()}: ${item.getId()}`}</p>,
      });
      expect(await screen.findByText('Orders: n1')).toBeInTheDocument();
      expect(screen.getByText('Promos: n2')).toBeInTheDocument();
      expect(screen.queryByRole('article')).toBeNull();
      expect(screen.queryByText('Your order shipped')).toBeNull();
    });

    it("the Root's children replace its whole layout", async () => {
      covers('CometChatNotificationFeed.children', 'custom');
      render(
        <CometChatNotificationFeed.Root title="Inbox">
          <CometChatNotificationFeed.Header />
          <CometChatNotificationFeed.List />
        </CometChatNotificationFeed.Root>
      );
      expect(await headline()).toBeInTheDocument();
      expect(title()).toHaveTextContent('Inbox');
      expect(chips()).toBeNull();
    });
  });
});
