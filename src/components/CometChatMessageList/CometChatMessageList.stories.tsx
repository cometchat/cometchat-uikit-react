/**
 * CometChatMessageList Storybook Stories
 *
 * Interactive stories demonstrating the message list component variants:
 *   - Default user conversation with mixed message types
 *   - Empty state (no messages)
 *   - Loading state (shimmer skeleton)
 *   - Error state
 *   - Mixed message types
 *   - Thread reply indicators
 *   - All variants in one showcase
 *
 * The stories bypass the SDK by rendering `CometChatMessageList.View` directly
 * inside a mock `CometChatMessageListContext` provider. This gives us full
 * control over the state (messages, loading, error, empty) without touching
 * the real SDK manager or event bridge.
 */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatMessageList } from './CometChatMessageList';
import { CometChatMessageListProvider } from './CometChatMessageList.context';
import {
  initialMessageListState,
  CometChatMessageListAlignment,
} from './CometChatMessageList.types';
import type {
  CometChatUseMessageListReturn,
  CometChatMessageListState,
} from './CometChatMessageList.types';

import { CometChatPluginRegistry } from '../../plugins/CometChatPluginRegistry';
import { defaultPlugins } from '../../plugins/core';
import { CometChatPluginRegistryContext } from '../../context/PluginRegistryContext';

// ============================================
// Mock Helpers
// ============================================

function mockUser(overrides: {
  uid?: string;
  name?: string;
  avatar?: string;
  status?: string;
}): CometChat.User {
  const { uid = 'user-john-doe', name = 'John Doe', avatar = '', status = 'online' } = overrides;
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => avatar,
    getStatus: () => status,
  } as unknown as CometChat.User;
}

function mockGroup(
  overrides: {
    guid?: string;
    name?: string;
    membersCount?: number;
    type?: string;
  } = {}
): CometChat.Group {
  const {
    guid = 'group-design',
    name = 'Design Team',
    membersCount = 8,
    type = 'public',
  } = overrides;
  return {
    getGuid: () => guid,
    getName: () => name,
    getMembersCount: () => membersCount,
    getType: () => type,
  } as unknown as CometChat.Group;
}

/**
 * Build a mock message. The plugins read `getType()` and `getCategory()`
 * to find the right renderer; everything else is type-specific.
 */
interface MockMessageOptions {
  id?: number;
  type?: string;
  category?: string;
  sender?: CometChat.User;
  sentAt?: number;
  readAt?: number;
  deliveredAt?: number;
  replyCount?: number;
  // text-specific
  text?: string;
  mentionedUsers?: CometChat.User[];
  // media-specific
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  caption?: string;
  // action-specific
  actionMessage?: string;
}

function mockMessage(opts: MockMessageOptions = {}): CometChat.BaseMessage {
  const {
    id = Math.floor(Math.random() * 100000),
    type = 'text',
    category = 'message',
    sender = mockUser({ uid: 'user-john-doe', name: 'John Doe' }),
    sentAt = Math.floor(Date.now() / 1000),
    readAt = 0,
    deliveredAt = 0,
    replyCount = 0,
    text = '',
    mentionedUsers = [],
    url = '',
    fileName = '',
    fileSize = 0,
    mimeType = '',
    caption = '',
    actionMessage = '',
  } = opts;

  const attachment = url
    ? {
        url,
        fileName,
        mimeType,
        metadata: { size: fileSize, mimeType },
      }
    : null;

  return {
    getId: () => id,
    getMuid: () => `muid-${String(id)}`,
    getType: () => type,
    getCategory: () => category,
    getSender: () => sender,
    getSentAt: () => sentAt,
    getDeliveredAt: () => deliveredAt,
    getReadAt: () => readAt,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => replyCount,
    getParentMessageId: () => 0,
    setReadAt: () => undefined,
    setDeliveredAt: () => undefined,
    getReceiverType: () => 'user',
    getReceiverId: () => 'receiver-id',
    // text message fields
    getText: () => text,
    getMentionedUsers: () => mentionedUsers,
    // media message fields
    getAttachments: () => (attachment ? [attachment] : []),
    getCaption: () => caption,
    getData: () => ({ text: caption, entities: {} }),
    // generic
    getMetadata: () => ({}),
    getReactions: () => [],
    // action message fields
    getMessage: () => actionMessage,
    getAction: () => 'joined',
    getActionOn: () => sender,
    getActionBy: () => sender,
    getActionFor: () => sender,
  } as unknown as CometChat.BaseMessage;
}

