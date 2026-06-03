import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatToast } from './CometChatToast';

/**
 * Wrapper that overrides fixed positioning so the toast renders inline
 * at the bottom of the viewport-sized container, matching real behavior.
 */
const InlineWrapper = ({ children, width }: { children: React.ReactNode; width?: string }) => (
  <div
    style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'center',
      height: '100vh',
      width: width ?? '600px',
      margin: '0 auto',
      paddingBottom: 80,
      boxSizing: 'border-box',
    }}
  >
    <style>{`
      [class*="cometchat-toast"] {
        position: relative !important;
        bottom: auto !important;
        left: auto !important;
        transform: none !important;
      }
    `}</style>
    {children}
  </div>
);

/** Reusable "Show toast again" button */
const ShowAgainButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      borderRadius: 4,
      border: '1px solid #ccc',
      background: '#fff',
      cursor: 'pointer',
    }}
  >
    Show toast again
  </button>
);

const meta: Meta<typeof CometChatToast> = {
  title: 'Base Elements/Toast',
  component: CometChatToast,
  tags: ['autodocs'],
  args: {
    showCloseButton: true,
    dismissOnEscape: true,
  },
  argTypes: {
    showCloseButton: {
      control: 'boolean',
      description: 'Whether to show the close (X) button on the toast.',
    },
    dismissOnEscape: {
      control: 'boolean',
      description: 'Whether pressing Escape dismisses the toast.',
    },
    text: {
      control: 'text',
      description: 'The notification message text.',
    },
    duration: {
      control: 'number',
      description: 'Auto-dismiss duration in ms. Set to 0 for no auto-dismiss.',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A temporary notification toast with success, error, warning, and info variants.',
      },
    },
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof CometChatToast>;

/** Default toast — dismissible via close button or Escape. */
export const Default: Story = {
  render: args => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return (
        <InlineWrapper>
          {visible ? (
            <CometChatToast
              text="This is a notification message"
              duration={0}
              showCloseButton={args.showCloseButton}
              dismissOnEscape={args.dismissOnEscape}
              onClose={() => setVisible(false)}
            />
          ) : (
            <ShowAgainButton onClick={() => setVisible(true)} />
          )}
        </InlineWrapper>
      );
    }
    return <Demo />;
  },
};

/** Toast with close button visible (default behavior). */
export const WithCloseButton: Story = {
  args: {
    showCloseButton: true,
  },
  render: args => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return (
        <InlineWrapper>
          {visible ? (
            <CometChatToast
              text="Click the X to dismiss"
              duration={0}
              showCloseButton={args.showCloseButton}
              dismissOnEscape={args.dismissOnEscape}
              onClose={() => setVisible(false)}
            />
          ) : (
            <ShowAgainButton onClick={() => setVisible(true)} />
          )}
        </InlineWrapper>
      );
    }
    return <Demo />;
  },
};

/** Toast without close button — dismissible via Escape key only. */
export const WithoutCloseButton: Story = {
  args: {
    showCloseButton: false,
  },
  render: args => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return (
        <InlineWrapper>
          {visible ? (
            <CometChatToast
              text="No close button — press Escape to dismiss"
              duration={0}
              showCloseButton={args.showCloseButton}
              dismissOnEscape={args.dismissOnEscape}
              onClose={() => setVisible(false)}
            />
          ) : (
            <ShowAgainButton onClick={() => setVisible(true)} />
          )}
        </InlineWrapper>
      );
    }
    return <Demo />;
  },
};

/** Toast that auto-dismisses after 3 seconds. */
export const AutoDismiss: Story = {
  render: args => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return (
        <InlineWrapper>
          {visible ? (
            <CometChatToast
              text="This will disappear in 3 seconds"
              duration={3000}
              showCloseButton={args.showCloseButton}
              dismissOnEscape={args.dismissOnEscape}
              onClose={() => setVisible(false)}
            />
          ) : (
            <ShowAgainButton onClick={() => setVisible(true)} />
          )}
        </InlineWrapper>
      );
    }
    return <Demo />;
  },
};

/** Persistent toast — no auto-dismiss, no close button, no Escape. Parent controls lifecycle. */
export const Persistent: Story = {
  args: {
    showCloseButton: false,
    dismissOnEscape: false,
  },
  render: args => (
    <InlineWrapper>
      <CometChatToast
        text="You are offline. Reconnecting..."
        duration={0}
        showCloseButton={args.showCloseButton}
        dismissOnEscape={args.dismissOnEscape}
      />
    </InlineWrapper>
  ),
};

/** Toast with very long text demonstrating word wrapping. */
export const LongText: Story = {
  render: args => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return (
        <InlineWrapper>
          {visible ? (
            <CometChatToast
              text="This is a very long notification message that should wrap to multiple lines. It demonstrates how the toast component handles long text content gracefully without breaking the layout or overflowing its container."
              duration={0}
              showCloseButton={args.showCloseButton}
              dismissOnEscape={args.dismissOnEscape}
              onClose={() => setVisible(false)}
            />
          ) : (
            <ShowAgainButton onClick={() => setVisible(true)} />
          )}
        </InlineWrapper>
      );
    }
    return <Demo />;
  },
};

/** Showcase of all toast variants (static visual reference). */
export const AllStates: Story = {
  render: args => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        paddingBottom: 80,
        boxSizing: 'border-box',
        gap: 12,
      }}
    >
      <style>{`
        [class*="cometchat-toast"] {
          position: relative !important;
          bottom: auto !important;
          left: auto !important;
          transform: none !important;
        }
      `}</style>
      <CometChatToast
        text="Default with close button"
        duration={0}
        showCloseButton={args.showCloseButton}
        dismissOnEscape={args.dismissOnEscape}
      />
      <CometChatToast text="Without close button" duration={0} showCloseButton={false} />
      <CometChatToast
        text="Persistent — no dismiss options"
        duration={0}
        showCloseButton={false}
        dismissOnEscape={false}
      />
      <CometChatToast
        text="Long text: This is a very long notification message that should wrap to multiple lines. It demonstrates how the toast component handles long text content gracefully without breaking the layout."
        duration={0}
        showCloseButton={args.showCloseButton}
        dismissOnEscape={args.dismissOnEscape}
      />
    </div>
  ),
};
