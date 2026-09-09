import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSavedMessages } from '../CometChatSavedMessages';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { SAVED_MESSAGES_PAGE_SIZE } from '../CometChatSavedMessagesManager';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatThemeContext } from '../../../context/ThemeContext';
import { buildUser } from '../../../testing/mock-builders';
import type { CometChatMessagePlugin } from '../../../plugins/plugin.types';

/**
 * jsdom has no IntersectionObserver. Capture the callbacks so a test can trip the
 * sentinel deliberately rather than depending on layout.
 */
const intersectionCallbacks: IntersectionObserverCallback[] = [];
vi.stubGlobal(
  'IntersectionObserver',
  class {
    constructor(cb: IntersectionObserverCallback) {
      intersectionCallbacks.push(cb);
    }
    observe() {
      /* no-op */
    }
    disconnect() {
      /* no-op */
    }
    unobserve() {
      /* no-op */
    }
  }
);

function triggerIntersection() {
  intersectionCallbacks.forEach(cb =>
    cb(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      null as unknown as IntersectionObserver
    )
  );
}

const loggedInUser = buildUser({ uid: 'me' }) as unknown as CometChat.User;

const textPlugin: CometChatMessagePlugin = {
  id: 'text',
  messageTypes: ['text'],
  messageCategories: ['message'],
  renderBubble: () => React.createElement('span', { 'data-testid': 'bubble' }, 'Body'),
};

const registry = new CometChatPluginRegistry([textPlugin]);

/** A saved row. `savedAt` may legitimately be absent — the list read is the
 *  authority on membership, not the attribute. */
function savedMessage(
  id: number,
  opts: { savedAt?: number; parentMessageId?: number } = {}
): CometChat.BaseMessage {
  return {
    getId: () => id,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({
      getUid: () => 'other',
      getName: () => 'Other',
      getAvatar: () => '',
      getStatus: () => 'online',
    }),
    getReceiverType: () => 'user',
    getReceiverId: () => 'me',
    getReceiver: () => ({ getName: () => 'Other', getAvatar: () => '' }),
    getText: () => 'Hello there',
    getSentAt: () => 1735689600,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMuid: () => `m-${String(id)}`,
    getParentMessageId: () => opts.parentMessageId ?? 0,
    getSavedAt: () => opts.savedAt,
    getPinnedAt: () => undefined,
    isSaved: () => opts.savedAt !== undefined,
    isPinned: () => false,
  } as unknown as CometChat.BaseMessage;
}

let fetchNextMock: ReturnType<typeof vi.fn>;

function mockSavedRequest(pages: CometChat.BaseMessage[][]) {
  let call = 0;
  fetchNextMock = vi.fn(() => Promise.resolve(pages[call++] ?? []));
  vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
    const builder = {
      setLimit: () => builder,
      setSaved: () => builder,
      build: () => ({ fetchPrevious: fetchNextMock, hasMore: () => false }),
    };
    return builder as unknown as CometChat.MessagesRequestBuilder;
  });
}

function renderPanel(props: Record<string, unknown> = {}) {
  return render(
    <CometChatPluginRegistryContext.Provider value={registry}>
      <CometChatThemeContext.Provider value={{ theme: 'light', setTheme: vi.fn() }}>
        <CometChatSavedMessages {...props} />
      </CometChatThemeContext.Provider>
    </CometChatPluginRegistryContext.Provider>
  );
}

