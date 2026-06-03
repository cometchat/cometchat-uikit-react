import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatThreadHeader } from './CometChatThreadHeader';
import { CometChatPluginRegistryContext } from '../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../plugins/CometChatPluginRegistry';
import { CometChatTextPlugin } from '../../plugins/core/text/CometChatTextPlugin';
import { CometChatImagePlugin } from '../../plugins/core/image/CometChatImagePlugin';
import { CometChatUIKit } from '../../CometChatUIKit';

// ============================================
// Mock SDK — logged-in user for alignment detection
// ============================================

const LOGGED_IN_UID = 'logged-in-user';

const mockLoggedInUser = {
  getUid: () => LOGGED_IN_UID,
  getName: () => 'Me',
  getAvatar: () => '',
  getStatus: () => 'online',
  getLastActiveAt: () => 0,
} as unknown as CometChat.User;

// Mock CometChatUIKit.getLoggedInUser so useLoggedInUser resolves synchronously
(CometChatUIKit as unknown as { _loggedInUser: CometChat.User | null })._loggedInUser =
  mockLoggedInUser;

// Mock CometChat.getLoggedinUser for the async fallback path
CometChat.getLoggedinUser = () => Promise.resolve(mockLoggedInUser);

// ============================================
// Mock helpers
// ============================================

function mockUser(uid: string, name: string): CometChat.User {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => '',
    getStatus: () => 'online',
    getLastActiveAt: () => 0,
  } as unknown as CometChat.User;
}

function mockMessage(overrides: {
  id?: number;
  text?: string;
  type?: string;
  category?: string;
  senderName?: string;
  senderUid?: string;
  sentAt?: number;
  replyCount?: number;
  deliveredAt?: number;
  readAt?: number;
}): CometChat.BaseMessage {
  const {
    id = Math.floor(Math.random() * 10000),
    text = 'This is the parent message that started the thread.',
    type = 'text',
    category = 'message',
    senderName = 'Alice',
    senderUid = 'user-1',
    sentAt = Math.floor(Date.now() / 1000) - 7200,
    replyCount = 5,
    deliveredAt = 0,
    readAt = 0,
  } = overrides;

  return {
    getId: () => id,
    getType: () => type,
    getCategory: () => category,
    getSender: () => mockUser(senderUid, senderName),
    getReplyCount: () => replyCount,
    getSentAt: () => sentAt,
    getDeletedAt: () => 0,
    getEditedAt: () => 0,
    getReadAt: () => readAt,
    getDeliveredAt: () => deliveredAt,
    getParentMessageId: () => 0,
    getText: () => text,
    getMuid: () => `muid-${String(id)}`,
    getReceiverType: () => 'user',
    getReceiver: () => ({ getUid: () => 'receiver-456', getName: () => 'Jane' }),
    getConversationId: () => 'conv-1',
    getRawMessage: () => ({}),
    getMetadata: () => ({}),
    getData: () => ({}),
    getAttachments: () => [
      {
        getUrl: () => 'https://picsum.photos/seed/thread-img/400/300',
        getName: () => 'photo.png',
        getExtension: () => 'png',
        getMimeType: () => 'image/png',
        getSize: () => 102400,
      },
    ],
    getAttachment: () => ({
      getUrl: () => 'https://picsum.photos/seed/thread-img/400/300',
      getName: () => 'photo.png',
      getExtension: () => 'png',
      getMimeType: () => 'image/png',
      getSize: () => 102400,
    }),
    getMentionedUsers: () => [],
    getReactions: () => [],
    getUnreadRepliesCount: () => 0,
  } as unknown as CometChat.BaseMessage;
}

// ============================================
// Plugin registry for stories
// ============================================

const storyRegistry = new CometChatPluginRegistry([CometChatTextPlugin, CometChatImagePlugin]);

// ============================================
// Layout helpers
// ============================================

const fullScreenCenterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  minHeight: 80,
  boxSizing: 'border-box',
  padding: 16,
};

