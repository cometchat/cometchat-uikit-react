/**
 * Unit tests for CometChatSearchMessagesList: section visibility and states,
 * per-type rendering (title, subtitle, date separators, leading and trailing
 * views), custom view overrides, row activation, and both pagination modes.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  state: {
    messages: [] as unknown[],
    fetchState: 'idle' as string,
    hasMore: false,
    loadMore: vi.fn(),
  },
  hookOptions: undefined as Record<string, unknown> | undefined,
  subtitle: vi.fn((_m: unknown, opts: { includeSenderPrefix?: boolean }) =>
    opts.includeSenderPrefix ? 'Bob: preview' : 'preview'
  ),
}));

vi.mock('../useCometChatSearchMessages', () => ({
  useCometChatSearchMessages: (options: Record<string, unknown>) => {
    mocks.hookOptions = options;
    return mocks.state;
  },
}));

vi.mock('../../../utils/messageSubtitle', () => ({ getMessageSubtitle: mocks.subtitle }));

vi.mock('../../../CometChatUIKit/CometChatUIKit', () => ({
  CometChatUIKit: { getLoggedInUser: () => ({ getUid: () => 'me' }) },
}));

import { CometChatSearchMessagesList } from '../CometChatSearchMessagesList';
import { CometChatSearchContext } from '../CometChatSearch.context';
import type { CometChatSearchContextValue } from '../CometChatSearch.types';

interface MsgOptions {
  id: number;
  type?: string;
  sentAt?: number;
  text?: string;
  metadata?: Record<string, unknown>;
  parentId?: number;
  attachments?: string[];
}

function msg({ id, type = 'text', sentAt = 1_760_000_000, text = 'hello', metadata, parentId = 0, attachments = [] }: MsgOptions) {
  return {
    getId: () => id,
    getType: () => type,
    getSentAt: () => sentAt,
    getText: () => text,
    getMetadata: () => metadata,
    getParentMessageId: () => parentId,
    getSender: () => ({ getName: () => 'Bob' }),
    getReceiver: () => ({ getName: () => 'Design Team' }),
    getAttachments: () => attachments.map(url => ({ getUrl: () => url })),
  };
}

const withLinkPreview = (favicon?: string) => ({
  '@injected': { extensions: { 'link-preview': { links: [{ favicon }] } } },
});

function renderList(ctx: Partial<CometChatSearchContextValue> = {}, props: Record<string, unknown> = {}) {
  const value = {
    searchText: 'figma',
    activeFilters: [],
    hideMessagesSection: false,
    bothScopesActive: false,
    textFormatters: [],
    handleMessageClick: vi.fn(),
    handleError: vi.fn(),
    handleMessagesStateChange: vi.fn(),
    ...ctx,
  } as unknown as CometChatSearchContextValue;
  const utils = render(
    <CometChatSearchContext.Provider value={value}>
      <CometChatSearchMessagesList {...props} />
    </CometChatSearchContext.Provider>
  );
  return { ...utils, ctx: value };
}

function loaded(messages: unknown[], hasMore = false) {
  mocks.state.fetchState = 'loaded';
  mocks.state.messages = messages;
  mocks.state.hasMore = hasMore;
}

const item = (id: number) => screen.getByTestId(`search-message-item-${String(id)}`);

describe('CometChatSearchMessagesList', () => {
  let observers: { cb: IntersectionObserverCallback; disconnect: ReturnType<typeof vi.fn> }[];

  beforeEach(() => {
    mocks.state = { messages: [], fetchState: 'idle', hasMore: false, loadMore: vi.fn() };
    mocks.subtitle.mockClear();
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

  describe('section and states', () => {
    it('renders nothing when hidden', () => {
      expect(renderList({ hideMessagesSection: true }).container).toBeEmptyDOMElement();
    });

    it('shows loading, empty and error views, honouring custom views and suppression', () => {
      mocks.state.fetchState = 'loading';
      let r = renderList();
      expect(r.container.querySelectorAll('.cometchat-search__shimmer-item')).toHaveLength(3);
      r.unmount();
      r = renderList({ loadingView: <i>loading…</i> });
      expect(screen.getByText('loading…')).toBeInTheDocument();
      r.unmount();

      mocks.state.fetchState = 'empty';
      r = renderList();
      expect(r.container.querySelector('.cometchat-search__section-empty-view')).not.toBeNull();
      r.unmount();
      r = renderList({ bothScopesActive: true });
      expect(r.container.querySelector('.cometchat-search__section-empty-view')).toBeNull();
      r.unmount();

      mocks.state.fetchState = 'error';
      r = renderList({ errorView: <i>oops</i> });
      expect(screen.getByText('oops')).toBeInTheDocument();
      r.unmount();
      r = renderList();
      expect(r.container.querySelector('.cometchat-search__section-error-view')).not.toBeNull();
    });
  });

  describe('result rows', () => {
    it('unscoped: titled by the conversation, subtitle prefixed with the sender', () => {
      loaded([msg({ id: 1 })]);
      renderList();
      expect(item(1).querySelector('.cometchat-search__messages-list-item-title')?.textContent).toBe('Design Team');
      expect(item(1).querySelector('.cometchat-search__messages-list-item-subtitle-content')?.textContent).toBe('Bob: preview');
      expect(mocks.subtitle.mock.calls[0]![1]).toMatchObject({ loggedInUserId: 'me', includeSenderPrefix: true });
    });

    it('inside one conversation: titled by the sender, no sender prefix', () => {
      loaded([msg({ id: 1 })]);
      renderList({ uid: 'bob' });
      expect(item(1).querySelector('.cometchat-search__messages-list-item-title')?.textContent).toBe('Bob');
      expect(mocks.subtitle.mock.calls[0]![1]).toMatchObject({ includeSenderPrefix: false });
    });

    it('marks thread replies with a thread icon', () => {
      loaded([msg({ id: 1, parentId: 9 }), msg({ id: 2 })]);
      renderList();
      expect(item(1).querySelector('.cometchat-search__messages-subtitle-icon-thread')).not.toBeNull();
      expect(item(2).querySelector('.cometchat-search__messages-subtitle-icon-thread')).toBeNull();
    });

    it('adds a month separator before the first result and whenever the month changes', () => {
      const oct = Date.UTC(2026, 9, 10) / 1000;
      const oct2 = Date.UTC(2026, 9, 2) / 1000;
      const sep = Date.UTC(2026, 8, 20) / 1000;
      loaded([msg({ id: 1, sentAt: oct }), msg({ id: 2, sentAt: oct2 }), msg({ id: 3, sentAt: sep })]);
      const { container } = renderList();
      const separators = Array.from(container.querySelectorAll('.cometchat-search__messages-date-separator'));
      expect(separators.map(s => s.textContent)).toEqual(['October 2026', 'September 2026']);
    });

    it('leading views: audio and file icons, a link favicon, or a link icon without one', () => {
      loaded([
        msg({ id: 1, type: 'audio' }),
        msg({ id: 2, type: 'file' }),
        msg({ id: 3, metadata: withLinkPreview('https://x.test/favicon.ico') }),
        msg({ id: 4, text: 'see https://cometchat.com docs' }),
        msg({ id: 5, text: 'plain words' }),
      ]);
      renderList();
      expect(item(1).querySelector('.cometchat-search__messages-leading-view--audio')).not.toBeNull();
      expect(item(2).querySelector('.cometchat-search__messages-leading-view-file-icon')).not.toBeNull();
      expect(item(3).querySelector('.cometchat-search__messages-leading-view-link-img')?.getAttribute('src')).toBe(
        'https://x.test/favicon.ico'
      );
      expect(item(4).querySelector('.cometchat-search__messages-leading-view--link .cometchat-search__messages-leading-view-icon')).not.toBeNull();
      expect(item(5).querySelector('.cometchat-search__messages-leading-view')).toBeNull();
    });

    it('trailing views: image with overflow count, video thumbnail or play button, otherwise the date', () => {
      loaded([
        msg({ id: 1, type: 'image', attachments: ['https://x.test/a.png', 'b', 'c'] }),
        msg({
          id: 2,
          type: 'video',
          attachments: ['v1'],
          metadata: { '@injected': { extensions: { 'thumbnail-generation': { url_medium: 'https://x.test/t.jpg' } } } },
        }),
        msg({ id: 3, type: 'video', attachments: ['v1', 'v2'] }),
        msg({ id: 4, sentAt: Date.UTC(2026, 9, 10) / 1000 }),
      ]);
      renderList();

      expect(item(1).querySelector('.cometchat-search__messages-trailing-view img')?.getAttribute('src')).toBe('https://x.test/a.png');
      expect(item(1).querySelector('.cometchat-search__messages-trailing-overlay')?.textContent).toBe('+2');
      expect(item(2).querySelector('.cometchat-search__messages-trailing-view--video img')?.getAttribute('src')).toBe('https://x.test/t.jpg');
      expect(item(2).querySelector('.cometchat-search__messages-video-play-button')).not.toBeNull();
      expect(item(3).querySelector('.cometchat-search__messages-trailing-overlay')?.textContent).toBe('+1');
      expect(item(4).querySelector('.cometchat-search__messages-trailing-view--date')?.textContent).toMatch(/2026/);
    });

    it('custom views replace the defaults', () => {
      loaded([msg({ id: 1 })]);
      renderList({
        messageLeadingView: () => <i>L</i>,
        messageTitleView: () => <i>T</i>,
        messageSubtitleView: () => <i>S</i>,
        messageTrailingView: () => <i>R</i>,
      } as never);
      expect(item(1).textContent).toBe('LTSR');
    });

    it('a custom item view replaces the whole row', () => {
      loaded([msg({ id: 1 })]);
      renderList({ messageItemView: () => <b>whole row</b> } as never);
      expect(screen.getByText('whole row')).toBeInTheDocument();
      expect(screen.queryByTestId('search-message-item-1')).toBeNull();
    });

    it('opens a result on click, Enter or Space', () => {
      loaded([msg({ id: 1 })]);
      const { ctx } = renderList();
      fireEvent.click(item(1));
      fireEvent.keyDown(item(1), { key: 'Enter' });
      fireEvent.keyDown(item(1), { key: ' ' });
      fireEvent.keyDown(item(1), { key: 'a' });
      expect(ctx.handleMessageClick).toHaveBeenCalledTimes(3);
      expect(ctx.handleMessageClick).toHaveBeenLastCalledWith({ message: mocks.state.messages[0], searchKeyword: 'figma' });
    });
  });

  describe('pagination', () => {
    it('unscoped with no filters: "See more" loads the next page', () => {
      loaded([msg({ id: 1 })], true);
      renderList();
      expect(mocks.hookOptions?.alwaysShowSeeMore).toBe(true);
      fireEvent.click(screen.getByTestId('search-messages-see-more'));
      expect(mocks.state.loadMore).toHaveBeenCalled();
      expect(observers).toHaveLength(0);
    });

    it('inside one conversation: pages by scrolling to a sentinel', () => {
      loaded([msg({ id: 1 })], true);
      const { unmount } = renderList({ guid: 'g1' });
      expect(screen.queryByTestId('search-messages-see-more')).toBeNull();
      expect(observers).toHaveLength(1);
      observers[0]!.cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      expect(mocks.state.loadMore).toHaveBeenCalledTimes(1);
      unmount();
      expect(observers[0]!.disconnect).toHaveBeenCalled();
    });
  });
});
