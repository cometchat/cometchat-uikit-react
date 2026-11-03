/**
 * The public props of <CometChatPinnedMessages />, one case each: the prop is set (or left out) on the
 * real component and the test checks what it changes. Each row is the real bubble, drawn by the text
 * plugin, with its real options menu. Only the SDK is mocked; the session is the kit's own
 * (CometChatUIKit.init resumes the logged-in user from the mocked SDK, with Pin and Save enabled).
 */
import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatPinnedMessages,
  PINNED_DEFAULT_QUICK_OPTIONS_COUNT,
} from '../CometChatPinnedMessages';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { UIKitSettingsBuilder } from '../../../CometChatUIKit/UIKitSettings';
import { resolvePinSaveFeatures } from '../../../utils/pinSaveFeatures';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatTextPlugin } from '../../../plugins/core/text/CometChatTextPlugin';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { buildGroup, buildTextMessage, buildUser } from '../../../testing/mock-builders';
import { covers } from '../../../testing/covers';

const sdk = vi.hoisted(() => ({
  newBuilder: vi.fn(),
  setLimit: vi.fn(),
  setPinned: vi.fn(),
  setGUID: vi.fn(),
  setUID: vi.fn(),
  fetchPrevious: vi.fn(),
}));

// The real SDK's classes and constants (the kit reads them), with the calls the panel makes mocked.
vi.mock('@cometchat/chat-sdk-javascript', async () => {
  const actual = await vi.importActual<typeof import('@cometchat/chat-sdk-javascript')>(
    '@cometchat/chat-sdk-javascript'
  );
  const me = { getUid: () => 'me', getName: () => 'Me', getAvatar: () => '', getStatus: () => 'online' };
  const resolves = (value: unknown) => () => Promise.resolve(value);
  return {
    ...actual,
    CometChat: Object.assign({}, actual.CometChat, {
      // The session CometChatUIKit.init resumes.
      init: resolves(true),
      setSource: vi.fn(),
      getLoggedinUser: resolves(me),
      getConversationUpdateSettings: resolves(null),
      addLoginListener: vi.fn(),
      removeLoginListener: vi.fn(),
      // Pin and Save are on for this app, with no caps.
      isPinMessageEnabled: resolves(true),
      isSaveMessageEnabled: resolves(true),
      isPinConversationEnabled: resolves(true),
      getPinnedMessagesLimit: resolves(null),
      getSavedMessagesLimit: resolves(null),
      getPinnedConversationsLimit: resolves(null),
      // The pinned read.
      MessagesRequestBuilder: vi.fn(function (this: Record<string, unknown>) {
        sdk.newBuilder();
        this.setLimit = sdk.setLimit.mockReturnValue(this);
        this.setPinned = sdk.setPinned.mockReturnValue(this);
        this.setGUID = sdk.setGUID.mockReturnValue(this);
        this.setUID = sdk.setUID.mockReturnValue(this);
        this.build = () => ({ fetchPrevious: sdk.fetchPrevious });
      }),
    }),
  };
});

const registry = new CometChatPluginRegistry([CometChatTextPlugin]);
const team = buildGroup({ guid: 'g1', name: 'Team' }) as unknown as CometChat.Group;
const bob = buildUser({ uid: 'bob', name: 'Bob' });

/** A pinned text message; Bob's in the Team group unless said otherwise. */
function note(
  id: number,
  { mine = false, saved = false, inChatWithBob = false, text = `Pinned note ${String(id)}` } = {}
) {
  const message = buildTextMessage({
    id,
    text,
    sender: mine ? buildUser({ uid: 'me', name: 'Me' }) : bob,
    receiverType: inChatWithBob ? 'user' : 'group',
    receiverId: inChatWithBob ? 'me' : 'g1',
    sentAt: 1735689600,
  });
  return Object.assign(message, {
    isPinned: () => true,
    getPinnedAt: () => 1735689600,
    getPinnedBy: () => 'bob',
    isSaved: () => saved,
    getSavedAt: () => (saved ? 1735689600 : undefined),
  }) as unknown as CometChat.BaseMessage;
}

