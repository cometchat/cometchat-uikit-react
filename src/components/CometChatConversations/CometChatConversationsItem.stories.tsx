/**
 * CometChatConversationItem Storybook Stories
 *
 * Demonstrates a single conversation item in isolation:
 * - Default (user conversation with unread count)
 * - Group conversation
 * - No last message
 * - With typing indicator
 *
 * @module components/CometChatConversations/CometChatConversationItem
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatConversationsItem } from './CometChatConversationsItem';
import { CometChatConversationsContext } from './CometChatConversations.context';
import type { CometChatConversationsContextValue } from './CometChatConversations.types';

// ============================================
// Mock Data
// ============================================

function createMockUser(uid: string, name: string, status = 'online') {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => status,
    getAvatar: () => `https://i.pravatar.cc/150?u=${uid}`,
    getBlockedByMe: () => false,
    getHasBlockedMe: () => false,
  } as unknown as CometChat.User;
}

function createMockGroup(guid: string, name: string) {
  return {
    getGuid: () => guid,
    getName: () => name,
    getAvatar: () => `https://i.pravatar.cc/150?u=${guid}`,
    getMembersCount: () => 5,
    getIcon: () => `https://i.pravatar.cc/150?u=${guid}`,
  } as unknown as CometChat.Group;
}

function createMockTextMessage(
  id: number,
  text: string,
  sentAt: number,
  senderUid = 'sender-1',
  senderName = 'Sender'
) {
  return {
    getId: () => id,
    getType: () => 'text',
    getText: () => text,
    getSentAt: () => sentAt,
    getCategory: () => 'message',
    getSender: () => createMockUser(senderUid, senderName),
    getDeletedAt: () => null,
    getParentMessageId: () => null,
    getReadAt: () => sentAt + 10,
    getDeliveredAt: () => sentAt + 5,
  } as unknown as CometChat.TextMessage;
}

function createMockConversation(
  id: string,
  type: 'user' | 'group',
  entity: CometChat.User | CometChat.Group,
  lastMessage: CometChat.BaseMessage | null,
  unreadCount = 0
) {
  return {
    getConversationId: () => id,
    getConversationType: () => type,
    getConversationWith: () => entity,
    getLastMessage: () => lastMessage,
    getUnreadMessageCount: () => unreadCount,
  } as unknown as CometChat.Conversation;
}

const now = Math.floor(Date.now() / 1000);

const userConversation = createMockConversation(
  'conv_user_alice',
  'user',
  createMockUser('alice-1', 'Alice Johnson', 'online'),
  createMockTextMessage(1, 'Hey! How are you doing?', now - 60),
  3
);

const groupConversation = createMockConversation(
  'conv_group_team',
  'group',
  createMockGroup('team-1', 'Engineering Team'),
  createMockTextMessage(3, 'The build is passing now', now - 7200, 'bob-1', 'Bob Smith'),
  12
);

const noMessageConversation = createMockConversation(
  'conv_user_emma',
  'user',
  createMockUser('emma-1', 'Emma Davis', 'online'),
  null,
  0
);

// ============================================
// Context mock helper
// ============================================

function createMockContext(
  overrides: Partial<CometChatConversationsContextValue> = {}
): CometChatConversationsContextValue {
  return {
    conversations: [],
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedConversationIds: [],
    selectedConversationsMap: new Map(),
    activeConversationId: null,
    searchText: '',
    selectionMode: 'none',
    hideUserStatus: false,
    hideUnreadCount: false,
    hideReceipts: false,
    options: undefined,
    fetchNext: async () => {},
    setSearchText: () => {},
    selectConversation: () => {},
    deselectConversation: () => {},
    selectRange: () => {},
    deselectRange: () => {},
    clearSelection: () => {},
    setActiveConversation: () => {},
    handleItemClick: () => {},
    deleteConversation: async () => {},
    setConversationToBeDeleted: () => {},
    conversationToBeDeleted: null,
    hideGroupType: false,
    loggedInUserId: 'me-1',
    typingIndicatorMap: new Map(),
    hideDeleteConversation: false,
    showSearchBar: false,
    ...overrides,
  };
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<typeof CometChatConversationsItem> = {
  title: 'Components/Conversations/CometChat Conversation Item',
  component: CometChatConversationsItem,
  tags: ['autodocs'],
  args: {
    hideUserStatus: false,
    hideReceipts: false,
    hideDeleteButton: true,
  },
  argTypes: {
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide the online/offline status indicator.',
    },
    hideReceipts: {
      control: 'boolean',
      description: 'Hide message read receipts.',
    },
    hideDeleteButton: {
      control: 'boolean',
      description: 'Hide the delete button on hover.',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A single conversation list item showing avatar, name, last message preview, timestamp, and unread badge.',
      },
    },
  },
  decorators: [
    Story => (
      <div
        style={{
          width: 400,
          border: '1px solid var(--cometchat-border-color-light, #eee)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof CometChatConversationsItem>;

// ============================================
// Stories
// ============================================

/** Default — user conversation with unread messages. */
export const Default: Story = {
  render: args => (
    <CometChatConversationsContext.Provider value={createMockContext()}>
      <CometChatConversationsItem
        conversation={userConversation}
        hideUserStatus={args.hideUserStatus}
        hideReceipts={args.hideReceipts}
        hideDeleteButton={args.hideDeleteButton}
      />
    </CometChatConversationsContext.Provider>
  ),
};

