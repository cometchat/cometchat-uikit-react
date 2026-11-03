/**
 * Unit tests for CometChatSearchConversationsList: section visibility, the
 * loading / empty / error / loaded views (and their custom overrides), row
 * activation by click and keyboard, and both pagination modes.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const hook = vi.hoisted(() => ({
  state: {
    conversations: [] as unknown[],
    fetchState: 'idle' as string,
    hasMore: false,
    typingIndicators: new Map(),
    loadMore: vi.fn(),
  },
}));

vi.mock('../useCometChatSearchConversations', () => ({
  useCometChatSearchConversations: () => hook.state,
}));

vi.mock('../../CometChatConversations/CometChatConversationsItem', () => ({
  CometChatConversationsItem: ({ conversation }: { conversation: { getConversationId: () => string } }) => (
    <span data-testid="default-item">{conversation.getConversationId()}</span>
  ),
}));

import { CometChatSearchConversationsList } from '../CometChatSearchConversationsList';
import { CometChatSearchContext } from '../CometChatSearch.context';
import type { CometChatSearchContextValue } from '../CometChatSearch.types';

const conv = (id: string) => ({ getConversationId: () => id });

function renderList(ctx: Partial<CometChatSearchContextValue> = {}, props: Record<string, unknown> = {}) {
  const value = {
    searchText: 'team',
    activeFilters: [],
    hideConversationsSection: false,
    bothScopesActive: false,
    handleConversationClick: vi.fn(),
    handleError: vi.fn(),
    handleConversationsStateChange: vi.fn(),
    ...ctx,
  } as unknown as CometChatSearchContextValue;
  const utils = render(
    <CometChatSearchContext.Provider value={value}>
      <CometChatSearchConversationsList {...props} />
    </CometChatSearchContext.Provider>
  );
  return { ...utils, ctx: value };
}

describe('CometChatSearchConversationsList', () => {
  let observers: { cb: IntersectionObserverCallback; disconnect: ReturnType<typeof vi.fn> }[];

  beforeEach(() => {
    hook.state = { conversations: [], fetchState: 'idle', hasMore: false, typingIndicators: new Map(), loadMore: vi.fn() };
    observers = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        disconnect = vi.fn();
        constructor(cb: IntersectionObserverCallback) {
          observers.push({ cb, disconnect: this.disconnect });
        }
        observe() {}
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing when the section is hidden', () => {
    const { container } = renderList({ hideConversationsSection: true });
    expect(container).toBeEmptyDOMElement();
  });

  it('a prop overrides the context to hide the section', () => {
    const { container } = renderList({}, { hideSection: true });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the loading shimmer, or a custom loading view', () => {
    hook.state.fetchState = 'loading';
    const { container, unmount } = renderList();
    expect(container.querySelectorAll('.cometchat-search__shimmer-item')).toHaveLength(3);
    unmount();

    renderList({ loadingView: <div>custom loading</div> });
    expect(screen.getByText('custom loading')).toBeInTheDocument();
  });

  it('shows the empty view, a custom one, or nothing when suppressed', () => {
    hook.state.fetchState = 'empty';
    const first = renderList();
    expect(first.container.querySelector('.cometchat-search__section-empty-view')).not.toBeNull();
    first.unmount();

    const custom = renderList({ emptyView: <div>nothing here</div> });
    expect(screen.getByText('nothing here')).toBeInTheDocument();
    custom.unmount();

    const suppressed = renderList({ bothScopesActive: true });
    expect(suppressed.container.querySelector('.cometchat-search__section-empty-view')).toBeNull();
  });

  it('shows the error view, or a custom one', () => {
    hook.state.fetchState = 'error';
    const first = renderList();
    expect(first.container.querySelector('.cometchat-search__section-error-view')).not.toBeNull();
    first.unmount();

    renderList({ errorView: <div>search broke</div> });
    expect(screen.getByText('search broke')).toBeInTheDocument();
  });

  it('lists results and opens one on click, Enter or Space', () => {
    hook.state.fetchState = 'loaded';
    hook.state.conversations = [conv('a'), conv('b')];
    const { ctx } = renderList();

    expect(screen.getAllByTestId('default-item').map(n => n.textContent)).toEqual(['a', 'b']);
    const rowB = screen.getByTestId('search-conversation-item-b');
    fireEvent.click(rowB);
    fireEvent.keyDown(rowB, { key: 'Enter' });
    fireEvent.keyDown(rowB, { key: ' ' });
    fireEvent.keyDown(rowB, { key: 'x' });

    expect(ctx.handleConversationClick).toHaveBeenCalledTimes(3);
    expect(ctx.handleConversationClick).toHaveBeenLastCalledWith({ conversation: hook.state.conversations[1], searchKeyword: 'team' });
  });

  it('uses a custom item view when one is provided', () => {
    hook.state.fetchState = 'loaded';
    hook.state.conversations = [conv('a')];
    renderList({ conversationItemView: (c: { getConversationId: () => string }) => <b>custom {c.getConversationId()}</b> } as never);
    expect(screen.getByText('custom a')).toBeInTheDocument();
    expect(screen.queryByTestId('default-item')).toBeNull();
  });

  it('without scroll pagination, offers "See more" when there is another page', () => {
    hook.state.fetchState = 'loaded';
    hook.state.conversations = [conv('a')];
    hook.state.hasMore = true;
    renderList();
    fireEvent.click(screen.getByTestId('search-conversations-see-more'));
    expect(hook.state.loadMore).toHaveBeenCalled();
    expect(observers).toHaveLength(0);
  });

  it('with filters active, pages by scrolling to a sentinel instead', () => {
    hook.state.fetchState = 'loaded';
    hook.state.conversations = [conv('a')];
    hook.state.hasMore = true;
    const { unmount } = renderList({ activeFilters: ['groups'] } as never);

    expect(screen.queryByTestId('search-conversations-see-more')).toBeNull();
    expect(observers).toHaveLength(1);
    observers[0]!.cb([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(hook.state.loadMore).not.toHaveBeenCalled();
    observers[0]!.cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(hook.state.loadMore).toHaveBeenCalledTimes(1);

    unmount();
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });
});
