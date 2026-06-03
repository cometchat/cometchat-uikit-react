import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatLinkPopover } from './CometChatLinkPopover';

const meta: Meta<typeof CometChatLinkPopover> = {
  title: 'Components/Misc/Link Popover',
  component: CometChatLinkPopover,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A popover shown on link hover with options to open, copy, or edit the link.',
      },
    },
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof CometChatLinkPopover>;

/** Default link popover with sample link data. */
export const Default: Story = {
  render: () => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return (
        <div style={{ minHeight: 200, padding: 24 }}>
          {visible ? (
            <CometChatLinkPopover
              text="Example Link"
              url="https://example.com"
              position={{ top: 100, left: 200 }}
              onEdit={({ url, text }) => console.log('Edit:', url, text)}
              onRemove={() => console.log('Remove')}
              onClose={() => setVisible(false)}
            />
          ) : (
            <button onClick={() => setVisible(true)}>Show popover again</button>
          )}
        </div>
      );
    }
    return <Demo />;
  },
};

/** Popover with a long URL demonstrating truncation. */
export const LongURL: Story = {
  render: () => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return (
        <div style={{ minHeight: 200, padding: 24 }}>
          {visible ? (
            <CometChatLinkPopover
              text="CometChat Docs"
              url="https://www.cometchat.com/docs/react-uikit/overview/getting-started-with-a-very-long-path-to-demonstrate-truncation"
              position={{ top: 100, left: 200 }}
              onEdit={({ url, text }) => console.log('Edit:', url, text)}
              onRemove={() => console.log('Remove')}
              onClose={() => setVisible(false)}
            />
          ) : (
            <button onClick={() => setVisible(true)}>Show popover again</button>
          )}
        </div>
      );
    }
    return <Demo />;
  },
};

/** Popover with a long title demonstrating word-break. */
export const LongTitle: Story = {
  render: () => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      return (
        <div style={{ minHeight: 200, padding: 24 }}>
          {visible ? (
            <CometChatLinkPopover
              text="This is a very long link title that should wrap to multiple lines and demonstrate the word-break behavior of the popover title area"
              url="https://example.com/page"
              position={{ top: 100, left: 200 }}
              onEdit={({ url, text }) => console.log('Edit:', url, text)}
              onRemove={() => console.log('Remove')}
              onClose={() => setVisible(false)}
            />
          ) : (
            <button onClick={() => setVisible(true)}>Show popover again</button>
          )}
        </div>
      );
    }
    return <Demo />;
  },
};