/** Group conversation with sender name in subtitle. */
export const GroupConversation: Story = {
  render: args => (
    <CometChatConversationsContext.Provider value={createMockContext()}>
      <CometChatConversationsItem
        conversation={groupConversation}
        hideUserStatus={args.hideUserStatus}
        hideReceipts={args.hideReceipts}
        hideDeleteButton={args.hideDeleteButton}
      />
    </CometChatConversationsContext.Provider>
  ),
};

/** Conversation with no last message. */
export const NoLastMessage: Story = {
  render: args => (
    <CometChatConversationsContext.Provider value={createMockContext()}>
      <CometChatConversationsItem
        conversation={noMessageConversation}
        hideUserStatus={args.hideUserStatus}
        hideReceipts={args.hideReceipts}
        hideDeleteButton={args.hideDeleteButton}
      />
    </CometChatConversationsContext.Provider>
  ),
};

/** With options prop — context menu appears on hover. */
export const WithOptions: Story = {
  render: args => {
    const options = (conversation: CometChat.Conversation) => [
      {
        id: 'pin',
        title: `Pin ${conversation.getConversationType() === 'group' ? 'Group' : 'Chat'}`,
        onClick: (conv: CometChat.Conversation) => {
          console.log('Pin clicked for:', conv.getConversationId());
        },
      },
      {
        id: 'mute',
        title: 'Mute Notifications',
        onClick: (conv: CometChat.Conversation) => {
          console.log('Mute clicked for:', conv.getConversationId());
        },
      },
      {
        id: 'archive',
        title: 'Archive',
        onClick: (conv: CometChat.Conversation) => {
          console.log('Archive clicked for:', conv.getConversationId());
        },
      },
    ];

    return (
      <CometChatConversationsContext.Provider value={createMockContext()}>
        <CometChatConversationsItem
          conversation={userConversation}
          hideUserStatus={args.hideUserStatus}
          hideReceipts={args.hideReceipts}
          hideDeleteButton={args.hideDeleteButton}
          options={options}
        />
      </CometChatConversationsContext.Provider>
    );
  },
};

// ============================================
// Internal — Media Last Message Subtitles
// ============================================

