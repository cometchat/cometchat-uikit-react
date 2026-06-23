import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCallActionBubble } from './CometChatCallActionBubble';
import { CometChatUIKit } from '../../CometChatUIKit';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';

// Stub the logged-in user so the bubble (which needs it to compute sent-by-me /
// missed) renders in Storybook without an initialized SDK.
const ME = { getUid: () => 'me', getName: () => 'Me' } as unknown as CometChat.User;
CometChatUIKit.getLoggedInUser = () => ME;

const meta: Meta = {
  title: 'Components/Bubbles/Call Action Bubble',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Self-extracting call action bubble. Takes the SDK call message and derives the status text/icon (outgoing, incoming, missed, ended) from the call status and logged-in user.',
      },
    },
  },
};
export default meta;

/** Build a call message that the bubble can read. */
function mockCall(type: string, status: string, initiatorUid: string): CometChat.BaseMessage {
  return {
    getSender: () => ({ getUid: () => initiatorUid, getName: () => initiatorUid }),
    getCallInitiator: () => ({ getUid: () => initiatorUid }),
    getStatus: () => status,
    getType: () => type,
  } as unknown as CometChat.BaseMessage;
}

const C = CometChatUIKitConstants.calls;
const T = CometChatUIKitConstants.MessageTypes;

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

/** Outgoing calls (initiated by the logged-in user). */
export const OutgoingCalls = () => (
  <ChatContainer>
    <CometChatCallActionBubble message={mockCall(T.audio, C.ended, 'me')} />
    <CometChatCallActionBubble message={mockCall(T.video, C.ended, 'me')} />
    <CometChatCallActionBubble message={mockCall(T.audio, C.cancelled, 'me')} />
  </ChatContainer>
);

/** Incoming calls (initiated by someone else). */
export const IncomingCalls = () => (
  <ChatContainer>
    <CometChatCallActionBubble message={mockCall(T.audio, C.initiated, 'other')} />
    <CometChatCallActionBubble message={mockCall(T.video, C.ongoing, 'other')} />
  </ChatContainer>
);

/** Missed calls — rendered with the error color. */
export const MissedCalls = () => (
  <ChatContainer>
    <CometChatCallActionBubble message={mockCall(T.audio, C.unanswered, 'other')} />
    <CometChatCallActionBubble message={mockCall(T.video, C.cancelled, 'other')} />
  </ChatContainer>
);
