/**
 * The public props of <CometChatMessageList /> that change what the list looks like: view slots,
 * date formats, avatars, receipts, alignment, scrollbars, truncation, moderation and formatters.
 * Each prop is set (or left out) on the real list, and the test checks what it changes. Only the
 * SDK is mocked; see helpers/messageListPropsHarness.tsx.
 *
 * A prop the list's View also takes (`<CometChatMessageList.View showScrollbar />`) is checked to
 * win over the list's own value there, which is what `overrides-context` means for this list.
 */
import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageList } from '../CometChatMessageList';
import { CometChatMessageListAlignment } from '../CometChatMessageList.types';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { covers } from '../../../testing/covers';
import {
  Kit,
  alice,
  asUser,
  bob,
  bubbleText,
  chooseOption,
  history,
  installBrowser,
  joined,
  log,
  me,
  resetHarness,
  row,
  sdk,
  show,
  showGroup,
  signIn,
  tenDaysAgo,
  text,
  yearOf,
} from './helpers/messageListPropsHarness';

vi.mock('@cometchat/chat-sdk-javascript', async () =>
  (await import('./helpers/messageListSdkMock')).mockSdkModule()
);

installBrowser();

beforeAll(async () => {
  await signIn();
});

beforeEach(() => {
  resetHarness();
});

const year = yearOf(tenDaysAgo);
/** "20 Oct, 2026": how a day ten days back reads by default. */
const DAY_MONTH_YEAR = /^\d{2} \w{3}, \d{4}$/;

const region = () => screen.getByRole('region', { name: 'Message list' });
const separators = () => screen.queryAllByRole('separator', { name: 'Date separator' });
const floatingDate = (container: HTMLElement) =>
  container.querySelector('.cometchat-message-list__floating-date');
const sentAt = (rowEl: HTMLElement) => rowEl.querySelector('.cometchat-message-bubble time')?.textContent;

/** The list in compound form: the Root takes `rootProps`, its View `viewProps`. */
function showCompound(
  rootProps: Partial<React.ComponentProps<typeof CometChatMessageList.Root>>,
  viewProps: React.ComponentProps<typeof CometChatMessageList.View>
) {
  return render(
    <Kit>
      <CometChatMessageList.Root user={asUser(bob)} {...rootProps}>
        <CometChatMessageList.View {...viewProps} />
      </CometChatMessageList.Root>
    </Kit>
  );
}

/**
 * jsdom has no layout, so the floating date never finds a message under the top edge. Give every
 * element a box so the topmost message is the one under it.
 */