/** A messages request builder an app passes in, returning its own page. */
function appBuilder(messages: CometChat.BaseMessage[]) {
  const fetchPrevious = vi.fn().mockResolvedValue(messages);
  const builder = {
    setPinned: vi.fn(),
    setGUID: vi.fn(),
    setUID: vi.fn(),
    build: vi.fn(() => ({ fetchPrevious })),
  };
  builder.setPinned.mockReturnValue(builder);
  builder.setGUID.mockReturnValue(builder);
  builder.setUID.mockReturnValue(builder);
  return builder;
}

class Shout extends CometChatTextFormatter {
  readonly id = 'shout';
  override customLogicToFormatText(text: string) {
    return text.toUpperCase();
  }
}

const Kit: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CometChatPluginRegistryContext.Provider value={registry}>{children}</CometChatPluginRegistryContext.Provider>
);

type Props = React.ComponentProps<typeof CometChatPinnedMessages>;
function show(props: Props = {}) {
  return render(
    <Kit>
      <CometChatPinnedMessages group={team} {...props} />
    </Kit>
  );
}

const rows = () => screen.findAllByRole('listitem');
const firstRow = async () => (await rows())[0]!;
const panel = () => screen.getByRole('dialog', { name: 'Pinned Messages' });
const bubble = (text: string) => screen.findByText(text, { selector: '.cometchat-text-bubble__text' });
const quickIcons = (row: HTMLElement) =>
  Array.from(row.querySelectorAll('.cometchat-context-menu__top-menu-item')).map(b => b.getAttribute('aria-label'));

/** Every option a row offers: its quick icons, then what its "More options" menu lists. */
async function optionsOf(row: HTMLElement): Promise<(string | null)[]> {
  const more = within(row).queryByRole('button', { name: 'More options' });
  if (!more) return quickIcons(row);
  fireEvent.click(more);
  // The menu shows once it has measured where to open.
  const menu = (await within(row).findAllByRole('menuitem')).map(item => item.textContent);
  fireEvent.click(more);
  return [...quickIcons(row), ...menu];
}

/** The options of the one pinned row, rendered with these props. */
async function rowOptions(props: Props, message = note(1)) {
  sdk.fetchPrevious.mockResolvedValue([message]);
  const view = show(props);
  const options = await optionsOf(await firstRow());
  view.unmount();
  return options;
}

const notes = [note(1), note(2)];

beforeAll(async () => {
  await CometChatUIKit.init(new UIKitSettingsBuilder().setAppId('app').setRegion('us').build());
  await resolvePinSaveFeatures();
});

beforeEach(() => {
  for (const fn of [sdk.newBuilder, sdk.setLimit, sdk.setPinned, sdk.setGUID, sdk.setUID]) fn.mockClear();
  sdk.fetchPrevious.mockReset().mockResolvedValue(notes);
});

