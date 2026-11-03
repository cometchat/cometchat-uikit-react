/**
 * The public props of <CometChatThreadHeader />, one case each: the prop is set (or left out) on the real
 * component and the test checks what it changes. The parent bubble is the real one, drawn by the text
 * plugin; only the SDK is mocked, and kit events go through a small in-memory bus.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatThreadHeader } from '../CometChatThreadHeader';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatTextPlugin } from '../../../plugins/core/text/CometChatTextPlugin';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import type { CometChatEvent } from '../../../context/CometChatEvents.types';
import { LocaleContext } from '../../../context/locale/LocaleContext';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { resetThreadSubscriptionGuards } from '../../../utils/CometChatThreadSubscription';
import { buildTextMessage, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  addMessageListener: vi.fn(),
  subscribeToThread: vi.fn(),
}));

// The real SDK's constants (the kit reads them on import), with the calls the header makes mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  return {
    CometChat: Object.assign({}, CometChat, {
      getLoggedinUser: () => Promise.resolve({ getUid: () => 'me', getName: () => 'Me' }),
      addMessageListener: sdk.addMessageListener,
      removeMessageListener: vi.fn(),
      MessageListener: vi.fn((callbacks: unknown) => callbacks),
      subscribeToThread: sdk.subscribeToThread,
      unsubscribeFromThread: vi.fn().mockResolvedValue('ok'),
    }),
  };
});

const tenDaysAgo = Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60;
const year = String(new Date(tenDaysAgo * 1000).getFullYear());

function parent(overrides: { text?: string; replyCount?: number } = {}) {
  return buildTextMessage({
    id: 900,
    text: overrides.text ?? 'Lunch plans?',
    sender: buildUser({ uid: 'alice', name: 'Alice' }),
    receiverType: 'group',
    receiverId: 'group-1',
    sentAt: tenDaysAgo,
    replyCount: overrides.replyCount ?? 3,
  }) as unknown as CometChat.BaseMessage;
}

/** The kit's event bus, in memory. */
const handlers = new Set<(event: CometChatEvent) => void>();
const events = {
  subscribe: (handler: (event: CometChatEvent) => void) => {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  },
  publish: (event: CometChatEvent) => {
    handlers.forEach(handler => {
      handler(event);
    });
  },
};

const registry = new CometChatPluginRegistry([CometChatTextPlugin]);

class Shout extends CometChatTextFormatter {
  readonly id = 'shout';
  override customLogicToFormatText(text: string) {
    return text.toUpperCase();
  }
}

const Kit: React.FC<{ children: React.ReactNode; calendar?: Record<string, string> }> = ({ children, calendar }) => {
  const locale = React.useContext(LocaleContext);
  return (
    <CometChatEventsContext.Provider value={events}>
      <CometChatPluginRegistryContext.Provider value={registry}>
        <LocaleContext.Provider value={calendar ? { ...locale, calendarObject: calendar } : locale}>{children}</LocaleContext.Provider>
      </CometChatPluginRegistryContext.Provider>
    </CometChatEventsContext.Provider>
  );
};

type Props = Partial<React.ComponentProps<typeof CometChatThreadHeader>>;
function show(props: Props = {}, calendar?: Record<string, string>) {
  return render(
    <Kit {...(calendar && { calendar })}>
      <CometChatThreadHeader parentMessage={parent()} {...props} />
    </Kit>
  );
}

/**
 * The parent bubble, once the logged-in user has loaded and the text plugin has drawn it (until
 * then the header shows the text plainly).
 */
const bubble = (text = 'Lunch plans?') => screen.findByText(text, { selector: '.cometchat-text-bubble__text' });
const header = (container: HTMLElement) => container.querySelector('.cometchat-thread-header');
const chip = (container: HTMLElement) => container.querySelector('.cometchat-thread-header__body-timestamp time')?.textContent;
const sentAt = (container: HTMLElement) => container.querySelector('.cometchat-message-bubble time')?.textContent;

beforeEach(() => {
  handlers.clear();
  resetThreadSubscriptionGuards();
  sdk.addMessageListener.mockReset();
  sdk.subscribeToThread.mockReset().mockResolvedValue('ok');
});