const LOGGED_IN_USER = mockUser({
  uid: 'user-john-doe',
  name: 'John Doe',
  avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp',
  status: 'online',
});

const OTHER_USER = mockUser({
  uid: 'user-jane-smith',
  name: 'Jane Smith',
  avatar: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-2.webp',
  status: 'online',
});

/**
 * Build a realistic set of mixed-type messages for demos.
 * Alternates between outgoing (logged-in user) and incoming (other user),
 * and cycles through text → image → file → audio → video.
 */
function createTestMessages(count = 15): CometChat.BaseMessage[] {
  const messages: CometChat.BaseMessage[] = [];
  const now = Math.floor(Date.now() / 1000);

  const sampleTexts = [
    'Hey! How is the project going?',
    'Looking great so far. The new designs are 🔥',
    "I'll push the PR this afternoon.",
    'Can you review when you get a chance?',
    'Sounds good — let me know if you need anything.',
  ];

  for (let i = 0; i < count; i++) {
    const isOutgoing = i % 3 === 0;
    const sender = isOutgoing ? LOGGED_IN_USER : OTHER_USER;
    const base = {
      id: i + 1,
      sentAt: now - (count - i) * 120,
      sender,
      deliveredAt: now - (count - i) * 120,
      readAt: isOutgoing ? now - (count - i) * 120 + 1 : 0,
    };

    const typeIdx = i % 5;
    switch (typeIdx) {
      case 0:
        messages.push(
          mockMessage({
            ...base,
            type: 'text',
            text: sampleTexts[i % sampleTexts.length] ?? 'Hello!',
          })
        );
        break;
      case 1:
        messages.push(
          mockMessage({
            ...base,
            type: 'image',
            url: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-2.webp',
            fileName: 'sample-image.jpg',
            mimeType: 'image/jpeg',
          })
        );
        break;
      case 2:
        messages.push(
          mockMessage({
            ...base,
            type: 'file',
            url: 'https://example.com/document.pdf',
            fileName: 'project-report.pdf',
            fileSize: 2048000,
            mimeType: 'application/pdf',
          })
        );
        break;
      case 3:
        messages.push(
          mockMessage({
            ...base,
            type: 'audio',
            url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
            fileName: 'voice-note.mp3',
            mimeType: 'audio/mpeg',
          })
        );
        break;
      default:
        messages.push(
          mockMessage({
            ...base,
            type: 'video',
            url: 'https://www.w3schools.com/html/movie.mp4',
            fileName: 'recording.mp4',
            mimeType: 'video/mp4',
          })
        );
    }
  }

  return messages;
}

// ============================================
// Context Value Builder
// ============================================

/**
 * Build a mock `CometChatUseMessageListReturn` that we feed directly into
 * the context, bypassing the real hook and SDK entirely.
 */
