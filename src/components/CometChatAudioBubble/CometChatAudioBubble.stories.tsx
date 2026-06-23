import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAudioBubble } from './CometChatAudioBubble';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import type { CometChatAudioBubbleAttachment } from './CometChatAudioBubble.types';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/Audio',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders audio message bubbles with waveform visualization and playback controls. ' +
          'The bubble self-extracts the audio attachments and caption from the SDK message.',
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

// Public domain audio samples — using MDN CC0 audio (CORS-enabled, reliable)
const WORKING_AUDIO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';
const BROKEN_AUDIO = 'https://example.com/nonexistent-audio.mp3';

function makeAttachment(
  index: number,
  overrides?: Partial<CometChatAudioBubbleAttachment>
): CometChatAudioBubbleAttachment {
  return {
    name: `audio-${String(index)}.mp3`,
    url: WORKING_AUDIO,
    mimeType: 'audio/mpeg',
    extension: 'mp3',
    size: 1048576 + index * 100000,
    ...overrides,
  };
}

function makeAttachments(count: number): CometChatAudioBubbleAttachment[] {
  return Array.from({ length: count }, (_, i) => makeAttachment(i + 1));
}

/**
 * Build an audio MediaMessage. The bubble self-extracts attachments and caption
 * from it via getAttachments()/getCaption().
 */
function mockAudioMsg(
  overrides: Partial<{
    attachmentCount: number;
    attachments: CometChatAudioBubbleAttachment[];
    caption: string;
    senderName: string;
    senderUid: string;
    readAt: number;
  }> = {}
): CometChat.MediaMessage {
  const attachments = overrides.attachments ?? makeAttachments(overrides.attachmentCount ?? 1);
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
    getAttachments: () => attachments,
    getMentionedUsers: () => [],
    getMetadata: () => ({}),
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

/** Default — outgoing + incoming audio with waveform. */
export const Default = () => {
  const group = mockGroup();
  const outgoing = mockAudioMsg({ readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockAudioMsg({ senderName: 'Jane Smith', senderUid: 'user-jane' });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatAudioBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatAudioBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
// ============================================
// Internal testing stories
// ============================================

/** [Internal] Audio with caption — outgoing + incoming. */
export const _WithCaption = () => {
  const group = mockGroup();
  const outgoing = mockAudioMsg({
    caption: 'Voice note from the meeting 🎙️',
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockAudioMsg({
    caption: 'Thanks! Will listen on my commute 🚗',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatAudioBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatAudioBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_WithCaption.storyName = '[Internal] With Caption';
_WithCaption.tags = ['!dev', '!autodocs'];

/** [Internal] Multiple audios with expand/collapse. */
export const _MultipleAudios = () => {
  const message = mockAudioMsg({ attachmentCount: 5, readAt: Math.floor(Date.now() / 1000) });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={message}
        alignment="right"
        contentView={<CometChatAudioBubble message={message} alignment="right" />}
      />
    </ChatContainer>
  );
};
_MultipleAudios.storyName = '[Internal] Multiple Audios (5)';
_MultipleAudios.tags = ['!dev', '!autodocs'];

/** [Internal] Multiple audios with caption. */
export const _MultipleAudiosWithCaption = () => {
  const message = mockAudioMsg({
    attachmentCount: 4,
    caption: 'All the recordings from today',
    readAt: Math.floor(Date.now() / 1000),
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={message}
        alignment="right"
        contentView={<CometChatAudioBubble message={message} alignment="right" />}
      />
    </ChatContainer>
  );
};
_MultipleAudiosWithCaption.storyName = '[Internal] Multiple Audios with Caption';
_MultipleAudiosWithCaption.tags = ['!dev', '!autodocs'];

/** [Internal] Failed to load audio — error state. */
export const _ErrorState = () => {
  const brokenAttachment = [makeAttachment(1, { url: BROKEN_AUDIO, name: 'broken-audio.mp3' })];
  const outgoing = mockAudioMsg({
    attachments: brokenAttachment,
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockAudioMsg({
    attachments: brokenAttachment,
    senderName: 'Jane',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        contentView={<CometChatAudioBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatAudioBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_ErrorState.storyName = '[Internal] Error State — Failed to Load';
_ErrorState.tags = ['!dev', '!autodocs'];
