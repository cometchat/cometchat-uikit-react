/**
 * Unit tests for CometChatNotificationFeedItem: read/unread presentation,
 * activation by click and keyboard, card JSON and theme forwarding, card
 * actions (and that they don't double as an item click), and visibility
 * registration.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

interface CardProps {
  cardJson: string;
  themeMode: string;
  themeOverride?: Record<string, unknown>;
  onAction: (event: unknown) => void;
}

const card = vi.hoisted(() => ({ props: null as CardProps | null }));

vi.mock('@cometchat/cards-react', () => ({
  CometChatCardView: (props: CardProps) => {
    card.props = props;
    return (
      <div data-testid="card">
        <span>card body</span>
        <button onClick={() => props.onAction({ action: { type: 'openUrl', params: {} } })}>
          Track order
        </button>
      </div>
    );
  },
}));

vi.mock('../../base/CometChatDate', () => ({
  CometChatDate: ({ timestamp }: { timestamp: number }) => <time>{timestamp}</time>,
}));

import { CometChatNotificationFeedItem } from '../CometChatNotificationFeedItem';
import { CometChatNotificationFeedContext } from '../CometChatNotificationFeed.context';
import type {
  CometChatNotificationFeedContextValue,
  NotificationFeedItem,
} from '../CometChatNotificationFeed.types';

function feedItem(overrides: Partial<NotificationFeedItem> = {}): NotificationFeedItem {
  return {
    getId: () => 'n1',
    getSentAt: () => 1700000000,
    getReadAt: () => null,
    setReadAt: vi.fn(),
    getContent: () => ({ version: '1.0', body: [] }),
    getCategory: () => 'Orders',
    ...overrides,
  };
}

function renderItem(
  item: NotificationFeedItem = feedItem(),
  ctx: Partial<CometChatNotificationFeedContextValue> = {},
  props: { cardThemeMode?: 'light' | 'dark' | 'auto'; cardThemeOverride?: Record<string, unknown> } = {}
) {
  card.props = null;
  const value = {
    cardThemeMode: 'auto',
    reportClicked: vi.fn(),
    observeItem: vi.fn(),
    onItemClick: vi.fn(),
    onActionClick: vi.fn(),
    ...ctx,
  } as unknown as CometChatNotificationFeedContextValue;
  const utils = render(
    <CometChatNotificationFeedContext.Provider value={value}>
      <CometChatNotificationFeedItem item={item} {...props} />
    </CometChatNotificationFeedContext.Provider>
  );
  return { ...utils, ctx: value, article: within(utils.container).getByRole('article') };
}

describe('CometChatNotificationFeedItem', () => {
  it('marks an unread item with an indicator and modifier class', () => {
    const { article, container } = renderItem();
    expect(article).toHaveClass('cometchat-notification-feed__item--unread');
    expect(container.querySelector('.cometchat-notification-feed__unread-indicator')).not.toBeNull();
  });

  it('shows no unread indicator for a read item', () => {
    const { article, container } = renderItem(feedItem({ getReadAt: () => 1700000100 }));
    expect(article).not.toHaveClass('cometchat-notification-feed__item--unread');
    expect(container.querySelector('.cometchat-notification-feed__unread-indicator')).toBeNull();
  });

  it('labels the item with its category and sent time', () => {
    const { article } = renderItem();
    expect(article).toHaveAccessibleName('Notification from Orders');
    expect(article).toHaveAttribute('data-feed-item-id', 'n1');
    expect(article).toHaveTextContent('Orders');
    expect(screen.getByText('1700000000')).toBeInTheDocument();
  });

  it('reports a click and calls onItemClick when activated by mouse, Enter or Space', () => {
    const item = feedItem();
    const { article, ctx } = renderItem(item);

    fireEvent.click(article);
    fireEvent.keyDown(article, { key: 'Enter' });
    fireEvent.keyDown(article, { key: ' ' });
    fireEvent.keyDown(article, { key: 'Tab' });

    expect(ctx.onItemClick).toHaveBeenCalledTimes(3);
    expect(ctx.onItemClick).toHaveBeenCalledWith(item);
    expect(ctx.reportClicked).toHaveBeenCalledTimes(3);
  });

  it('still reports the click when no onItemClick is provided', () => {
    const { article, ctx } = renderItem(feedItem(), { onItemClick: undefined });
    fireEvent.click(article);
    expect(ctx.reportClicked).toHaveBeenCalledTimes(1);
  });

  it('treats a click on non-interactive card content as an item click', () => {
    const { ctx } = renderItem();
    fireEvent.click(screen.getByText('card body'));
    expect(ctx.onItemClick).toHaveBeenCalledTimes(1);
  });

  it('runs a card action without also triggering the item click', () => {
    const item = feedItem();
    const { ctx } = renderItem(item);

    fireEvent.click(screen.getByRole('button', { name: 'Track order' }));

    expect(ctx.onActionClick).toHaveBeenCalledWith(item, { type: 'openUrl', params: {} });
    expect(ctx.reportClicked).toHaveBeenCalledTimes(1);
    expect(ctx.onItemClick).not.toHaveBeenCalled();
  });

  it('ignores card events that carry no action', () => {
    const { ctx } = renderItem();
    card.props?.onAction({});
    expect(ctx.onActionClick).not.toHaveBeenCalled();
    expect(ctx.reportClicked).not.toHaveBeenCalled();
  });

  it('reports the action click even when no onActionClick is provided', () => {
    const { ctx } = renderItem(feedItem(), { onActionClick: undefined });
    card.props?.onAction({ action: { type: 'x', params: {} } });
    expect(ctx.reportClicked).toHaveBeenCalledTimes(1);
  });

  // Known issue: the item's onKeyDown handles Enter/Space bubbling from buttons inside the card, unlike the click path which stops them.
  it.fails('does not trigger the item click when Enter is pressed on a card button', () => {
    const { ctx } = renderItem();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Track order' }), { key: 'Enter' });
    expect(ctx.onItemClick).not.toHaveBeenCalled();
  });

  it('passes string content to the card unchanged and serialises object content', () => {
    renderItem(feedItem({ getContent: () => '{"raw":true}' }));
    expect(card.props?.cardJson).toBe('{"raw":true}');

    renderItem(feedItem({ getContent: () => ({ version: '1.0' }) }));
    expect(card.props?.cardJson).toBe('{"version":"1.0"}');
  });

  it('renders no card when the content cannot be read', () => {
    renderItem(
      feedItem({
        getContent: () => {
          throw new Error('corrupt');
        },
      })
    );
    expect(screen.queryByTestId('card')).toBeNull();
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('uses the context card theme unless the item props override it', () => {
    const ctxOverride = { primary: 'red' };
    renderItem(feedItem(), { cardThemeMode: 'dark', cardThemeOverride: ctxOverride });
    expect(card.props).toMatchObject({ themeMode: 'dark', themeOverride: ctxOverride });

    const propOverride = { primary: 'blue' };
    renderItem(feedItem(), { cardThemeMode: 'dark' }, {
      cardThemeMode: 'light',
      cardThemeOverride: propOverride,
    });
    expect(card.props).toMatchObject({ themeMode: 'light', themeOverride: propOverride });
  });

  it('registers its element for visibility tracking', () => {
    const item = feedItem();
    const { ctx, article } = renderItem(item);
    expect(ctx.observeItem).toHaveBeenCalledWith(article, item);
  });
});