function buildMockContextValue(
  overrides: Partial<CometChatMessageListState> & {
    allMessages?: CometChat.BaseMessage[];
    isLoading?: boolean;
    isEmpty?: boolean;
    isError?: boolean;
  } = {}
): CometChatUseMessageListReturn {
  const state: CometChatMessageListState = {
    ...initialMessageListState,
    messages: overrides.messages ?? overrides.allMessages ?? [],
    fetchState: overrides.fetchState ?? 'loaded',
    hasMore: overrides.hasMore ?? false,
    hasMoreNewer: overrides.hasMoreNewer ?? false,
    hasReachedLatest: overrides.hasReachedLatest ?? true,
    isAtBottom: overrides.isAtBottom ?? true,
    unreadCount: overrides.unreadCount ?? 0,
    newMessageCount: overrides.newMessageCount ?? 0,
  };

  const noop = () => {
    /* mock */
  };
  const noopAsync = async () => {
    /* mock */
  };

  return {
    state,
    allMessages: state.messages,
    loggedInUser: LOGGED_IN_USER as never,
    user: undefined,
    group: undefined,
    isLoading: overrides.isLoading ?? false,
    isEmpty: overrides.isEmpty ?? (state.messages.length === 0 && state.fetchState === 'empty'),
    isError: overrides.isError ?? false,
    fetchPrevious: noopAsync,
    fetchNext: noopAsync,
    deleteMessage: noopAsync,
    scrollToMessage: noop,
    goToMessage: noopAsync,
    setAtBottom: noop,
    clearNewMessageCount: noop,
    markConversationAsReadIfUnread: noop,
    markMessageAsUnread: noopAsync,
    reactToMessage: noopAsync,
    scrollToBottom: () => 'scroll-dom',
    hasMore: state.hasMore,
    hasMoreNewer: state.hasMoreNewer,
    hasReachedLatest: state.hasReachedLatest,
    isFetchingMore: state.isFetchingMore,
    newMessageCount: state.newMessageCount,
    unreadCount: state.unreadCount,
    isConversationRead: state.isConversationRead,
    lastReadMessageId: state.lastReadMessageId,
    error: state.error,
    isAtBottom: state.isAtBottom,
    options: {
      hideStickyDate: false,
      hideAvatar: false,
      hideGroupActionMessages: false,
      quickOptionsCount: 2,
      hideReplyOption: false,
      hideReplyInThreadOption: false,
      hideEditMessageOption: false,
      hideDeleteMessageOption: false,
      hideCopyMessageOption: false,
      hideReactionOption: false,
      hideMessageInfoOption: false,
      hideFlagMessageOption: false,
      hideMessagePrivatelyOption: false,
      hideTranslateMessageOption: false,
      showMarkAsUnreadOption: false,
      separatorDateTimeFormat: undefined,
      stickyDateTimeFormat: undefined,
      messageSentAtDateTimeFormat: undefined,
      messageInfoDateTimeFormat: undefined,
      reactionsRequestBuilder: undefined,
      onReactionClick: undefined,
      onReactionListItemClick: undefined,
      messageAlignment: 1,
      showScrollbar: false,
      hideDateSeparator: false,
      onThreadRepliesClick: undefined,
      onAvatarClick: undefined,
      hideFlagRemarkField: false,
      disableTruncation: false,
      hideModerationView: false,
      isAgentChat: false,
      bubbleView: undefined,
      leadingBubbleView: undefined,
      headerBubbleView: undefined,
      statusInfoBubbleView: undefined,
      footerBubbleView: undefined,
      threadBubbleView: undefined,
      onEditMessage: undefined,
      onReplyMessage: undefined,
      showSmartReplies: false,
      smartRepliesKeywords: ['what', 'when', 'why', 'who', 'where', 'how', '?'],
      smartRepliesDelayDuration: 10000,
      showConversationStarters: false,
    },
  };
}

// ============================================
// Story Wrapper
// ============================================

const pluginRegistry = new CometChatPluginRegistry(defaultPlugins);

interface StoryShellProps {
  value: CometChatUseMessageListReturn;
  group?: CometChat.Group;
  messageAlignment?: CometChatMessageListAlignment;
  showScrollbar?: boolean;
  hideDateSeparator?: boolean;
  disableTruncation?: boolean;
  hideModerationView?: boolean;
  height?: number | string;
}

/**
 * Story shell — provides the plugin registry, the mock message-list context,
 * and a fixed-size container so the list has room to render.
 */