function withLayout() {
  return vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 0,
    bottom: 100,
    left: 0,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

describe('CometChatMessageList props: views', () => {
  it('bubbleView replaces every bubble; it is handed the message and the logged-in user', async () => {
    covers('CometChatMessageList.bubbleView', 'custom');
    history(text({ id: 1, from: bob, text: 'Hi' }), text({ id: 2, from: me, text: 'Hello' }));
    const { container } = show({
      bubbleView: (message, loggedInUser) => (
        <p>
          {loggedInUser.getName()} sees {(message as CometChat.TextMessage).getText()}
        </p>
      ),
    });
    expect(await screen.findByText('Me sees Hi')).toBeInTheDocument();
    expect(screen.getByText('Me sees Hello')).toBeInTheDocument();
    expect(container.querySelector('.cometchat-message-bubble')).toBeNull();
    expect(row(container, 1)).toHaveTextContent('Me sees Hi');
  });

  it("children replace the list's own layout, and get the list's state through its parts", async () => {
    covers('CometChatMessageList.children', 'custom');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    let view = render(
      <Kit>
        <CometChatMessageList user={asUser(bob)}>
          <p>Only this</p>
        </CometChatMessageList>
      </Kit>
    );
    expect(screen.getByText('Only this')).toBeInTheDocument();
    await waitFor(() => {
      expect(sdk.fetchPrevious).toHaveBeenCalled();
    });
    await act(() => Promise.resolve());
    expect(screen.queryByRole('log')).toBeNull();
    expect(screen.queryByText('Hi')).toBeNull();
    view.unmount();

    view = render(
      <Kit>
        <CometChatMessageList user={asUser(bob)}>
          <p>Above the messages</p>
          <CometChatMessageList.View />
        </CometChatMessageList>
      </Kit>
    );
    expect(await bubbleText('Hi')).toBeInTheDocument();
    expect(within(region()).getByText('Above the messages')).toBeInTheDocument();
  });

  it('className is added to the list; by default it has only its own', async () => {
    covers('CometChatMessageList.className', 'set', 'default');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    const view = show({ className: 'app-chat' });
    await bubbleText('Hi');
    expect(region()).toHaveClass('cometchat-message-list', 'app-chat');
    view.unmount();
    show();
    await bubbleText('Hi');
    expect([...region().classList]).toEqual(['cometchat-message-list']);
  });

  it('loadingView is shown while the messages load, instead of the shimmer', async () => {
    covers('CometChatMessageList.loadingView', 'custom');
    sdk.fetchPrevious.mockReturnValue(new Promise(() => undefined));
    show({ loadingView: <p>Fetching your chat</p> });
    expect(await screen.findByText('Fetching your chat')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading messages' })).toBeNull();
  });

  it('emptyView is shown when the chat has no messages', async () => {
    covers('CometChatMessageList.emptyView', 'custom');
    history();
    show({ emptyView: <p>Say hello to Bob</p> });
    expect(await screen.findByText('Say hello to Bob')).toBeInTheDocument();
    expect(screen.queryByRole('log')).toBeNull();
  });

  it("errorView is shown when the messages can't be loaded, instead of the retry prompt", async () => {
    covers('CometChatMessageList.errorView', 'custom');
    sdk.fetchPrevious.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    show({ errorView: <p>Chat unavailable</p> });
    expect(await screen.findByText('Chat unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong. Tap to retry.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    vi.mocked(console.warn).mockRestore();
  });

  it('headerView sits above the messages and footerView below them', async () => {
    covers('CometChatMessageList.headerView', 'custom');
    covers('CometChatMessageList.footerView', 'custom');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    show({ headerView: <p>Pinned: lunch at one</p>, footerView: <p>Bob is away</p> });
    await bubbleText('Hi');
    const header = screen.getByText('Pinned: lunch at one');
    const footer = screen.getByText('Bob is away');
    expect(header.closest('.cometchat-message-list__header-view')).not.toBeNull();
    expect(footer.closest('.cometchat-message-list__footer-view')).not.toBeNull();
    const following = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(following(header, log())).toBe(true);
    expect(following(log(), footer)).toBe(true);
  });
});

describe('CometChatMessageList props: dates', () => {
  it('hideDateSeparator removes the day dividers (and the floating date); shown by default', async () => {
    covers('CometChatMessageList.hideDateSeparator', 'true', 'false', 'default');
    const layout = withLayout();
    try {
      history(text({ id: 1, from: bob, text: 'Hi' }));
      for (const [props, shown] of [
        [{ hideDateSeparator: true }, false],
        [{ hideDateSeparator: false }, true],
        [{}, true],
      ] as const) {
        const view = show(props);
        await bubbleText('Hi');
        await act(() => Promise.resolve());
        expect(separators()).toHaveLength(shown ? 1 : 0);
        expect(floatingDate(view.container) !== null).toBe(shown);
        view.unmount();
      }
    } finally {
      layout.mockRestore();
    }
  });

  it("hideDateSeparator on the list's View wins over the list's own", async () => {
    covers('CometChatMessageList.hideDateSeparator', 'overrides-context');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    let view = showCompound({ hideDateSeparator: false }, { hideDateSeparator: true });
    await bubbleText('Hi');
    expect(separators()).toHaveLength(0);
    view.unmount();
    view = showCompound({ hideDateSeparator: true }, { hideDateSeparator: false });
    await bubbleText('Hi');
    expect(separators()).toHaveLength(1);
  });

  it('separatorDateTimeFormat formats the day dividers; by default "DD MMM, YYYY" for an older day', async () => {
    covers('CometChatMessageList.separatorDateTimeFormat', 'set', 'default');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    const view = show();
    await bubbleText('Hi');
    expect(separators()[0]?.textContent).toMatch(DAY_MONTH_YEAR);
    view.unmount();
    show({ separatorDateTimeFormat: { otherDays: 'YYYY' } });
    await bubbleText('Hi');
    expect(separators()[0]?.textContent).toBe(year);
  });

  it('hideStickyDate removes the date floating over the messages; shown by default', async () => {
    covers('CometChatMessageList.hideStickyDate', 'true', 'false', 'default');
    const layout = withLayout();
    try {
      history(text({ id: 1, from: bob, text: 'Hi' }));
      for (const [props, shown] of [
        [{ hideStickyDate: true }, false],
        [{ hideStickyDate: false }, true],
        [{}, true],
      ] as const) {
        const view = show(props);
        await bubbleText('Hi');
        if (shown) {
          await waitFor(() => {
            expect(floatingDate(view.container)).not.toBeNull();
          });
        } else {
          await act(() => Promise.resolve());
          expect(floatingDate(view.container)).toBeNull();
          // Only the floating one goes; the dividers stay.
          expect(separators()).toHaveLength(1);
        }
        view.unmount();
      }
    } finally {
      layout.mockRestore();
    }
  });

  it('stickyDateTimeFormat formats the floating date; by default "DD MMM, YYYY" for an older day', async () => {
    covers('CometChatMessageList.stickyDateTimeFormat', 'set', 'default');
    const layout = withLayout();
    try {
      history(text({ id: 1, from: bob, text: 'Hi' }));
      let view = show();
      await waitFor(() => {
        expect(floatingDate(view.container)?.textContent).toMatch(DAY_MONTH_YEAR);
      });
      view.unmount();
      view = show({ stickyDateTimeFormat: { otherDays: 'YYYY' } });
      await waitFor(() => {
        expect(floatingDate(view.container)?.textContent).toBe(year);
      });
    } finally {
      layout.mockRestore();
    }
  });

  it("messageSentAtDateTimeFormat formats each bubble's time; by default the time of day", async () => {
    covers('CometChatMessageList.messageSentAtDateTimeFormat', 'set', 'default');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    let view = show();
    await bubbleText('Hi');
    expect(sentAt(row(view.container, 1))).toMatch(/^\d{2}:\d{2} [ap]m$/i);
    view.unmount();
    view = show({ messageSentAtDateTimeFormat: { otherDays: 'YYYY' } });
    await bubbleText('Hi');
    expect(sentAt(row(view.container, 1))).toBe(year);
  });

  it('by default the message information sheet gives read and delivered times as "DD MMM, hh:mm A"', async () => {
    covers('CometChatMessageList.messageInfoDateTimeFormat', 'default');
    history(text({ id: 1, from: me, text: 'Mine', readAt: tenDaysAgo, deliveredAt: tenDaysAgo }));
    const { container } = show();
    await bubbleText('Mine');
    chooseOption(row(container, 1), 'Info');
    await waitFor(() => {
      expect(document.querySelectorAll('.cometchat-message-information__section-time').length).toBeGreaterThan(0);
    });
    const times = [...document.querySelectorAll('.cometchat-message-information__section-time')].map(
      time => time.textContent
    );
    for (const time of times) expect(time).toMatch(/^\d{2} \w{3}, \d{2}:\d{2} [AP]M$/);
  });
});

describe('CometChatMessageList props: what each bubble shows', () => {
  it('hideAvatar removes the sender avatar from incoming group messages; shown by default', async () => {
    covers('CometChatMessageList.hideAvatar', 'true', 'false', 'default');
    history(text({ id: 1, from: bob, text: 'Hi team', inGroup: true }));
    for (const [props, shown] of [
      [{ hideAvatar: true }, false],
      [{ hideAvatar: false }, true],
      [{}, true],
    ] as const) {
      const view = showGroup(props);
      await bubbleText('Hi team');
      expect(screen.queryByRole('button', { name: 'Avatar for Bob' }) !== null).toBe(shown);
      view.unmount();
    }
  });

  it('hideGroupActionMessages removes "joined", "left" and other member events; shown by default', async () => {
    covers('CometChatMessageList.hideGroupActionMessages', 'true', 'false', 'default');
    history(joined(1, alice), text({ id: 2, from: bob, text: 'Welcome, Alice', inGroup: true }));
    for (const [props, shown] of [
      [{ hideGroupActionMessages: true }, false],
      [{ hideGroupActionMessages: false }, true],
      [{}, true],
    ] as const) {
      const view = showGroup(props);
      await bubbleText('Welcome, Alice');
      expect(screen.queryByText('Alice joined') !== null).toBe(shown);
      view.unmount();
    }
  });

  it('hideReceipts removes the sent/delivered/read tick from my messages; shown by default', async () => {
    covers('CometChatMessageList.hideReceipts', 'true', 'false', 'default');
    history(text({ id: 1, from: me, text: 'Mine', deliveredAt: tenDaysAgo, readAt: tenDaysAgo }));
    for (const [props, shown] of [
      [{ hideReceipts: true }, false],
      [{ hideReceipts: false }, true],
      [{}, true],
    ] as const) {
      const view = show(props);
      await bubbleText('Mine');
      expect(screen.queryByRole('img', { name: 'Read' }) !== null).toBe(shown);
      view.unmount();
    }
  });

  it("hideReceipts wins over the app's global setting", async () => {
    covers('CometChatMessageList.hideReceipts', 'overrides-context');
    history(text({ id: 1, from: me, text: 'Mine', deliveredAt: tenDaysAgo, readAt: tenDaysAgo }));
    // The global setting alone hides the tick…
    let view = show({}, { hideReceipts: true });
    await bubbleText('Mine');
    expect(screen.queryByRole('img', { name: 'Read' })).toBeNull();
    view.unmount();
    // …and the prop set to false shows it again.
    view = show({ hideReceipts: false }, { hideReceipts: true });
    await bubbleText('Mine');
    expect(screen.getByRole('img', { name: 'Read' })).toBeInTheDocument();
  });

  it('textFormatters change how message text reads; by default it reads as sent', async () => {
    covers('CometChatMessageList.textFormatters', 'set', 'default');
    class Shout extends CometChatTextFormatter {
      readonly id = 'shout';
      override customLogicToFormatText(value: string) {
        return value.toUpperCase();
      }
    }
    history(text({ id: 1, from: bob, text: 'see you soon' }));
    const view = show();
    expect(await bubbleText('see you soon')).toBeInTheDocument();
    view.unmount();
    show({ textFormatters: [new Shout()] });
    expect(await bubbleText('SEE YOU SOON')).toBeInTheDocument();
    expect(screen.queryByText('see you soon')).toBeNull();
  });
});

describe('CometChatMessageList props: layout', () => {
  const side = (container: HTMLElement, id: number) => {
    const wrapper = row(container, id).querySelector('.cometchat-message-bubble-wrapper');
    if (wrapper?.classList.contains('cometchat-message-bubble-wrapper--right')) return 'right';
    if (wrapper?.classList.contains('cometchat-message-bubble-wrapper--left')) return 'left';
    return 'none';
  };

  it('messageAlignment standard (1, the default) puts my messages on the right, left (0) puts every message on the left', async () => {
    covers('CometChatMessageList.messageAlignment', '0', '1', 'default');
    history(text({ id: 1, from: bob, text: 'Theirs' }), text({ id: 2, from: me, text: 'Mine' }));
    for (const [props, mine] of [
      [{ messageAlignment: CometChatMessageListAlignment.standard }, 'right'],
      [{}, 'right'],
      [{ messageAlignment: CometChatMessageListAlignment.left }, 'left'],
    ] as const) {
      const view = show(props);
      await bubbleText('Mine');
      expect(side(view.container, 1)).toBe('left');
      expect(side(view.container, 2)).toBe(mine);
      view.unmount();
    }
  });

  it("messageAlignment on the list's View wins over the list's own", async () => {
    covers('CometChatMessageList.messageAlignment', 'overrides-context');
    history(text({ id: 2, from: me, text: 'Mine' }));
    const { container } = showCompound(
      { messageAlignment: CometChatMessageListAlignment.standard },
      { messageAlignment: CometChatMessageListAlignment.left }
    );
    await bubbleText('Mine');
    expect(side(container, 2)).toBe('left');
  });

  it('showScrollbar shows the scrollbar of the message area; hidden by default', async () => {
    covers('CometChatMessageList.showScrollbar', 'true', 'false', 'default');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    for (const [props, hidden] of [
      [{ showScrollbar: true }, false],
      [{ showScrollbar: false }, true],
      [{}, true],
    ] as const) {
      const view = show(props);
      await bubbleText('Hi');
      expect(log().classList.contains('cometchat-message-list__scroll-container--hide-scrollbar')).toBe(hidden);
      view.unmount();
    }
  });

  it("showScrollbar on the list's View wins over the list's own", async () => {
    covers('CometChatMessageList.showScrollbar', 'overrides-context');
    history(text({ id: 1, from: bob, text: 'Hi' }));
    showCompound({ showScrollbar: false }, { showScrollbar: true });
    await bubbleText('Hi');
    expect(log()).not.toHaveClass('cometchat-message-list__scroll-container--hide-scrollbar');
  });
});

describe('CometChatMessageList props: long messages', () => {
  // jsdom has no layout: make every text bubble overflow its clamped height.
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.classList.contains('cometchat-text-bubble__text') ? 400 : 0;
      },
    });
  });
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
  });

  const readMore = () => screen.queryByRole('button', { name: 'Read more' });

  it('disableTruncation shows long messages in full, with no "Read more"; truncated by default', async () => {
    covers('CometChatMessageList.disableTruncation', 'true', 'false', 'default');
    history(text({ id: 1, from: bob, text: 'A very long message' }));
    for (const [props, truncated] of [
      [{ disableTruncation: true }, false],
      [{ disableTruncation: false }, true],
      [{}, true],
    ] as const) {
      const view = show(props);
      const body = await bubbleText('A very long message');
      if (truncated) {
        expect(await screen.findByRole('button', { name: 'Read more' })).toBeInTheDocument();
        expect(body).not.toHaveClass('cometchat-text-bubble__text--no-truncation');
      } else {
        await act(() => new Promise(resolve => requestAnimationFrame(() => resolve(undefined))));
        expect(readMore()).toBeNull();
        expect(body).toHaveClass('cometchat-text-bubble__text--no-truncation');
      }
      view.unmount();
    }
  });

  it("disableTruncation on the list's View wins over the list's own", async () => {
    covers('CometChatMessageList.disableTruncation', 'overrides-context');
    history(text({ id: 1, from: bob, text: 'A very long message' }));
    showCompound({ disableTruncation: false }, { disableTruncation: true });
    const body = await bubbleText('A very long message');
    await act(() => new Promise(resolve => requestAnimationFrame(() => resolve(undefined))));
    expect(readMore()).toBeNull();
    expect(body).toHaveClass('cometchat-text-bubble__text--no-truncation');
  });
});

