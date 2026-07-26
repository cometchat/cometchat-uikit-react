import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatFilesBubble } from './CometChatFilesBubble';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import type { CometChatFilesBubbleAttachment } from './CometChatFilesBubble.types';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/Files',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders multi-file message bubbles with file-type icons, size labels, and download buttons. ' +
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

const SAMPLE_FILES: CometChatFilesBubbleAttachment[] = [
  {
    name: 'Project-Proposal.pdf',
    url: '#',
    extension: 'pdf',
    mimeType: 'application/pdf',
    size: 2457600,
  },
  {
    name: 'Budget-2026.xlsx',
    url: '#',
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 156000,
  },
  {
    name: 'Presentation-Final.pptx',
    url: '#',
    extension: 'pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 8912000,
  },
  { name: 'meeting-notes.txt', url: '#', extension: 'txt', mimeType: 'text/plain', size: 4200 },
  {
    name: 'source-code.zip',
    url: '#',
    extension: 'zip',
    mimeType: 'application/zip',
    size: 15728640,
  },
  { name: 'design-mockup.jpg', url: '#', extension: 'jpg', mimeType: 'image/jpeg', size: 3145728 },
];

function attachmentGetters(att: CometChatFilesBubbleAttachment) {
  return {
    getUrl: () => att.url,
    getName: () => att.name,
    getSize: () => att.size,
    getMimeType: () => att.mimeType,
    getExtension: () => att.extension,
  };
}

function mockFileMsg(
  overrides: Partial<{
    attachmentCount: number;
    files: CometChatFilesBubbleAttachment[];
    caption: string;
    senderName: string;
    senderUid: string;
    readAt: number;
  }> = {}
): CometChat.MediaMessage {
  const count = overrides.attachmentCount ?? 1;
  const sourceFiles = overrides.files ?? SAMPLE_FILES.slice(0, count);
  const attachments = sourceFiles.map(attachmentGetters);
  const now = Math.floor(Date.now() / 1000);

  return {
    getId: () => Math.floor(Math.random() * 10000),
    getType: () => 'file',
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

/** Default — outgoing + incoming single file. */
export const Default = () => {
  const group = mockGroup();
  const outgoing = mockFileMsg({ readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockFileMsg({ senderName: 'Jane Smith', senderUid: 'user-jane' });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatFilesBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatFilesBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};

/** Different file types — shows icon variety. */
export const FileTypes = () => (
  <ChatContainer>
    {SAMPLE_FILES.map((file, i) => {
      const isOutgoing = i % 2 === 0;
      const msg = mockFileMsg({ files: [file], readAt: Math.floor(Date.now() / 1000) });
      return (
        <CometChatMessageBubble
          key={file.name}
          message={msg}
          alignment={isOutgoing ? 'right' : 'left'}
          {...(!isOutgoing ? { group: mockGroup() } : {})}
          contentView={
            <CometChatFilesBubble message={msg} alignment={isOutgoing ? 'right' : 'left'} />
          }
        />
      );
    })}
  </ChatContainer>
);

/** Two files. */
export const _TwoFiles = () => {
  const msg = mockFileMsg({ attachmentCount: 2, readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockFileMsg({
    attachmentCount: 2,
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatFilesBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatFilesBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_TwoFiles.storyName = '2 Files';
_TwoFiles.tags = ['!autodocs'];

/** Three files — at the collapse threshold. */
export const _ThreeFiles = () => {
  const msg = mockFileMsg({ attachmentCount: 3, senderName: 'Jane', senderUid: 'user-jane' });
  const outgoing = mockFileMsg({ attachmentCount: 3, readAt: Math.floor(Date.now() / 1000) });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        contentView={<CometChatFilesBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={msg}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatFilesBubble message={msg} alignment="left" />}
      />
    </ChatContainer>
  );
};
_ThreeFiles.storyName = '3 Files (Collapse Threshold)';
_ThreeFiles.tags = ['!autodocs'];

/** Five files — expand/collapse with "+2 more". */
export const _FiveFilesExpandCollapse = () => {
  const msg = mockFileMsg({ attachmentCount: 5, readAt: Math.floor(Date.now() / 1000) });
  const incoming = mockFileMsg({
    attachmentCount: 5,
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatFilesBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatFilesBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_FiveFilesExpandCollapse.storyName = '5 Files (Expand/Collapse)';
_FiveFilesExpandCollapse.tags = ['!autodocs'];

/** Six files — all types with expand/collapse. */
export const _SixFiles = () => {
  const msg = mockFileMsg({ attachmentCount: 6, senderName: 'Jane', senderUid: 'user-jane' });
  const outgoing = mockFileMsg({ attachmentCount: 6, readAt: Math.floor(Date.now() / 1000) });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        contentView={<CometChatFilesBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={msg}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatFilesBubble message={msg} alignment="left" />}
      />
    </ChatContainer>
  );
};
_SixFiles.storyName = '6 Files (All Types)';
_SixFiles.tags = ['!autodocs'];

/** With caption. */
export const _WithCaption = () => {
  const group = mockGroup();
  const outgoing = mockFileMsg({
    caption: 'Here are the project documents 📄',
    attachmentCount: 2,
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockFileMsg({
    caption: 'Thanks! I added my comments.',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        group={group}
        contentView={<CometChatFilesBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={group}
        contentView={<CometChatFilesBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_WithCaption.storyName = 'With Caption';
_WithCaption.tags = ['!autodocs'];

/** Multiple files with caption and expand/collapse. */
export const _ManyWithCaption = () => {
  const msg = mockFileMsg({
    attachmentCount: 4,
    caption: "All the documents from today's meeting",
    readAt: Math.floor(Date.now() / 1000),
  });
  const incoming = mockFileMsg({
    attachmentCount: 4,
    caption: 'Perfect, reviewing them now.',
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msg}
        alignment="right"
        contentView={<CometChatFilesBubble message={msg} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        group={mockGroup()}
        contentView={<CometChatFilesBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};
_ManyWithCaption.storyName = '4 Files with Caption';
_ManyWithCaption.tags = ['!autodocs'];
