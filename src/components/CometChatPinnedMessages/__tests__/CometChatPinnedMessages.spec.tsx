import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPinnedMessages } from '../CometChatPinnedMessages';
import { PINNED_MESSAGES_PAGE_SIZE } from '../CometChatPinnedMessagesManager';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatThemeContext } from '../../../context/ThemeContext';
import { resolvePinSaveFeatures, resetPinSaveFeatures } from '../../../utils/pinSaveFeatures';
import { buildUser, buildGroup } from '../../../testing/mock-builders';
import type { CometChatMessagePlugin } from '../../../plugins/plugin.types';

const loggedInUser = buildUser({ uid: 'me' }) as unknown as CometChat.User;

const textPlugin: CometChatMessagePlugin = {
  id: 'text',
  messageTypes: ['text'],
  messageCategories: ['message'],
  renderBubble: () => React.createElement('span', { 'data-testid': 'bubble' }, 'Body'),
};
const registry = new CometChatPluginRegistry([textPlugin]);

function pinnedMessage(
  id: number,
  opts: { pinnedAt?: number; parentMessageId?: number } = {}
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
    getReceiverType: () => 'group',
    getReceiverId: () => 'g1',
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
    getPinnedAt: () => opts.pinnedAt ?? 1735689600,
    getPinnedBy: () => 'admin',
    getSavedAt: () => undefined,
    isPinned: () => true,
    isSaved: () => false,
  } as unknown as CometChat.BaseMessage;
}

let setGUIDSpy: ReturnType<typeof vi.fn>;
let setUIDSpy: ReturnType<typeof vi.fn>;

function mockPinnedRequest(pages: CometChat.BaseMessage[][]) {
  let call = 0;
  setGUIDSpy = vi.fn();
  setUIDSpy = vi.fn();
  vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
    const builder = {
      setLimit: () => builder,
      setPinned: () => builder,
      setGUID: (g: string) => {
        setGUIDSpy(g);
        return builder;
      },
      setUID: (u: string) => {
        setUIDSpy(u);
        return builder;
      },
      build: () => ({
        fetchPrevious: () => Promise.resolve(pages[call++] ?? []),
        hasMore: () => call < pages.length,
      }),
    };
    return builder as unknown as CometChat.MessagesRequestBuilder;
  });
}

/** A group where the logged-in user holds the given scope. */
function scopedGroup(scope: string) {
  const g = buildGroup() as unknown as CometChat.Group;
  Object.assign(g, {
    getGuid: () => 'g1',
    getScope: () => scope,
    getOwner: () => 'someone-else',
  });
  return g;
}

function renderPanel(props: Record<string, unknown> = {}) {
  return render(
    <CometChatPluginRegistryContext.Provider value={registry}>
      <CometChatThemeContext.Provider value={{ theme: 'light', setTheme: vi.fn() }}>
        <CometChatPinnedMessages
          group={scopedGroup(CometChat.GROUP_MEMBER_SCOPE.ADMIN)}
          {...props}
        />
      </CometChatThemeContext.Provider>
    </CometChatPluginRegistryContext.Provider>
  );
}

beforeEach(async () => {
  vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInUser);
  resetPinSaveFeatures();
  vi.spyOn(CometChat, 'isPinMessageEnabled').mockResolvedValue(true);
  vi.spyOn(CometChat, 'isSaveMessageEnabled').mockResolvedValue(true);
  vi.spyOn(CometChat, 'isPinConversationEnabled').mockResolvedValue(true);
  await resolvePinSaveFeatures();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetPinSaveFeatures();
});

