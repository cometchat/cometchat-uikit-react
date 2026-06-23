import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupActionBubble } from './CometChatGroupActionBubble';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';

const meta: Meta = {
  title: 'Components/Bubbles/Group Action Bubble',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Self-extracting group action bubble. Takes the SDK action message and derives the localized text (member joined/added/left/kicked/banned/scope change) itself.',
      },
    },
  },
};
export default meta;

/** Build a group-action message that getActionMessageText() can read. */
function mockGroupAction(
  action: string,
  byName: string,
  onName?: string,
  scopeNew?: string
): CometChat.BaseMessage {
  return {
    getSender: () => ({ getUid: () => 'u1', getName: () => byName }),
    action,
    actionBy: { name: byName },
    actionOn: { name: onName ?? byName },
    data: scopeNew ? { extras: { scope: { new: scopeNew } } } : {},
  } as unknown as CometChat.BaseMessage;
}

const A = CometChatUIKitConstants.groupMemberAction;

function ChatContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 560,
        padding: 16,
        alignItems: 'center',
        background: 'var(--cometchat-background-color-01, #fff)',
        borderRadius: 'var(--cometchat-radius-4, 16px)',
        border: '1px solid var(--cometchat-border-color-light, #f5f5f5)',
      }}
    >
      {children}
    </div>
  );
}

/** A member joined. */
export const Joined = () => (
  <ChatContainer>
    <CometChatGroupActionBubble message={mockGroupAction(A.JOINED, 'Alice')} />
  </ChatContainer>
);

/** All common group actions. */
export const AllActions = () => (
  <ChatContainer>
    <CometChatGroupActionBubble message={mockGroupAction(A.JOINED, 'Alice')} />
    <CometChatGroupActionBubble message={mockGroupAction(A.ADDED, 'Admin', 'Bob')} />
    <CometChatGroupActionBubble message={mockGroupAction(A.LEFT, 'Charlie')} />
    <CometChatGroupActionBubble message={mockGroupAction(A.KICKED, 'Admin', 'Dave')} />
    <CometChatGroupActionBubble message={mockGroupAction(A.BANNED, 'Admin', 'Eve')} />
    <CometChatGroupActionBubble
      message={mockGroupAction(A.SCOPE_CHANGE, 'Admin', 'Bob', 'moderator')}
    />
  </ChatContainer>
);
