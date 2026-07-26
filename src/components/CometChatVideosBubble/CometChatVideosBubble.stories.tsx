import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVideosBubble } from './CometChatVideosBubble';
import { CometChatMessageBubble } from '../CometChatMessageBubble';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/Videos',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders multi-video message bubbles with thumbnail grid, play overlay, and fullscreen playback. ' +
          'Self-extracts attachments and caption from the SDK message.',
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

const SAMPLE_VIDEOS = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://www.w3schools.com/html/movie.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
];

// `.invalid` never resolves (RFC 2606), so the probe fails and the tile falls
// back to the unsupported state (as does an audio/image file in a video message).
const BROKEN_VIDEO = 'https://cometchat.invalid/not-a-video.mp4';

function mockVideoMsg(
  overrides: Partial<{
    attachmentCount: number;
    caption: string;
    senderName: string;
    senderUid: string;
    readAt: number;
    withThumbnail: boolean;
    broken: boolean;
  }> = {}
): CometChat.MediaMessage {
  const count = overrides.attachmentCount ?? 1;
  const broken = overrides.broken ?? false;
  const withThumbnail = (overrides.withThumbnail ?? true) && !broken;
  const attachments = Array.from({ length: count }, (_, i) => ({
    getUrl: () =>
      broken ? BROKEN_VIDEO : (SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length] ?? SAMPLE_VIDEOS[0] ?? ''),
    getSize: () => 5242880,
    getMimeType: () => 'video/mp4',
    getExtension: () => 'mp4',
    getName: () => `video-${String(i + 1)}.mp4`,
  }));
  const now = Math.floor(Date.now() / 1000);

  // Metadata with thumbnail-generation extension (applied to first attachment)
  const metadata: Record<string, unknown> = {};
  if (withThumbnail) {
    metadata['@injected'] = {
      extensions: {
        'thumbnail-generation': {
          url_medium: `https://picsum.photos/seed/vids1/640/360`,
        },
      },
    };
  }

  return {
    getId: () => Math.floor(Math.random() * 10000),
    getType: () => 'video',
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
    getMetadata: () => metadata,
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

/** Default — outgoing + incoming single video without thumbnail (browser poster). */
export const Default = () => {
  const group = mockGroup();
  const outgoing = mockVideoMsg({ readAt: Math.floor(Date.now() / 1000), withThumbnail: false });
  const incoming = mockVideoMsg({
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
    withThumbnail: false,
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatVideosBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatVideosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};

/** Two videos with thumbnails — side-by-side. */
export const _Grid2Videos = () => {
  const msg = mockVideoMsg({ attachmentCount: 2, readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockVideoMsg({
    attachmentCount: 2,
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatVideosBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatVideosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_Grid2Videos.storyName = 'Grid — 2 Videos (Thumbnails)';
_Grid2Videos.tags = ['!autodocs'];

/** Two videos without thumbnails — browser poster. */
export const _Grid2VideosNoThumb = () => {
  const msg = mockVideoMsg({
    attachmentCount: 2,
    withThumbnail: false,
    senderName: 'Jane',
    senderUid: 'user-jane',
  });
  const outgoing = mockVideoMsg({
    attachmentCount: 2,
    withThumbnail: false,
    readAt: Math.floor(Date.now() / 1000),
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        contentView={<CometChatVideosBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={msg}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatVideosBubble message={msg} alignment="left" />}
      />
    </ChatContainer>
  );
};
_Grid2VideosNoThumb.storyName = 'Grid — 2 Videos (No Thumbnails)';
_Grid2VideosNoThumb.tags = ['!autodocs'];

/** Three videos — 1 top + 2 bottom. */
export const _Grid3Videos = () => {
  const msg = mockVideoMsg({ attachmentCount: 3, senderName: 'Jane', senderUid: 'user-jane' });
  const outgoing = mockVideoMsg({ attachmentCount: 3, readAt: Math.floor(Date.now() / 1000) });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        contentView={<CometChatVideosBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={msg}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatVideosBubble message={msg} alignment="left" />}
      />
    </ChatContainer>
  );
};
_Grid3Videos.storyName = 'Grid — 3 Videos (1+2)';
_Grid3Videos.tags = ['!autodocs'];

/** Four videos — 2×2 grid. */
export const _Grid4Videos = () => {
  const msg = mockVideoMsg({ attachmentCount: 4, readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockVideoMsg({
    attachmentCount: 4,
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatVideosBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatVideosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_Grid4Videos.storyName = 'Grid — 4 Videos (2×2)';
_Grid4Videos.tags = ['!autodocs'];

/** Video with caption. */
export const _WithCaption = () => {
  const group = mockGroup();
  const outgoing = mockVideoMsg({
    caption: 'Check out this clip from the conference! 🎬',
    readAt: Math.floor(Date.now() / 1000),
    withThumbnail: false,
  });
  const incoming = mockVideoMsg({
    attachmentCount: 2,
    caption: 'Thanks for sharing! Looks amazing 🔥',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatVideosBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatVideosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_WithCaption.storyName = 'With Caption';
_WithCaption.tags = ['!autodocs'];

/** Error state — a broken / mismatched video shows the fallback tile (outgoing + incoming). */
export const _ErrorState = () => {
  const group = mockGroup();
  const outgoing = mockVideoMsg({ broken: true, readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockVideoMsg({ broken: true, senderName: 'Jane Smith', senderUid: 'user-jane' });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatVideosBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatVideosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_ErrorState.storyName = 'Error — Broken / Mismatched Video';
_ErrorState.tags = ['!autodocs'];

/** Grid with caption. */
export const _GridWithCaption = () => {
  const msg = mockVideoMsg({
    attachmentCount: 3,
    caption: 'Highlights from the team offsite! 🎉',
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockVideoMsg({
    attachmentCount: 3,
    caption: 'Loved these — great work everyone!',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatVideosBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatVideosBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_GridWithCaption.storyName = 'Grid — 3 Videos with Caption';
_GridWithCaption.tags = ['!autodocs'];