describe('CometChatMessageList props: moderation', () => {
  const blockedNotice = () => screen.queryByText('Your message was blocked due to moderation policies');

  it('hideModerationView removes the notice under my blocked messages; shown by default', async () => {
    covers('CometChatMessageList.hideModerationView', 'true', 'false', 'default');
    history(text({ id: 1, from: me, text: 'Blocked words', moderationStatus: 'disapproved' }));
    for (const [props, shown] of [
      [{ hideModerationView: true }, false],
      [{ hideModerationView: false }, true],
      [{}, true],
    ] as const) {
      const view = show(props);
      await bubbleText('Blocked words');
      expect(blockedNotice() !== null).toBe(shown);
      view.unmount();
    }
  });

  it("hideModerationView on the list's View wins over the list's own", async () => {
    covers('CometChatMessageList.hideModerationView', 'overrides-context');
    history(text({ id: 1, from: me, text: 'Blocked words', moderationStatus: 'disapproved' }));
    let view = showCompound({ hideModerationView: false }, { hideModerationView: true });
    await bubbleText('Blocked words');
    expect(blockedNotice()).toBeNull();
    view.unmount();
    view = showCompound({ hideModerationView: true }, { hideModerationView: false });
    await bubbleText('Blocked words');
    expect(blockedNotice()).not.toBeNull();
  });
});
