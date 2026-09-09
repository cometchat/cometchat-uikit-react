/**
 * Multi-attachment "batch" stories.
 *
 * A batch is a set of consecutive messages that share the same `batchId` in
 * metadata. Rather than hand-composing wrappers and manually applying the
 * `--batch-first/middle/last` classes and chrome suppression, these stories feed
 * the batch straight into the **real `CometChatMessageList`**. The list is what
 * ships this behaviour: `computeBatchPosition()` groups consecutive same-batchId
 * messages, `MessageItem` applies the batch wrapper class, and the bubble
 * renderer suppresses avatar / sender name / receipts for middle & last items.
 *
 * So the alignment and tight vertical stacking you see here is produced by the
 * same code path used in production — not simulated in the story.
 */
import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatMessageList } from '../CometChatMessageList/CometChatMessageList';
import { CometChatMessageListProvider } from '../CometChatMessageList/CometChatMessageList.context';
import {
  initialMessageListState,
  CometChatMessageListAlignment,
} from '../CometChatMessageList/CometChatMessageList.types';
import type {
  CometChatUseMessageListReturn,
  CometChatMessageListState,
} from '../CometChatMessageList/CometChatMessageList.types';
import { CometChatPluginRegistry } from '../../plugins/CometChatPluginRegistry';
import { defaultPlugins } from '../../plugins/core';
import { CometChatPluginRegistryContext } from '../../context/PluginRegistryContext';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/Batch (Multi-Attachment)',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Multiple messages sent as one batch (shared batchId in metadata) render ' +
          'as a tightly-grouped, correctly-aligned stack. Each media type is a ' +
          'separate message; the caption sits on the last message only. The grouping ' +
          'is done by the real CometChatMessageList (computeBatchPosition + batch chrome).',
      },
    },
  },
  decorators: [
    Story => (
      <div
        style={{
          background: '#fff',
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;

// ============================================================
// Mock SDK objects
// ============================================================

const SHARED_BATCH_ID = 'batch-abc123';

function mockUser(uid: string, name: string, avatar = ''): CometChat.User {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => avatar,
    getStatus: () => 'online',
  } as unknown as CometChat.User;
}

function mockGroup(): CometChat.Group {
  return {
    getGuid: () => 'group-design',
    getName: () => 'Design Team',
    getMembersCount: () => 8,
    getType: () => 'public',
  } as unknown as CometChat.Group;
}

// The logged-in user. Outgoing messages are sent by this user (→ right-aligned);
// incoming messages come from OTHER_USER (→ left-aligned). MessageItem resolves
// alignment via CometChatUIKit.getLoggedInUser(), so seed the cached value.
const LOGGED_IN_USER = mockUser('user-john', 'John Doe');
const OTHER_USER = mockUser('user-jane', 'Jane Smith');
(CometChatUIKit as unknown as { _loggedInUser: CometChat.User | null })._loggedInUser =
  LOGGED_IN_USER;

const now = Math.floor(Date.now() / 1000);

/** Fields every mock message shares so the real message list can render it. */
function baseMessageFields(id: number, sender: CometChat.User, batchId: string) {
  return {
    getId: () => id,
    getMuid: () => `muid-${String(id)}`,
    getCategory: () => 'message',
    getSender: () => sender,
    getReceiverType: () => 'user',
    getReceiverId: () => 'receiver-id',
    getSentAt: () => now,
    getDeliveredAt: () => 0,
    getReadAt: () => now,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getParentMessageId: () => 0,
    setReadAt: () => undefined,
    setDeliveredAt: () => undefined,
    getMentionedUsers: () => [],
    getMetadata: () => ({ batchId }),
    getReactions: () => [],
  };
}

interface MediaOpts {
  id: number;
  sender: CometChat.User;
  batchId: string;
  count?: number;
  caption?: string;
}

function mockImageMsg({ id, sender, batchId, count = 2, caption = '' }: MediaOpts) {
  const atts = Array.from({ length: count }, (_, i) => ({
    getUrl: () => `https://picsum.photos/seed/batch-img${String(id)}-${String(i)}/800/600`,
    getSize: () => 204800,
  }));
  return {
    ...baseMessageFields(id, sender, batchId),
    getType: () => 'image',
    getCaption: () => caption,
    getData: () => ({ text: caption }),
    getAttachments: () => atts,
  } as unknown as CometChat.MediaMessage;
}

function mockVideoMsg({ id, sender, batchId, count = 1, caption = '' }: MediaOpts) {
  const atts = Array.from({ length: count }, (_, i) => ({
    getUrl: () => 'https://www.w3schools.com/html/mov_bbb.mp4',
    getSize: () => 5242880,
    getMimeType: () => 'video/mp4',
    getExtension: () => 'mp4',
    getName: () => `video-${String(i + 1)}.mp4`,
  }));
  return {
    ...baseMessageFields(id, sender, batchId),
    getType: () => 'video',
    getCaption: () => caption,
    getData: () => ({ text: caption }),
    getAttachments: () => atts,
  } as unknown as CometChat.MediaMessage;
}

function mockAudioMsg({ id, sender, batchId, count = 1, caption = '' }: MediaOpts) {
  const url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';
  const atts = Array.from({ length: count }, (_, i) => ({
    getUrl: () => url,
    getName: () => `recording-${String(i + 1)}.mp3`,
    getMimeType: () => 'audio/mpeg',
    getExtension: () => 'mp3',
    getSize: () => 1048576,
  }));
  return {
    ...baseMessageFields(id, sender, batchId),
    getType: () => 'audio',
    getCaption: () => caption,
    getData: () => ({ text: caption }),
    getAttachments: () => atts,
  } as unknown as CometChat.MediaMessage;
}

function mockFileMsg({ id, sender, batchId, count = 2, caption = '' }: MediaOpts) {
  const fileNames = ['Project-Proposal.pdf', 'Budget-2026.xlsx', 'notes.txt'];
  const mimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];
  const exts = ['pdf', 'xlsx', 'txt'];
  const atts = Array.from({ length: count }, (_, i) => ({
    getUrl: () => '#',
    getName: () => fileNames[i % fileNames.length]!,
    getSize: () => 2457600,
    getMimeType: () => mimeTypes[i % mimeTypes.length]!,
    getExtension: () => exts[i % exts.length]!,
  }));
  return {
    ...baseMessageFields(id, sender, batchId),
    getType: () => 'file',
    getCaption: () => caption,
    getData: () => ({ text: caption }),
    getAttachments: () => atts,
  } as unknown as CometChat.MediaMessage;
}

// ============================================================
// Message-list harness (renders the real list from a static array)
// ============================================================

const pluginRegistry = new CometChatPluginRegistry(defaultPlugins);

/** Build a mock message-list context value carrying the given messages. */
function buildContext(messages: CometChat.BaseMessage[]): CometChatUseMessageListReturn {
  const state: CometChatMessageListState = {
    ...initialMessageListState,
    messages,
    fetchState: 'loaded',
    hasMore: false,
    hasMoreNewer: false,
    hasReachedLatest: true,
    isAtBottom: true,
  };
  const noop = () => undefined;
  const noopAsync = () => Promise.resolve(undefined);

  return {
    state,
    allMessages: state.messages,
    loggedInUser: LOGGED_IN_USER as never,
    user: undefined,
    group: undefined,
    isLoading: false,
    isEmpty: false,
    isError: false,
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
      hideDateSeparator: true,
      onThreadRepliesClick: undefined,
      onAvatarClick: undefined,
      hideFlagRemarkField: false,
      disableTruncation: false,
      hideModerationView: false,
      isAgentChat: false,
      bubbleView: undefined,
      onEditMessage: undefined,
      onReplyMessage: undefined,
      showSmartReplies: false,
      smartRepliesKeywords: ['what', 'when', 'why', 'who', 'where', 'how', '?'],
      smartRepliesDelayDuration: 10000,
      showConversationStarters: false,
    },
  } as unknown as CometChatUseMessageListReturn;
}

/** Renders the real message list with a static batch, inside a sized container. */
function BatchList({
  messages,
  group,
  height = 800,
}: {
  messages: CometChat.BaseMessage[];
  group?: CometChat.Group;
  height?: number;
}) {
  const value = group ? { ...buildContext(messages), group } : buildContext(messages);
  return (
    <CometChatPluginRegistryContext.Provider value={pluginRegistry}>
      <CometChatMessageListProvider value={value}>
        <div
          style={{
            width: 720,
            height,
            border: '1px solid var(--cometchat-border-color-light, #f5f5f5)',
            borderRadius: 'var(--cometchat-radius-4, 16px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--cometchat-message-list-bg, #fff)',
          }}
        >
          <CometChatMessageList.View
            messageAlignment={CometChatMessageListAlignment.standard}
            hideDateSeparator
          />
        </div>
      </CometChatMessageListProvider>
    </CometChatPluginRegistryContext.Provider>
  );
}

// ============================================================
// Stories
// ============================================================

/**
 * Outgoing batch — image → video → audio → file, sent by the logged-in user.
 * Caption only on the last message (file). Right-aligned, tightly grouped.
 */
export const OutgoingBatch = () => {
  const messages = [
    mockImageMsg({ id: 101, sender: LOGGED_IN_USER, batchId: SHARED_BATCH_ID, count: 3 }),
    mockVideoMsg({ id: 102, sender: LOGGED_IN_USER, batchId: SHARED_BATCH_ID, count: 2 }),
    mockAudioMsg({ id: 103, sender: LOGGED_IN_USER, batchId: SHARED_BATCH_ID, count: 1 }),
    mockFileMsg({
      id: 104,
      sender: LOGGED_IN_USER,
      batchId: SHARED_BATCH_ID,
      count: 2,
      caption: 'Meeting notes and project files',
    }),
  ];
  return <BatchList messages={messages} />;
};

/**
 * Incoming batch (group) — all 4 media types from another user.
 * Sender name/avatar show on the first item only, caption on the last.
 */
export const IncomingBatchGroup = () => {
  const messages = [
    mockImageMsg({ id: 201, sender: OTHER_USER, batchId: SHARED_BATCH_ID, count: 2 }),
    mockVideoMsg({ id: 202, sender: OTHER_USER, batchId: SHARED_BATCH_ID, count: 1 }),
    mockAudioMsg({ id: 203, sender: OTHER_USER, batchId: SHARED_BATCH_ID, count: 2 }),
    mockFileMsg({
      id: 204,
      sender: OTHER_USER,
      batchId: SHARED_BATCH_ID,
      count: 3,
      caption: 'Here are the project documents',
    }),
  ];
  return <BatchList messages={messages} group={mockGroup()} />;
};

/**
 * Batch vs non-batch — standalone messages (unique batchIds → normal spacing)
 * above, a shared-batchId group (tight spacing) below. Both use the real list.
 */
export const BatchVsNonBatch = () => {
  const label: React.CSSProperties = {
    margin: '0 0 8px',
    fontSize: 11,
    fontWeight: 600,
    color: '#999',
    textTransform: 'uppercase',
  };

  const standalone = [
    mockImageMsg({ id: 301, sender: LOGGED_IN_USER, batchId: 's1', count: 2 }),
    mockVideoMsg({ id: 302, sender: LOGGED_IN_USER, batchId: 's2', count: 1 }),
    mockAudioMsg({ id: 303, sender: LOGGED_IN_USER, batchId: 's3', count: 1 }),
    mockFileMsg({
      id: 304,
      sender: LOGGED_IN_USER,
      batchId: 's4',
      count: 1,
      caption: 'Standalone message with caption',
    }),
  ];

  const batch = [
    mockImageMsg({ id: 401, sender: LOGGED_IN_USER, batchId: SHARED_BATCH_ID, count: 2 }),
    mockVideoMsg({ id: 402, sender: LOGGED_IN_USER, batchId: SHARED_BATCH_ID, count: 1 }),
    mockAudioMsg({ id: 403, sender: LOGGED_IN_USER, batchId: SHARED_BATCH_ID, count: 1 }),
    mockFileMsg({
      id: 404,
      sender: LOGGED_IN_USER,
      batchId: SHARED_BATCH_ID,
      count: 1,
      caption: 'Batch message with caption',
    }),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={label}>Normal spacing (separate messages, no shared batchId)</p>
        <BatchList messages={standalone} height={800} />
      </div>
      <div>
        <p style={label}>Batch spacing (shared batchId — tight grouping)</p>
        <BatchList messages={batch} height={520} />
      </div>
    </div>
  );
};
