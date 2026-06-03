import React, { useState } from 'react';
import type { Meta } from '@storybook/react';
import { CometChatFlagMessageDialog } from './CometChatFlagMessageDialog';

/** Mock message object for stories. */
const mockMessage = {
  getId: () => 123,
} as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage;

/** Mock onSubmit that succeeds. */
const mockSubmitSuccess = () => Promise.resolve(true);

/** Mock onSubmit that fails. */
const mockSubmitFailure = () => Promise.reject(new Error('Submission failed'));

const meta: Meta = {
  title: 'Components/Misc/Flag Message Dialog',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A dialog for reporting/flagging inappropriate messages with reason selection.',
      },
    },
  },
};
export default meta;

/** Default — all sub-components rendered. */
export const Default = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <CometChatFlagMessageDialog.Root
        message={mockMessage}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={mockSubmitSuccess}
      >
        <CometChatFlagMessageDialog.Header />
        <CometChatFlagMessageDialog.Reasons />
        <CometChatFlagMessageDialog.Remark />
        <CometChatFlagMessageDialog.Actions />
      </CometChatFlagMessageDialog.Root>
    </>
  );
};

export const WithoutRemark = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <CometChatFlagMessageDialog.Root
        message={mockMessage}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={mockSubmitSuccess}
      >
        <CometChatFlagMessageDialog.Header />
        <CometChatFlagMessageDialog.Reasons />
        <CometChatFlagMessageDialog.Actions />
      </CometChatFlagMessageDialog.Root>
    </>
  );
};

/** Error state — submission fails. */
export const ErrorState = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <CometChatFlagMessageDialog.Root
        message={mockMessage}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={mockSubmitFailure}
      >
        <CometChatFlagMessageDialog.Header />
        <CometChatFlagMessageDialog.Reasons />
        <CometChatFlagMessageDialog.Remark />
        <CometChatFlagMessageDialog.Actions />
      </CometChatFlagMessageDialog.Root>
    </>
  );
};

/** With closeOnOutsideClick disabled. */
export const NoOutsideClickClose = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <CometChatFlagMessageDialog.Root
        message={mockMessage}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={mockSubmitSuccess}
        closeOnOutsideClick={false}
      >
        <CometChatFlagMessageDialog.Header />
        <CometChatFlagMessageDialog.Reasons />
        <CometChatFlagMessageDialog.Remark />
        <CometChatFlagMessageDialog.Actions />
      </CometChatFlagMessageDialog.Root>
    </>
  );
};

/** Controlled mode — starts closed. */
export const ControlledMode = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <CometChatFlagMessageDialog.Root
        message={mockMessage}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={mockSubmitSuccess}
      >
        <CometChatFlagMessageDialog.Header />
        <CometChatFlagMessageDialog.Reasons />
        <CometChatFlagMessageDialog.Remark />
        <CometChatFlagMessageDialog.Actions />
      </CometChatFlagMessageDialog.Root>
    </>
  );
};
/** Custom header content. */
export const CustomHeader = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Dialog</button>
      <CometChatFlagMessageDialog.Root
        message={mockMessage}
        isOpen={open}
        onClose={() => setOpen(false)}
        onSubmit={mockSubmitSuccess}
      >
        <CometChatFlagMessageDialog.Header>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: 'var(--cometchat-text-color-primary, #141414)' }}>
              Custom Report Header
            </h3>
            <p
              style={{ margin: '4px 0 0', color: 'var(--cometchat-text-color-secondary, #8a8a8a)' }}
            >
              This uses children instead of title/subtitle props.
            </p>
          </div>
        </CometChatFlagMessageDialog.Header>
        <CometChatFlagMessageDialog.Reasons />
        <CometChatFlagMessageDialog.Actions />
      </CometChatFlagMessageDialog.Root>
    </>
  );
};
