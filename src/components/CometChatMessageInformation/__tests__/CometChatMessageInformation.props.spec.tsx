/**
 * The public props of <CometChatMessageInformation />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. The previewed bubble is the real one, drawn by the
 * text plugin; only the SDK is mocked.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageInformation } from '../CometChatMessageInformation';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatTextPlugin } from '../../../plugins/core/text/CometChatTextPlugin';
import { LocaleContext } from '../../../context/locale/LocaleContext';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { buildTextMessage, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  getMessageReceipts: vi.fn(),
}));

// The real SDK's constants (the kit reads them on import), with the calls the panel makes mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const { CometChat } = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>('@cometchat/chat-sdk-javascript');
  return {
    CometChat: Object.assign({}, CometChat, {
      getLoggedinUser: () => Promise.resolve({ getUid: () => 'me', getName: () => 'Me' }),
      getMessageReceipts: sdk.getMessageReceipts,
      addMessageListener: vi.fn(),
      removeMessageListener: vi.fn(),
      MessageListener: vi.fn((callbacks: unknown) => callbacks),
      addConnectionListener: vi.fn(),
      removeConnectionListener: vi.fn(),
      ConnectionListener: vi.fn((callbacks: unknown) => callbacks),
    }),
  };
});

const tenDaysAgo = Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60;
const year = String(new Date(tenDaysAgo * 1000).getFullYear());

/** A message I sent ten days ago, read and delivered then too. */
function sent(receiverType: 'user' | 'group' = 'user') {
  return buildTextMessage({
    id: 700,
    text: 'See you at six',
    sender: buildUser({ uid: 'me', name: 'Me' }),
    receiverType,
    receiverId: receiverType === 'group' ? 'group-1' : 'bob',
    sentAt: tenDaysAgo,
    deliveredAt: tenDaysAgo,
    readAt: tenDaysAgo,
  }) as unknown as CometChat.BaseMessage;
}

function receipt(uid: string, name: string) {
  return {
    getSender: () => buildUser({ uid, name }),
    getReadAt: () => tenDaysAgo,
    getDeliveredAt: () => tenDaysAgo,
  };
}

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
    <CometChatPluginRegistryContext.Provider value={registry}>
      <LocaleContext.Provider value={calendar ? { ...locale, calendarObject: calendar } : locale}>{children}</LocaleContext.Provider>
    </CometChatPluginRegistryContext.Provider>
  );
};

type Props = Partial<React.ComponentProps<typeof CometChatMessageInformation>>;
function show(props: Props = {}, calendar?: Record<string, string>) {
  return render(
    <Kit {...(calendar && { calendar })}>
      <CometChatMessageInformation message={sent()} {...props} />
    </Kit>
  );
}

const bubble = (text = 'See you at six') => screen.findByText(text, { selector: '.cometchat-text-bubble__text' });
const panel = (container: HTMLElement) => container.querySelector('.cometchat-message-information');
const readAt = (container: HTMLElement) => container.querySelector('.cometchat-message-information__section-time')?.textContent;
const sentAt = (container: HTMLElement) => container.querySelector('.cometchat-message-bubble time')?.textContent;
const spinner = (container: HTMLElement) => container.querySelector('.cometchat-message-information__spinner');

beforeEach(() => {
  sdk.getMessageReceipts.mockReset().mockResolvedValue([receipt('bob', 'Bob')]);
});