function StoryShell({
  value,
  group,
  messageAlignment = CometChatMessageListAlignment.standard,
  showScrollbar = false,
  hideDateSeparator = false,
  disableTruncation = false,
  hideModerationView = false,
  height,
}: StoryShellProps) {
  // Inject group into the context value so the View reads it from context
  const ctxValue = group ? { ...value, group } : value;

  // Merge the showScrollbar prop into the context options so sub-components
  // (LoadingState, ErrorState, EmptyState, View) all respect it via context.
  const ctxWithScrollbar: CometChatUseMessageListReturn = {
    ...ctxValue,
    options: {
      ...ctxValue.options,
      showScrollbar,
    },
  };

  return (
    <CometChatPluginRegistryContext.Provider value={pluginRegistry}>
      <CometChatMessageListProvider value={ctxWithScrollbar}>
        <div
          style={{
            width: '100%',
            height: height ?? '100vh',
            border: '1px solid var(--cometchat-border-color-light, #e8e8e8)',
            borderRadius: 'var(--cometchat-radius-2, 8px)',
            overflow: 'hidden',
            background: 'var(--cometchat-background-color-01, #fff)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <CometChatMessageList.LoadingState />
          <CometChatMessageList.ErrorState />
          <CometChatMessageList.EmptyState />
          <CometChatMessageList.View
            messageAlignment={messageAlignment}
            showScrollbar={showScrollbar}
            hideDateSeparator={hideDateSeparator}
            disableTruncation={disableTruncation}
            hideModerationView={hideModerationView}
          />
        </div>
      </CometChatMessageListProvider>
    </CometChatPluginRegistryContext.Provider>
  );
}

// ============================================
// Meta
// ============================================

const meta: Meta<typeof StoryShell> = {
  title: 'Components/Messages/CometChat Message List',
  tags: ['autodocs'],
  component: StoryShell,
  args: {
    showScrollbar: false,
    hideDateSeparator: false,
    disableTruncation: false,
    hideModerationView: false,
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CometChatMessageList renders a scrollable list of messages for the active conversation. It supports infinite scrolling, date separators, standard/left alignment, receipts, thread indicators, unread banners, and custom empty/loading/error slots. These stories bypass the SDK by feeding the list context mock data directly.',
      },
    },
  },
  argTypes: {
    messageAlignment: {
      control: 'select',
      options: [CometChatMessageListAlignment.standard, CometChatMessageListAlignment.left],
      description: 'Standard (outgoing right, incoming left) or Left (all left-aligned).',
    },
    showScrollbar: {
      control: 'boolean',
      description: 'Hide the native scrollbar.',
    },
    hideDateSeparator: {
      control: 'boolean',
      description: 'Hide date separators between messages.',
    },
    disableTruncation: {
      control: 'boolean',
      description: 'Disable "read more / show less" truncation in long text bubbles.',
    },
    hideModerationView: {
      control: 'boolean',
      description: 'Hide the moderation footer under disapproved / permission-denied messages.',
    },
  },
};
export default meta;
type Story = StoryObj<typeof StoryShell>;

// ============================================
// Stories
// ============================================

/** Default — user conversation with a mix of text, image, file, audio, and video messages. */
export const Default: Story = {
  render: args => (
    <StoryShell
      {...args}
      group={mockGroup()}
      value={buildMockContextValue({ messages: createTestMessages(15), fetchState: 'loaded' })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '15 mixed-type messages in a group conversation. Outgoing messages align right with receipts; incoming messages align left with avatar and sender name.',
      },
    },
  },
};

