import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCollaborativeWhiteboardBubble } from './CometChatCollaborativeWhiteboardBubble';

const meta: Meta = {
  title: 'Components/Bubbles/Collaborative Whiteboard Bubble',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Self-extracting collaborative whiteboard bubble. Takes the SDK message and extracts the board URL from its metadata.',
      },
    },
  },
};
export default meta;

/** Build a custom message whose metadata holds the board URL. */
function mockWhiteboardMessage(url: string): CometChat.BaseMessage {
  return {
    getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
    getMetadata: () => ({
      '@injected': { extensions: { whiteboard: { board_url: url } } },
    }),
  } as unknown as CometChat.BaseMessage;
}

const message = mockWhiteboardMessage('https://example.com/board/xyz');

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: 360,
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

/** Incoming. */
export const Incoming = () => (
  <Frame>
    <CometChatCollaborativeWhiteboardBubble message={message} alignment="left" />
  </Frame>
);

/** Outgoing. */
export const Outgoing = () => (
  <Frame>
    <CometChatCollaborativeWhiteboardBubble message={message} alignment="right" />
  </Frame>
);
