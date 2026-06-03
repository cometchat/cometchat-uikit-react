/**
 * CometChatOutgoingCall Storybook Stories
 *
 * Demonstrates the outgoing call screen (waiting for recipient to pick up):
 * - Default (audio call)
 * - Video call
 * - Custom views (title, subtitle, avatar, cancel button)
 * - Dark theme
 * - RTL
 *
 * NOTE: Sound playback is disabled in these stories via `disableSoundForCalls`.
 *
 * @module components/CometChatOutgoingCall
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatOutgoingCall } from './CometChatOutgoingCall';

const meta: Meta<typeof CometChatOutgoingCall> = {
  title: 'Components/Calls/CometChat Outgoing Call',
  component: CometChatOutgoingCall,
  tags: ['autodocs'],
  args: {
    disableSoundForCalls: true,
  },
  argTypes: {
    disableSoundForCalls: {
      control: 'boolean',
      description: 'Disable the ringing sound during outgoing call.',
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Displays an outgoing call screen with cancel action while waiting for the recipient.',
      },
    },
  },
};
export default meta;

// --- Mock helpers ---

function createMockCall(overrides: { name?: string; avatar?: string; type?: string } = {}) {
  const name = overrides.name ?? 'Alice Johnson';
  const avatar = overrides.avatar ?? '/avatars/nancy-grace.png';
  const type = overrides.type ?? 'audio';

  return {
    getSessionId: () => 'session-mock-123',
    getType: () => type,
    getReceiverType: () => 'user',
    getReceiver: () => ({
      getName: () => name,
      getAvatar: () => avatar,
      getUid: () => 'uid-alice',
    }),
    getSender: () => ({
      getName: () => 'Me',
      getUid: () => 'uid-me',
    }),
  } as unknown as CometChat.Call;
}

function StoryContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cometchat-background-color-01, #fff)',
      }}
    >
      <div style={{ width: 380, height: 600, position: 'relative' }}>{children}</div>
    </div>
  );
}

/** Default — audio call. */
export const Default = {
  render: (args: { disableSoundForCalls: boolean }) => (
    <StoryContainer>
      <CometChatOutgoingCall
        call={createMockCall()}
        disableSoundForCalls={args.disableSoundForCalls}
        onCallCanceled={() => alert('Call cancelled')}
      />
    </StoryContainer>
  ),
};

/** Video call. */
export const VideoCall = () => (
  <StoryContainer>
    <CometChatOutgoingCall
      call={createMockCall({
        type: 'video',
        name: 'Bob Smith',
        avatar: '/avatars/george-alan.png',
      })}
      disableSoundForCalls
      onCallCanceled={() => alert('Call cancelled')}
    />
  </StoryContainer>
);

/** Custom title and subtitle views. */
export const CustomViews = () => (
  <StoryContainer>
    <CometChatOutgoingCall
      call={createMockCall()}
      disableSoundForCalls
      onCallCanceled={() => alert('Cancelled')}
      titleView={<div style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>Team Standup</div>}
      subtitleView={<div style={{ fontSize: 14, color: '#aaa' }}>Connecting to group...</div>}
    />
  </StoryContainer>
);

/** Custom cancel button. */
export const CustomCancelButton = () => (
  <StoryContainer>
    <CometChatOutgoingCall
      call={createMockCall({ name: 'Charlie' })}
      disableSoundForCalls
      onCallCanceled={() => alert('Cancelled')}
      cancelButtonView={
        <button
          type="button"
          style={{
            padding: '12px 32px',
            background: '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: 24,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          End Call
        </button>
      }
    />
  </StoryContainer>
);
