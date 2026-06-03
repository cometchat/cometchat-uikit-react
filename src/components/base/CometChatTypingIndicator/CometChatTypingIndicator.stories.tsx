import type { Meta, StoryObj } from '@storybook/react';
import { CometChatTypingIndicator } from './CometChatTypingIndicator';

const meta: Meta<typeof CometChatTypingIndicator> = {
  title: 'Components/Messages/Typing Indicator',
  component: CometChatTypingIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Displays an animated typing indicator when users are composing messages.',
      },
    },
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof CometChatTypingIndicator>;

/** 1-on-1 chat — shows "typing..." with animated dots. */
export const Default: Story = {
  render: () => <CometChatTypingIndicator typingNames={['Alice']} isGroupChat={false} />,
};

/** Group chat with 1 user — shows "{name} is typing..." */
export const SingleUserGroup: Story = {
  render: () => <CometChatTypingIndicator typingNames={['Bob']} isGroupChat />,
};

/** Group chat with 2 users — shows "{name1} and {name2} are typing..." */
export const TwoUsersGroup: Story = {
  render: () => <CometChatTypingIndicator typingNames={['Alice', 'Bob']} isGroupChat />,
};

/** Group chat with 3+ users — shows "Multiple people are typing..." */
export const MultipleUsersGroup: Story = {
  render: () => <CometChatTypingIndicator typingNames={['Alice', 'Bob', 'Charlie']} isGroupChat />,
};

/** Showcase of all 4 typing indicator variants. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 11, color: '#999' }}>1-on-1 chat</p>
        <CometChatTypingIndicator typingNames={['Alice']} isGroupChat={false} />
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 11, color: '#999' }}>Group — 1 user</p>
        <CometChatTypingIndicator typingNames={['Bob']} isGroupChat />
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 11, color: '#999' }}>Group — 2 users</p>
        <CometChatTypingIndicator typingNames={['Alice', 'Bob']} isGroupChat />
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 11, color: '#999' }}>Group — 3+ users</p>
        <CometChatTypingIndicator typingNames={['Alice', 'Bob', 'Charlie']} isGroupChat />
      </div>
    </div>
  ),
};
