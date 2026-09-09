import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVoiceNoteBubble } from './CometChatVoiceNoteBubble';
import { CometChatMessageBubble } from '../CometChatMessageBubble';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/Voice Note',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders voice-note messages (audio tagged `audioType: "voice_note"`) with the ' +
          'waveform renderer and playback controls. Always standalone (no grid). ' +
          'Self-extracts the audio attachment and caption from the SDK message.',
      },
    },
  },
  decorators: [
    Story => (
      <div
        style={{
          background: '#fff',
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;

// --- Helpers ---

// Public domain audio sample — MDN CC0 audio (CORS-enabled, reliable).
const WORKING_AUDIO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';

/**
 * Build a voice-note MediaMessage. Voice notes are audio messages tagged with
 * `audioType: "voice_note"` in metadata; the bubble self-extracts the single
 * attachment and caption via getAttachments()/getCaption().
 */
function mockVoiceNoteMsg(
  overrides: Partial<{
    caption: string;
    senderName: string;
    senderUid: string;
    readAt: number;
    duration: number;
    fileName: string;
  }> = {}
): CometChat.MediaMessage {
  const attachment = {
    name: overrides.fileName ?? 'voice-note.mp3',
    url: WORKING_AUDIO,
    getUrl: () => WORKING_AUDIO,
    getName: () => overrides.fileName ?? 'voice-note.mp3',
    mimeType: 'audio/mpeg',
    getMimeType: () => 'audio/mpeg',
    extension: 'mp3',
    getExtension: () => 'mp3',
    size: 1048576,
    getSize: () => 1048576,
  };
  const now = Math.floor(Date.now() / 1000);

  return {
    getId: () => Math.floor(Math.random() * 10000),
    getType: () => 'audio',
    getCategory: () => 'message',
    getSender: () => ({
      getUid: () => overrides.senderUid ?? 'user-john',
      getName: () => overrides.senderName ?? 'John Doe',
      getAvatar: () => '',
      getStatus: () => 'online',
    }),
    getSentAt: () => now,
    getDeliveredAt: () => 0,
    getReadAt: () => overrides.readAt ?? 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getMuid: () => `muid-${String(Math.random())}`,
    getCaption: () => overrides.caption ?? '',
    getData: () => ({ text: overrides.caption ?? '' }),
    getAttachments: () => [attachment],
    getMentionedUsers: () => [],
    getMetadata: () => ({ audioType: 'voice_note', duration: overrides.duration ?? 8 }),
    getReactions: () => [],
  } as unknown as CometChat.MediaMessage;
}

function ChatContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 720,
        padding: 16,
        borderRadius: 'var(--cometchat-radius-4, 16px)',
        border: '1px solid var(--cometchat-border-color-light, #f5f5f5)',
      }}
    >
      {children}
    </div>
  );
}

function mockGroup(): CometChat.Group {
  return {
    getGuid: () => 'group-design',
    getName: () => 'Design Team',
    getMembersCount: () => 8,
    getType: () => 'public',
  } as unknown as CometChat.Group;
}

// --- Stories ---

/** Default — outgoing + incoming voice note with waveform. */
export const Default = () => {
  const group = mockGroup();
  const outgoing = mockVoiceNoteMsg({ readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockVoiceNoteMsg({ senderName: 'Jane Smith', senderUid: 'user-jane' });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatVoiceNoteBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatVoiceNoteBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
