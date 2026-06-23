/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCallButtons } from './CometChatCallButtons';

// ============================================
// Mock Helpers
// ============================================

function createMockUser(uid: string, name: string, status = 'online') {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => status,
    getAvatar: () => `https://i.pravatar.cc/150?u=${uid}`,
  } as unknown as CometChat.User;
}

function createMockGroup(guid: string, name: string, membersCount = 5) {
  return {
    getGuid: () => guid,
    getName: () => name,
    getIcon: () => `https://i.pravatar.cc/150?u=${guid}`,
    getType: () => 'public',
    getMembersCount: () => membersCount,
  } as unknown as CometChat.Group;
}

const mockUser = createMockUser('user-alice', 'Alice Johnson');
const mockGroup = createMockGroup('group-design', 'Design Team', 8);

// ============================================
// Meta
// ============================================

const meta: Meta<typeof CometChatCallButtons> = {
  title: 'Components/Calls/CometChatCallButtons',
  component: CometChatCallButtons,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatCallButtons renders voice and video call buttons and manages the full call lifecycle (outgoing → ongoing → ended). Works with both 1:1 users and groups.',
      },
    },
  },
  decorators: [
    Story => (
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          minWidth: 160,
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <Story />
      </div>
    ),
  ],
  argTypes: {
    hideVoiceCallButton: {
      control: 'boolean',
      description: 'Hide the voice call button',
    },
    hideVideoCallButton: {
      control: 'boolean',
      description: 'Hide the video call button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CometChatCallButtons>;

// ============================================
// Stories
// ============================================

/** Default — both voice and video call buttons for a 1:1 user. */
export const Default: Story = {
  args: {
    user: mockUser,
    hideVoiceCallButton: false,
    hideVideoCallButton: false,
  },
};

/** Group Call — both buttons for a group conversation. */
export const GroupCall: Story = {
  args: {
    group: mockGroup,
    hideVoiceCallButton: false,
    hideVideoCallButton: false,
  },
};

/** Voice Only — video call button hidden. */
export const VoiceOnly: Story = {
  args: {
    user: mockUser,
    hideVoiceCallButton: false,
    hideVideoCallButton: true,
  },
};

/** Video Only — voice call button hidden. */
export const VideoOnly: Story = {
  args: {
    user: mockUser,
    hideVoiceCallButton: true,
    hideVideoCallButton: false,
  },
};

/** With Custom Click Handlers — overrides default call initiation with custom callbacks. */
export const WithCustomHandlers: Story = {
  args: {
    user: mockUser,
    onVoiceCallClick: entity => {
      alert(`Voice call clicked for: ${entity.getName?.() ?? 'unknown'}`);
    },
    onVideoCallClick: entity => {
      alert(`Video call clicked for: ${entity.getName?.() ?? 'unknown'}`);
    },
  },
};

/** Custom Button Views — renders custom elements instead of default buttons. */
export const CustomButtonViews: Story = {
  render: () => (
    <CometChatCallButtons
      user={mockUser}
      voiceCallButtonView={
        <button
          type="button"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#4caf50',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          📞 Call
        </button>
      }
      videoCallButtonView={
        <button
          type="button"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: '#2196f3',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          📹 Video
        </button>
      }
    />
  ),
};

/** Both Hidden — renders nothing when both buttons are hidden. */
export const BothHidden: Story = {
  args: {
    user: mockUser,
    hideVoiceCallButton: true,
    hideVideoCallButton: true,
  },
};