describe('CometChatPinnedMessages props', () => {
  describe('conversation and request', () => {
    it("group reads that group's pins, and its members can be messaged privately from a row", async () => {
      covers('CometChatPinnedMessages.group', 'set');
      show();
      const row = await firstRow();
      expect(sdk.setGUID).toHaveBeenCalledWith('g1');
      expect(sdk.setUID).not.toHaveBeenCalled();
      expect(await optionsOf(row)).toContain('Message Privately');
    });

    it("user reads the pins of the 1-1 chat with that user", async () => {
      covers('CometChatPinnedMessages.user', 'set');
      sdk.fetchPrevious.mockResolvedValue([note(5, { inChatWithBob: true, text: 'Our pinned plan' })]);
      render(
        <Kit>
          <CometChatPinnedMessages user={bob as unknown as CometChat.User} />
        </Kit>
      );
      expect(await bubble('Our pinned plan')).toBeInTheDocument();
      expect(sdk.setUID).toHaveBeenCalledWith('bob');
      expect(sdk.setGUID).not.toHaveBeenCalled();
      // Not a group: there is no one to message privately.
      expect(await optionsOf(await firstRow())).not.toContain('Message Privately');
    });

    it('without a user or a group there is no conversation to read: nothing is fetched and the empty state shows', async () => {
      covers('CometChatPinnedMessages.user', 'default');
      covers('CometChatPinnedMessages.group', 'default');
      render(
        <Kit>
          <CometChatPinnedMessages />
        </Kit>
      );
      expect(await screen.findByText('No pinned messages yet')).toBeInTheDocument();
      expect(sdk.fetchPrevious).not.toHaveBeenCalled();
      expect(sdk.setGUID).not.toHaveBeenCalled();
      expect(sdk.setUID).not.toHaveBeenCalled();
    });

    it("without a builder, reads the conversation's pinned messages 30 at a time", async () => {
      covers('CometChatPinnedMessages.messagesRequestBuilder', 'default');
      show();
      expect(await rows()).toHaveLength(2);
      expect(sdk.newBuilder).toHaveBeenCalledTimes(1);
      expect(sdk.setLimit).toHaveBeenCalledWith(30);
      expect(sdk.setPinned).toHaveBeenCalledWith(true);
      expect(sdk.setGUID).toHaveBeenCalledWith('g1');
    });

    it("an app's builder is the one read from, still limited to this conversation's pins", async () => {
      covers('CometChatPinnedMessages.messagesRequestBuilder', 'used');
      const builder = appBuilder([note(7, { text: 'From the app builder' })]);
      show({ messagesRequestBuilder: builder as unknown as CometChat.MessagesRequestBuilder });
      expect(await bubble('From the app builder')).toBeInTheDocument();
      expect(builder.build).toHaveBeenCalled();
      expect(builder.setPinned).toHaveBeenCalledWith(true);
      expect(builder.setGUID).toHaveBeenCalledWith('g1');
      expect(sdk.newBuilder).not.toHaveBeenCalled();
      expect(sdk.fetchPrevious).not.toHaveBeenCalled();
    });
  });

  describe('callbacks', () => {
    it('onItemClick gets the message of the row clicked', async () => {
      covers('CometChatPinnedMessages.onItemClick', 'called');
      const onItemClick = vi.fn();
      show({ onItemClick });
      const [, second] = await rows();
      fireEvent.click(second!);
      expect(onItemClick).toHaveBeenCalledTimes(1);
      expect(onItemClick).toHaveBeenCalledWith(notes[1]);
    });

    it('onClose fires from the close button and from Escape', async () => {
      covers('CometChatPinnedMessages.onClose', 'called');
      const onClose = vi.fn();
      show({ onClose });
      await rows();
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(panel(), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('views', () => {
    it('headerView replaces the title row and its close button', async () => {
      covers('CometChatPinnedMessages.headerView', 'custom');
      const view = show();
      await rows();
      expect(screen.getByText('Pinned Messages')).toBeInTheDocument();
      view.unmount();
      show({ headerView: <h2>Team pins</h2> });
      await rows();
      expect(screen.getByRole('heading', { name: 'Team pins' })).toBeInTheDocument();
      expect(screen.queryByText('Pinned Messages')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    });

    it('loadingView shows while the first page loads, in place of the skeleton', async () => {
      covers('CometChatPinnedMessages.loadingView', 'custom');
      sdk.fetchPrevious.mockReturnValue(new Promise(() => undefined));
      const view = show();
      expect(await screen.findByRole('status', { name: 'Loading messages' })).toBeInTheDocument();
      view.unmount();
      show({ loadingView: <p>Fetching pins</p> });
      expect(await screen.findByText('Fetching pins')).toBeInTheDocument();
      expect(screen.queryByRole('status', { name: 'Loading messages' })).toBeNull();
    });

    it('errorView shows when the read fails, in place of the default error', async () => {
      covers('CometChatPinnedMessages.errorView', 'custom');
      sdk.fetchPrevious.mockRejectedValue(new Error('offline'));
      const view = show();
      expect(await screen.findByText('Looks like something went wrong')).toBeInTheDocument();
      view.unmount();
      show({ errorView: <p>Pins are unavailable</p> });
      expect(await screen.findByText('Pins are unavailable')).toBeInTheDocument();
      expect(screen.queryByText('Looks like something went wrong')).toBeNull();
    });

    it('emptyView shows when nothing is pinned, in place of the default', async () => {
      covers('CometChatPinnedMessages.emptyView', 'custom');
      sdk.fetchPrevious.mockResolvedValue([]);
      const view = show();
      expect(await screen.findByText('No pinned messages yet')).toBeInTheDocument();
      view.unmount();
      show({ emptyView: <p>Nothing pinned here</p> });
      expect(await screen.findByText('Nothing pinned here')).toBeInTheDocument();
      expect(screen.queryByText('No pinned messages yet')).toBeNull();
    });

    it('itemView draws each row in place of the message bubble', async () => {
      covers('CometChatPinnedMessages.itemView', 'custom');
      const { container } = show({ itemView: m => <p>Row {String(m.getId())}</p> });
      expect(await screen.findByText('Row 1')).toBeInTheDocument();
      expect(screen.getByText('Row 2')).toBeInTheDocument();
      expect(container.querySelector('.cometchat-message-bubble')).toBeNull();
      expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });

    it("the List part's own itemView wins over the one given to Root", async () => {
      covers('CometChatPinnedMessages.itemView', 'overrides-context');
      render(
        <Kit>
          <CometChatPinnedMessages.Root group={team} itemView={m => <p>Root row {String(m.getId())}</p>}>
            <CometChatPinnedMessages.List itemView={m => <p>List row {String(m.getId())}</p>} />
          </CometChatPinnedMessages.Root>
        </Kit>
      );
      expect(await screen.findByText('List row 1')).toBeInTheDocument();
      expect(screen.queryByText('Root row 1')).toBeNull();
    });

    it('children replace the default layout with the parts given', async () => {
      covers('CometChatPinnedMessages.children', 'custom');
      render(
        <Kit>
          <CometChatPinnedMessages.Root group={team}>
            <p>Pinned in Team</p>
            <CometChatPinnedMessages.List />
          </CometChatPinnedMessages.Root>
        </Kit>
      );
      expect(await rows()).toHaveLength(2);
      expect(screen.getByText('Pinned in Team')).toBeInTheDocument();
      // No default header: no title, no close button.
      expect(screen.queryByText('Pinned Messages')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    });
  });

  describe('display', () => {
    it('className is added to the panel; by default it has only its own', async () => {
      covers('CometChatPinnedMessages.className', 'set', 'default');
      const view = show({ className: 'app-pins' });
      await rows();
      expect(panel()).toHaveClass('cometchat-pinned-messages', 'app-pins');
      view.unmount();
      show();
      await rows();
      expect(panel().className).toBe('cometchat-pinned-messages');
    });

    it('hideCloseButton removes the close button; shown by default', async () => {
      covers('CometChatPinnedMessages.hideCloseButton', 'true', 'false', 'default');
      for (const [props, shown] of [
        [{ hideCloseButton: true }, false],
        [{ hideCloseButton: false }, true],
        [{}, true],
      ] as const) {
        const view = show(props);
        await rows();
        expect(screen.getByText('Pinned Messages')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Close' }) !== null).toBe(shown);
        view.unmount();
      }
    });

    it('textFormatters format the text of each pinned bubble; by default it is shown as written', async () => {
      covers('CometChatPinnedMessages.textFormatters', 'set', 'default');
      const view = show();
      expect(await bubble('Pinned note 1')).toBeInTheDocument();
      view.unmount();
      show({ textFormatters: [new Shout()] });
      expect(await bubble('PINNED NOTE 1')).toBeInTheDocument();
      expect(screen.queryByText('Pinned note 1')).toBeNull();
    });

    it("quickOptionsCount sets how many options sit outside the menu as icons; by default the panel's own count", async () => {
      covers('CometChatPinnedMessages.quickOptionsCount', 'set', 'default');
      // Every option as an icon, to know the full list in order.
      const all = await rowOptions({ quickOptionsCount: 100 });
      expect(all.length).toBeGreaterThan(3);

      sdk.fetchPrevious.mockResolvedValue([note(1)]);
      let view = show();
      let row = await firstRow();
      expect(quickIcons(row)).toEqual(all.slice(0, PINNED_DEFAULT_QUICK_OPTIONS_COUNT));
      expect(await optionsOf(row)).toEqual(all);
      view.unmount();

      expect(PINNED_DEFAULT_QUICK_OPTIONS_COUNT).not.toBe(3);
      view = show({ quickOptionsCount: 3 });
      row = await firstRow();
      expect(quickIcons(row)).toEqual(all.slice(0, 3));
      expect(await optionsOf(row)).toEqual(all);
    });
  });

  describe('message options', () => {
    /** Hiding one option removes just that one from the row; the rest stay. */
    async function expectToggle(
      prop: keyof Props,
      title: string,
      message: CometChat.BaseMessage = note(1)
    ) {
      const offered = await rowOptions({}, message);
      expect(offered).toContain(title);
      expect(await rowOptions({ [prop]: false }, message)).toEqual(offered);
      expect(await rowOptions({ [prop]: true }, message)).toEqual(offered.filter(t => t !== title));
    }

    it('hideCopyMessageOption removes Copy; offered by default', async () => {
      covers('CometChatPinnedMessages.hideCopyMessageOption', 'true', 'false', 'default');
      await expectToggle('hideCopyMessageOption', 'Copy');
    });

    it('hideMessageInfoOption removes Info from your own messages; offered by default', async () => {
      covers('CometChatPinnedMessages.hideMessageInfoOption', 'true', 'false', 'default');
      await expectToggle('hideMessageInfoOption', 'Info', note(1, { mine: true }));
    });

    it('hideUnpinMessageOption removes Unpin; offered by default', async () => {
      covers('CometChatPinnedMessages.hideUnpinMessageOption', 'true', 'false', 'default');
      await expectToggle('hideUnpinMessageOption', 'Unpin message');
    });

    it('hideSaveMessageOption removes Save from a message you have not saved; offered by default', async () => {
      covers('CometChatPinnedMessages.hideSaveMessageOption', 'true', 'false', 'default');
      await expectToggle('hideSaveMessageOption', 'Save message');
    });

    it('hideUnsaveMessageOption removes Unsave from a message you saved; offered by default', async () => {
      covers('CometChatPinnedMessages.hideUnsaveMessageOption', 'true', 'false', 'default');
      await expectToggle('hideUnsaveMessageOption', 'Unsave message', note(1, { saved: true }));
    });

    it("hideFlagMessageOption removes Report from someone else's messages; offered by default", async () => {
      covers('CometChatPinnedMessages.hideFlagMessageOption', 'true', 'false', 'default');
      await expectToggle('hideFlagMessageOption', 'Report');
    });

    it('hideMessagePrivatelyOption removes Message Privately; offered by default', async () => {
      covers('CometChatPinnedMessages.hideMessagePrivatelyOption', 'true', 'false', 'default');
      await expectToggle('hideMessagePrivatelyOption', 'Message Privately');
    });

    it('hideTranslateMessageOption removes Translate; offered by default', async () => {
      covers('CometChatPinnedMessages.hideTranslateMessageOption', 'true', 'false', 'default');
      await expectToggle('hideTranslateMessageOption', 'Translate');
    });
  });

  it("a row is the real bubble: the message's text, its sender and its options", async () => {
    show();
    const row = await firstRow();
    expect(within(row).getByText('Pinned note 1')).toBeInTheDocument();
    expect(within(row).getByText('Bob')).toBeInTheDocument();
    expect(await optionsOf(row)).toEqual(expect.arrayContaining(['Copy', 'Unpin message', 'Save message', 'Report']));
  });
});