function createMockMediaMessage(
  id: number,
  type: 'image' | 'video' | 'audio' | 'file',
  sentAt: number,
  attachmentCount = 1,
  caption = '',
  senderUid = 'sender-1',
  senderName = 'Sender'
) {
  const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
    getUrl: () =>
      `https://example.com/${type}-${String(i)}.${type === 'image' ? 'png' : type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'pdf'}`,
    getName: () =>
      `file-${String(i + 1)}.${type === 'image' ? 'png' : type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'pdf'}`,
    getSize: () => 1024000,
    getMimeType: () =>
      type === 'image'
        ? 'image/png'
        : type === 'video'
          ? 'video/mp4'
          : type === 'audio'
            ? 'audio/mpeg'
            : 'application/pdf',
    getExtension: () =>
      type === 'image' ? 'png' : type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'pdf',
  }));

  return {
    getId: () => id,
    getType: () => type,
    getCategory: () => 'message',
    getSentAt: () => sentAt,
    getSender: () => createMockUser(senderUid, senderName),
    getDeletedAt: () => null,
    getParentMessageId: () => null,
    getReadAt: () => sentAt + 10,
    getDeliveredAt: () => sentAt + 5,
    getCaption: () => caption,
    getData: () => ({ text: caption }),
    getAttachments: () => attachments,
    getMentionedUsers: () => [],
    getMetadata: () => ({}),
  } as unknown as CometChat.BaseMessage;
}

/** Last message is a single image — subtitle shows "Photo". */
export const _LastMessageImage: Story = {
  render: () => {
    const conv = createMockConversation(
      'conv_media_img',
      'user',
      createMockUser('user-img', 'Alice Johnson'),
      createMockMediaMessage(10, 'image', now - 120),
      0
    );
    return (
      <CometChatConversationsContext.Provider value={createMockContext()}>
        <CometChatConversationsItem conversation={conv} />
      </CometChatConversationsContext.Provider>
    );
  },
};
_LastMessageImage.storyName = 'Last Message — Image';
_LastMessageImage.tags = ['!autodocs'];

/** Last message is multiple images — subtitle shows "3 Photos". */
export const _LastMessageMultipleImages: Story = {
  render: () => {
    const conv = createMockConversation(
      'conv_media_imgs',
      'user',
      createMockUser('user-imgs', 'Bob Smith'),
      createMockMediaMessage(11, 'image', now - 180, 3),
      1
    );
    return (
      <CometChatConversationsContext.Provider value={createMockContext()}>
        <CometChatConversationsItem conversation={conv} />
      </CometChatConversationsContext.Provider>
    );
  },
};
_LastMessageMultipleImages.storyName = 'Last Message — 3 Images';
_LastMessageMultipleImages.tags = ['!autodocs'];

/** Last message is a video — subtitle shows "Video". */
export const _LastMessageVideo: Story = {
  render: () => {
    const conv = createMockConversation(
      'conv_media_vid',
      'user',
      createMockUser('user-vid', 'Carol White'),
      createMockMediaMessage(12, 'video', now - 300),
      0
    );
    return (
      <CometChatConversationsContext.Provider value={createMockContext()}>
        <CometChatConversationsItem conversation={conv} />
      </CometChatConversationsContext.Provider>
    );
  },
};
_LastMessageVideo.storyName = 'Last Message — Video';
_LastMessageVideo.tags = ['!autodocs'];

/** Last message is multiple videos — subtitle shows "2 Videos". */
export const _LastMessageMultipleVideos: Story = {
  render: () => {
    const conv = createMockConversation(
      'conv_media_vids',
      'group',
      createMockGroup('grp-vids', 'Design Team'),
      createMockMediaMessage(13, 'video', now - 600, 2, '', 'bob-1', 'Bob Smith'),
      0
    );
    return (
      <CometChatConversationsContext.Provider value={createMockContext()}>
        <CometChatConversationsItem conversation={conv} />
      </CometChatConversationsContext.Provider>
    );
  },
};
_LastMessageMultipleVideos.storyName = 'Last Message — 2 Videos (Group)';
_LastMessageMultipleVideos.tags = ['!autodocs'];

