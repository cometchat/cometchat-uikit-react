import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCollaborativeDocumentBubble } from './CometChatCollaborativeDocumentBubble';

const meta: Meta = {
  title: 'Components/Bubbles/Collaborative Document Bubble',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Self-extracting collaborative document bubble. Takes the SDK message and extracts the document URL from its metadata.',
      },
    },
  },
};
export default meta;

/** Build a custom message whose metadata holds the document URL. */
function mockDocumentMessage(url: string): CometChat.BaseMessage {
  return {
    getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
    getMetadata: () => ({
      '@injected': { extensions: { document: { document_url: url } } },
    }),
  } as unknown as CometChat.BaseMessage;
}

const message = mockDocumentMessage('https://example.com/doc/abc');

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
    <CometChatCollaborativeDocumentBubble message={message} alignment="left" />
  </Frame>
);

/** Outgoing. */
export const Outgoing = () => (
  <Frame>
    <CometChatCollaborativeDocumentBubble message={message} alignment="right" />
  </Frame>
);
