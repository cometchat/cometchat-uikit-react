import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAudiosBubble } from './CometChatAudiosBubble';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import type { CometChatAudiosBubbleAttachment } from './CometChatAudiosBubble.types';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/Audios',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders multi-audio message bubbles with playback cards (play/pause, seek slider, time). ' +
          'Supports expand/collapse for >3 attachments. Self-extracts from the SDK message.',
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

const WORKING_AUDIO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';

function makeAttachment(
  index: number,
  overrides?: Partial<CometChatAudiosBubbleAttachment>
): CometChatAudiosBubbleAttachment {
  return {
    name: `recording-${String(index)}.mp3`,
    url: WORKING_AUDIO,
    mimeType: 'audio/mpeg',
    extension: 'mp3',
    size: 1048576 + index * 100000,
    duration: 7 + index * 3,
    ...overrides,
  };
}

function makeAttachments(count: number): CometChatAudiosBubbleAttachment[] {
  return Array.from({ length: count }, (_, i) => makeAttachment(i + 1));
}

function mockAudioMsg(
  overrides: Partial<{
    attachmentCount: number;
    attachments: CometChatAudiosBubbleAttachment[];
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

/** Default — outgoing + incoming single audio. */
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
        contentView={<CometChatAudiosBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatAudiosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};

/** Two audios. */
export const _TwoAudios = () => {
  const msg = mockAudioMsg({ attachmentCount: 2, readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockAudioMsg({
    attachmentCount: 2,
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatAudiosBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatAudiosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_TwoAudios.storyName = '2 Audios';
_TwoAudios.tags = ['!autodocs'];

/** Three audios — at the collapse threshold. */
export const _ThreeAudios = () => {
  const msg = mockAudioMsg({ attachmentCount: 3, senderName: 'Jane', senderUid: 'user-jane' });
  const outgoing = mockAudioMsg({ attachmentCount: 3, readAt: Math.floor(Date.now() / 1000) });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        contentView={<CometChatAudiosBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={msg}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatAudiosBubble message={msg} alignment="left" />}
      />
    </ChatContainer>
  );
};
_ThreeAudios.storyName = '3 Audios (Collapse Threshold)';
_ThreeAudios.tags = ['!autodocs'];

/** Five audios — shows expand/collapse with "+2 more". */
export const _FiveAudiosExpandCollapse = () => {
  const msg = mockAudioMsg({ attachmentCount: 5, readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockAudioMsg({
    attachmentCount: 5,
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatAudiosBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatAudiosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_FiveAudiosExpandCollapse.storyName = '5 Audios (Expand/Collapse)';
_FiveAudiosExpandCollapse.tags = ['!autodocs'];

/** With caption. */
export const _WithCaption = () => {
  const group = mockGroup();
  const outgoing = mockAudioMsg({
    caption: 'Recordings from the meeting 🎙️',
    attachmentCount: 2,
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockAudioMsg({
    caption: 'Thanks for the recordings!',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatAudiosBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatAudiosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_WithCaption.storyName = 'With Caption';
_WithCaption.tags = ['!autodocs'];

/** Error state — a type-mismatched file (non-audio mime) shows the unsupported card. */
export const _ErrorState = () => {
  const group = mockGroup();
  const mismatched: CometChatAudiosBubbleAttachment = {
    name: 'data.bin',
    url: WORKING_AUDIO,
    mimeType: 'application/octet-stream',
    extension: 'bin',
    size: 524288,
  };
  const outgoing = mockAudioMsg({
    attachments: [mismatched],
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockAudioMsg({
    attachments: [mismatched],
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatAudiosBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatAudiosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_ErrorState.storyName = 'Error — Unsupported / Mismatched File';
_ErrorState.tags = ['!autodocs'];

/** Many audios — four with caption and expand/collapse. */
export const _ManyWithCaption = () => {
  const msg = mockAudioMsg({
    attachmentCount: 4,
    caption: 'All the recordings from today',
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockAudioMsg({
    attachmentCount: 4,
    caption: 'Got them, thanks!',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatAudiosBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatAudiosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_ManyWithCaption.storyName = '4 Audios with Caption';
_ManyWithCaption.tags = ['!autodocs'];
