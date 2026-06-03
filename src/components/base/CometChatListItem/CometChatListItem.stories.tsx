import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatListItem } from './CometChatListItem';
import { CometChatAvatar } from '../CometChatAvatar';

const SAMPLE_IMAGE = 'https://data-in.cometchat.io/assets/images/avatars/ironman.png';

const meta: Meta = {
  title: 'Components/Misc/List Item',
  tags: ['autodocs'],
  args: {
    isActive: false,
    disabled: false,
  },
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Whether the list item is in active/selected state.',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the list item is disabled (non-interactive).',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A generic list item component with leading, title, subtitle, and trailing slots.',
      },
    },
  },
};
export default meta;

/** Default list item with avatar, title, subtitle, and trailing view. */
export const Default = {
  render: (args: { isActive: boolean; disabled: boolean }) => (
    <div style={{ width: 400 }}>
      <CometChatListItem.Root
        id="user-1"
        isActive={args.isActive}
        disabled={args.disabled}
        aria-label="Conversation with John Doe"
      >
        <CometChatListItem.LeadingView>
          <CometChatAvatar.Root name="John Doe" image={SAMPLE_IMAGE} size="medium">
            <CometChatAvatar.Image />
            <CometChatAvatar.Initials />
          </CometChatAvatar.Root>
        </CometChatListItem.LeadingView>
        <CometChatListItem.Title>John Doe</CometChatListItem.Title>
        <CometChatListItem.Subtitle>
          <span
            style={{
              font: 'var(--cometchat-font-body-regular)',
              color: 'var(--cometchat-text-color-secondary)',
            }}
          >
            Hey, are you free today?
          </span>
        </CometChatListItem.Subtitle>
        <CometChatListItem.TrailingView>
          <span
            style={{
              font: 'var(--cometchat-font-caption1-medium)',
              color: 'var(--cometchat-text-color-secondary)',
            }}
          >
            3:42 pm
          </span>
        </CometChatListItem.TrailingView>
        <CometChatListItem.MenuView>
          <button
            aria-label="More options"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
          >
            ⋮
          </button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    </div>
  ),
};

/** List item with menu view revealed on hover. */
function WithMenuViewDemo(args: { isActive: boolean; disabled: boolean }) {
  return (
    <div style={{ width: 400 }}>
      <CometChatListItem.Root
        id="user-2"
        isActive={args.isActive}
        disabled={args.disabled}
        aria-label="User Alice Smith"
      >
        <CometChatListItem.LeadingView>
          <CometChatAvatar.Root name="Alice Smith" size="medium">
            <CometChatAvatar.Initials />
          </CometChatAvatar.Root>
        </CometChatListItem.LeadingView>
        <CometChatListItem.Title>Alice Smith</CometChatListItem.Title>
        <CometChatListItem.Subtitle>
          <span
            style={{
              font: 'var(--cometchat-font-body-regular)',
              color: 'var(--cometchat-text-color-secondary)',
            }}
          >
            Online
          </span>
        </CometChatListItem.Subtitle>
        <CometChatListItem.TrailingView>
          <span
            style={{
              font: 'var(--cometchat-font-caption1-medium)',
              color: 'var(--cometchat-text-color-secondary)',
            }}
          >
            Yesterday
          </span>
        </CometChatListItem.TrailingView>
        <CometChatListItem.MenuView>
          <button
            aria-label="More options"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
          >
            ⋮
          </button>
        </CometChatListItem.MenuView>
      </CometChatListItem.Root>
    </div>
  );
}

export const WithMenuView = {
  render: (args: { isActive: boolean; disabled: boolean }) => <WithMenuViewDemo {...args} />,
};

/** Active/selected state. */
function ActiveStateDemo(args: { isActive: boolean; disabled: boolean }) {
  return (
    <div style={{ width: 400 }}>
      <CometChatListItem.Root
        id="user-3"
        isActive={args.isActive}
        disabled={args.disabled}
        aria-label="Selected: Rachel Lee"
      >
        <CometChatListItem.LeadingView>
          <CometChatAvatar.Root name="Rachel Lee" image={SAMPLE_IMAGE} size="medium">
            <CometChatAvatar.Image />
            <CometChatAvatar.Initials />
          </CometChatAvatar.Root>
        </CometChatListItem.LeadingView>
        <CometChatListItem.Title>Rachel Lee</CometChatListItem.Title>
        <CometChatListItem.Subtitle>
          <span
            style={{
              font: 'var(--cometchat-font-body-regular)',
              color: 'var(--cometchat-text-color-secondary)',
            }}
          >
            Typing...
          </span>
        </CometChatListItem.Subtitle>
      </CometChatListItem.Root>
    </div>
  );
}

export const ActiveState = {
  args: {
    isActive: true,
  },
  render: (args: { isActive: boolean; disabled: boolean }) => <ActiveStateDemo {...args} />,
};

/** Disabled state. */
function DisabledStateDemo(args: { isActive: boolean; disabled: boolean }) {
  return (
    <div style={{ width: 400 }}>
      <CometChatListItem.Root
        id="user-4"
        isActive={args.isActive}
        disabled={args.disabled}
        aria-label="Disabled: Mike Kim"
      >
        <CometChatListItem.LeadingView>
          <CometChatAvatar.Root name="Mike Kim" size="medium">
            <CometChatAvatar.Initials />
          </CometChatAvatar.Root>
        </CometChatListItem.LeadingView>
        <CometChatListItem.Title>Mike Kim</CometChatListItem.Title>
        <CometChatListItem.Subtitle>
          <span
            style={{
              font: 'var(--cometchat-font-body-regular)',
              color: 'var(--cometchat-text-color-secondary)',
            }}
          >
            Offline
          </span>
        </CometChatListItem.Subtitle>
      </CometChatListItem.Root>
    </div>
  );
}

