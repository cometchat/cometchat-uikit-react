/* eslint-disable @typescript-eslint/no-misused-spread */
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatAIAssistantBubble } from './CometChatAIAssistantBubble';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

// Mock AI assistant message with markdown content
const mockAssistantMessage = {
  getId: () => 1,
  getType: () => 'assistant',
  getCategory: () => 'agentic',
  getAssistantMessageData: () => ({
    getText: () =>
      `Hello! I can help you with questions about this conversation.

Here's what I can do:
- **Summarize** conversations
- **Answer questions** about the context
- **Suggest replies** based on the discussion

Would you like me to help with anything specific?`,
  }),
  getMetadata: () => ({}),
  getDeletedAt: () => null,
} as unknown as CometChat.BaseMessage;

const mockSimpleMessage = {
  ...mockAssistantMessage,
  getAssistantMessageData: () => ({
    getText: () => 'Hello! How can I help you today?',
  }),
} as unknown as CometChat.BaseMessage;

const mockCodeMessage = {
  ...mockAssistantMessage,
  getAssistantMessageData: () => ({
    getText: () => `Here's a code example:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

You can call it like: \`greet("World")\``,
  }),
} as unknown as CometChat.BaseMessage;

const meta: Meta<typeof CometChatAIAssistantBubble> = {
  title: 'Components/AI/AI Assistant Bubble',
  component: CometChatAIAssistantBubble,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'AI Assistant Bubble — renders completed AI assistant messages with rich markdown formatting. Used in the message list for agentic category messages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    alignment: {
      control: 'radio',
      options: ['left', 'right'],
    },
  },
};
export default meta;
type Story = StoryObj<typeof CometChatAIAssistantBubble>;

export const Default: Story = {
  args: {
    message: mockSimpleMessage,
    alignment: 'left',
  },
};

export const WithMarkdown: Story = {
  args: {
    message: mockAssistantMessage,
    alignment: 'left',
  },
};

export const WithCode: Story = {
  args: {
    message: mockCodeMessage,
    alignment: 'left',
  },
};
