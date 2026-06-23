import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChat, FlagReason } from '@cometchat/chat-sdk-javascript';
import { CometChatFlagMessageDialog } from './CometChatFlagMessageDialog';

/** Mock message object for stories. */
const mockMessage = {
  getId: () => 123,
} as unknown as CometChat.BaseMessage;

/** Mock flag reasons so the dialog renders options instead of a loading state. */
const mockFlagReasons = [
  { id: 'spam', name: 'Spam' },
  { id: 'harassment', name: 'Harassment' },
  { id: 'inappropriate', name: 'Inappropriate content' },
  { id: 'misinformation', name: 'Misinformation' },
  { id: 'other', name: 'Other' },
] as unknown as FlagReason[];

// Stub the SDK call used by the dialog so stories don't depend on an initialized SDK.
CometChat.getFlagReasons = () => Promise.resolve(mockFlagReasons);

/** Mock onSubmit that succeeds. */
const mockSubmitSuccess = () => Promise.resolve(true);

const meta: Meta = {
  title: 'Components/Misc/Flag Message Dialog',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A dialog for reporting/flagging inappropriate messages with reason selection.',
      },
    },
  },
  decorators: [
    // `transform` makes a containing block for the dialog's position:fixed backdrop so
    // it stays inside the preview (full height in Canvas, fixed-height box in Docs).
    (Story, context) => {
      const isDocs = context.viewMode === 'docs';
      return (
        <div
          style={{
            position: 'relative',
            height: isDocs ? 520 : '100vh',
            overflow: 'hidden',
            transform: 'translateZ(0)',
            border: isDocs ? '1px solid var(--cometchat-border-color-light, #f5f5f5)' : 'none',
            borderRadius: isDocs ? 8 : 0,
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};
export default meta;

/** No-op close handler — the dialog stays open for preview purposes. */
const noop = () => {};

/** Default — all sub-components rendered. */
export const Default = () => (
  <CometChatFlagMessageDialog.Root
    message={mockMessage}
    isOpen={true}
    onClose={noop}
    onSubmit={mockSubmitSuccess}
  >
    <CometChatFlagMessageDialog.Header />
    <CometChatFlagMessageDialog.Reasons />
    <CometChatFlagMessageDialog.Remark />
    <CometChatFlagMessageDialog.Actions />
  </CometChatFlagMessageDialog.Root>
);

export const WithoutRemark = () => (
  <CometChatFlagMessageDialog.Root
    message={mockMessage}
    isOpen={true}
    onClose={noop}
    onSubmit={mockSubmitSuccess}
  >
    <CometChatFlagMessageDialog.Header />
    <CometChatFlagMessageDialog.Reasons />
    <CometChatFlagMessageDialog.Actions />
  </CometChatFlagMessageDialog.Root>
);

/** Custom header content. */
export const CustomHeader = () => (
  <CometChatFlagMessageDialog.Root
    message={mockMessage}
    isOpen={true}
    onClose={noop}
    onSubmit={mockSubmitSuccess}
  >
    <CometChatFlagMessageDialog.Header>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--cometchat-text-color-primary, #141414)' }}>
          Custom Report Header
        </h3>
        <p style={{ margin: '4px 0 0', color: 'var(--cometchat-text-color-secondary, #8a8a8a)' }}>
          This uses children instead of title/subtitle props.
        </p>
      </div>
    </CometChatFlagMessageDialog.Header>
    <CometChatFlagMessageDialog.Reasons />
    <CometChatFlagMessageDialog.Actions />
  </CometChatFlagMessageDialog.Root>
);
