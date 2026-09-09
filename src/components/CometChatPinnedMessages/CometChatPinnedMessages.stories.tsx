import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPinnedMessages } from './CometChatPinnedMessages';
import { CometChatPinnedMessagesContext } from './CometChatPinnedMessages.context';
import type { CometChatPinnedMessagesContextValue } from './CometChatPinnedMessages.types';
import { CometChatPluginRegistry } from '../../plugins/CometChatPluginRegistry';
import { CometChatPluginRegistryContext } from '../../context/PluginRegistryContext';
import type { CometChatMessagePlugin } from '../../plugins/plugin.types';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';
import { CometChatTextPlugin } from '../../plugins/core/text/CometChatTextPlugin';
import { MESSAGE_OPTION_IDS } from '../../plugins/core/shared/CometChatMessageOptions';
import unpinIcon from '../../assets/unpin.svg';

// The pinned rows render real message bubbles, and the bubble renderer reads the
// logged-in user to decide incoming/outgoing. Seed a mock user so stories render
// without a live login (the component's tests do the equivalent via a spy).
(CometChatUIKit as unknown as { _loggedInUser: CometChat.User | null })._loggedInUser = {
  getUid: () => 'me',
  getName: () => 'Me',
  getAvatar: () => '',
} as unknown as CometChat.User;

// ============================================
// Plugin registry — pinned rows render real bubbles via the plugin system,
// so a registry with a minimal text plugin must be provided (same setup the
// component's tests use).
// ============================================

const textPlugin: CometChatMessagePlugin = {
  ...CometChatTextPlugin,
  getOptions: (message, context) => [
    {
      id: MESSAGE_OPTION_IDS.pinMessage,
      title: context.getLocalizedString?.('message_list_option_unpin_message') ?? 'Unpin message',
      iconURL: unpinIcon,
      onClick: () => {
        // no-op
      },
    },
  ],
};

const registry = new CometChatPluginRegistry([textPlugin]);

// ============================================
// Mock data
// ============================================

function mockGroup(): CometChat.Group {
  return {
    getGuid: () => 'group-design',
    getName: () => 'Design Team',
    getScope: () => 'participant',
    getOwner: () => 'someone-else',
    getMembersCount: () => 8,
    getType: () => 'public',
  } as unknown as CometChat.Group;
}

function mockPinnedMessage(overrides: {
  id?: number;
  text?: string;
  senderName?: string;
  senderUid?: string;
  sentAt?: number;
  pinnedBy?: string;
  saved?: boolean;
}): CometChat.BaseMessage {
  const {
    id = Math.floor(Math.random() * 100000),
    text = 'Pinned for everyone in this conversation.',
    senderName = 'Jane Smith',
    senderUid = 'user-jane',
    sentAt = Math.floor(Date.now() / 1000),
    pinnedBy = 'admin',
    saved = false,
  } = overrides;

  return {
    getId: () => id,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({
      getUid: () => senderUid,
      getName: () => senderName,
      getAvatar: () => '',
      getStatus: () => 'online',
    }),
    getReceiverType: () => 'group',
    getReceiverId: () => 'group-design',
    getSentAt: () => sentAt,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMuid: () => `m-${String(id)}`,
    getParentMessageId: () => 0,
    getMentionedUsers: () => [],
    getText: () => text,
    getPinnedAt: () => sentAt,
    getPinnedBy: () => pinnedBy,
    getSavedAt: () => (saved ? sentAt : undefined),
    isPinned: () => true,
    isSaved: () => saved,
    isSystemPinned: () => false,
  } as unknown as CometChat.BaseMessage;
}

const mockPins: CometChat.BaseMessage[] = [
  mockPinnedMessage({
    id: 1,
    text: 'Release checklist lives in the pinned doc — read before Friday.',
    senderName: 'Alex Kim',
    senderUid: 'user-alex',
    pinnedBy: 'user-alex',
  }),
  mockPinnedMessage({
    id: 2,
    text: 'Design tokens are frozen for this sprint.',
    senderName: 'Alice Johnson',
    senderUid: 'alice-johnson',
    pinnedBy: 'admin',
  }),
  mockPinnedMessage({
    id: 3,
    text: 'Standup moves to 10:30 starting next week.',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
    pinnedBy: 'admin',
    saved: true,
  }),
];

// ============================================
// Context mock helper
// ============================================