beforeEach(() => {
  vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInUser);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CometChatSavedMessages', () => {
  it('titles the panel without a count', async () => {
    mockSavedRequest([[savedMessage(1), savedMessage(2)]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('Saved Messages')).toBeInTheDocument();
    });
    expect(screen.queryByText(/2 Saved/)).toBeNull();
  });

  it('renders rows conversation-style: other party as title, sender in the subtitle', async () => {
    mockSavedRequest([[savedMessage(1)]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    // The 1-1 counterpart, not the logged-in user, names the row.
    expect(screen.getByText('Other')).toBeInTheDocument();
    expect(screen.getByText('Other:')).toBeInTheDocument();
  });

  it('applies custom text formatters to the row preview', async () => {
    const msg = savedMessage(1);
    Object.assign(msg, { getText: () => 'Hello #cool there' });
    mockSavedRequest([[msg]]);

    class HashtagFmt extends CometChatTextFormatter {
      readonly id = 'test-hashtag';
      override customLogicToFormatText(text: string): string {
        return text.replace(/(^|\s|>)#(\w+)/g, '$1<span class="custom-hashtag">#$2</span>');
      }
    }

    renderPanel({ textFormatters: [new HashtagFmt()] });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    const preview = document.querySelector('.cometchat-saved-messages__item-preview');
    expect(preview?.querySelector('.custom-hashtag')?.textContent).toBe('#cool');
    expect(preview?.textContent).toContain('Hello');
  });

  it('renders a custom itemView in place of the default row', async () => {
    mockSavedRequest([[savedMessage(1)]]);
    renderPanel({
      itemView: (m: CometChat.BaseMessage) => (
        <div data-testid="custom-row">row-{String(m.getId())}</div>
      ),
    });
    await waitFor(() => {
      expect(screen.getByTestId('custom-row')).toBeInTheDocument();
    });
    // The default row (sender prefix + list item) is replaced.
    expect(screen.queryByText('Other:')).toBeNull();
  });

  it('labels the sender "You" for the logged-in user\u2019s own message', async () => {
    const own = savedMessage(1);
    Object.assign(own, {
      getSender: () => ({
        getUid: () => 'me',
        getName: () => 'Me',
        getAvatar: () => '',
        getStatus: () => 'online',
      }),
      getReceiverId: () => 'bob',
      getReceiver: () => ({ getName: () => 'Bob', getAvatar: () => '' }),
    });
    mockSavedRequest([[own]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('You:')).toBeInTheDocument();
    });
    // …and the row is still named after the other party.
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders a row even when the receiver is not hydrated', async () => {
    const bare = savedMessage(1);
    Object.assign(bare, { getReceiver: () => undefined });
    mockSavedRequest([[bare]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });

  it('offers Unsave as the only row action, and it does not navigate', async () => {
    const onItemClick = vi.fn();
    mockSavedRequest([[savedMessage(1)]]);
    const { container } = renderPanel({ onItemClick });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    const row = container.querySelector('.cometchat-list-item')!;

    // The action only mounts on hover — that is the spec'd behaviour, not an
    // implementation detail: exactly one option, revealed on hover.
    expect(container.querySelector('.cometchat-saved-messages__item-unsave')).toBeNull();
    fireEvent.mouseEnter(row);

    // Queried by class rather than by accessible name: nwsapi (jsdom's selector
    // engine) throws on a malformed selector while resolving roles inside the
    // CometChatListItem subtree. A browser is unaffected — the label is asserted
    // directly below instead.
    const actions = container.querySelectorAll('.cometchat-saved-messages__item-unsave');
    expect(actions).toHaveLength(1);
    expect(actions[0]).toHaveAttribute('aria-label', 'Unsave message');

    fireEvent.click(actions[0]!);
    expect(onItemClick).not.toHaveBeenCalled();
  });

  it('renders rich text in the preview, the way search and conversations do', async () => {
    const rich = savedMessage(1);
    Object.assign(rich, { getText: () => 'look at this **bold** bit' });
    mockSavedRequest([[rich]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    const preview = container.querySelector('.cometchat-saved-messages__item-preview');
    expect(preview?.querySelector('b')?.textContent).toBe('bold');
  });

  it('prefers the rich-text HTML the editor stored in metadata', async () => {
    const rich = savedMessage(1);
    Object.assign(rich, {
      getText: () => 'plain fallback',
      getMetadata: () => ({ richText: { html: '<b>formatted</b>', hasFormatting: true } }),
    });
    mockSavedRequest([[rich]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    const preview = container.querySelector('.cometchat-saved-messages__item-preview');
    expect(preview?.querySelector('b')?.textContent).toBe('formatted');
  });

  it('shows a media-type icon in the subtitle for an attachment', async () => {
    const image = savedMessage(1);
    Object.assign(image, {
      getType: () => 'image',
      getAttachments: () => [{ getName: () => 'beach.png' }],
      getCaption: () => '',
    });
    mockSavedRequest([[image]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(
      container.querySelector('.cometchat-saved-messages__item-subtitle-icon--image')
    ).toBeTruthy();
    expect(screen.getByText('beach.png')).toBeInTheDocument();
  });

  it('shows the timestamp, and swaps it for the action on hover', async () => {
    mockSavedRequest([[savedMessage(1)]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    // At rest: the date is visible and no action is mounted.
    expect(
      container.querySelector('.cometchat-list-item__trailing-view .cometchat-date')
    ).toBeTruthy();
    expect(container.querySelector('.cometchat-saved-messages__item-unsave')).toBeNull();

    // On hover the trailing view yields its place to the action — the same
    // exchange the conversation list makes.
    fireEvent.mouseEnter(container.querySelector('.cometchat-list-item')!);
    expect(container.querySelector('.cometchat-list-item__trailing-view')).toBeNull();
    expect(container.querySelector('.cometchat-saved-messages__item-unsave')).toBeTruthy();
  });

  it('renders the empty state with an icon, title and subtitle', async () => {
    mockSavedRequest([[]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getByText('No saved messages yet')).toBeInTheDocument();
    });
    expect(container.querySelector('.cometchat-saved-messages__empty-icon')).toBeTruthy();
    expect(
      screen.getByText('Save messages to keep them handy whenever you need them.')
    ).toBeInTheDocument();
  });

  it('shows the conversation-row shimmer while the first page is loading', () => {
    // Never resolves — we want to observe the loading state, not the result.
    vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
      const builder = {
        setLimit: () => builder,
        setSaved: () => builder,
        build: () => ({ fetchPrevious: () => new Promise(() => undefined), hasMore: () => false }),
      };
      return builder as unknown as CometChat.MessagesRequestBuilder;
    });
    const { container } = renderPanel();
    expect(container.querySelector('.cometchat-conversations__loading-state')).toBeTruthy();
  });

  it('renders the empty state when nothing is saved', async () => {
    mockSavedRequest([[]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('No saved messages yet')).toBeInTheDocument();
    });
  });

  it('renders a row per saved message', async () => {
    mockSavedRequest([[savedMessage(1), savedMessage(2)]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
  });

  it('renders rows even when savedAt is absent from the payload', async () => {
    // The list endpoint is the authority on membership; a missing attribute must
    // not drop the row.
    mockSavedRequest([[savedMessage(1)]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });

  it('marks a thread reply with an icon, not parent-message details', async () => {
    mockSavedRequest([[savedMessage(1, { parentMessageId: 55 })]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(container.querySelector('.cometchat-saved-messages__item-thread-icon')).toBeTruthy();
  });

  it('does not mark a top-level message as a thread reply', async () => {
    mockSavedRequest([[savedMessage(1)]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(container.querySelector('.cometchat-saved-messages__item-thread-icon')).toBeNull();
  });

  it('reports the clicked message so the app can navigate', async () => {
    const onItemClick = vi.fn();
    mockSavedRequest([[savedMessage(42)]]);
    const { container } = renderPanel({ onItemClick });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    // The clickable element is the list item itself, inside our listitem wrapper.
    fireEvent.click(container.querySelector('.cometchat-list-item')!);
    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect((onItemClick.mock.calls[0]?.[0] as CometChat.BaseMessage).getId()).toBe(42);
  });

  it('is READ-ONLY — never marks anything read or sends receipts', async () => {
    const markAsRead = vi.spyOn(CometChat, 'markAsRead');
    const markAsDelivered = vi.spyOn(CometChat, 'markAsDelivered');
    mockSavedRequest([[savedMessage(1), savedMessage(2)]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    expect(markAsRead).not.toHaveBeenCalled();
    expect(markAsDelivered).not.toHaveBeenCalled();
  });

  it('surfaces the error state when the first read fails', async () => {
    vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
      const builder = {
        setLimit: () => builder,
        setSaved: () => builder,
        build: () => ({
          fetchPrevious: () => Promise.reject(new Error('offline')),
          hasMore: () => false,
        }),
      };
      return builder as unknown as CometChat.MessagesRequestBuilder;
    });
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('Looks like something went wrong')).toBeInTheDocument();
    });
  });

  it('calls onClose from the header close button', async () => {
    const onClose = vi.fn();
    mockSavedRequest([[savedMessage(1)]]);
    renderPanel({ onClose });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('CometChatSavedMessages — hideUnsaveMessageOption', () => {
  it('drops the Unsave action when hidden', async () => {
    mockSavedRequest([[savedMessage(1)]]);
    const { container } = renderPanel({ hideUnsaveMessageOption: true });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    fireEvent.mouseEnter(container.querySelector('.cometchat-list-item')!);
    expect(container.querySelector('.cometchat-saved-messages__item-unsave')).toBeNull();
  });

  it('keeps the timestamp on hover once the action is gone', async () => {
    // CometChatListItem hides its trailing view only when a menuView exists, so
    // omitting the action must leave the date in place rather than blanking the row.
    mockSavedRequest([[savedMessage(1)]]);
    const { container } = renderPanel({ hideUnsaveMessageOption: true });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    fireEvent.mouseEnter(container.querySelector('.cometchat-list-item')!);
    expect(container.querySelector('.cometchat-list-item__trailing-view')).toBeTruthy();
  });

  it('still offers Unsave by default', async () => {
    mockSavedRequest([[savedMessage(1)]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    fireEvent.mouseEnter(container.querySelector('.cometchat-list-item')!);
    expect(container.querySelector('.cometchat-saved-messages__item-unsave')).toBeTruthy();
  });
});

describe('CometChatSavedMessages — navigation from inside the focus trap', () => {
  it('navigates on a row click despite the panel being tabIndex={-1}', async () => {
    // The panel root carries role="dialog" tabIndex={-1} for its focus trap. The
    // list item's nested-interactive guard used to read that ancestor as a control
    // and swallow every row click — no handler, no API call, no navigation.
    const onItemClick = vi.fn();
    mockSavedRequest([[savedMessage(7)]]);
    const { container } = renderPanel({ onItemClick });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    // Guard the precondition: if the panel stops being a focus trap this test
    // would pass for the wrong reason.
    expect(container.querySelector('[role="dialog"][tabindex="-1"]')).toBeTruthy();

    fireEvent.click(container.querySelector('.cometchat-list-item')!);
    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect((onItemClick.mock.calls[0]?.[0] as CometChat.BaseMessage).getId()).toBe(7);
  });

  it('navigates on a click on the row title', async () => {
    const onItemClick = vi.fn();
    mockSavedRequest([[savedMessage(1)]]);
    renderPanel({ onItemClick });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    fireEvent.click(screen.getByText('Other'));
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });

  it('navigates on a click on the subtitle preview', async () => {
    const onItemClick = vi.fn();
    mockSavedRequest([[savedMessage(1)]]);
    const { container } = renderPanel({ onItemClick });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    fireEvent.click(container.querySelector('.cometchat-saved-messages__item-preview')!);
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });
});

describe('CometChatSavedMessages — request shape', () => {
  it('asks the messages endpoint for saved messages, unscoped', async () => {
    // Saves are user-level and cross-conversation: setting a uid/guid would scope
    // the read to one chat and silently drop the rest.
    const setSaved = vi.fn();
    const setLimit = vi.fn();
    const setUID = vi.fn();
    const setGUID = vi.fn();
    vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
      const builder = {
        setLimit: (n: number) => {
          setLimit(n);
          return builder;
        },
        setSaved: (v: boolean) => {
          setSaved(v);
          return builder;
        },
        setUID: (u: string) => {
          setUID(u);
          return builder;
        },
        setGUID: (g: string) => {
          setGUID(g);
          return builder;
        },
        build: () => ({ fetchPrevious: () => Promise.resolve([]), hasMore: () => false }),
      };
      return builder as unknown as CometChat.MessagesRequestBuilder;
    });

    renderPanel();
    await waitFor(() => {
      expect(setSaved).toHaveBeenCalledWith(true);
    });
    expect(setUID).not.toHaveBeenCalled();
    expect(setGUID).not.toHaveBeenCalled();
    // Whatever the manager's page size is — the point is that it sets one.
    expect(setLimit).toHaveBeenCalledWith(expect.any(Number));
  });
});

describe('CometChatSavedMessages — paging', () => {
  /** Mock the builder so fetchNext yields the given pages in order. */
  function mockPagedRequest(pages: CometChat.BaseMessage[][]) {
    let call = 0;
    const fetchPrevious = vi.fn(() => Promise.resolve(pages[call++] ?? []));
    vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
      const builder = {
        setLimit: () => builder,
        setSaved: () => builder,
        build: () => ({ fetchPrevious }),
      };
      return builder as unknown as CometChat.MessagesRequestBuilder;
    });
    return fetchPrevious;
  }

  /** n saved rows with descending ids, so sentAt ordering is predictable. */
  function rows(from: number, count: number) {
    return Array.from({ length: count }, (_, i) => savedMessage(from + i));
  }

  it('renders no scroll sentinel once the list is complete', async () => {
    // A short first page means the whole list arrived; nothing left to observe.
    mockPagedRequest([rows(1, 3)]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });
    expect(container.querySelector('.cometchat-saved-messages__sentinel')).toBeNull();
  });

  it('loads the next page when the sentinel scrolls into view', async () => {
    const size = SAVED_MESSAGES_PAGE_SIZE;
    mockPagedRequest([rows(1, size), rows(size + 1, 4)]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(size);
    });

    // The sentinel is present while more may exist; tripping the observer is what
    // a scroll to the bottom does.
    expect(container.querySelector('.cometchat-saved-messages__sentinel')).toBeTruthy();
    act(() => {
      triggerIntersection();
    });

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(size + 4);
    });
    // Exhausted — the sentinel goes away rather than driving an empty fetch.
    expect(container.querySelector('.cometchat-saved-messages__sentinel')).toBeNull();
  });
});
