import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatConfirmDialog } from './CometChatConfirmDialog';

const meta: Meta = {
  title: 'Components/Misc/Confirm Dialog',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A modal confirmation dialog with customizable title, message, and action buttons.',
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

/** Default — danger variant (delete confirmation). */
export const Default = () => (
  <CometChatConfirmDialog.Root isOpen={true} onClose={noop} variant="danger">
    <CometChatConfirmDialog.Icon />
    <CometChatConfirmDialog.Content
      title="Delete Conversation?"
      messageText="Would you like to delete this conversation? This action cannot be undone."
    />
    <CometChatConfirmDialog.Actions
      cancelButtonText="Cancel"
      confirmButtonText="Delete"
      onConfirm={noop}
      onCancel={noop}
    />
  </CometChatConfirmDialog.Root>
);

/** With custom icon. */
export const WithCustomIcon = () => {
  const customIcon = (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        fill="var(--cometchat-primary-color, #3399ff)"
      />
    </svg>
  );
  return (
    <CometChatConfirmDialog.Root isOpen={true} onClose={noop} variant="info">
      <CometChatConfirmDialog.Icon icon={customIcon} />
      <CometChatConfirmDialog.Content
        title="Custom Icon"
        messageText="This dialog uses a custom icon element."
      />
      <CometChatConfirmDialog.Actions
        confirmButtonText="OK"
        cancelButtonText="Cancel"
        onConfirm={noop}
        onCancel={noop}
      />
    </CometChatConfirmDialog.Root>
  );
};

/** With custom content (children). */
export const WithCustomContent = () => (
  <CometChatConfirmDialog.Root isOpen={true} onClose={noop} variant="danger">
    <CometChatConfirmDialog.Icon />
    <CometChatConfirmDialog.Content>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--cometchat-text-color-primary, #141414)' }}>
          Custom Content
        </h3>
        <p style={{ margin: '4px 0 0', color: 'var(--cometchat-text-color-secondary, #8a8a8a)' }}>
          This uses children instead of title/message props.
        </p>
      </div>
    </CometChatConfirmDialog.Content>
    <CometChatConfirmDialog.Actions
      confirmButtonText="Confirm"
      cancelButtonText="Cancel"
      onConfirm={noop}
      onCancel={noop}
    />
  </CometChatConfirmDialog.Root>
);

/** With async confirm (loading state). */
export const WithAsyncConfirm = () => {
  const handleConfirm = () =>
    new Promise<void>(resolve => {
      setTimeout(resolve, 2000);
    });
  return (
    <CometChatConfirmDialog.Root isOpen={true} onClose={noop} variant="danger">
      <CometChatConfirmDialog.Icon />
      <CometChatConfirmDialog.Content
        title="Delete Conversation?"
        messageText="This will take a moment..."
      />
      <CometChatConfirmDialog.Actions
        cancelButtonText="Cancel"
        confirmButtonText="Delete"
        onConfirm={handleConfirm}
        onCancel={noop}
      />
    </CometChatConfirmDialog.Root>
  );
};
