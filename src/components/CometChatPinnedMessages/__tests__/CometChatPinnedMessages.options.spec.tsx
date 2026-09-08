import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatThemeContext } from '../../../context/ThemeContext';
import { resolvePinSaveFeatures, resetPinSaveFeatures } from '../../../utils/pinSaveFeatures';
import { buildUser, buildGroup } from '../../../testing/mock-builders';

/**
 * Which message options the Pinned panel asks for.
 *
 * Tested at the props seam rather than through a rendered menu: the panel's job
 * is to declare the option set, and asserting on the declaration pins that
 * intent without depending on how any one plugin builds its menu.
 */

interface CapturedBubbleProps {
  hideMessageInfoOption?: boolean;
  hideDeleteMessageOption?: boolean;
  hideReplyOption?: boolean;
  hideReplyInThreadOption?: boolean;
  hideEditMessageOption?: boolean;
  hideReactionOption?: boolean;
  hideCopyMessageOption?: boolean;
  hideUnpinMessageOption?: boolean;
  hideSaveMessageOption?: boolean;
  hideUnsaveMessageOption?: boolean;
  hideFlagMessageOption?: boolean;
  hideMessagePrivatelyOption?: boolean;
  hideTranslateMessageOption?: boolean;
  optionsLayout?: string;
  quickOptionsCount?: number;
  bubbleVariant?: string;
  messageAlignment?: number;
}

const capturedProps: CapturedBubbleProps[] = [];

vi.mock('../../CometChatMessageBubble/CometChatMessageBubbleRenderer', () => ({
  CometChatMessageBubbleRenderer: (props: CapturedBubbleProps) => {
    capturedProps.push(props);
    return React.createElement('div', { 'data-testid': 'bubble' });
  },
}));

const { CometChatPinnedMessages, PINNED_DEFAULT_QUICK_OPTIONS_COUNT } =
  await import('../CometChatPinnedMessages');

const loggedInUser = buildUser({ uid: 'me' }) as unknown as CometChat.User;
const registry = new CometChatPluginRegistry([]);

function pinnedMessage(id: number): CometChat.BaseMessage {
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
    getDeletedAt: () => 0,
    getParentMessageId: () => 0,
    getPinnedAt: () => 1735689600,
    getSavedAt: () => undefined,
    isPinned: () => true,
    isSaved: () => false,
  } as unknown as CometChat.BaseMessage;
}

function mockPinnedRequest(messages: CometChat.BaseMessage[]) {
  let call = 0;
  vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
    const builder = {
      setLimit: () => builder,
      setPinned: () => builder,
      setGUID: () => builder,
      setUID: () => builder,
      build: () => ({
        fetchPrevious: () => Promise.resolve(call++ === 0 ? messages : []),
        hasMore: () => false,
      }),
    };
    return builder as unknown as CometChat.MessagesRequestBuilder;
  });
}

function adminGroup() {
  const g = buildGroup() as unknown as CometChat.Group;
  Object.assign(g, {
    getGuid: () => 'g1',
    getScope: () => CometChat.GROUP_MEMBER_SCOPE.ADMIN,
    getOwner: () => 'someone-else',
  });
  return g;
}

async function renderPanel(props: Record<string, unknown> = {}) {
  mockPinnedRequest([pinnedMessage(1)]);
  render(
    <CometChatPluginRegistryContext.Provider value={registry}>
      <CometChatThemeContext.Provider value={{ theme: 'light', setTheme: vi.fn() }}>
        <CometChatPinnedMessages group={adminGroup()} {...props} />
      </CometChatThemeContext.Provider>
    </CometChatPluginRegistryContext.Provider>
  );
  await waitFor(() => {
    expect(capturedProps.length).toBeGreaterThan(0);
  });
  return capturedProps[0]!;
}

