/**
 * CometChatCallBubble Storybook Stories
 *
 * Demonstrates the call bubble used for group/conference call messages:
 * - Audio call (outgoing/incoming)
 * - Video call (outgoing/incoming)
 * - Without join button
 * - Dark theme
 * - RTL
 *
 * @module plugins/core/call-action
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatCallBubble } from './CometChatCallBubble';
import videoCallIcon from '../../../assets/video_call_button.svg';
import audioCallIcon from '../../../assets/audio_call_button.svg';

const meta: Meta<typeof CometChatCallBubble> = {
  title: 'Components/Bubbles/Call Bubble',
  component: CometChatCallBubble,
  tags: ['autodocs'],
  args: {
    isSentByMe: true,
    title: 'Audio Call',
    subtitle: 'Today, 2:30 PM',
    buttonText: 'Join',
  },
  argTypes: {
    isSentByMe: {
      control: 'boolean',
      description: 'Whether the call was initiated by the logged-in user (outgoing).',
    },
    title: {
      control: 'text',
      description: 'Call type title (e.g., "Audio Call", "Video Call").',
    },
    subtitle: {
      control: 'text',
      description: 'Subtitle text (e.g., timestamp or duration).',
    },
    buttonText: {
      control: 'text',
      description: 'Join button text. Omit to hide the button.',
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Renders call-related message bubbles (missed, rejected, ended calls).',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="cometchat" style={{ padding: 16, background: '#fff', borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

/** Audio call — outgoing (sent by me). */
export const AudioCallOutgoing = {
  render: (args: {
    isSentByMe: boolean;
    title: string;
    subtitle?: string;
    buttonText?: string;
  }) => (
    <CometChatCallBubble
      title={args.title}
      subtitle={args.subtitle}
      buttonText={args.buttonText}
      iconUrl={audioCallIcon}
      sessionId="session-123"
      isSentByMe={args.isSentByMe}
      onClicked={id => alert(`Joining session: ${id}`)}
    />
  ),
};

/** Audio call — incoming (received). */
export const AudioCallIncoming = () => (
  <CometChatCallBubble
    title="Audio Call"
    subtitle="Today, 2:30 PM"
    buttonText="Join"
    iconUrl={audioCallIcon}
    sessionId="session-456"
    isSentByMe={false}
    onClicked={id => alert(`Joining session: ${id}`)}
  />
);

/** Video call — outgoing. */
export const VideoCallOutgoing = () => (
  <CometChatCallBubble
    title="Video Call"
    subtitle="Yesterday, 10:15 AM"
    buttonText="Join"
    iconUrl={videoCallIcon}
    sessionId="session-789"
    isSentByMe={true}
    onClicked={id => alert(`Joining session: ${id}`)}
  />
);

/** Without join button (ended call). */
export const WithoutButton = () => (
  <CometChatCallBubble
    title="Audio Call"
    subtitle="Ended · 5 min"
    iconUrl={audioCallIcon}
    isSentByMe={true}
  />
);
