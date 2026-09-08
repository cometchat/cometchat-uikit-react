import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPinnedMessages } from '../CometChatPinnedMessages';
import { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatThemeContext } from '../../../context/ThemeContext';
import { resolvePinSaveFeatures, resetPinSaveFeatures } from '../../../utils/pinSaveFeatures';
import { buildUser, buildGroup } from '../../../testing/mock-builders';

// Capture the props the bubble renderer receives, to assert textFormatters is forwarded.
// A per-file mock (not global) so the main spec keeps rendering the real renderer.
const { rendererProps } = vi.hoisted(() => ({
  rendererProps: [] as Record<string, unknown>[],
}));
vi.mock('../../CometChatMessageBubble/CometChatMessageBubbleRenderer', () => ({
  CometChatMessageBubbleRenderer: (props: Record<string, unknown>) => {
    rendererProps.push(props);
    return null;
  },
}));

const loggedInUser = buildUser({ uid: 'me' }) as unknown as CometChat.User;
const registry = new CometChatPluginRegistry([]);

class NoopFormatter extends CometChatTextFormatter {
  readonly id = 'test-noop';
}

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
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMuid: () => `m-${String(id)}`,
    getParentMessageId: () => 0,
    getPinnedAt: () => 1735689600,
    getPinnedBy: () => 'admin',
    getSavedAt: () => undefined,
    isPinned: () => true,
    isSaved: () => false,
  } as unknown as CometChat.BaseMessage;
}

function mockPinnedRequest(pages: CometChat.BaseMessage[][]) {
  let call = 0;
  vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
    const builder = {
      setLimit: () => builder,
      setPinned: () => builder,
      setGUID: () => builder,
      setUID: () => builder,
      build: () => ({
        fetchPrevious: () => Promise.resolve(pages[call++] ?? []),
        hasMore: () => call < pages.length,
      }),
    };
    return builder as unknown as CometChat.MessagesRequestBuilder;
  });
}

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
  rendererProps.length = 0;
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

describe('CometChatPinnedMessages — textFormatters', () => {
  it('forwards textFormatters to the message bubble renderer', async () => {
    const fmt = new NoopFormatter();
    mockPinnedRequest([[pinnedMessage(1)]]);
    renderPanel({ textFormatters: [fmt] });

    await waitFor(() => {
      expect(rendererProps.length).toBeGreaterThan(0);
    });
    expect(
      rendererProps.some(
        p => Array.isArray(p.textFormatters) && (p.textFormatters as unknown[]).includes(fmt)
      )
    ).toBe(true);
  });

  it('does not set textFormatters when the prop is omitted', async () => {
    mockPinnedRequest([[pinnedMessage(1)]]);
    renderPanel();

    await waitFor(() => {
      expect(rendererProps.length).toBeGreaterThan(0);
    });
    expect(rendererProps.every(p => p.textFormatters === undefined)).toBe(true);
  });
});