beforeEach(async () => {
  capturedProps.length = 0;
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

describe('CometChatPinnedMessages — option set', () => {
  it('offers Message Info', async () => {
    const props = await renderPanel();
    expect(props.hideMessageInfoOption).toBeFalsy();
  });

  it('withholds Delete — browsing pins must not destroy the message for everyone', async () => {
    const props = await renderPanel();
    expect(props.hideDeleteMessageOption).toBe(true);
  });

  it('withholds the options that need the full conversation behind them', async () => {
    const props = await renderPanel();
    expect(props.hideReplyOption).toBe(true);
    expect(props.hideReplyInThreadOption).toBe(true);
    expect(props.hideEditMessageOption).toBe(true);
    expect(props.hideReactionOption).toBe(true);
  });

  it('lays options out flat — a fly-out has nowhere to go in a ~400px panel', async () => {
    const props = await renderPanel();
    expect(props.optionsLayout).toBe('flat');
  });

  it('keeps the outgoing palette on an own message while laying it out left', async () => {
    capturedProps.length = 0;
    const own = pinnedMessage(1);
    Object.assign(own, {
      getSender: () => ({
        getUid: () => 'me',
        getName: () => 'Me',
        getAvatar: () => '',
        getStatus: () => 'online',
      }),
    });
    mockPinnedRequest([own]);
    render(
      <CometChatPluginRegistryContext.Provider value={registry}>
        <CometChatThemeContext.Provider value={{ theme: 'light', setTheme: vi.fn() }}>
          <CometChatPinnedMessages group={adminGroup()} />
        </CometChatThemeContext.Provider>
      </CometChatPluginRegistryContext.Provider>
    );
    await waitFor(() => {
      expect(capturedProps.length).toBeGreaterThan(0);
    });
    expect(capturedProps[0]!.bubbleVariant).toBe('outgoing');
    expect(capturedProps[0]!.messageAlignment).toBe(0);
  });
});

describe('CometChatPinnedMessages — configurable option toggles', () => {
  it.each([
    'hideCopyMessageOption',
    'hideMessageInfoOption',
    'hideSaveMessageOption',
    'hideUnsaveMessageOption',
    'hideFlagMessageOption',
    'hideMessagePrivatelyOption',
    'hideTranslateMessageOption',
  ] as const)('forwards %s', async prop => {
    const props = await renderPanel({ [prop]: true });
    expect(props[prop]).toBe(true);
  });

  it('leaves an unset toggle undefined rather than coercing it', async () => {
    // Every one of these currently defaults to false in the renderer, so this is
    // equivalent today. It is pinned because it stops being equivalent the moment
    // any default changes: forwarding a hard false here would silently override it.
    const props = await renderPanel();
    expect(props.hideCopyMessageOption).toBeUndefined();
    expect(props.hideTranslateMessageOption).toBeUndefined();
  });

  it('lets a consumer hide Unpin', async () => {
    const props = await renderPanel({ hideUnpinMessageOption: true });
    expect(props.hideUnpinMessageOption).toBe(true);
  });

  it('offers Unpin to a Participant — the server enforces, not the client', async () => {
    // Unpin is shown to everyone; a denied unpin reverts with a toast server-side.
    capturedProps.length = 0;
    mockPinnedRequest([pinnedMessage(1)]);
    const participantGroup = buildGroup() as unknown as CometChat.Group;
    Object.assign(participantGroup, {
      getGuid: () => 'g1',
      getScope: () => CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
      getOwner: () => 'someone-else',
    });
    render(
      <CometChatPluginRegistryContext.Provider value={registry}>
        <CometChatThemeContext.Provider value={{ theme: 'light', setTheme: vi.fn() }}>
          <CometChatPinnedMessages group={participantGroup} hideUnpinMessageOption={false} />
        </CometChatThemeContext.Provider>
      </CometChatPluginRegistryContext.Provider>
    );
    await waitFor(() => {
      expect(capturedProps.length).toBeGreaterThan(0);
    });
    expect(capturedProps[0]!.hideUnpinMessageOption).toBe(false);
  });

  it('still hides the options this panel never offers', async () => {
    // No prop should be able to turn these on.
    const props = await renderPanel({
      hideDeleteMessageOption: false,
      hideReplyOption: false,
    });
    expect(props.hideDeleteMessageOption).toBe(true);
    expect(props.hideReplyOption).toBe(true);
  });
});

describe('CometChatPinnedMessages — quick options', () => {
  it("uses the panel default, which is lower than the message list's", async () => {
    // The panel is narrow; every quick icon costs the bubble width it needs.
    const props = await renderPanel();
    expect(props.quickOptionsCount).toBe(PINNED_DEFAULT_QUICK_OPTIONS_COUNT);
    expect(PINNED_DEFAULT_QUICK_OPTIONS_COUNT).toBeLessThan(2);
  });

  it('lets a consumer surface some options as icons', async () => {
    const props = await renderPanel({ quickOptionsCount: 2 });
    expect(props.quickOptionsCount).toBe(2);
  });
});
