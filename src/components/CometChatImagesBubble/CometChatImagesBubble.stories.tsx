import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatImagesBubble } from './CometChatImagesBubble';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import type { CometChatImagesBubbleAttachment } from './CometChatImagesBubble.types';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/Images',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders multi-image message bubbles with grid layout, captions, and fullscreen viewer. ' +
          'The bubble self-extracts attachments and caption from the SDK message.',
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

// `.invalid` never resolves (RFC 2606), so the <img> reliably fails to load and
// the tile falls back to the unsupported state.
const BROKEN_IMAGE = 'https://cometchat.invalid/broken-image.jpg';

function makeAttachment(index: number): CometChatImagesBubbleAttachment {
  return {
    url: `https://picsum.photos/seed/imgs${String(index)}/800/600`,
    size: 204800 + index * 50000,
  };
}

function makeAttachments(count: number): CometChatImagesBubbleAttachment[] {
  return Array.from({ length: count }, (_, i) => makeAttachment(i + 1));
}

function mockImageMsg(
  overrides: Partial<{
    attachmentCount: number;
    attachments: CometChatImagesBubbleAttachment[];
    caption: string;
    senderName: string;
    senderUid: string;
    readAt: number;
  }> = {}
): CometChat.MediaMessage {
  const atts = (overrides.attachments ?? makeAttachments(overrides.attachmentCount ?? 1)).map(
    att => ({
      getUrl: () => att.url,
      getSize: () => att.size ?? 0,
    })
  );
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
    getSentAt: () => now,
    getDeliveredAt: () => 0,
    getReadAt: () => overrides.readAt ?? 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
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

/** Default — outgoing + incoming single image. */
export const Default = () => {
  const group = mockGroup();
  const outgoing = mockImageMsg({ readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockImageMsg({ senderName: 'Jane Smith', senderUid: 'user-jane' });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatImagesBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatImagesBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};

/** Two images — side-by-side grid. */
export const _Grid2Images = () => {
  const msg = mockImageMsg({ attachmentCount: 2, readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockImageMsg({
    attachmentCount: 2,
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatImagesBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatImagesBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_Grid2Images.storyName = 'Grid — 2 Images';
_Grid2Images.tags = ['!autodocs'];

/** Three images — 1 top + 2 bottom. */
export const _Grid3Images = () => {
  const msg = mockImageMsg({ attachmentCount: 3, senderName: 'Jane', senderUid: 'user-jane' });
  const outgoing = mockImageMsg({ attachmentCount: 3, readAt: Math.floor(Date.now() / 1000) });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        contentView={<CometChatImagesBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={msg}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatImagesBubble message={msg} alignment="left" />}
      />
    </ChatContainer>
  );
};
_Grid3Images.storyName = 'Grid — 3 Images (1+2)';
_Grid3Images.tags = ['!autodocs'];

/** Four images — 2×2 grid. */
export const _Grid4Images = () => {
  const msg = mockImageMsg({ attachmentCount: 4, readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockImageMsg({
    attachmentCount: 4,
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatImagesBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatImagesBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_Grid4Images.storyName = 'Grid — 4 Images (2×2)';
_Grid4Images.tags = ['!autodocs'];

/** Six images — overflow with +2 indicator. */
export const _GridOverflow = () => {
  const msg = mockImageMsg({ attachmentCount: 6, senderName: 'Jane', senderUid: 'user-jane' });
  const outgoing = mockImageMsg({ attachmentCount: 6, readAt: Math.floor(Date.now() / 1000) });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        contentView={<CometChatImagesBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={msg}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatImagesBubble message={msg} alignment="left" />}
      />
    </ChatContainer>
  );
};
_GridOverflow.storyName = 'Grid — 6 Images (Overflow +2)';
_GridOverflow.tags = ['!autodocs'];

/** Image with caption — outgoing + incoming. */
export const _WithCaption = () => {
  const group = mockGroup();
  const outgoing = mockImageMsg({
    caption: 'Beautiful sunset at the beach! 🌅',
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockImageMsg({
    attachmentCount: 2,
    caption: 'Great photos! Where was this?',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatImagesBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatImagesBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_WithCaption.storyName = 'With Caption';
_WithCaption.tags = ['!autodocs'];

/** Multi-image grid with caption. */
export const _GridWithCaption = () => {
  const msg = mockImageMsg({
    attachmentCount: 3,
    caption: 'Photos from the team offsite! 🎉',
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockImageMsg({
    attachmentCount: 3,
    caption: 'These are amazing — send me the originals!',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatImagesBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatImagesBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_GridWithCaption.storyName = 'Grid — 3 Images with Caption';
_GridWithCaption.tags = ['!autodocs'];

/** Error state — a broken / unsupported image shows the fallback tile (outgoing + incoming). */
export const _ErrorState = () => {
  const group = mockGroup();
  const outgoing = mockImageMsg({
    attachments: [{ url: BROKEN_IMAGE }],
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockImageMsg({
    attachments: [{ url: BROKEN_IMAGE }],
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatImagesBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatImagesBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_ErrorState.storyName = 'Error — Broken / Unsupported Image';
_ErrorState.tags = ['!autodocs'];

/** All grid layouts side by side for comparison. */
export const _AllGridLayouts = () => {
  const counts = [1, 2, 3, 4, 7];
  const messages = counts.map(count =>
    mockImageMsg({ attachmentCount: count, readAt: Math.floor(Date.now() / 1000) })
  );
  const incomingMessages = counts.map(count =>
    mockImageMsg({ attachmentCount: count, senderName: 'Jane Smith', senderUid: 'user-jane' })
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {messages.map((msg, i) => (
        <ChatContainer key={counts[i]}>
          <CometChatMessageBubble
            message={msg}
            alignment="right"
            contentView={<CometChatImagesBubble message={msg} alignment="right" />}
          />
          <CometChatMessageBubble
            message={incomingMessages[i]!}
            alignment="left"
            group={mockGroup()}
            contentView={<CometChatImagesBubble message={incomingMessages[i]!} alignment="left" />}
          />
        </ChatContainer>
      ))}
    </div>
  );
};
_AllGridLayouts.storyName = 'All Grid Layouts Comparison';
_AllGridLayouts.tags = ['!autodocs'];