/** Last message is an audio — subtitle shows "Audio". */
export const _LastMessageAudio: Story = {
  render: () => {
    const conv = createMockConversation(
      'conv_media_aud',
      'user',
      createMockUser('user-aud', 'David Lee'),
      createMockMediaMessage(14, 'audio', now - 900),
      2
    );
    return (
      <CometChatConversationsContext.Provider value={createMockContext()}>
        <CometChatConversationsItem conversation={conv} />
      </CometChatConversationsContext.Provider>
    );
  },
};
_LastMessageAudio.storyName = 'Last Message — Audio';
_LastMessageAudio.tags = ['!autodocs'];

/** Last message is a file — subtitle shows "File". */
export const _LastMessageFile: Story = {
  render: () => {
    const conv = createMockConversation(
      'conv_media_file',
      'user',
      createMockUser('user-file', 'Emma Davis'),
      createMockMediaMessage(15, 'file', now - 1200),
      0
    );
    return (
      <CometChatConversationsContext.Provider value={createMockContext()}>
        <CometChatConversationsItem conversation={conv} />
      </CometChatConversationsContext.Provider>
    );
  },
};
_LastMessageFile.storyName = 'Last Message — File';
_LastMessageFile.tags = ['!autodocs'];

/** Last message is multiple files with caption. */
export const _LastMessageFilesWithCaption: Story = {
  render: () => {
    const conv = createMockConversation(
      'conv_media_files_cap',
      'group',
      createMockGroup('grp-files', 'Engineering'),
      createMockMediaMessage(16, 'file', now - 1500, 4, 'Project documents', 'alice-1', 'Alice'),
      0
    );
    return (
      <CometChatConversationsContext.Provider value={createMockContext()}>
        <CometChatConversationsItem conversation={conv} />
      </CometChatConversationsContext.Provider>
    );
  },
};
_LastMessageFilesWithCaption.storyName = 'Last Message — 4 Files with Caption';
_LastMessageFilesWithCaption.tags = ['!autodocs'];

/** All media types side by side for comparison. */
export const _AllMediaSubtitles: Story = {
  render: () => {
    const conversations = [
      createMockConversation(
        'c1',
        'user',
        createMockUser('u1', 'Single Image'),
        createMockMediaMessage(20, 'image', now - 60),
        0
      ),
      createMockConversation(
        'c2',
        'user',
        createMockUser('u2', 'Multi Images'),
        createMockMediaMessage(21, 'image', now - 120, 3, 'Beach photos'),
        1
      ),
      createMockConversation(
        'c3',
        'user',
        createMockUser('u3', 'Single Video'),
        createMockMediaMessage(22, 'video', now - 180),
        0
      ),
      createMockConversation(
        'c4',
        'user',
        createMockUser('u4', 'Multi Videos'),
        createMockMediaMessage(23, 'video', now - 240, 2),
        0
      ),
      createMockConversation(
        'c5',
        'user',
        createMockUser('u5', 'Single Audio'),
        createMockMediaMessage(24, 'audio', now - 300),
        0
      ),
      createMockConversation(
        'c6',
        'user',
        createMockUser('u6', 'Multi Audios'),
        createMockMediaMessage(25, 'audio', now - 360, 4),
        0
      ),
      createMockConversation(
        'c7',
        'user',
        createMockUser('u7', 'Single File'),
        createMockMediaMessage(26, 'file', now - 420),
        0
      ),
      createMockConversation(
        'c8',
        'user',
        createMockUser('u8', 'Multi Files'),
        createMockMediaMessage(27, 'file', now - 480, 5, 'Documents attached'),
        0
      ),
    ];
    return (
      <CometChatConversationsContext.Provider value={createMockContext()}>
        {conversations.map(conv => (
          <CometChatConversationsItem key={conv.getConversationId()} conversation={conv} />
        ))}
      </CometChatConversationsContext.Provider>
    );
  },
};
_AllMediaSubtitles.storyName = 'All Media Subtitles';
_AllMediaSubtitles.tags = ['!autodocs'];
