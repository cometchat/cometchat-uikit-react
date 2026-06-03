import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatVideoBubble } from './CometChatVideoBubble';
import { CometChatMessageBubble } from '../../../components/CometChatMessageBubble';
import type { CometChatVideoBubbleAttachment } from './CometChatVideoBubble.types';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/Video',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders video message bubbles with thumbnail, play overlay, and fullscreen playback.',
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

function makeAttachments(count: number): CometChatVideoBubbleAttachment[] {
  return Array.from({ length: count }, (_, i) => makeAttachment(i + 1));
}

/** Single-video attachment without thumbnail — lets the browser generate poster natively. */
function makeSingleAttachment(index: number): CometChatVideoBubbleAttachment {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { thumbnail: _thumb, ...rest } = makeAttachment(index);
  return rest;
}

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
  }> = {}
): CometChat.BaseMessage {
  const count = overrides.attachmentCount ?? 1;
  const attachments = makeAttachments(count).map(att => ({
    url: att.url,
    thumbnail: att.thumbnail,
    metadata: {
      width: att.width,
      height: att.height,
      size: att.size,
      mimeType: att.mimeType,
    },
  }));
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
  } as unknown as CometChat.BaseMessage;
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
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockVideoMsg({ readAt: Math.floor(Date.now() / 1000) })}
        alignment="right"
        group={group}
        contentView={
          <CometChatVideoBubble
            attachments={[makeSingleAttachment(1)]}
            variant="outgoing"
            senderName="John Doe"
          />
        }
      />
      <CometChatMessageBubble
        message={mockVideoMsg({ senderName: 'Jane Smith', senderUid: 'user-jane' })}
        alignment="left"
        group={group}
        contentView={
          <CometChatVideoBubble
            attachments={[makeSingleAttachment(2)]}
            variant="incoming"
            senderName="Jane Smith"
          />
        }
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
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockVideoMsg({
          caption: 'Check out this clip from the conference! 🎬',
          readAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        contentView={
          <CometChatVideoBubble
            attachments={[makeSingleAttachment(1)]}
            variant="outgoing"
            caption="Check out this clip from the conference! 🎬"
            senderName="John Doe"
          />
        }
      />
      <CometChatMessageBubble
        message={mockVideoMsg({
          caption: 'Thanks for sharing! Looks amazing 🔥',
          senderName: 'Jane Smith',
          senderUid: 'user-jane',
        })}
        alignment="left"
        group={group}
        contentView={
          <CometChatVideoBubble
            attachments={[makeSingleAttachment(2)]}
            variant="incoming"
            caption="Thanks for sharing! Looks amazing 🔥"
            senderName="Jane Smith"
          />
        }
      />
    </ChatContainer>
  );
};
_WithCaption.storyName = '[Internal] With Caption';
_WithCaption.tags = ['!dev', '!autodocs'];

/** [Internal] Two videos — side-by-side grid with thumbnails. */
export const _Grid2Videos = () => (
  <ChatContainer>
    <CometChatMessageBubble
      message={mockVideoMsg({ attachmentCount: 2, readAt: Math.floor(Date.now() / 1000) })}
      alignment="right"
      contentView={
        <CometChatVideoBubble
          attachments={makeAttachments(2)}
          variant="outgoing"
          senderName="John Doe"
        />
      }
    />
  </ChatContainer>
);
_Grid2Videos.storyName = '[Internal] Grid — 2 Videos';
_Grid2Videos.tags = ['!dev', '!autodocs'];

/** [Internal] Three videos — 1 top + 2 bottom. */
export const _Grid3Videos = () => (
  <ChatContainer>
    <CometChatMessageBubble
      message={mockVideoMsg({ attachmentCount: 3, senderName: 'Jane', senderUid: 'user-jane' })}
      alignment="left"
      group={mockGroup()}
      contentView={
        <CometChatVideoBubble
          attachments={makeAttachments(3)}
          variant="incoming"
          senderName="Jane"
        />
      }
    />
  </ChatContainer>
);
_Grid3Videos.storyName = '[Internal] Grid — 3 Videos (1+2)';
_Grid3Videos.tags = ['!dev', '!autodocs'];

/** [Internal] Four videos — 2×2 grid. */
export const _Grid4Videos = () => (
  <ChatContainer>
    <CometChatMessageBubble
      message={mockVideoMsg({ attachmentCount: 4, readAt: Math.floor(Date.now() / 1000) })}
      alignment="right"
      contentView={
        <CometChatVideoBubble
          attachments={makeAttachments(4)}
          variant="outgoing"
          senderName="John Doe"
        />
      }
    />
  </ChatContainer>
);
_Grid4Videos.storyName = '[Internal] Grid — 4 Videos (2×2)';
_Grid4Videos.tags = ['!dev', '!autodocs'];

/** [Internal] Six videos — overflow with +2 indicator. */
export const _GridOverflow = () => (
  <ChatContainer>
    <CometChatMessageBubble
      message={mockVideoMsg({ attachmentCount: 6, senderName: 'Jane', senderUid: 'user-jane' })}
      alignment="left"
      group={mockGroup()}
      contentView={
        <CometChatVideoBubble
          attachments={makeAttachments(6)}
          variant="incoming"
          senderName="Jane"
        />
      }
    />
  </ChatContainer>
);
_GridOverflow.storyName = '[Internal] Grid — 6 Videos (Overflow +2)';
_GridOverflow.tags = ['!dev', '!autodocs'];

/** [Internal] Grid with caption. */
export const _GridWithCaption = () => (
  <ChatContainer>
    <CometChatMessageBubble
      message={mockVideoMsg({
        attachmentCount: 3,
        caption: 'Highlights from the team offsite! 🎉',
        readAt: Math.floor(Date.now() / 1000),
      })}
      alignment="right"
      contentView={
        <CometChatVideoBubble
          attachments={makeAttachments(3)}
          variant="outgoing"
          caption="Highlights from the team offsite! 🎉"
          senderName="John Doe"
        />
      }
    />
  </ChatContainer>
);
_GridWithCaption.storyName = '[Internal] Grid — 3 Videos with Caption';
_GridWithCaption.tags = ['!dev', '!autodocs'];
