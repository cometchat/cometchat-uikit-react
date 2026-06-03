import type { Meta, StoryObj } from '@storybook/react';
import { CometChatButton } from './CometChatButton';

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 14L15 8L2 2V6.5L11 8L2 9.5V14Z" fill="currentColor" />
  </svg>
);

interface ButtonStoryArgs {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled: boolean;
  isLoading: boolean;
}

const meta: Meta = {
  title: 'Base Elements/Button',
  tags: ['autodocs'],
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    isLoading: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
      description: 'Visual style variant of the button.',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button.',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled.',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the button shows a loading spinner.',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A versatile button component supporting primary, secondary, and ghost variants with icon and loading states.',
      },
    },
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj;

/** Default — interactive controls for variant, size, disabled, and loading. */
export const Default: Story = {
  render: (args: ButtonStoryArgs) => (
    <CometChatButton.Root
      variant={args.variant}
      size={args.size}
      disabled={args.disabled}
      isLoading={args.isLoading}
      onClick={() => console.log('clicked')}
    >
      <CometChatButton.Text>Button</CometChatButton.Text>
    </CometChatButton.Root>
  ),
};

function PrimaryDemo(args: ButtonStoryArgs) {
  return (
    <CometChatButton.Root
      variant={args.variant}
      size={args.size}
      disabled={args.disabled}
      isLoading={args.isLoading}
      onClick={() => console.log('clicked')}
    >
      <CometChatButton.Text>Primary Button</CometChatButton.Text>
    </CometChatButton.Root>
  );
}

export const Primary: Story = {
  args: {
    variant: 'primary',
  },
  render: (args: ButtonStoryArgs) => <PrimaryDemo {...args} />,
};

function SecondaryDemo(args: ButtonStoryArgs) {
  return (
    <CometChatButton.Root
      variant={args.variant}
      size={args.size}
      disabled={args.disabled}
      isLoading={args.isLoading}
      onClick={() => console.log('clicked')}
    >
      <CometChatButton.Text>Secondary Button</CometChatButton.Text>
    </CometChatButton.Root>
  );
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
  render: (args: ButtonStoryArgs) => <SecondaryDemo {...args} />,
};

function AllSizesDemo(args: ButtonStoryArgs) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <CometChatButton.Root
        variant={args.variant}
        size="sm"
        disabled={args.disabled}
        isLoading={args.isLoading}
      >
        <CometChatButton.Text>Small</CometChatButton.Text>
      </CometChatButton.Root>
      <CometChatButton.Root
        variant={args.variant}
        size="md"
        disabled={args.disabled}
        isLoading={args.isLoading}
      >
        <CometChatButton.Text>Medium</CometChatButton.Text>
      </CometChatButton.Root>
      <CometChatButton.Root
        variant={args.variant}
        size="lg"
        disabled={args.disabled}
        isLoading={args.isLoading}
      >
        <CometChatButton.Text>Large</CometChatButton.Text>
      </CometChatButton.Root>
    </div>
  );
}

export const AllSizes: Story = {
  render: (args: ButtonStoryArgs) => <AllSizesDemo {...args} />,
};

function WithIconAndTextDemo(args: ButtonStoryArgs) {
  return (
    <CometChatButton.Root
      variant={args.variant}
      size={args.size}
      disabled={args.disabled}
      isLoading={args.isLoading}
      onClick={() => console.log('send')}
    >
      <CometChatButton.Icon>
        <SendIcon />
      </CometChatButton.Icon>
      <CometChatButton.Text>Send</CometChatButton.Text>
    </CometChatButton.Root>
  );
}

export const WithIconAndText: Story = {
  render: (args: ButtonStoryArgs) => <WithIconAndTextDemo {...args} />,
};

function IconOnlyDemo(args: ButtonStoryArgs) {
  return (
    <CometChatButton.Root
      variant={args.variant}
      size={args.size}
      disabled={args.disabled}
      isLoading={args.isLoading}
      aria-label="Send message"
    >
      <CometChatButton.Icon>
        <SendIcon />
      </CometChatButton.Icon>
    </CometChatButton.Root>
  );
}

export const IconOnly: Story = {
  args: {
    variant: 'ghost',
  },
  render: (args: ButtonStoryArgs) => <IconOnlyDemo {...args} />,
};

function TextOnlyDemo(args: ButtonStoryArgs) {
  return (
    <CometChatButton.Root
      variant={args.variant}
      size={args.size}
      disabled={args.disabled}
      isLoading={args.isLoading}
    >
      <CometChatButton.Text>Text Only</CometChatButton.Text>
    </CometChatButton.Root>
  );
}

export const TextOnly: Story = {
  render: (args: ButtonStoryArgs) => <TextOnlyDemo {...args} />,
};

function LoadingDemo(args: ButtonStoryArgs) {
  return (
    <CometChatButton.Root
      variant={args.variant}
      size={args.size}
      disabled={args.disabled}
      isLoading={args.isLoading}
      loadingLabel="Sending..."
    >
      <CometChatButton.Text>Send</CometChatButton.Text>
    </CometChatButton.Root>
  );
}

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  render: (args: ButtonStoryArgs) => <LoadingDemo {...args} />,
};

function DisabledDemo(args: ButtonStoryArgs) {
  return (
    <CometChatButton.Root
      variant={args.variant}
      size={args.size}
      disabled={args.disabled}
      isLoading={args.isLoading}
    >
      <CometChatButton.Text>Disabled</CometChatButton.Text>
    </CometChatButton.Root>
  );
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args: ButtonStoryArgs) => <DisabledDemo {...args} />,
};