const cardStyle: React.CSSProperties = {
  width: 500,
  border: '1px solid var(--cometchat-border-color-light, #eee)',
  borderRadius: 'var(--cometchat-radius-2, 8px)',
  overflow: 'hidden',
};

/**
 * Wrapper providing plugin registry context and card layout.
 */
function StoryWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CometChatPluginRegistryContext.Provider value={storyRegistry}>
      <div style={fullScreenCenterStyle}>
        <div style={cardStyle}>{children}</div>
      </div>
    </CometChatPluginRegistryContext.Provider>
  );
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/Messages/Thread Header',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Header component for threaded message views showing the parent message and reply count.',
      },
    },
  },
};
export default meta;

// ============================================
// Stories
// ============================================

/** Default thread header with a text parent message and 5 replies. */
export const Default = () => {
  const msg = mockMessage({
    text: 'This is the parent message that started the thread discussion.',
    senderName: 'Alice',
    senderUid: 'user-1',
    replyCount: 5,
  });

  return (
    <StoryWrapper>
      <CometChatThreadHeader parentMessage={msg} onClose={() => console.log('Thread closed')} />
    </StoryWrapper>
  );
};

/** Thread header displaying an image parent message with 12 replies. */
export const ImageParentMessage = () => {
  const msg = mockMessage({
    type: 'image',
    senderName: 'Bob',
    senderUid: 'user-2',
    replyCount: 12,
  });

  return (
    <StoryWrapper>
      <CometChatThreadHeader parentMessage={msg} onClose={() => console.log('Thread closed')} />
    </StoryWrapper>
  );
};

/** Thread header with a single reply (singular form). */
export const SingleReply = () => {
  const msg = mockMessage({
    text: 'Quick question about the API changes.',
    senderName: 'Charlie',
    senderUid: 'user-3',
    replyCount: 1,
  });

  return (
    <StoryWrapper>
      <CometChatThreadHeader parentMessage={msg} onClose={() => console.log('Thread closed')} />
    </StoryWrapper>
  );
};

/** Thread header with zero replies. */
export const ZeroReplies = () => {
  const msg = mockMessage({
    text: 'Has anyone looked into this issue yet?',
    senderName: 'Diana',
    senderUid: 'user-4',
    replyCount: 0,
  });

  return (
    <StoryWrapper>
      <CometChatThreadHeader parentMessage={msg} onClose={() => console.log('Thread closed')} />
    </StoryWrapper>
  );
};

/** Thread header with 999+ replies (cap display). */
export const ManyReplies = () => {
  const msg = mockMessage({
    text: 'This thread has a lot of activity!',
    senderName: 'Eve',
    senderUid: 'user-5',
    replyCount: 1500,
  });

  return (
    <StoryWrapper>
      <CometChatThreadHeader parentMessage={msg} onClose={() => console.log('Thread closed')} />
    </StoryWrapper>
  );
};

/** Outgoing parent message (right-aligned bubble) — sender matches logged-in user. */
export const OutgoingParentMessage = () => {
  const msg = mockMessage({
    text: 'I started this thread with my own message.',
    senderName: 'Me',
    senderUid: LOGGED_IN_UID,
    replyCount: 3,
    readAt: Math.floor(Date.now() / 1000),
  });

  return (
    <StoryWrapper>
      <CometChatThreadHeader parentMessage={msg} onClose={() => console.log('Thread closed')} />
    </StoryWrapper>
  );
};

/** Long parent message text. */
export const LongParentMessage = () => {
  const longText =
    'This is a very long parent message that should demonstrate how the component handles text that exceeds the normal display length. The thread header should show the full message in a scrollable bubble wrapper area, allowing users to read the complete parent message before scrolling down to the replies.';
  const msg = mockMessage({
    text: longText,
    senderName: 'Frank',
    senderUid: 'user-6',
    replyCount: 7,
  });

  return (
    <StoryWrapper>
      <CometChatThreadHeader parentMessage={msg} onClose={() => console.log('Thread closed')} />
    </StoryWrapper>
  );
};
