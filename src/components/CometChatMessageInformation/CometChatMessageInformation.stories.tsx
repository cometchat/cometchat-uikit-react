import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageInformation } from './CometChatMessageInformation';
import { CometChatPluginRegistryContext } from '../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../plugins/CometChatPluginRegistry';
import { CometChatTextPlugin } from '../../plugins/core/text/CometChatTextPlugin';
import { CometChatImagePlugin } from '../../plugins/core/image/CometChatImagePlugin';

// --- Mock SDK helpers ---

function createMockUser(uid: string, name: string, avatar?: string) {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => avatar ?? '',
    getStatus: () => 'online',
  } as unknown as CometChat.User;
}

// Default mock receipts with actual data so stories render meaningful UI
const defaultMockReceipts = [
  {
    getSender: () => createMockUser('user-alice', 'Alice', 'https://i.pravatar.cc/150?u=alice'),
    getReadAt: () => Math.floor(Date.now() / 1000) - 30,
    getDeliveredAt: () => Math.floor(Date.now() / 1000) - 90,
    getReceiverType: () => 'group',
    getReceiver: () => ({ getGuid: () => 'group-1' }),
    getMessageId: () => 101,
    getReceiptType: () => 'read',
    getTimestamp: () => Math.floor(Date.now() / 1000) - 30,
  } as unknown as CometChat.MessageReceipt,
  {
    getSender: () => createMockUser('user-bob', 'Bob', 'https://i.pravatar.cc/150?u=bob'),
    getReadAt: () => Math.floor(Date.now() / 1000) - 60,
    getDeliveredAt: () => Math.floor(Date.now() / 1000) - 120,
    getReceiverType: () => 'group',
    getReceiver: () => ({ getGuid: () => 'group-1' }),
    getMessageId: () => 101,
    getReceiptType: () => 'read',
    getTimestamp: () => Math.floor(Date.now() / 1000) - 60,
  } as unknown as CometChat.MessageReceipt,
  {
    getSender: () =>
      createMockUser('user-charlie', 'Charlie', 'https://i.pravatar.cc/150?u=charlie'),
    getReadAt: () => 0,
    getDeliveredAt: () => Math.floor(Date.now() / 1000) - 100,
    getReceiverType: () => 'group',
    getReceiver: () => ({ getGuid: () => 'group-1' }),
    getMessageId: () => 101,
    getReceiptType: () => 'delivery',
    getTimestamp: () => Math.floor(Date.now() / 1000) - 100,
  } as unknown as CometChat.MessageReceipt,
];

// Mock SDK methods so stories render without real SDK initialization
CometChat.getLoggedinUser = () =>
  Promise.resolve({
    getUid: () => 'user-me',
    getName: () => 'Me',
    getAvatar: () => '',
  } as unknown as CometChat.User);
CometChat.getMessageReceipts = () => Promise.resolve(defaultMockReceipts);
CometChat.addMessageListener = () => {};
CometChat.removeMessageListener = () => {};
CometChat.addConnectionListener = () => {};
CometChat.removeConnectionListener = () => {};
CometChat.isInitialized = () => true;

const meta: Meta = {
  title: 'Components/Messages/Message Information',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays detailed message information including read/delivered receipts for each group member.',
      },
    },
    layout: 'centered',
  },
};
export default meta;

// --- Plugin registry for stories ---

const storyRegistry = new CometChatPluginRegistry([CometChatTextPlugin, CometChatImagePlugin]);

// --- Mock message helper ---