describe('CometChatMessageInformation props', () => {
  it('message is the bubble previewed, with when it was read and delivered', async () => {
    covers('CometChatMessageInformation.message', 'set');
    const { container } = show();
    expect((await bubble()).closest('.cometchat-message-bubble')).not.toBeNull();
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(container.querySelectorAll('.cometchat-message-information__section-time')).toHaveLength(2);
  });

  it('className is added to the panel; by default it has only its own', async () => {
    covers('CometChatMessageInformation.className', 'set', 'default');
    let view = show({ className: 'app-info' });
    await bubble();
    expect(panel(view.container)).toHaveClass('app-info');
    view.unmount();
    view = show();
    await bubble();
    expect(panel(view.container)?.className).toBe('cometchat-message-information');
  });

  it('showScrollbar shows the scrollbars; hidden by default', async () => {
    covers('CometChatMessageInformation.showScrollbar', 'true', 'false', 'default');
    const hidden = '.cometchat-message-information__content--hide-scrollbar, .cometchat-message-information__message-preview--hide-scrollbar';
    for (const [props, count] of [
      [{ showScrollbar: true }, 0],
      [{ showScrollbar: false }, 2],
      [{}, 2],
    ] as const) {
      const view = show(props);
      await bubble();
      expect(view.container.querySelectorAll(hidden)).toHaveLength(count);
      view.unmount();
    }
  });

  it("hideReceipts removes the receipt from the previewed bubble; shown by default", async () => {
    covers('CometChatMessageInformation.hideReceipts', 'true', 'false', 'default');
    for (const [props, shown] of [
      [{ hideReceipts: true }, false],
      [{ hideReceipts: false }, true],
      [{}, true],
    ] as const) {
      const view = show(props);
      await bubble();
      expect(view.container.querySelector('.cometchat-message-bubble .cometchat-receipts') !== null).toBe(shown);
      view.unmount();
    }
  });

  it('textFormatters format the previewed text; by default it is shown as written', async () => {
    covers('CometChatMessageInformation.textFormatters', 'set', 'default');
    let view = show();
    await bubble();
    view.unmount();
    view = show({ textFormatters: [new Shout()] });
    expect(await bubble('SEE YOU AT SIX')).toBeInTheDocument();
    expect(screen.queryByText('See you at six')).toBeNull();
  });

  describe('dates', () => {
    it('messageInfoDateTimeFormat sets the read and delivered times, over the global format; by default day, month and time', async () => {
      covers('CometChatMessageInformation.messageInfoDateTimeFormat', 'set', 'default');
      let view = show();
      await bubble();
      expect(readAt(view.container)).toMatch(/^\d{2} \w{3}, \d{2}:\d{2} [AP]M$/);
      view.unmount();

      view = show({ messageInfoDateTimeFormat: { otherDays: 'YYYY' } });
      await bubble();
      expect(readAt(view.container)).toBe(year);
      view.unmount();

      // The app's calendar format applies when the prop leaves a part out.
      view = show({}, { otherDays: '[on] YYYY' });
      await bubble();
      expect(readAt(view.container)).toBe(`on ${year}`);
      view.unmount();

      view = show({ messageInfoDateTimeFormat: { today: 'HH:mm' } }, { otherDays: '[on] YYYY' });
      await bubble();
      expect(readAt(view.container)).toBe(`on ${year}`);
    });

    it("messageSentAtDateTimeFormat sets the previewed bubble's time; by default the time of day", async () => {
      covers('CometChatMessageInformation.messageSentAtDateTimeFormat', 'set', 'default');
      let view = show();
      await bubble();
      expect(sentAt(view.container)).toMatch(/^\d{2}:\d{2} [ap]m$/i);
      view.unmount();
      view = show({ messageSentAtDateTimeFormat: { otherDays: 'YYYY' } });
      await bubble();
      expect(sentAt(view.container)).toBe(year);
    });
  });

  describe('callbacks', () => {
    it('onClose fires from the close button and from Escape', async () => {
      covers('CometChatMessageInformation.onClose', 'called');
      const onClose = vi.fn();
      const { container } = show({ onClose });
      await bubble();
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      const root = panel(container);
      if (!root) throw new Error('no panel');
      fireEvent.keyDown(root, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('onError gets the error when the receipts cannot be fetched', async () => {
      covers('CometChatMessageInformation.onError', 'called');
      const failure = new Error('not connected');
      sdk.getMessageReceipts.mockRejectedValue(failure);
      const onError = vi.fn();
      show({ message: sent('group'), onError });
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(failure);
      });
      expect(screen.getByRole('alert')).toHaveTextContent('Looks like something went wrong');
    });
  });

  describe('views', () => {
    it('headerView replaces the header; the preview, receipts and Escape still work', async () => {
      covers('CometChatMessageInformation.headerView', 'custom');
      const onClose = vi.fn();
      const { container } = show({ headerView: <h2>About this message</h2>, onClose });
      expect(await bubble()).toBeInTheDocument();
      expect(screen.getByText('About this message')).toBeInTheDocument();
      expect(screen.queryByText('Message Information')).toBeNull();
      expect(screen.getByText('Read')).toBeInTheDocument();
      const root = panel(container);
      if (!root) throw new Error('no panel');
      fireEvent.keyDown(root, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('receiptListView replaces the receipts; the header and preview stay', async () => {
      covers('CometChatMessageInformation.receiptListView', 'custom');
      show({ receiptListView: <p>Seen by everyone</p> });
      expect(await bubble()).toBeInTheDocument();
      expect(screen.getByText('Seen by everyone')).toBeInTheDocument();
      expect(screen.getByText('Message Information')).toBeInTheDocument();
      expect(screen.queryByText('Read')).toBeNull();
    });

    it('loadingView is shown while group receipts load, in place of the spinner, and only then', async () => {
      covers('CometChatMessageInformation.loadingView', 'custom');
      let finish: (value: unknown[]) => void = () => undefined;
      sdk.getMessageReceipts.mockReturnValue(new Promise(resolve => (finish = resolve)));
      const { container } = show({ message: sent('group'), loadingView: <p>Checking…</p> });
      expect(await screen.findByText('Checking…')).toBeInTheDocument();
      expect(screen.getByText('Checking…').closest('[role="status"]')).not.toBeNull();
      expect(spinner(container)).toBeNull();
      finish([receipt('bob', 'Bob')]);
      expect(await screen.findByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Checking…')).toBeNull();
      expect(spinner(container)).toBeNull();
    });

    it('errorView is shown when group receipts fail, in place of the message and retry, and only then', async () => {
      covers('CometChatMessageInformation.errorView', 'custom');
      sdk.getMessageReceipts.mockRejectedValue(new Error('not connected'));
      let view = show({ message: sent('group'), errorView: <p>Offline</p> });
      expect(await screen.findByText('Offline')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Offline');
      expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
      view.unmount();

      sdk.getMessageReceipts.mockResolvedValue([receipt('bob', 'Bob')]);
      view = show({ message: sent('group'), errorView: <p>Offline</p> });
      expect(await screen.findByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Offline')).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('emptyView is shown when no one has received the group message yet, and only then', async () => {
      covers('CometChatMessageInformation.emptyView', 'custom');
      sdk.getMessageReceipts.mockResolvedValue([]);
      let view = show({ message: sent('group'), emptyView: <p>No one yet</p> });
      expect(await screen.findByText('No one yet')).toBeInTheDocument();
      expect(screen.queryByText(/Waiting for recipients/)).toBeNull();
      view.unmount();

      sdk.getMessageReceipts.mockResolvedValue([receipt('bob', 'Bob')]);
      view = show({ message: sent('group'), emptyView: <p>No one yet</p> });
      expect(await screen.findByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('No one yet')).toBeNull();
    });

    it("the Root's children replace its whole layout", async () => {
      covers('CometChatMessageInformation.children', 'custom');
      render(
        <Kit>
          <CometChatMessageInformation.Root message={sent()}>
            <CometChatMessageInformation.Header />
            <p>Only this</p>
          </CometChatMessageInformation.Root>
        </Kit>
      );
      expect(await screen.findByText('Only this')).toBeInTheDocument();
      expect(screen.getByText('Message Information')).toBeInTheDocument();
      expect(screen.queryByText('See you at six')).toBeNull();
      expect(screen.queryByText('Read')).toBeNull();
    });
  });
});