describe('CometChatPinnedMessages', () => {
  it('titles the panel without a count', async () => {
    mockPinnedRequest([[pinnedMessage(1), pinnedMessage(2), pinnedMessage(3)]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('Pinned Messages')).toBeInTheDocument();
    });
    expect(screen.queryByText(/3 Pinned/)).toBeNull();
  });

  it('renders a custom itemView in place of the default bubble', async () => {
    mockPinnedRequest([[pinnedMessage(1)]]);
    renderPanel({
      itemView: (m: CometChat.BaseMessage) => (
        <div data-testid="custom-row">row-{String(m.getId())}</div>
      ),
    });
    await waitFor(() => {
      expect(screen.getByTestId('custom-row')).toBeInTheDocument();
    });
    // The default bubble is replaced.
    expect(screen.queryByTestId('bubble')).toBeNull();
  });

  it('left-aligns every row while keeping the sender colour', async () => {
    // Own message: left-aligned layout, outgoing palette.
    const own = pinnedMessage(1);
    Object.assign(own, {
      getSender: () => ({
        getUid: () => 'me',
        getName: () => 'Me',
        getAvatar: () => '',
        getStatus: () => 'online',
      }),
    });
    mockPinnedRequest([[own]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(container.querySelector('.cometchat-message-bubble-outgoing')).toBeTruthy();
    // Layout stays left — the wrapper never gets the outgoing (right) modifier.
    expect(container.querySelector('.cometchat-message-bubble__wrapper--outgoing')).toBeNull();
  });

  it('renders "You" and an inline date instead of a day divider', async () => {
    const own = pinnedMessage(1);
    Object.assign(own, {
      getSender: () => ({
        getUid: () => 'me',
        getName: () => 'Me',
        getAvatar: () => '',
        getStatus: () => 'online',
      }),
    });
    mockPinnedRequest([[own]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getByText('You')).toBeInTheDocument();
    });
    expect(container.querySelector('.cometchat-pinned-messages__row-header')).toBeTruthy();
    expect(container.querySelector('.cometchat-message-list__date-separator')).toBeNull();
  });

  it('shows the sender name for someone else\u2019s message', async () => {
    mockPinnedRequest([[pinnedMessage(1)]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('Other')).toBeInTheDocument();
    });
  });

  it('does NOT navigate when the click lands on a control inside the bubble', async () => {
    const onItemClick = vi.fn();
    mockPinnedRequest([[pinnedMessage(1)]]);
    const { container } = renderPanel({ onItemClick });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    // A button inside the row belongs to that control, not to the row.
    const row = screen.getAllByRole('listitem')[0]!;
    const probe = document.createElement('button');
    row.appendChild(probe);
    fireEvent.click(probe);
    expect(onItemClick).not.toHaveBeenCalled();

    // …while the row itself still navigates.
    fireEvent.click(row);
    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(container).toBeTruthy();
  });

  it('scopes the request by GUID for a group', async () => {
    mockPinnedRequest([[pinnedMessage(1)]]);
    renderPanel();
    await waitFor(() => {
      expect(setGUIDSpy).toHaveBeenCalledWith('g1');
    });
    expect(setUIDSpy).not.toHaveBeenCalled();
  });

  it('scopes the request by UID for a 1-1 — the two are mutually exclusive', async () => {
    mockPinnedRequest([[pinnedMessage(1)]]);
    const user = buildUser({ uid: 'bob' }) as unknown as CometChat.User;
    render(
      <CometChatPluginRegistryContext.Provider value={registry}>
        <CometChatThemeContext.Provider value={{ theme: 'light', setTheme: vi.fn() }}>
          <CometChatPinnedMessages user={user} />
        </CometChatThemeContext.Provider>
      </CometChatPluginRegistryContext.Provider>
    );
    await waitFor(() => {
      expect(setUIDSpy).toHaveBeenCalledWith('bob');
    });
    expect(setGUIDSpy).not.toHaveBeenCalled();
  });

  it('renders the empty state with an icon, title and subtitle', async () => {
    mockPinnedRequest([[]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getByText('No pinned messages yet')).toBeInTheDocument();
    });
    expect(container.querySelector('.cometchat-pinned-messages__empty-icon')).toBeTruthy();
    expect(
      screen.getByText('Pin important messages to keep them easy to find.')
    ).toBeInTheDocument();
  });

  it('shows the transcript shimmer while the first page is loading', () => {
    // Never resolves — we want to observe the loading state, not the result.
    vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
      const builder = {
        setLimit: () => builder,
        setPinned: () => builder,
        setGUID: () => builder,
        setUID: () => builder,
        build: () => ({ fetchPrevious: () => new Promise(() => undefined), hasMore: () => true }),
      };
      return builder as unknown as CometChat.MessagesRequestBuilder;
    });
    const { container } = renderPanel();
    expect(container.querySelector('.cometchat-message-list__shimmer')).toBeTruthy();
  });

  it('renders the empty state when nothing is pinned', async () => {
    mockPinnedRequest([[]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('No pinned messages yet')).toBeInTheDocument();
    });
  });

  it('shows no thread marker on a pinned thread reply', async () => {
    // Clicking the row opens the thread anyway, so the badge was noise.
    mockPinnedRequest([[pinnedMessage(1, { parentMessageId: 55 })]]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(container.querySelector('[class*="thread-marker"]')).toBeNull();
  });

  it('reports the clicked message so the app can jump the main list', async () => {
    const onItemClick = vi.fn();
    mockPinnedRequest([[pinnedMessage(42)]]);
    renderPanel({ onItemClick });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    fireEvent.click(screen.getAllByRole('listitem')[0] as Element);
    expect((onItemClick.mock.calls[0]?.[0] as CometChat.BaseMessage).getId()).toBe(42);
  });

  it('is READ-ONLY — never marks anything read or sends receipts', async () => {
    const markAsRead = vi.spyOn(CometChat, 'markAsRead');
    const markAsDelivered = vi.spyOn(CometChat, 'markAsDelivered');
    mockPinnedRequest([[pinnedMessage(1), pinnedMessage(2)]]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    expect(markAsRead).not.toHaveBeenCalled();
    expect(markAsDelivered).not.toHaveBeenCalled();
  });

  it('surfaces the error state when the read fails', async () => {
    vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
      const builder = {
        setLimit: () => builder,
        setPinned: () => builder,
        setGUID: () => builder,
        setUID: () => builder,
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
    mockPinnedRequest([[pinnedMessage(1)]]);
    renderPanel({ onClose });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('a Participant still sees the panel — viewing is not role-gated', async () => {
    mockPinnedRequest([[pinnedMessage(1)]]);
    renderPanel({ group: scopedGroup(CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT) });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(screen.getByText('Pinned Messages')).toBeInTheDocument();
  });
});

describe('CometChatPinnedMessages — request shape', () => {
  it('asks the messages endpoint for pinned messages, scoped to the conversation', async () => {
    // The dedicated PinnedMessagesRequestBuilder is gone; pins are now a filter on
    // the normal builder. Without setPinned this silently reads the whole chat.
    const setPinned = vi.fn();
    const setLimit = vi.fn();
    const setGUID = vi.fn();
    vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
      const builder = {
        setLimit: (n: number) => {
          setLimit(n);
          return builder;
        },
        setPinned: (v: boolean) => {
          setPinned(v);
          return builder;
        },
        setGUID: (g: string) => {
          setGUID(g);
          return builder;
        },
        setUID: () => builder,
        build: () => ({ fetchPrevious: () => Promise.resolve([]), hasMore: () => false }),
      };
      return builder as unknown as CometChat.MessagesRequestBuilder;
    });

    renderPanel();
    await waitFor(() => {
      expect(setPinned).toHaveBeenCalledWith(true);
    });
    expect(setGUID).toHaveBeenCalledWith('g1');
    // Tracks the manager's own page size rather than assuming a number — lowering
    // it is a legitimate way to exercise paging.
    expect(setLimit).toHaveBeenCalledWith(PINNED_MESSAGES_PAGE_SIZE);
  });
});
