import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatDeleteBubble } from './CometChatDeleteBubble';
import { CometChatMessageBubble } from '../../CometChatMessageBubble';

const meta: Meta = {
  title: 'Base Elements/Delete Bubble',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Renders a placeholder for deleted messages.',
      },
    },
  },
};
export default meta;

// --- Helpers ---

function mockDeletedMsg(
  overrides: {
    senderName?: string;
    senderUid?: string;
    sentAt?: number;
  } = {}
): CometChat.BaseMessage {
  const now = Math.floor(Date.now() / 1000);
  return {
    getId: () => Math.floor(Math.random() * 10000),
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({
      getUid: () => overrides.senderUid ?? 'user-john',
      getName: () => overrides.senderName ?? 'John Doe',
      getAvatar: () => '',
      getStatus: () => 'online',
    }),
    getSentAt: () => overrides.sentAt ?? now,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => now,
    getReplyCount: () => 0,
    getMuid: () => `muid-${String(Math.random())}`,
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;
}

function mockGroup(): CometChat.Group {
  return {
    getGuid: () => 'group-design',
    getName: () => 'Design Team',
    getMembersCount: () => 8,
    getType: () => 'public',
  } as unknown as CometChat.Group;
}

function ChatContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 560,
        padding: 16,
        background: 'var(--cometchat-background-color-01, #fff)',
        borderRadius: 'var(--cometchat-radius-4, 16px)',
        border: '1px solid var(--cometchat-border-color-light, #f5f5f5)',
      }}
    >
      {children}
    </div>
  );
}

// --- Stories ---

/** Default — outgoing + incoming deleted messages. */
export const Default = () => (
  <ChatContainer>
    <CometChatMessageBubble
      message={mockDeletedMsg()}
      alignment="right"
      contentView={<CometChatDeleteBubble isSentByMe text="This message was deleted" />}
    />
    <CometChatMessageBubble
      message={mockDeletedMsg({ senderName: 'Jane Smith', senderUid: 'user-jane' })}
      alignment="left"
      group={mockGroup()}
      contentView={<CometChatDeleteBubble isSentByMe={false} text="This message was deleted" />}
    />
  </ChatContainer>
);

/** Custom text override — outgoing + incoming. */
export const CustomText = () => (
  <ChatContainer>
    <CometChatMessageBubble
      message={mockDeletedMsg()}
      alignment="right"
      contentView={<CometChatDeleteBubble isSentByMe text="Message removed by admin" />}
    />
    <CometChatMessageBubble
      message={mockDeletedMsg({ senderName: 'Jane Smith', senderUid: 'user-jane' })}
      alignment="left"
      group={mockGroup()}
      contentView={<CometChatDeleteBubble isSentByMe={false} text="Message removed by admin" />}
    />
  </ChatContainer>
);
