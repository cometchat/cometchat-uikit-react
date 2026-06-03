import React, { useState } from 'react';
import type { Meta } from '@storybook/react';
import { CometChatConfirmDialog } from './CometChatConfirmDialog';

const meta: Meta = {
  title: 'Components/Misc/Confirm Dialog',
  tags: ['autodocs'],
  args: {
    isOpen: true,
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the confirm dialog is open.',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A modal confirmation dialog with customizable title, message, and action buttons.',
      },
    },
  },
};
export default meta;

/** Default — danger variant (delete confirmation). */
function DefaultDemo(args: { isOpen: boolean }) {
  const [open, setOpen] = useState(args.isOpen);
  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <CometChatConfirmDialog.Root isOpen={open} onClose={() => setOpen(false)} variant="danger">
        <CometChatConfirmDialog.Icon />
        <CometChatConfirmDialog.Content
          title="Delete Conversation?"
          messageText="Would you like to delete this conversation? This action cannot be undone."
        />
        <CometChatConfirmDialog.Actions
          cancelButtonText="Cancel"
          confirmButtonText="Delete"
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </CometChatConfirmDialog.Root>
    </>
  );
}

export const Default = {
  render: (args: { isOpen: boolean }) => <DefaultDemo {...args} />,
};

/** With custom icon. */
function WithCustomIconDemo(args: { isOpen: boolean }) {
  const [open, setOpen] = useState(args.isOpen);
  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);
  const customIcon = (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
        fill="var(--cometchat-primary-color, #3399ff)"
      />
    </svg>
  );
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <CometChatConfirmDialog.Root isOpen={open} onClose={() => setOpen(false)} variant="info">
        <CometChatConfirmDialog.Icon icon={customIcon} />
        <CometChatConfirmDialog.Content
          title="Custom Icon"
          messageText="This dialog uses a custom icon element."
        />
        <CometChatConfirmDialog.Actions
          confirmButtonText="OK"
          cancelButtonText="Cancel"
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </CometChatConfirmDialog.Root>
    </>
  );
}

export const WithCustomIcon = {
  render: (args: { isOpen: boolean }) => <WithCustomIconDemo {...args} />,
};

/** With custom content (children). */
function WithCustomContentDemo(args: { isOpen: boolean }) {
  const [open, setOpen] = useState(args.isOpen);
  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <CometChatConfirmDialog.Root isOpen={open} onClose={() => setOpen(false)} variant="danger">
        <CometChatConfirmDialog.Icon />
        <CometChatConfirmDialog.Content>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: 'var(--cometchat-text-color-primary, #141414)' }}>
              Custom Content
            </h3>
            <p
              style={{ margin: '4px 0 0', color: 'var(--cometchat-text-color-secondary, #8a8a8a)' }}
            >
              This uses children instead of title/message props.
            </p>
          </div>
        </CometChatConfirmDialog.Content>
        <CometChatConfirmDialog.Actions
          confirmButtonText="Confirm"
          cancelButtonText="Cancel"
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </CometChatConfirmDialog.Root>
    </>
  );
}

export const WithCustomContent = {
  render: (args: { isOpen: boolean }) => <WithCustomContentDemo {...args} />,
};

/** With async confirm (loading state). */
function WithAsyncConfirmDemo(args: { isOpen: boolean }) {
  const [open, setOpen] = useState(args.isOpen);
  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);
  const handleConfirm = () =>
    new Promise<void>(resolve => {
      setTimeout(resolve, 2000);
    });
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <CometChatConfirmDialog.Root isOpen={open} onClose={() => setOpen(false)} variant="danger">
        <CometChatConfirmDialog.Icon />
        <CometChatConfirmDialog.Content
          title="Delete Conversation?"
          messageText="This will take a moment..."
        />
        <CometChatConfirmDialog.Actions
          cancelButtonText="Cancel"
          confirmButtonText="Delete"
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      </CometChatConfirmDialog.Root>
    </>
  );
}

export const WithAsyncConfirm = {
  render: (args: { isOpen: boolean }) => <WithAsyncConfirmDemo {...args} />,
};

/** With closeOnOutsideClick disabled. */
function NoOutsideClickCloseDemo(args: { isOpen: boolean }) {
  const [open, setOpen] = useState(args.isOpen);
  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <CometChatConfirmDialog.Root
        isOpen={open}
        onClose={() => setOpen(false)}
        variant="danger"
        closeOnOutsideClick={false}
      >
        <CometChatConfirmDialog.Icon />
        <CometChatConfirmDialog.Content
          title="Cannot Dismiss"
          messageText="Clicking outside will not close this dialog."
        />
        <CometChatConfirmDialog.Actions
          cancelButtonText="Cancel"
          confirmButtonText="OK"
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </CometChatConfirmDialog.Root>
    </>
  );
}

export const NoOutsideClickClose = {
  render: (args: { isOpen: boolean }) => <NoOutsideClickCloseDemo {...args} />,
};
