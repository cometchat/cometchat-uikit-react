/**
 * CometChatMessageHeader Storybook Stories
 *
 * Interactive stories demonstrating the message header component:
 * - User Chat Header (online user with call buttons)
 * - Group Chat Header (group with member count)
 * - Offline User Header
 * - Without Back Button
 * - Without Call Buttons
 * - With Search Option
 * - With Conversation Summary
 *
 * All variants render centered in both docs preview and fullscreen story pages.
 *
 * @module components/CometChatMessageHeader
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageHeader } from './CometChatMessageHeader';
import type { CometChatMessageHeaderRootProps } from './CometChatMessageHeader.types';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';

// Mock CometChatUIKit.getSettings() so call buttons are visible in Storybook
CometChatUIKit.getSettings = () =>
  ({ isCallingEnabled: () => true }) as ReturnType<typeof CometChatUIKit.getSettings>;

// ============================================
// Mock Data — real SDK objects
// ============================================

function createMockUser(overrides: {
  uid: string;
  name: string;
  avatar?: string;
  status?: string;
  lastActiveAt?: number;
}): CometChat.User {
  const user = new CometChat.User(overrides.uid);
  user.setName(overrides.name);
  if (overrides.avatar) {
    user.setAvatar(overrides.avatar);
  }
  user.setStatus(overrides.status ?? CometChat.USER_STATUS.ONLINE);
  if (overrides.lastActiveAt) {
    user.setLastActiveAt(overrides.lastActiveAt);
  }
  return user;
}

function createMockGroup(overrides: {
  guid: string;
  name: string;
  membersCount?: number;
  type?: string;
  icon?: string;
}): CometChat.Group {
  const group = new CometChat.Group(
    overrides.guid,
    overrides.name,
    overrides.type ?? CometChat.GROUP_TYPE.PUBLIC
  );
  group.setMembersCount(overrides.membersCount ?? 5);
  if (overrides.icon) {
    group.setIcon(overrides.icon);
  }
  return group;
}

const onlineUser = createMockUser({
  uid: 'user-header-1',
  name: 'John Doe',
  avatar: 'https://i.pravatar.cc/150?u=john-doe',
  status: CometChat.USER_STATUS.ONLINE,
});

const offlineUser = createMockUser({
  uid: 'user-header-2',
  name: 'Jane Smith',
  avatar: 'https://i.pravatar.cc/150?u=jane-smith',
  status: CometChat.USER_STATUS.OFFLINE,
  lastActiveAt: Math.floor(Date.now() / 1000) - 3600,
});

const testGroup = createMockGroup({
  guid: 'group-header-1',
  name: 'Design Team',
  membersCount: 12,
  type: CometChat.GROUP_TYPE.PUBLIC,
});

// ============================================
// Wrapper styles (matching Angular)
// ============================================

const fullScreenCenterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  minHeight: '80px',
  boxSizing: 'border-box',
  padding: '16px',
};

const cardStyle: React.CSSProperties = {
  width: '500px',
  border: '1px solid var(--cometchat-border-color-light, #eee)',
  borderRadius: 'var(--cometchat-radius-2, 8px)',
  overflow: 'hidden',
};

// ============================================
// Render helper
// ============================================

function renderHeader(
  entity: { user?: CometChat.User; group?: CometChat.Group },
  args: Partial<CometChatMessageHeaderRootProps>
) {
  return (
    <div style={fullScreenCenterStyle}>
      <div style={cardStyle}>
        <CometChatMessageHeader.Root
          user={entity.user}
          group={entity.group}
          hideUserStatus={args.hideUserStatus}
          hideBackButton={args.hideBackButton}
          hideVoiceCallButton={args.hideVoiceCallButton}
          hideVideoCallButton={args.hideVideoCallButton}
          showSearchOption={args.showSearchOption}
          showConversationSummaryButton={args.showConversationSummaryButton}
          onBack={() => {
            console.log('backClick');
          }}
          onItemClick={e => {
            console.log('itemClick', e);
          }}
          onSearchOptionClicked={() => {
            console.log('searchClick');
          }}
          onSummaryClick={() => {
            console.log('conversationSummaryClick');
          }}
          onVoiceCallClick={e => {
            console.log('voiceCallClick', e);
          }}
          onVideoCallClick={e => {
            console.log('videoCallClick', e);
          }}
          onError={e => {
            console.log('error', e);
          }}
        />
      </div>
    </div>
  );
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatMessageHeaderRootProps> = {
  title: 'Components/Messages/CometChat Message Header',
  component: CometChatMessageHeader.Root,
  tags: ['autodocs'],
  args: {
    hideUserStatus: false,
    hideBackButton: false,
    hideVoiceCallButton: false,
    hideVideoCallButton: false,
    showSearchOption: true,
    showConversationSummaryButton: false,
  },
  argTypes: {
    // Entity Configuration
    user: {
      control: false,
      description: 'CometChat.User object for 1-on-1 conversations. Mutually exclusive with group.',
    },
    group: {
      control: false,
      description: 'CometChat.Group object for group conversations. Mutually exclusive with user.',
    },
    // Display Controls
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide the user online/offline status indicator',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    hideBackButton: {
      control: 'boolean',
      description: 'Hide the back button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    hideVoiceCallButton: {
      control: 'boolean',
      description: 'Hide the voice call button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    hideVideoCallButton: {
      control: 'boolean',
      description: 'Hide the video call button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    showSearchOption: {
      control: 'boolean',
      description: 'Show the search option button in the header',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    showConversationSummaryButton: {
      control: 'boolean',
      description: 'Show the AI conversation summary button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    // Callbacks
    onItemClick: {
      action: 'itemClick',
      table: {
        type: { summary: '(entity: CometChat.User | CometChat.Group) => void' },
      },
    },
    onSearchOptionClicked: {
      action: 'searchClick',
    },
    onSummaryClick: {
      action: 'conversationSummaryClick',
    },
    onVoiceCallClick: {
      action: 'voiceCallClick',
      table: {
        type: { summary: '(entity: CometChat.User | CometChat.Group) => void' },
      },
    },
    onVideoCallClick: {
      action: 'videoCallClick',
      table: {
        type: { summary: '(entity: CometChat.User | CometChat.Group) => void' },
      },
    },
    onError: {
      action: 'error',
      table: {
        type: { summary: '((error: CometChat.CometChatException) => void) | null' },
      },
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CometChatMessageHeader displays the header section of a chat conversation, showing avatar, name, online/offline status for users, member count for groups, and action buttons (back, voice/video call). Supports extensive template customization and full keyboard navigation.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<CometChatMessageHeaderRootProps>;

// ============================================
// Stories
// ============================================

/** Message header for a 1-on-1 user conversation showing online status and call actions. */
export const UserChatHeader: Story = {
  render: args => renderHeader({ user: onlineUser }, args),
  parameters: {
    docs: {
      description: {
        story:
          'Header for a 1-on-1 user conversation displaying the user avatar, name, online/offline status indicator, and voice/video call action buttons.',
      },
    },
  },
};

