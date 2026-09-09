/* eslint-disable @typescript-eslint/no-deprecated -- this file intentionally exercises the deprecated legacy bubble it covers */
import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVideoBubble } from './CometChatVideoBubble';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import type { CometChatVideoBubbleAttachment } from './CometChatVideoBubble.types';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/Video',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders video message bubbles with thumbnail, play overlay, and fullscreen playback. ' +
          'The bubble self-extracts attachments, caption, and sender name from the SDK message.',
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

// Sample video URLs — using W3Schools and Blender Foundation CDN (CORS-enabled, publicly accessible)
const SAMPLE_VIDEOS = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://www.w3schools.com/html/movie.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://www.w3schools.com/html/movie.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
];

function makeAttachment(
  index: number,
  overrides?: Partial<CometChatVideoBubbleAttachment>
): CometChatVideoBubbleAttachment {
  return {
    url: SAMPLE_VIDEOS[(index - 1) % SAMPLE_VIDEOS.length] ?? SAMPLE_VIDEOS[0] ?? '',
    // In production, the SDK provides real video thumbnails.
    // For stories, use placeholder images so grid tiles are visible.
    thumbnail: `https://picsum.photos/seed/video${String(index)}/640/360`,
    width: 1920,
    height: 1080,
    size: 5242880,
    mimeType: 'video/mp4',
    ...overrides,
  };
}

/**
 * Build a video MediaMessage with the raw attachment shape the bubble extracts.
 * `withThumbnail: false` drops thumbnails so a single video lets the browser
 * generate its own poster natively.
 */
function mockVideoMsg(
  overrides: Partial<{
    attachmentCount: number;
    caption: string;
    senderName: string;
    senderUid: string;
    sentAt: number;
    readAt: number;
    deliveredAt: number;
    replyCount: number;
    withThumbnail: boolean;
  }> = {}
): CometChat.MediaMessage {
  const count = overrides.attachmentCount ?? 1;
  const withThumbnail = overrides.withThumbnail ?? true;
  const attachments = Array.from({ length: count }, (_, i) => {
    const att = makeAttachment(i + 1);
    return {
      url: att.url,
      ...(withThumbnail ? { thumbnail: att.thumbnail } : {}),
      metadata: {
        width: att.width,
        height: att.height,
        size: att.size,
        mimeType: att.mimeType,
      },
    };
  });
  const now = Math.floor(Date.now() / 1000);

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
    getSentAt: () => overrides.sentAt ?? now,
    getDeliveredAt: () => overrides.deliveredAt ?? 0,
    getReadAt: () => overrides.readAt ?? 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => overrides.replyCount ?? 0,
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

/** Default — outgoing + incoming single videos with inline playback. */
export const Default = () => {
  const group = mockGroup();
  const outgoing = mockVideoMsg({
    readAt: Math.floor(Date.now() / 1000),
    withThumbnail: false,
  });
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
        contentView={<CometChatVideoBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatVideoBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
// ============================================
// Internal testing stories
// ============================================

/** [Internal] Video with caption — outgoing + incoming. */
export const _WithCaption = () => {
  const group = mockGroup();
  const outgoing = mockVideoMsg({
    caption: 'Check out this clip from the conference! 🎬',
    readAt: Math.floor(Date.now() / 1000),
    withThumbnail: false,
  });
  const incoming = mockVideoMsg({
    caption: 'Thanks for sharing! Looks amazing 🔥',
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
        contentView={<CometChatVideoBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatVideoBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_WithCaption.storyName = '[Internal] With Caption';
_WithCaption.tags = ['!dev', '!autodocs'];

/** [Internal] Two videos — side-by-side grid with thumbnails. */
export const _Grid2Videos = () => {
  const message = mockVideoMsg({ attachmentCount: 2, readAt: Math.floor(Date.now() / 1000) });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={message}
        alignment="right"
        contentView={<CometChatVideoBubble message={message} alignment="right" />}
      />
    </ChatContainer>
  );
};
_Grid2Videos.storyName = '[Internal] Grid — 2 Videos';
_Grid2Videos.tags = ['!dev', '!autodocs'];

/** [Internal] Three videos — 1 top + 2 bottom. */
export const _Grid3Videos = () => {
  const message = mockVideoMsg({ attachmentCount: 3, senderName: 'Jane', senderUid: 'user-jane' });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={message}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatVideoBubble message={message} alignment="left" />}
      />
    </ChatContainer>
  );
};
_Grid3Videos.storyName = '[Internal] Grid — 3 Videos (1+2)';
_Grid3Videos.tags = ['!dev', '!autodocs'];

/** [Internal] Four videos — 2×2 grid. */
export const _Grid4Videos = () => {
  const message = mockVideoMsg({ attachmentCount: 4, readAt: Math.floor(Date.now() / 1000) });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={message}
        alignment="right"
        contentView={<CometChatVideoBubble message={message} alignment="right" />}
      />
    </ChatContainer>
  );
};
_Grid4Videos.storyName = '[Internal] Grid — 4 Videos (2×2)';
_Grid4Videos.tags = ['!dev', '!autodocs'];

/** [Internal] Six videos — overflow with +2 indicator. */
export const _GridOverflow = () => {
  const message = mockVideoMsg({ attachmentCount: 6, senderName: 'Jane', senderUid: 'user-jane' });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={message}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatVideoBubble message={message} alignment="left" />}
      />
    </ChatContainer>
  );
};
_GridOverflow.storyName = '[Internal] Grid — 6 Videos (Overflow +2)';
_GridOverflow.tags = ['!dev', '!autodocs'];

/** [Internal] Grid with caption. */
export const _GridWithCaption = () => {
  const message = mockVideoMsg({
    attachmentCount: 3,
    caption: 'Highlights from the team offsite! 🎉',
    readAt: Math.floor(Date.now() / 1000),
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={message}
        alignment="right"
        contentView={<CometChatVideoBubble message={message} alignment="right" />}
      />
    </ChatContainer>
  );
};
_GridWithCaption.storyName = '[Internal] Grid — 3 Videos with Caption';
_GridWithCaption.tags = ['!dev', '!autodocs'];
