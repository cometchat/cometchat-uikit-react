/**
 * CometChatCallBubble Storybook Stories
 *
 * Demonstrates the call bubble used for group/conference call messages
 * (direct call / meeting custom messages). The bubble self-extracts the call
 * type, session id, title, icon and timestamp from the SDK message.
 *
 * - Audio call (outgoing/incoming)
 * - Video call (outgoing/incoming)
 *
 * @module components/CometChatCallBubble
 */

import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCallBubble } from './CometChatCallBubble';

const meta: Meta<typeof CometChatCallBubble> = {
  title: 'Components/Bubbles/Call Bubble',
  component: CometChatCallBubble,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Renders group/conference call message bubbles (meeting type) with a Join button. ' +
          'The bubble self-extracts the call type, session id, title, icon and timestamp from the SDK message.',
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

/**
 * Build a meeting CustomMessage. The bubble self-extracts the call type and
 * session id from getData().customData and the timestamp from getSentAt().
 */
function mockMeetingMsg(
  overrides: {
    callType?: 'audio' | 'video';
    sessionID?: string;
    senderUid?: string;
    senderName?: string;
    sentAt?: number;
  } = {}
): CometChat.CustomMessage {
  const now = Math.floor(Date.now() / 1000);
  return {
    getId: () => Math.floor(Math.random() * 10000),
    getType: () => 'meeting',
    getCategory: () => 'custom',
    getSender: () => ({
      getUid: () => overrides.senderUid ?? 'user-john',
      getName: () => overrides.senderName ?? 'John Doe',
      getAvatar: () => '',
      getStatus: () => 'online',
    }),
    getReceiverType: () => 'group',
    getReceiverId: () => 'group-design',
    getSentAt: () => overrides.sentAt ?? now,
    getData: () => ({
      customData: {
        sessionID: overrides.sessionID ?? 'session-123',
        callType: overrides.callType ?? 'video',
      },
    }),
  } as unknown as CometChat.CustomMessage;
}

const onJoinClick = (id: string) => alert(`Joining session: ${id}`);

/** Audio call — outgoing (sent by me). */
export const AudioCallOutgoing = () => (
  <CometChatCallBubble
    message={mockMeetingMsg({ callType: 'audio', sessionID: 'session-123' })}
    alignment="right"
    onJoinClick={onJoinClick}
  />
);

/** Audio call — incoming (received). */
export const AudioCallIncoming = () => (
  <CometChatCallBubble
    message={mockMeetingMsg({ callType: 'audio', sessionID: 'session-456' })}
    alignment="left"
    onJoinClick={onJoinClick}
  />
);

/** Video call — outgoing. */
export const VideoCallOutgoing = () => (
  <CometChatCallBubble
    message={mockMeetingMsg({ callType: 'video', sessionID: 'session-789' })}
    alignment="right"
    onJoinClick={onJoinClick}
  />
);

/** Video call — incoming. */
export const VideoCallIncoming = () => (
  <CometChatCallBubble
    message={mockMeetingMsg({ callType: 'video', sessionID: 'session-abc' })}
    alignment="left"
    onJoinClick={onJoinClick}
  />
);