describe('CometChatThreadHeader props', () => {
  it("parentMessage is the bubble shown, with its sender's name and reply count", async () => {
    covers('CometChatThreadHeader.parentMessage', 'set');
    show();
    expect((await bubble()).closest('.cometchat-message-bubble')).not.toBeNull();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('3 Replies')).toBeInTheDocument();
  });

  it('className is added to the header; by default it has only its own', async () => {
    covers('CometChatThreadHeader.className', 'set', 'default');
    let view = show({ className: 'app-thread' });
    await bubble();
    expect(header(view.container)).toHaveClass('app-thread');
    view.unmount();
    view = show();
    await bubble();
    expect(header(view.container)?.className).toBe('cometchat-thread-header cometchat-thread-header--hide-scrollbar');
  });

  describe('what is shown', () => {
    it('hideDate removes the date above the bubble; shown by default', async () => {
      covers('CometChatThreadHeader.hideDate', 'true', 'false', 'default');
      for (const [props, shown] of [
        [{ hideDate: true }, false],
        [{ hideDate: false }, true],
        [{}, true],
      ] as const) {
        const view = show(props);
        await bubble();
        expect(view.container.querySelector('.cometchat-thread-header__body-timestamp') !== null).toBe(shown);
        view.unmount();
      }
    });

    it('hideReplyCount removes the reply count; shown by default', async () => {
      covers('CometChatThreadHeader.hideReplyCount', 'true', 'false', 'default');
      for (const [props, shown] of [
        [{ hideReplyCount: true }, false],
        [{ hideReplyCount: false }, true],
        [{}, true],
      ] as const) {
        const view = show(props);
        await bubble();
        expect(screen.queryByText('3 Replies') !== null).toBe(shown);
        view.unmount();
      }
    });

    it('hideThreadSubscriptionToggle removes the follow bell; shown by default', async () => {
      covers('CometChatThreadHeader.hideThreadSubscriptionToggle', 'true', 'false', 'default');
      for (const [props, shown] of [
        [{ hideThreadSubscriptionToggle: true }, false],
        [{ hideThreadSubscriptionToggle: false }, true],
        [{}, true],
      ] as const) {
        const view = show(props);
        await bubble();
        expect(screen.queryByRole('button', { name: /subscribe to thread/i }) !== null).toBe(shown);
        view.unmount();
      }
    });

    it('showScrollbar shows the scrollbar; hidden by default', async () => {
      covers('CometChatThreadHeader.showScrollbar', 'true', 'false', 'default');
      for (const [props, hidden] of [
        [{ showScrollbar: true }, false],
        [{ showScrollbar: false }, true],
        [{}, true],
      ] as const) {
        const view = show(props);
        await bubble();
        expect(header(view.container)?.classList.contains('cometchat-thread-header--hide-scrollbar')).toBe(hidden);
        expect(view.container.querySelector('.cometchat-thread-header__bubble-wrapper')?.classList.contains('cometchat-thread-header--hide-scrollbar')).toBe(hidden);
        view.unmount();
      }
    });

    it('textFormatters change how the parent text reads; by default it is as sent', async () => {
      covers('CometChatThreadHeader.textFormatters', 'set', 'default');
      let view = show();
      await bubble();
      view.unmount();
      view = show({ textFormatters: [new Shout()] });
      expect(await bubble('LUNCH PLANS?')).toBeInTheDocument();
      expect(screen.queryByText('Lunch plans?')).toBeNull();
    });
  });

  describe('dates', () => {
    it('separatorDateTimeFormat sets the date above the bubble, over the global format; by default day, month and year', async () => {
      covers('CometChatThreadHeader.separatorDateTimeFormat', 'set', 'default');
      let view = show();
      await bubble();
      expect(chip(view.container)).toMatch(/^\d{2} \w{3}, \d{4}$/);
      view.unmount();

      view = show({ separatorDateTimeFormat: { otherDays: 'YYYY' } });
      await bubble();
      expect(chip(view.container)).toBe(year);
      view.unmount();

      // The app's calendar format applies; the prop wins where it says something, and only there.
      view = show({}, { otherDays: 'MM-YYYY' });
      await bubble();
      expect(chip(view.container)).toMatch(/^\d{2}-\d{4}$/);
      view.unmount();
      view = show({ separatorDateTimeFormat: { otherDays: 'YYYY' } }, { otherDays: 'MM-YYYY' });
      await bubble();
      expect(chip(view.container)).toBe(year);
      view.unmount();
      view = show({ separatorDateTimeFormat: { today: 'hh:mm' } }, { otherDays: 'MM-YYYY' });
      await bubble();
      expect(chip(view.container)).toMatch(/^\d{2}-\d{4}$/);
    });

    it("messageSentAtDateTimeFormat sets the bubble's time; by default the time of day", async () => {
      covers('CometChatThreadHeader.messageSentAtDateTimeFormat', 'set', 'default');
      let view = show();
      await bubble();
      expect(sentAt(view.container)).toMatch(/^\d{2}:\d{2} [ap]m$/i);
      view.unmount();
      view = show({ messageSentAtDateTimeFormat: { otherDays: 'YYYY' } });
      await bubble();
      expect(sentAt(view.container)).toBe(year);
    });

    it("messageSentAtDateTimeFormat on the parent bubble part wins over the header's", async () => {
      covers('CometChatThreadHeader.messageSentAtDateTimeFormat', 'overrides-context');
      const { container } = render(
        <Kit>
          <CometChatThreadHeader.Root parentMessage={parent()} messageSentAtDateTimeFormat={{ otherDays: 'DD/MM' }}>
            <CometChatThreadHeader.ParentBubble messageSentAtDateTimeFormat={{ otherDays: 'YYYY' }} />
          </CometChatThreadHeader.Root>
        </Kit>
      );
      await bubble();
      expect(sentAt(container)).toBe(year);
    });
  });

  describe('callbacks', () => {
    it('onClose fires from the close button and from Escape', async () => {
      covers('CometChatThreadHeader.onClose', 'called');
      const onClose = vi.fn();
      const { container } = show({ onClose });
      await bubble();
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
      const root = header(container);
      if (!root) throw new Error('no thread header');
      fireEvent.keyDown(root, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("onSubtitleClicked fires from the sender's name", async () => {
      covers('CometChatThreadHeader.onSubtitleClicked', 'called');
      const onSubtitleClicked = vi.fn();
      show({ onSubtitleClicked });
      await bubble();
      fireEvent.click(screen.getByRole('button', { name: 'Alice' }));
      expect(onSubtitleClicked).toHaveBeenCalled();
    });

    it('onThreadSubscriptionChange reports following the thread from the bell', async () => {
      covers('CometChatThreadHeader.onThreadSubscriptionChange', 'called');
      const onThreadSubscriptionChange = vi.fn();
      show({ onThreadSubscriptionChange });
      await bubble();
      expect(onThreadSubscriptionChange).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: /subscribe to thread/i }));
      await waitFor(() => {
        expect(onThreadSubscriptionChange).toHaveBeenCalledWith(true);
      });
      expect(sdk.subscribeToThread).toHaveBeenCalledWith(900);
    });

    it('onParentDeleted fires when the parent message is deleted, not another one', async () => {
      covers('CometChatThreadHeader.onParentDeleted', 'called');
      const onParentDeleted = vi.fn();
      show({ onParentDeleted });
      await bubble();
      const other = buildTextMessage({ id: 901 }) as unknown as CometChat.BaseMessage;
      act(() => {
        events.publish({ type: 'message/deleted', message: other } as CometChatEvent);
      });
      expect(onParentDeleted).not.toHaveBeenCalled();
      act(() => {
        events.publish({ type: 'message/deleted', message: parent() } as CometChatEvent);
      });
      expect(onParentDeleted).toHaveBeenCalledTimes(1);
    });

    it('onError gets the error when listening for replies fails', async () => {
      covers('CometChatThreadHeader.onError', 'called');
      const error = new Error('not connected');
      sdk.addMessageListener.mockImplementation(() => {
        throw error;
      });
      const onError = vi.fn();
      show({ onError });
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });
  });

  describe('views', () => {
    it('headerView replaces the top bar; the bubble and reply count stay', async () => {
      covers('CometChatThreadHeader.headerView', 'custom');
      show({ headerView: <h2>App thread bar</h2> });
      await bubble();
      expect(screen.getByRole('heading', { name: 'App thread bar' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /close/i })).toBeNull();
      expect(screen.getByText('3 Replies')).toBeInTheDocument();
    });

    it('messageBubbleView replaces the parent bubble; the top bar stays', async () => {
      covers('CometChatThreadHeader.messageBubbleView', 'custom');
      const { container } = show({ messageBubbleView: <p>App bubble</p> });
      expect(await screen.findByText('App bubble')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Lunch plans?')).toBeNull();
      expect(container.querySelector('.cometchat-message-bubble')).toBeNull();
    });

    it('subtitleView goes between the top bar and the bubble', async () => {
      covers('CometChatThreadHeader.subtitleView', 'custom');
      const { container } = show({ subtitleView: <p>App subtitle</p> });
      await bubble();
      const subtitle = screen.getByText('App subtitle');
      const topBar = container.querySelector('.cometchat-thread-header__top-bar');
      const wrapper = container.querySelector('.cometchat-thread-header__bubble-wrapper');
      expect(topBar?.nextElementSibling).toBe(subtitle);
      expect(subtitle.nextElementSibling).toBe(wrapper);
    });

    it("the Root's children replace its whole layout", async () => {
      covers('CometChatThreadHeader.children', 'custom');
      render(
        <Kit>
          <CometChatThreadHeader.Root parentMessage={parent()}>
            <CometChatThreadHeader.SenderName />
            <p>Only this</p>
          </CometChatThreadHeader.Root>
        </Kit>
      );
      expect(await screen.findByText('Only this')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /close/i })).toBeNull();
      expect(screen.queryByText('3 Replies')).toBeNull();
      expect(screen.queryByText('Lunch plans?')).toBeNull();
    });
  });
});