function createMockContext(
  overrides: Partial<CometChatPinnedMessagesContextValue> = {}
): CometChatPinnedMessagesContextValue {
  const noop = () => {
    /* no-op */
  };
  return {
    messages: mockPins,
    fetchState: 'loaded',
    hasMore: false,
    loadMore: noop,
    group: mockGroup(),
    hideCloseButton: false,
    quickOptionsCount: 1,
    hideCopyMessageOption: false,
    hideMessageInfoOption: false,
    hideUnpinMessageOption: false,
    hideSaveMessageOption: false,
    hideUnsaveMessageOption: false,
    hideFlagMessageOption: false,
    hideMessagePrivatelyOption: false,
    hideTranslateMessageOption: false,
    onPinMessage: noop,
    onUnpinMessage: noop,
    onSaveMessage: noop,
    onUnsaveMessage: noop,
    onMessageInfo: noop,
    showToast: noop,
    ...overrides,
  };
}

const containerStyle: React.CSSProperties = {
  width: 400,
  height: 560,
  border: '1px solid var(--cometchat-border-color-light, #e0e0e0)',
  borderRadius: 8,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--cometchat-background-color-01, #fff)',
};

function Panel({
  ctx,
  children,
}: {
  ctx: CometChatPinnedMessagesContextValue;
  children: React.ReactNode;
}) {
  return (
    <CometChatPluginRegistryContext.Provider value={registry}>
      <CometChatPinnedMessagesContext.Provider value={ctx}>
        <div style={containerStyle}>{children}</div>
      </CometChatPinnedMessagesContext.Provider>
    </CometChatPluginRegistryContext.Provider>
  );
}

// ============================================
// Meta
// ============================================

const meta: Meta = {
  title: 'Components/Messages/Pinned Messages',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The messages pinned in a conversation. Stories render the compound sub-components against a mocked context and a minimal plugin registry (no backend).',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

// ============================================
// Stories
// ============================================

/** Default — a few pinned messages. */
export const Default: Story = {
  render: () => (
    <Panel ctx={createMockContext()}>
      <CometChatPinnedMessages.Header />
      <CometChatPinnedMessages.List />
    </Panel>
  ),
};

/** Empty — nothing pinned yet. */
export const Empty: Story = {
  render: () => (
    <Panel ctx={createMockContext({ messages: [], fetchState: 'empty' })}>
      <CometChatPinnedMessages.Header />
      <CometChatPinnedMessages.EmptyState />
    </Panel>
  ),
};

/** Loading — initial fetch in progress. */
export const Loading: Story = {
  render: () => (
    <Panel ctx={createMockContext({ messages: [], fetchState: 'loading' })}>
      <CometChatPinnedMessages.Header />
      <CometChatPinnedMessages.LoadingState />
    </Panel>
  ),
};

/** Error — the fetch failed. */
export const Error: Story = {
  render: () => (
    <Panel ctx={createMockContext({ messages: [], fetchState: 'error' })}>
      <CometChatPinnedMessages.Header />
      <CometChatPinnedMessages.ErrorState />
    </Panel>
  ),
};

/** Many pins — the list scrolls. */
export const ManyPins: Story = {
  render: () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      mockPinnedMessage({
        id: 100 + i,
        text: `Pinned item #${String(i + 1)} — kept at the top for the whole conversation.`,
        senderName: i % 2 === 0 ? 'Alex Kim' : 'Alice Johnson',
        senderUid: i % 2 === 0 ? 'user-alex' : 'alice-johnson',
      })
    );
    return (
      <Panel ctx={createMockContext({ messages: many })}>
        <CometChatPinnedMessages.Header />
        <CometChatPinnedMessages.List />
      </Panel>
    );
  },
};

/** Close button hidden. */
export const HideCloseButton: Story = {
  render: () => (
    <Panel ctx={createMockContext({ hideCloseButton: true })}>
      <CometChatPinnedMessages.Header />
      <CometChatPinnedMessages.List />
    </Panel>
  ),
};

/** Trimmed options — Save/Unsave and Translate removed from the per-message menu. */
export const TrimmedOptions: Story = {
  render: () => (
    <Panel
      ctx={createMockContext({
        hideSaveMessageOption: true,
        hideUnsaveMessageOption: true,
        hideTranslateMessageOption: true,
      })}
    >
      <CometChatPinnedMessages.Header />
      <CometChatPinnedMessages.List />
    </Panel>
  ),
};