/** Empty state — no messages in the conversation. */
export const EmptyState: Story = {
  render: args => (
    <StoryShell
      {...args}
      value={buildMockContextValue({
        messages: [],
        fetchState: 'empty',
        isEmpty: true,
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Empty state shown when a conversation has no messages. Customize by passing `emptyView` to `CometChatMessageList.View`.',
      },
    },
  },
};

/** Loading state — shimmer skeleton while messages are being fetched. */
export const LoadingState: Story = {
  render: args => (
    <StoryShell
      {...args}
      value={buildMockContextValue({
        messages: [],
        fetchState: 'loading',
        isLoading: true,
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shimmer skeleton shown during the initial fetch. Customize by passing `loadingView` to `CometChatMessageList.View`.',
      },
    },
  },
};

/** Error state — fetch failed; shows error UI with retry. */
export const ErrorState: Story = {
  render: args => (
    <StoryShell
      {...args}
      value={buildMockContextValue({
        messages: [],
        fetchState: 'error',
        isError: true,
        error: 'Failed to fetch messages. Please try again.',
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Error state shown when fetching messages fails. Customize by passing `errorView` to `CometChatMessageList.View`.',
      },
    },
  },
};

/** Mixed message types — text, image, file, audio, video in one conversation. */
export const MixedMessageTypes: Story = {
  render: args => (
    <StoryShell
      {...args}
      group={mockGroup()}
      value={buildMockContextValue({ messages: createTestMessages(10), fetchState: 'loaded' })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Every core message type — text, image, file, audio, and video — rendered in a single list. Demonstrates how different bubble plugins compose together in the view.',
      },
    },
  },
};

/** Thread replies visible — messages with reply counts show a thread indicator. */
export const ThreadReplyVisible: Story = {
  render: args => {
    const msgs = [
      mockMessage({
        id: 1,
        type: 'text',
        text: 'Kicking off the new launch plan.',
        sender: LOGGED_IN_USER,
        sentAt: Math.floor(Date.now() / 1000) - 600,
        readAt: Math.floor(Date.now() / 1000) - 599,
        replyCount: 3,
      }),
      mockMessage({
        id: 2,
        type: 'text',
        text: "Sounds great. I've drafted the timeline — let me know what you think.",
        sender: OTHER_USER,
        sentAt: Math.floor(Date.now() / 1000) - 500,
        replyCount: 5,
      }),
      mockMessage({
        id: 3,
        type: 'text',
        text: 'Will review this afternoon.',
        sender: LOGGED_IN_USER,
        sentAt: Math.floor(Date.now() / 1000) - 300,
        readAt: Math.floor(Date.now() / 1000) - 299,
      }),
      mockMessage({
        id: 4,
        type: 'text',
        text: 'Moved the kickoff to Friday — can everyone make it?',
        sender: OTHER_USER,
        sentAt: Math.floor(Date.now() / 1000) - 100,
        replyCount: 1,
      }),
    ];
    return (
      <StoryShell
        {...args}
        group={mockGroup()}
        value={buildMockContextValue({ messages: msgs, fetchState: 'loaded' })}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Messages with thread reply counts. Each message that has replies shows a "View thread" indicator with the reply count beneath the bubble.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** All variants — default, empty, and error states in one scrollable view. */
export const AllVariantsShowcase: Story = {
  render: args => {
    const labelStyle: React.CSSProperties = {
      margin: 0,
      font: 'var(--cometchat-font-body-medium, 500 14px / 18px Roboto)',
      color: 'var(--cometchat-text-color-secondary, #666)',
    };
    const sectionStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--cometchat-spacing-2, 8px)',
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--cometchat-spacing-5, 20px)',
          padding: 'var(--cometchat-spacing-5, 20px)',
        }}
      >
        <h3
          style={{
            margin: 0,
            font: 'var(--cometchat-font-heading3-bold, 700 20px / 24px Roboto)',
            color: 'var(--cometchat-text-color-primary, #141414)',
          }}
        >
          Message List Variants
        </h3>

        <div style={sectionStyle}>
          <p style={labelStyle}>Standard alignment (sent &amp; received)</p>
          <StoryShell
            {...args}
            group={mockGroup()}
            value={buildMockContextValue({
              messages: createTestMessages(10),
              fetchState: 'loaded',
            })}
            height={400}
          />
        </div>

        <div style={sectionStyle}>
          <p style={labelStyle}>Empty state</p>
          <StoryShell
            {...args}
            value={buildMockContextValue({
              messages: [],
              fetchState: 'empty',
              isEmpty: true,
            })}
            height={400}
          />
        </div>

        <div style={sectionStyle}>
          <p style={labelStyle}>Error state</p>
          <StoryShell
            {...args}
            value={buildMockContextValue({
              messages: [],
              fetchState: 'error',
              isError: true,
              error: 'Failed to fetch messages.',
            })}
            height={400}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase of message list variants — standard alignment with mixed messages, empty state, and error state — in a single view.',
      },
    },
  },
};