/** Message header for a group conversation showing member count and call actions. */
export const GroupChatHeader: Story = {
  render: args => renderHeader({ group: testGroup }, args),
  parameters: {
    docs: {
      description: {
        story:
          'Header for a group conversation displaying the group icon, name, member count in the subtitle, and voice/video call action buttons.',
      },
    },
  },
};

/** Message header for an offline user showing last active timestamp. */
export const OfflineUserHeader: Story = {
  render: args => renderHeader({ user: offlineUser }, args),
  parameters: {
    docs: {
      description: {
        story:
          'Header for an offline user conversation showing last active timestamp in the subtitle.',
      },
    },
  },
};

/** Message header without the back button. */
export const WithoutBackButton: Story = {
  args: { hideBackButton: true },
  render: args => renderHeader({ user: onlineUser }, args),
  parameters: {
    docs: {
      description: {
        story: 'Header without the back button, suitable for single-panel layouts.',
      },
    },
  },
};

/** Message header without call buttons. */
export const WithoutCallButtons: Story = {
  args: { hideVoiceCallButton: true, hideVideoCallButton: true },
  render: args => renderHeader({ user: onlineUser }, args),
  parameters: {
    docs: {
      description: {
        story: 'Header with voice and video call buttons hidden.',
      },
    },
  },
};

/** Message header with search option enabled. */
export const WithSearchOption: Story = {
  args: { showSearchOption: true },
  render: args => renderHeader({ user: onlineUser }, args),
  parameters: {
    docs: {
      description: {
        story: 'Header with the search option button visible in the trailing section.',
      },
    },
  },
};

/** Message header with AI conversation summary button. */
export const WithConversationSummary: Story = {
  args: { showConversationSummaryButton: true },
  render: args => renderHeader({ user: onlineUser }, args),
  parameters: {
    docs: {
      description: {
        story: 'Header with the AI conversation summary button enabled.',
      },
    },
  },
};
