import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChatAvatar } from './CometChatAvatar';

const SAMPLE_IMAGE = 'https://data-in.cometchat.io/assets/images/avatars/ironman.png';
const BROKEN_IMAGE = 'https://example.com/nonexistent-image.png';

interface AvatarStoryArgs {
  name: string;
  image: string;
  size: 'small' | 'medium' | 'large';
}

const meta: Meta<AvatarStoryArgs> = {
  title: 'Components/Misc/Avatar',
  tags: ['autodocs'],
  args: {
    name: 'John Doe',
    image: SAMPLE_IMAGE,
    size: 'medium',
  },
  argTypes: {
    name: {
      control: 'text',
      description: 'The name used for initials fallback and alt text.',
    },
    image: {
      control: 'text',
      description: 'URL of the avatar image.',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Size variant of the avatar.',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a user or group avatar with image, initials fallback, and optional status indicator.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<AvatarStoryArgs>;

/** Default with image. */
export const Default: Story = {
  render: (args: AvatarStoryArgs) => (
    <CometChatAvatar.Root name={args.name} image={args.image} size={args.size}>
      <CometChatAvatar.Image />
      <CometChatAvatar.Initials />
    </CometChatAvatar.Root>
  ),
};

/** Initials fallback (no image). */
function InitialsFallbackDemo(args: AvatarStoryArgs) {
  return (
    <CometChatAvatar.Root name={args.name} size={args.size}>
      <CometChatAvatar.Image />
      <CometChatAvatar.Initials />
    </CometChatAvatar.Root>
  );
}

export const InitialsFallback: Story = {
  args: {
    name: 'Jane Smith',
    image: '',
  },
  render: (args: AvatarStoryArgs) => <InitialsFallbackDemo {...args} />,
};

/** Image with error fallback to initials. */
function ImageErrorFallbackDemo(args: AvatarStoryArgs) {
  return (
    <CometChatAvatar.Root name={args.name} image={args.image} size={args.size}>
      <CometChatAvatar.Image />
      <CometChatAvatar.Initials />
    </CometChatAvatar.Root>
  );
}

export const ImageErrorFallback: Story = {
  args: {
    name: 'Bruce Wayne',
    image: BROKEN_IMAGE,
  },
  render: (args: AvatarStoryArgs) => <ImageErrorFallbackDemo {...args} />,
};

/** All size variants. */
function SizeVariantsDemo(args: AvatarStoryArgs) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <CometChatAvatar.Root name={args.name} size="small">
        <CometChatAvatar.Initials />
      </CometChatAvatar.Root>
      <CometChatAvatar.Root name={args.name} size="medium">
        <CometChatAvatar.Initials />
      </CometChatAvatar.Root>
      <CometChatAvatar.Root name={args.name} size="large">
        <CometChatAvatar.Initials />
      </CometChatAvatar.Root>
    </div>
  );
}

export const SizeVariants: Story = {
  render: (args: AvatarStoryArgs) => <SizeVariantsDemo {...args} />,
};

/** With status indicator (online). */
function StatusOnlineDemo(args: AvatarStoryArgs) {
  return (
    <CometChatAvatar.Root name={args.name} image={args.image} size={args.size}>
      <CometChatAvatar.Image />
      <CometChatAvatar.Initials />
      <CometChatAvatar.StatusIndicator status="online" />
    </CometChatAvatar.Root>
  );
}

export const StatusOnline: Story = {
  args: {
    size: 'large',
  },
  render: (args: AvatarStoryArgs) => <StatusOnlineDemo {...args} />,
};

/** Long name handling. */
function LongNameDemo(args: AvatarStoryArgs) {
  return (
    <CometChatAvatar.Root name={args.name} size={args.size}>
      <CometChatAvatar.Initials />
    </CometChatAvatar.Root>
  );
}

export const LongName: Story = {
  args: {
    name: 'Alexander Benjamin Christopher',
  },
  render: (args: AvatarStoryArgs) => <LongNameDemo {...args} />,
};

/** Single character name. */
function SingleCharNameDemo(args: AvatarStoryArgs) {
  return (
    <CometChatAvatar.Root name={args.name} size={args.size}>
      <CometChatAvatar.Initials />
    </CometChatAvatar.Root>
  );
}

export const SingleCharName: Story = {
  args: {
    name: 'A',
  },
  render: (args: AvatarStoryArgs) => <SingleCharNameDemo {...args} />,
};

/** Empty name — shows default placeholder. */
function EmptyNameDemo(args: AvatarStoryArgs) {
  return (
    <CometChatAvatar.Root name={args.name} size={args.size}>
      <CometChatAvatar.Image />
      <CometChatAvatar.Initials />
    </CometChatAvatar.Root>
  );
}

export const EmptyName: Story = {
  args: {
    name: '',
    image: '',
  },
  render: (args: AvatarStoryArgs) => <EmptyNameDemo {...args} />,
};

/** Broken image URL — falls back to initials. */
function BrokenImageDemo(args: AvatarStoryArgs) {
  return (
    <CometChatAvatar.Root name={args.name} image={args.image} size={args.size}>
      <CometChatAvatar.Image />
      <CometChatAvatar.Initials />
    </CometChatAvatar.Root>
  );
}

export const BrokenImage: Story = {
  args: {
    name: 'Bruce Wayne',
    image: 'https://example.com/nonexistent.png',
  },
  render: (args: AvatarStoryArgs) => <BrokenImageDemo {...args} />,
};

/** Render image — displays the avatar image correctly. */
function RenderImageDemo(args: AvatarStoryArgs) {
  return (
    <CometChatAvatar.Root name={args.name} image={args.image} size={args.size}>
      <CometChatAvatar.Image />
      <CometChatAvatar.Initials />
    </CometChatAvatar.Root>
  );
}

export const RenderImage: Story = {
  args: {
    name: 'Tony Stark',
    image: 'https://data-in.cometchat.io/assets/images/avatars/ironman.png',
    size: 'large',
  },
  render: (args: AvatarStoryArgs) => <RenderImageDemo {...args} />,
};
