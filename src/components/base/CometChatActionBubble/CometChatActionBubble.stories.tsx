import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatActionBubble } from './CometChatActionBubble';

const meta: Meta<typeof CometChatActionBubble> = {
  title: 'Base Elements/Action Bubble',
  component: CometChatActionBubble,
  tags: ['autodocs'],
  args: {
    messageText: 'Jane Smith joined',
    iconErrorColor: false,
  },
  argTypes: {
    messageText: { control: 'text', description: 'The system message text to display.' },
    iconErrorColor: {
      control: 'boolean',
      description: 'Render the icon and text in error/red color (e.g., missed calls).',
    },
    iconClassName: { control: 'text', description: 'CSS class name for the icon.' },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Low-level presentational primitive for centered, pill-shaped system messages. Used internally by CometChatGroupActionBubble and CometChatCallActionBubble.',
      },
    },
  },
};
export default meta;

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

/** Default — text only. */
export const Default = {
  render: (args: { messageText: string; iconErrorColor: boolean; iconClassName?: string }) => (
    <ChatContainer>
      <CometChatActionBubble
        messageText={args.messageText}
        iconClassName={args.iconClassName}
        iconErrorColor={args.iconErrorColor}
      />
    </ChatContainer>
  ),
};

/** All icon variants. */
export const IconVariants = () => (
  <ChatContainer>
    <CometChatActionBubble
      messageText="Missed Video Call"
      iconClassName="cometchat-action-bubble__icon--missed-video"
      iconErrorColor
    />
    <CometChatActionBubble
      messageText="Outgoing Voice Call"
      iconClassName="cometchat-action-bubble__icon--outgoing-audio"
    />
    <CometChatActionBubble
      messageText="Incoming Video Call"
      iconClassName="cometchat-action-bubble__icon--incoming-video"
    />
    <CometChatActionBubble
      messageText="Call Ended"
      iconClassName="cometchat-action-bubble__icon--call-ended"
    />
  </ChatContainer>
);