function createMockMessage(
  receiverType: 'user' | 'group',
  opts?: {
    readAt?: number;
    deliveredAt?: number;
    type?: string;
    text?: string;
  }
) {
  const {
    readAt = 0,
    deliveredAt = 0,
    type = 'text',
    text = 'Hello! How are you doing today?',
  } = opts ?? {};
  return {
    getId: () => 101,
    getType: () => type,
    getCategory: () => 'message',
    getReceiverType: () => receiverType,
    getSender: () => createMockUser('user-me', 'Me'),
    getSentAt: () => Math.floor(Date.now() / 1000) - 300,
    getReadAt: () => readAt,
    getDeliveredAt: () => deliveredAt,
    getDeletedAt: () => null,
    getText: () => text,
    getReactions: () => [],
    getReplyCount: () => 0,
    getMentionedUsers: () => [],
    getEditedAt: () => null,
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage;
}

const panelStyle: React.CSSProperties = {
  width: 380,
  height: 500,
  border: '1px solid #e0e0e0',
  borderRadius: 12,
  overflow: 'hidden',
};

/**
 * Wrapper that provides the plugin registry context for stories.
 */
function StoryWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CometChatPluginRegistryContext.Provider value={storyRegistry}>
      {children}
    </CometChatPluginRegistryContext.Provider>
  );
}

// --- Stories ---
// NOTE: These stories require the CometChat SDK to be mocked at the Storybook level
// (via .storybook/preview.ts or a decorator) so that CometChat.getMessageReceipts,
// CometChat.getLoggedinUser, CometChat.addMessageListener, etc. are available.
// The component now always fetches from the SDK — no mock prop bypass.

/**
 * Default1on1 — 1-on-1 message with read and delivered timestamps.
 * Shows the message bubble preview via the plugin system.
 */
export const Default1on1 = () => (
  <StoryWrapper>
    <div style={panelStyle}>
      <CometChatMessageInformation.Root
        message={createMockMessage('user', {
          readAt: Math.floor(Date.now() / 1000) - 60,
          deliveredAt: Math.floor(Date.now() / 1000) - 120,
        })}
        onClose={() => console.log('Close clicked')}
      />
    </div>
  </StoryWrapper>
);

/**
 * Default1on1NoRead — 1-on-1 message delivered but not yet read.
 */
export const Default1on1NoRead = () => (
  <StoryWrapper>
    <div style={panelStyle}>
      <CometChatMessageInformation.Root
        message={createMockMessage('user', {
          readAt: 0,
          deliveredAt: Math.floor(Date.now() / 1000) - 120,
        })}
        onClose={() => console.log('Close clicked')}
      />
    </div>
  </StoryWrapper>
);

/**
 * DefaultGroup — group message with receipts fetched from SDK.
 * Shows mock receipt data with multiple members who have read/delivered.
 */
export const DefaultGroup = () => (
  <StoryWrapper>
    <div style={panelStyle}>
      <CometChatMessageInformation.Root
        message={createMockMessage('group', {
          deliveredAt: Math.floor(Date.now() / 1000) - 120,
          readAt: Math.floor(Date.now() / 1000) - 30,
        })}
        onClose={() => console.log('Close clicked')}
      />
    </div>
  </StoryWrapper>
);

/**
 * GroupEmpty — group message with no receipts yet.
 */
export const GroupEmpty = () => {
  const originalGetMessageReceipts = CometChat.getMessageReceipts.bind(CometChat);
  CometChat.getMessageReceipts = () => Promise.resolve([]);

  React.useEffect(() => {
    return () => {
      CometChat.getMessageReceipts = originalGetMessageReceipts;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StoryWrapper>
      <div style={panelStyle}>
        <CometChatMessageInformation.Root
          message={createMockMessage('group')}
          onClose={() => console.log('Close clicked')}
        />
      </div>
    </StoryWrapper>
  );
};
/**
 * GroupMessageWithReceipts — group message where multiple members have
 * delivered and/or read the message. Uses the default mock receipts
 * which include Alice (read), Bob (read), and Charlie (delivered only).
 */
export const GroupMessageWithReceipts = () => {
  return (
    <StoryWrapper>
      <div style={panelStyle}>
        <CometChatMessageInformation.Root
          message={createMockMessage('group', {
            deliveredAt: Math.floor(Date.now() / 1000) - 120,
            readAt: Math.floor(Date.now() / 1000) - 30,
          })}
          onClose={() => console.log('Close clicked')}
        />
      </div>
    </StoryWrapper>
  );
};
