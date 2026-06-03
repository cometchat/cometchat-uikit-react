import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatGroupActionBubble } from './CometChatGroupActionBubble';

// Call status icons from assets (same icons the Calling plugin will use)
import outgoingVideoCallIcon from '../../../assets/conversations_outgoing-video-call.svg';
import outgoingVoiceCallIcon from '../../../assets/conversations_outgoing-voice-call.svg';
import callMissedIcon from '../../../assets/call_missed.svg';
import callReceivedIcon from '../../../assets/call_received.svg';

const meta: Meta<typeof CometChatGroupActionBubble> = {
  title: 'Components/Bubbles/Message Bubble/Group Action',
  component: CometChatGroupActionBubble,
  tags: ['autodocs'],
  args: {
    messageText: 'Jane Smith joined',
    iconErrorColor: false,
  },
  argTypes: {
    messageText: {
      control: 'text',
      description: 'The system message text to display.',
    },
    iconErrorColor: {
      control: 'boolean',
      description: 'Whether to render the icon in error/red color (e.g., missed calls).',
    },
    iconUrl: {
      control: 'text',
      description: 'Optional icon URL to display alongside the message.',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Renders system messages for group actions (member joined, left, etc.).',
      },
    },
  },
};
export default meta;

// --- Helpers ---

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

// --- Stories ---

/** Default — group action with no icon. */
export const Default = {
  render: (args: { messageText: string; iconErrorColor: boolean; iconUrl?: string }) => (
    <ChatContainer>
      <CometChatGroupActionBubble
        messageText={args.messageText}
        iconUrl={args.iconUrl ?? ''}
        iconErrorColor={args.iconErrorColor}
      />
    </ChatContainer>
  ),
};

/** Common group actions — joined, added, left, kicked, banned, scope change. */
export const GroupActions = () => (
  <ChatContainer>
    <CometChatGroupActionBubble messageText="Alice joined" />
    <CometChatGroupActionBubble messageText="Admin added Bob" />
    <CometChatGroupActionBubble messageText="Charlie left" />
    <CometChatGroupActionBubble messageText="Admin kicked Dave" />
    <CometChatGroupActionBubble messageText="Admin banned Eve" />
    <CometChatGroupActionBubble messageText="Admin made Bob Moderator" />
  </ChatContainer>
);

/** Audio call — ended. */
export const CallAudioEnded = () => (
  <ChatContainer>
    <CometChatGroupActionBubble messageText="Voice Call · 3:05" iconUrl={outgoingVoiceCallIcon} />
  </ChatContainer>
);

/** Video call — ended. */
export const CallVideoEnded = () => (
  <ChatContainer>
    <CometChatGroupActionBubble messageText="Video Call · 5:20" iconUrl={outgoingVideoCallIcon} />
  </ChatContainer>
);

/** Audio call — missed (incoming unanswered). */
export const CallAudioMissed = () => (
  <ChatContainer>
    <CometChatGroupActionBubble
      messageText="Missed Voice Call"
      iconUrl={callMissedIcon}
      iconErrorColor
    />
  </ChatContainer>
);

/** Video call — missed (incoming unanswered). */
export const CallVideoMissed = () => (
  <ChatContainer>
    <CometChatGroupActionBubble
      messageText="Missed Video Call"
      iconUrl={callMissedIcon}
      iconErrorColor
    />
  </ChatContainer>
);

/** Audio call — cancelled (outgoing). */
export const CallAudioCancelled = () => (
  <ChatContainer>
    <CometChatGroupActionBubble
      messageText="Cancelled Voice Call"
      iconUrl={outgoingVoiceCallIcon}
      iconErrorColor
    />
  </ChatContainer>
);

/** Video call — rejected (outgoing). */
export const CallVideoRejected = () => (
  <ChatContainer>
    <CometChatGroupActionBubble
      messageText="Rejected Video Call"
      iconUrl={outgoingVideoCallIcon}
      iconErrorColor
    />
  </ChatContainer>
);

/** Audio call — busy (outgoing). */
export const CallAudioBusy = () => (
  <ChatContainer>
    <CometChatGroupActionBubble
      messageText="Busy Voice Call"
      iconUrl={outgoingVoiceCallIcon}
      iconErrorColor
    />
  </ChatContainer>
);

/** Audio call — initiated (outgoing, ringing). */
export const CallAudioInitiated = () => (
  <ChatContainer>
    <CometChatGroupActionBubble messageText="Outgoing Voice Call" iconUrl={outgoingVoiceCallIcon} />
  </ChatContainer>
);

/** Incoming voice call — received. */
export const CallIncomingReceived = () => (
  <ChatContainer>
    <CometChatGroupActionBubble
      messageText="Incoming Voice Call · 2:15"
      iconUrl={callReceivedIcon}
    />
  </ChatContainer>
);
