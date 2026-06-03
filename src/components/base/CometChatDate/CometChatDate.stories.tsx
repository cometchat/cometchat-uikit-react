import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatDate } from './CometChatDate';

/** Helper: get a Unix timestamp (seconds) for "now minus N seconds". */
function ago(seconds: number): number {
  return Math.floor(Date.now() / 1000) - seconds;
}

const meta: Meta = {
  title: 'Components/Misc/Date',
  tags: ['autodocs'],
  args: {
    timestamp: ago(60),
  },
  argTypes: {
    timestamp: {
      control: 'number',
      description: 'Unix timestamp (seconds) to display.',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays formatted dates with relative time (today, yesterday) and absolute formats.',
      },
    },
  },
};
export default meta;

/** Default — interactive timestamp control. */
export const Default = {
  render: (args: { timestamp: number }) => (
    <CometChatDate.Root timestamp={args.timestamp}>
      <CometChatDate.Text />
    </CometChatDate.Root>
  ),
};

/** Yesterday timestamp. */
export const Yesterday = {
  args: {
    timestamp: ago(24 * 60 * 60 + 3600),
  },
  render: (args: { timestamp: number }) => (
    <CometChatDate.Root timestamp={args.timestamp} formatConfig={{ yesterday: 'Yesterday' }}>
      <CometChatDate.Text />
    </CometChatDate.Root>
  ),
};

/** Older timestamp (> 7 days). */
export const OlderDate = {
  args: {
    timestamp: ago(30 * 24 * 60 * 60),
  },
  render: (args: { timestamp: number }) => (
    <CometChatDate.Root timestamp={args.timestamp} formatConfig={{ otherDays: 'DD MMM, YYYY' }}>
      <CometChatDate.Text />
    </CometChatDate.Root>
  ),
};

/** Relative time — minutes ago. */
export const RelativeMinutes = {
  args: {
    timestamp: ago(5 * 60),
  },
  render: (args: { timestamp: number }) => (
    <CometChatDate.Root
      timestamp={args.timestamp}
      formatConfig={{
        today: 'hh:mm A',
        relativeTime: { minute: '1 min ago', minutes: '%d mins ago' },
      }}
    >
      <CometChatDate.Text />
    </CometChatDate.Root>
  ),
};

/** Relative time — hours ago. */
export const RelativeHours = {
  args: {
    timestamp: ago(3 * 60 * 60),
  },
  render: (args: { timestamp: number }) => (
    <CometChatDate.Root
      timestamp={args.timestamp}
      formatConfig={{
        today: 'hh:mm A',
        relativeTime: { hour: '1 hr ago', hours: '%d hrs ago' },
      }}
    >
      <CometChatDate.Text />
    </CometChatDate.Root>
  ),
};

/** Body variant. */
export const BodyVariant = {
  args: {
    timestamp: ago(120),
  },
  render: (args: { timestamp: number }) => (
    <CometChatDate.Root timestamp={args.timestamp} variant="body">
      <CometChatDate.Text />
    </CometChatDate.Root>
  ),
};

/** Label variant (date separator style). */
export const LabelVariant = {
  args: {
    timestamp: ago(2 * 24 * 60 * 60),
  },
  render: (args: { timestamp: number }) => (
    <CometChatDate.Root
      timestamp={args.timestamp}
      variant="label"
      formatConfig={{
        today: 'Today',
        yesterday: 'Yesterday',
        lastWeek: 'dddd, DD MMM',
        otherDays: 'DD MMM, YYYY',
      }}
    >
      <CometChatDate.Text />
    </CometChatDate.Root>
  ),
};

/** Custom formatConfig. */
export const CustomFormatConfig = {
  render: (args: { timestamp: number }) => (
    <CometChatDate.Root
      timestamp={args.timestamp}
      formatConfig={{
        today: 'hh:mm A',
        yesterday: 'DD MMM, hh:mm A',
        lastWeek: 'dddd, DD MMM',
        otherDays: 'DD/MM/YYYY',
      }}
    >
      <CometChatDate.Text />
    </CometChatDate.Root>
  ),
};

/** Custom formatter function. */
export const CustomFormatter = {
  render: (args: { timestamp: number }) => (
    <CometChatDate.Root
      timestamp={args.timestamp}
      formatter={ts =>
        new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
          ts * 1000
        )
      }
    >
      <CometChatDate.Text />
    </CometChatDate.Root>
  ),
};

/** All variants side by side. */
export const AllVariants = {
  render: (args: { timestamp: number }) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <CometChatDate.Root timestamp={args.timestamp} variant="caption">
        <CometChatDate.Text />
      </CometChatDate.Root>
      <CometChatDate.Root timestamp={args.timestamp} variant="body">
        <CometChatDate.Text />
      </CometChatDate.Root>
      <CometChatDate.Root timestamp={args.timestamp} variant="label">
        <CometChatDate.Text />
      </CometChatDate.Root>
    </div>
  ),
};