export const DisabledState = {
  args: {
    disabled: true,
  },
  render: (args: { isActive: boolean; disabled: boolean }) => <DisabledStateDemo {...args} />,
};

/** Without leading view. */
function WithoutLeadingViewDemo(args: { isActive: boolean; disabled: boolean }) {
  return (
    <div style={{ width: 400 }}>
      <CometChatListItem.Root
        id="user-5"
        isActive={args.isActive}
        disabled={args.disabled}
        aria-label="No avatar item"
      >
        <CometChatListItem.Title>Item without avatar</CometChatListItem.Title>
        <CometChatListItem.Subtitle>
          <span
            style={{
              font: 'var(--cometchat-font-body-regular)',
              color: 'var(--cometchat-text-color-secondary)',
            }}
          >
            Just title and subtitle
          </span>
        </CometChatListItem.Subtitle>
      </CometChatListItem.Root>
    </div>
  );
}

export const WithoutLeadingView = {
  render: (args: { isActive: boolean; disabled: boolean }) => <WithoutLeadingViewDemo {...args} />,
};

/** Without subtitle. */
function WithoutSubtitleDemo(args: { isActive: boolean; disabled: boolean }) {
  return (
    <div style={{ width: 400 }}>
      <CometChatListItem.Root
        id="user-6"
        isActive={args.isActive}
        disabled={args.disabled}
        aria-label="Title only item"
      >
        <CometChatListItem.LeadingView>
          <CometChatAvatar.Root name="Jane Doe" size="medium">
            <CometChatAvatar.Initials />
          </CometChatAvatar.Root>
        </CometChatListItem.LeadingView>
        <CometChatListItem.Title>Jane Doe</CometChatListItem.Title>
      </CometChatListItem.Root>
    </div>
  );
}

export const WithoutSubtitle = {
  render: (args: { isActive: boolean; disabled: boolean }) => <WithoutSubtitleDemo {...args} />,
};

/** Without trailing view. */
function WithoutTrailingViewDemo(args: { isActive: boolean; disabled: boolean }) {
  return (
    <div style={{ width: 400 }}>
      <CometChatListItem.Root
        id="user-7"
        isActive={args.isActive}
        disabled={args.disabled}
        aria-label="No trailing view"
      >
        <CometChatListItem.LeadingView>
          <CometChatAvatar.Root name="Bob Wilson" image={SAMPLE_IMAGE} size="medium">
            <CometChatAvatar.Image />
            <CometChatAvatar.Initials />
          </CometChatAvatar.Root>
        </CometChatListItem.LeadingView>
        <CometChatListItem.Title>Bob Wilson</CometChatListItem.Title>
        <CometChatListItem.Subtitle>
          <span
            style={{
              font: 'var(--cometchat-font-body-regular)',
              color: 'var(--cometchat-text-color-secondary)',
            }}
          >
            Last seen 2 hours ago
          </span>
        </CometChatListItem.Subtitle>
      </CometChatListItem.Root>
    </div>
  );
}

export const WithoutTrailingView = {
  render: (args: { isActive: boolean; disabled: boolean }) => <WithoutTrailingViewDemo {...args} />,
};

/** Long title with truncation. */
function LongTitleDemo(args: { isActive: boolean; disabled: boolean }) {
  return (
    <div style={{ width: 400 }}>
      <CometChatListItem.Root
        id="user-8"
        isActive={args.isActive}
        disabled={args.disabled}
        aria-label="Long title item"
      >
        <CometChatListItem.LeadingView>
          <CometChatAvatar.Root name="Alexander Benjamin Christopher Davidson" size="medium">
            <CometChatAvatar.Initials />
          </CometChatAvatar.Root>
        </CometChatListItem.LeadingView>
        <CometChatListItem.Title>
          Alexander Benjamin Christopher Davidson the Third
        </CometChatListItem.Title>
        <CometChatListItem.Subtitle>
          <span
            style={{
              font: 'var(--cometchat-font-body-regular)',
              color: 'var(--cometchat-text-color-secondary)',
            }}
          >
            This is a very long subtitle that should also be truncated with an ellipsis
          </span>
        </CometChatListItem.Subtitle>
      </CometChatListItem.Root>
    </div>
  );
}

export const LongTitle = {
  render: (args: { isActive: boolean; disabled: boolean }) => <LongTitleDemo {...args} />,
};

/** Custom leading view (non-avatar). */
function CustomLeadingViewDemo(args: { isActive: boolean; disabled: boolean }) {
  return (
    <div style={{ width: 400 }}>
      <CometChatListItem.Root
        id="group-1"
        isActive={args.isActive}
        disabled={args.disabled}
        aria-label="Group chat"
      >
        <CometChatListItem.LeadingView>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'var(--cometchat-primary-color, #3399ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            #
          </div>
        </CometChatListItem.LeadingView>
        <CometChatListItem.Title>Design Team</CometChatListItem.Title>
        <CometChatListItem.Subtitle>
          <span
            style={{
              font: 'var(--cometchat-font-body-regular)',
              color: 'var(--cometchat-text-color-secondary)',
            }}
          >
            12 members
          </span>
        </CometChatListItem.Subtitle>
      </CometChatListItem.Root>
    </div>
  );
}

export const CustomLeadingView = {
  render: (args: { isActive: boolean; disabled: boolean }) => <CustomLeadingViewDemo {...args} />,
};
