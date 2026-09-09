/* eslint-disable @typescript-eslint/no-deprecated -- this file intentionally exercises the deprecated legacy bubble it covers */
import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatImageBubble } from './CometChatImageBubble';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import type { CometChatImageBubbleAttachment } from './CometChatImageBubble.types';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/Image',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders image message bubbles with multi-image grid, captions, and fullscreen viewer. Takes the SDK message and extracts attachments + caption itself.',
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

function makeAttachment(
  index: number,
  overrides?: Partial<CometChatImageBubbleAttachment>
): CometChatImageBubbleAttachment {
  return {
    url: `https://picsum.photos/seed/img${String(index)}/1920/1080`,
    size: 204800,
    ...overrides,
  };
}

function makeAttachments(count: number): CometChatImageBubbleAttachment[] {
  return Array.from({ length: count }, (_, i) => makeAttachment(i + 1));
}

/**
 * Build a mock image MediaMessage. The bubble self-extracts attachments + caption
 * from this, so stories pass the message directly (no attachments/variant props).
 */
function mockImageMsg(
  overrides: Partial<{
    attachments: CometChatImageBubbleAttachment[];
    caption: string;
    senderName: string;
    senderUid: string;
    sentAt: number;
    readAt: number;
    deliveredAt: number;
    replyCount: number;
  }> = {}
): CometChat.MediaMessage {
  const atts = (overrides.attachments ?? makeAttachments(1)).map(att => ({
    getUrl: () => att.url,
    getSize: () => att.size,
  }));
  const now = Math.floor(Date.now() / 1000);

  return {
    getId: () => Math.floor(Math.random() * 10000),
    getType: () => 'image',
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
    getAttachments: () => atts,
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

/** Default — outgoing + incoming single images in a group conversation. */
export const Default = () => {
  const group = mockGroup();
  const outgoing = mockImageMsg({ readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockImageMsg({
    attachments: [makeAttachment(2)],
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatImageBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatImageBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};

/** Long caption that wraps — images should expand to match the wider bubble. */
export const LongCaption = () => {
  const longCaption =
    'This is a really long caption that should demonstrate how the image bubble handles text wrapping. When the caption text is longer than the image width, the bubble should expand to accommodate the text, and the image should grow along with it so there is no awkward mismatch between the image width and the caption width below it. The image and caption should feel like one cohesive unit.';
  const group = mockGroup();
  const outgoing = mockImageMsg({ caption: longCaption, readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockImageMsg({
    caption: longCaption,
    senderName: 'Jane',
    senderUid: 'user-jane',
  });

  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatImageBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatImageBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
LongCaption.tags = ['!dev', '!autodocs'];

/** Tiny image (favicon-sized) — bubble should not collapse. */
export const TinyImage = () => {
  const group = mockGroup();
  const tiny: CometChatImageBubbleAttachment = {
    url: 'https://www.google.com/favicon.ico',
    size: 1024,
  };
  const outgoing = mockImageMsg({ attachments: [tiny], readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockImageMsg({
    attachments: [tiny],
    senderName: 'Jane',
    senderUid: 'user-jane',
  });

  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatImageBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatImageBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};

/** Very large image — should be capped at max size. */
export const LargeImage = () => {
  const group = mockGroup();
  const huge: CometChatImageBubbleAttachment = {
    url: 'https://picsum.photos/seed/huge/3000/2000',
    size: 5242880,
  };
  const outgoing = mockImageMsg({ attachments: [huge], readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockImageMsg({
    attachments: [huge],
    senderName: 'Jane',
    senderUid: 'user-jane',
  });

  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatImageBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatImageBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};

/** Mixed sizes — different image dimensions in the same conversation. */
export const MixedSizes = () => {
  const pano = mockImageMsg({ attachments: [{ url: 'https://picsum.photos/seed/pano/1200/400' }] });
  const tall = mockImageMsg({
    attachments: [{ url: 'https://picsum.photos/seed/tall/400/1200' }],
    senderName: 'Jane',
    senderUid: 'user-jane',
  });
  const square = mockImageMsg({
    attachments: [{ url: 'https://picsum.photos/seed/square/600/600' }],
  });
  const tiny = mockImageMsg({
    attachments: [{ url: 'https://picsum.photos/seed/tiny/50/50' }],
    senderName: 'Jane',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      {/* Wide panoramic */}
      <CometChatMessageBubble
        message={pano}
        alignment="right"
        contentView={<CometChatImageBubble message={pano} alignment="right" />}
      />
      {/* Tall portrait */}
      <CometChatMessageBubble
        message={tall}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatImageBubble message={tall} alignment="left" />}
      />
      {/* Square */}
      <CometChatMessageBubble
        message={square}
        alignment="right"
        contentView={<CometChatImageBubble message={square} alignment="right" />}
      />
      {/* Tiny */}
      <CometChatMessageBubble
        message={tiny}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatImageBubble message={tiny} alignment="left" />}
      />
    </ChatContainer>
  );
};
// ============================================
// Internal testing stories
// ============================================

/** [Internal] Image with caption — outgoing + incoming. */
export const _WithCaption = () => {
  const group = mockGroup();
  const outgoing = mockImageMsg({
    caption: 'Beautiful sunset at the beach! 🌅',
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockImageMsg({
    attachments: [makeAttachment(2)],
    caption: 'Gorgeous view! Which beach was this?',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatImageBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatImageBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_WithCaption.storyName = '[Internal] With Caption';
_WithCaption.tags = ['!dev', '!autodocs'];

/** [Internal] Two images — side-by-side grid. */
export const _Grid2Images = () => {
  const msg = mockImageMsg({
    attachments: makeAttachments(2),
    readAt: Math.floor(Date.now() / 1000),
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatImageBubble message={msg} alignment="right" />}
      />
    </ChatContainer>
  );
};
_Grid2Images.storyName = '[Internal] Grid — 2 Images';
_Grid2Images.tags = ['!dev', '!autodocs'];

/** [Internal] Three images — 1 top full-width + 2 bottom half-width. */
export const _Grid3Images = () => {
  const msg = mockImageMsg({
    attachments: makeAttachments(3),
    senderName: 'Jane',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatImageBubble message={msg} alignment="left" />}
      />
    </ChatContainer>
  );
};
_Grid3Images.storyName = '[Internal] Grid — 3 Images (1+2)';
_Grid3Images.tags = ['!dev', '!autodocs'];

/** [Internal] Four images — 2×2 grid. */
export const _Grid4Images = () => {
  const msg = mockImageMsg({
    attachments: makeAttachments(4),
    readAt: Math.floor(Date.now() / 1000),
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatImageBubble message={msg} alignment="right" />}
      />
    </ChatContainer>
  );
};
_Grid4Images.storyName = '[Internal] Grid — 4 Images (2×2)';
_Grid4Images.tags = ['!dev', '!autodocs'];

/** [Internal] Six images — overflow with +2 indicator. */
export const _GridOverflow = () => {
  const msg = mockImageMsg({
    attachments: makeAttachments(6),
    senderName: 'Jane',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatImageBubble message={msg} alignment="left" />}
      />
    </ChatContainer>
  );
};
_GridOverflow.storyName = '[Internal] Grid — 6 Images (Overflow +2)';
_GridOverflow.tags = ['!dev', '!autodocs'];

/** [Internal] Ten images — overflow with +6 indicator. */
export const _GridLargeOverflow = () => {
  const msg = mockImageMsg({
    attachments: makeAttachments(10),
    readAt: Math.floor(Date.now() / 1000),
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatImageBubble message={msg} alignment="right" />}
      />
    </ChatContainer>
  );
};
_GridLargeOverflow.storyName = '[Internal] Grid — 10 Images (Overflow +6)';
_GridLargeOverflow.tags = ['!dev', '!autodocs'];

/** [Internal] Multi-image with caption. */
export const _GridWithCaption = () => {
  const msg = mockImageMsg({
    attachments: makeAttachments(3),
    caption: 'Photos from the team offsite! 🎉',
    readAt: Math.floor(Date.now() / 1000),
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatImageBubble message={msg} alignment="right" />}
      />
    </ChatContainer>
  );
};
_GridWithCaption.storyName = '[Internal] Grid — 3 Images with Caption';
_GridWithCaption.tags = ['!dev', '!autodocs'];

/** [Internal] Long caption with multi-image grid. */
export const _GridLongCaption = () => {
  const longCaption =
    'These are all the photos from our trip to the mountains last weekend. We had an amazing time hiking, camping, and exploring the trails. The weather was perfect and the views were absolutely breathtaking. I highly recommend this trail to anyone who loves nature!';
  const msg = mockImageMsg({
    attachments: makeAttachments(3),
    caption: longCaption,
    readAt: Math.floor(Date.now() / 1000),
  });

  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatImageBubble message={msg} alignment="right" />}
      />
    </ChatContainer>
  );
};
_GridLongCaption.storyName = '[Internal] Grid — 3 Images with Long Caption';
_GridLongCaption.tags = ['!dev', '!autodocs'];

/** [Internal] All grid layouts side by side for comparison. */
export const _AllGridLayouts = () => {
  const counts = [1, 2, 3, 4, 7];
  const messages = counts.map(count =>
    mockImageMsg({ attachments: makeAttachments(count), readAt: Math.floor(Date.now() / 1000) })
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {messages.map((msg, i) => (
        <ChatContainer key={counts[i]}>
          <CometChatMessageBubble
            message={msg}
            alignment="right"
            contentView={<CometChatImageBubble message={msg} alignment="right" />}
          />
        </ChatContainer>
      ))}
    </div>
  );
};
_AllGridLayouts.storyName = '[Internal] All Grid Layouts Comparison';
_AllGridLayouts.tags = ['!dev', '!autodocs'];
