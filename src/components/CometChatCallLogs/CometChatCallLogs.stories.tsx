/**
 * CometChatCallLogs Storybook Stories
 *
 * Demonstrates the call logs list component using the actual component
 * with a mock CallLogRequestBuilder:
 * - Default (loaded state with varied call types)
 * - With call history (longer list, scrollbar enabled)
 * - Empty state
 * - Error state
 * - Loading state (shimmer)
 * - With active call highlighted
 *
 * @module components/CometChatCallLogs
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCallLogs } from './CometChatCallLogs';
import { _setCallsSDKForTesting } from '../../CometChatUIKit/CometChatCalls';

// ============================================
// Mock SDK setup
// ============================================

const LOGGED_IN_USER = {
  getUid: () => 'logged-in-user',
  getName: () => 'Me',
  getAvatar: () => '',
  getStatus: () => 'online',
  getLastActiveAt: () => 0,
  getAuthToken: () => 'mock-auth-token',
} as unknown as CometChat.User;

// Mock CometChat.getLoggedinUser
CometChat.getLoggedinUser = () => Promise.resolve(LOGGED_IN_USER);
CometChat.addCallListener = (() => {}) as typeof CometChat.addCallListener;
CometChat.removeCallListener = (() => {}) as typeof CometChat.removeCallListener;

// Mock CometChatUIKitCalls so the component doesn't show "Calling is not enabled" error.
// We only need it to be truthy — the actual SDK methods aren't called when a custom
// callLogRequestBuilder is provided.
_setCallsSDKForTesting({
  CallLogRequestBuilder: class {
    setLimit() {
      return this;
    }
    setCallCategory() {
      return this;
    }
    setAuthToken() {
      return this;
    }
    build() {
      return { fetchNext: () => Promise.resolve([]) };
    }
  },
});

// ============================================
// Mock Call Log Data
// ============================================

class MockCallUser {
  uid: string;
  name: string;
  avatar: string;

  constructor(uid: string, name: string, avatar?: string) {
    this.uid = uid;
    this.name = name;
    this.avatar = avatar ?? '';
  }
  getUid(): string {
    return this.uid;
  }
  getName(): string {
    return this.name;
  }
  getAvatar(): string {
    return this.avatar;
  }
}

function createMockCallLog(overrides?: {
  sessionId?: string;
  type?: 'audio' | 'video';
  status?: string;
  initiator?: MockCallUser;
  receiver?: MockCallUser;
  initiatedAt?: number;
}): any {
  const sessionId = overrides?.sessionId ?? `session-${Math.random().toString(36).slice(2, 11)}`;
  const type = overrides?.type ?? 'audio';
  const status = overrides?.status ?? 'ended';
  const initiatedAt =
    overrides?.initiatedAt ?? Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400);
  const initiator =
    overrides?.initiator ??
    new MockCallUser(`initiator-${sessionId}`, `Caller ${sessionId.slice(-4)}`);
  const receiver =
    overrides?.receiver ??
    new MockCallUser(`receiver-${sessionId}`, `Receiver ${sessionId.slice(-4)}`);

  return {
    getSessionID: () => sessionId,
    getInitiator: () => initiator,
    getReceiver: () => receiver,
    getStatus: () => status,
    getType: () => type,
    initiatedAt,
    type,
  };
}

function createMockCallLogs(count: number) {
  const names = [
    'Alice Johnson',
    'Bob Smith',
    'Charlie Brown',
    'Diana Ross',
    'Edward Norton',
    'Fiona Apple',
    'George Lucas',
    'Hannah Montana',
    'Ivan Petrov',
    'Julia Roberts',
    'Kevin Hart',
    'Lisa Simpson',
  ];
  const statuses = ['ended', 'ended', 'ended', 'unanswered', 'cancelled', 'busy'];
  const types: ('audio' | 'video')[] = ['audio', 'video'];
  const avatarMap: Record<string, string> = {
    'Alice Johnson': '/avatars/nancy-grace.png',
    'Bob Smith': '/avatars/george-alan.png',
    'Charlie Brown': '/avatars/andrew-joseph.png',
  };

  return Array.from({ length: count }, (_, i) => {
    const name = names[i % names.length]!;
    const isOutgoing = i % 3 === 0;
    const otherUser = new MockCallUser(
      `user-${name.toLowerCase().replace(/\s/g, '-')}`,
      name,
      avatarMap[name]
    );

    return createMockCallLog({
      sessionId: `session-${String(i + 1)}`,
      type: types[i % types.length],
      status: statuses[i % statuses.length],
      initiator: isOutgoing ? new MockCallUser('logged-in-user', 'Me') : otherUser,
      receiver: isOutgoing ? otherUser : new MockCallUser('logged-in-user', 'Me'),
      initiatedAt: Math.floor(Date.now() / 1000) - i * 3600,
    });
  });
}

// ============================================
// Mock Request Builder Factories
// ============================================

function createDataRequestBuilder(callLogs: any[]) {
  let fetched = false;
  return {
    build: () => ({
      fetchNext: () => {
        if (!fetched) {
          fetched = true;
          return Promise.resolve(callLogs);
        }
        return Promise.resolve([]);
      },
    }),
  };
}

function createEmptyRequestBuilder() {
  return {
    build: () => ({
      fetchNext: () => Promise.resolve([]),
    }),
  };
}

function createLoadingRequestBuilder() {
  return {
    build: () => ({
      fetchNext: () => new Promise(() => {}), // never resolves — stays in loading state
    }),
  };
}

function createErrorRequestBuilder() {
  return {
    build: () => ({
      fetchNext: () => {
        const error = new Error('Failed to fetch call logs');

        (error as any).code = 'ERROR';
        return Promise.reject(error);
      },
    }),
  };
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<typeof CometChatCallLogs> = {
  title: 'Components/Calls/CometChat Call Logs',
  component: CometChatCallLogs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays a paginated list of call logs with call type indicators, timestamps, and the ability to initiate calls. Requires CometChat SDK initialization for live data.',
      },
    },
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div
        style={{
          width: 400,
          height: 600,
          overflow: 'hidden',
          border: '1px solid var(--cometchat-border-color-light, #eee)',
          borderRadius: 'var(--cometchat-radius-2, 8px)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof CometChatCallLogs>;

// ============================================
// Stories
// ============================================

/** Default — call logs list with recent call history entries. */
export const Default: Story = {
  render: () => (
    <CometChatCallLogs
      callLogRequestBuilder={createDataRequestBuilder(createMockCallLogs(8))}
      showScrollbar={false}
    />
  ),
};

/** Call logs with a longer history and scrollbar enabled. */
export const WithCallHistory: Story = {
  render: () => (
    <CometChatCallLogs
      callLogRequestBuilder={createDataRequestBuilder(createMockCallLogs(12))}
      showScrollbar={true}
    />
  ),
};

/** Empty state when no call logs exist. */
export const EmptyState: Story = {
  render: () => <CometChatCallLogs callLogRequestBuilder={createEmptyRequestBuilder()} />,
};

/** Loading state with shimmer placeholders. */
export const LoadingState: Story = {
  render: () => <CometChatCallLogs callLogRequestBuilder={createLoadingRequestBuilder()} />,
};

/** Error state when fetching call logs fails. */
export const ErrorState: Story = {
  render: () => <CometChatCallLogs callLogRequestBuilder={createErrorRequestBuilder()} />,
};
