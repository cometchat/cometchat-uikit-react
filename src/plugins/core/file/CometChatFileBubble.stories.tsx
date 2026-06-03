import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatFileBubble } from './CometChatFileBubble';
import { CometChatMessageBubble } from '../../../components/CometChatMessageBubble';
import type { CometChatFileBubbleAttachment } from './CometChatFileBubble.types';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/File',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders file message bubbles with file type icon, name, size, and download button.',
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

const SAMPLE_FILES: CometChatFileBubbleAttachment[] = [
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

function mockFileMsg(
  overrides: Partial<{
    attachmentCount: number;
    caption: string;
    senderName: string;
    senderUid: string;
    readAt: number;
  }> = {}
): CometChat.BaseMessage {
  const count = overrides.attachmentCount ?? 1;
  const attachments = SAMPLE_FILES.slice(0, count);
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

/** Default — outgoing + incoming file in a group conversation. */
export const Default = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockFileMsg({ readAt: Math.floor(Date.now() / 1000) })}
        alignment="right"
        group={group}
        contentView={
          <CometChatFileBubble
            attachments={[SAMPLE_FILES[0]!]}
            variant="outgoing"
            senderName="John Doe"
          />
        }
      />
      <CometChatMessageBubble
        message={mockFileMsg({ senderName: 'Jane Smith', senderUid: 'user-jane' })}
        alignment="left"
        group={group}
        contentView={
          <CometChatFileBubble
            attachments={[SAMPLE_FILES[1]!]}
            variant="incoming"
            senderName="Jane Smith"
          />
        }
      />
    </ChatContainer>
  );
};

/** Different file types. */
export const FileTypes = () => (
  <ChatContainer>
    {SAMPLE_FILES.map((file, i) => {
      const isOutgoing = i % 2 === 0;
      const groupProps = isOutgoing ? {} : { group: mockGroup() };
      return (
        <CometChatMessageBubble
          key={file.name}
          message={mockFileMsg({ readAt: Math.floor(Date.now() / 1000) })}
          alignment={isOutgoing ? 'right' : 'left'}
          {...groupProps}
          contentView={
            <CometChatFileBubble
              attachments={[file]}
              variant={isOutgoing ? 'outgoing' : 'incoming'}
              senderName={isOutgoing ? 'John' : 'Jane'}
            />
          }
        />
      );
    })}
  </ChatContainer>
);
// ============================================
// Internal testing stories
// ============================================

/** [Internal] File with caption — outgoing + incoming. */
export const _WithCaption = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockFileMsg({
          caption: 'Here is the project proposal for review 📄',
          readAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        contentView={
          <CometChatFileBubble
            attachments={[SAMPLE_FILES[0]!]}
            variant="outgoing"
            caption="Here is the project proposal for review 📄"
            senderName="John Doe"
          />
        }
      />
      <CometChatMessageBubble
        message={mockFileMsg({
          caption: 'Thanks! I added my comments in section 3.',
          senderName: 'Jane Smith',
          senderUid: 'user-jane',
        })}
        alignment="left"
        group={group}
        contentView={
          <CometChatFileBubble
            attachments={[SAMPLE_FILES[1]!]}
            variant="incoming"
            caption="Thanks! I added my comments in section 3."
            senderName="Jane Smith"
          />
        }
      />
    </ChatContainer>
  );
};
_WithCaption.storyName = '[Internal] With Caption';
_WithCaption.tags = ['!dev', '!autodocs'];

/** [Internal] Multiple files with expand/collapse. */
export const _MultipleFiles = () => (
  <ChatContainer>
    <CometChatMessageBubble
      message={mockFileMsg({ attachmentCount: 4, readAt: Math.floor(Date.now() / 1000) })}
      alignment="right"
      contentView={
        <CometChatFileBubble
          attachments={SAMPLE_FILES.slice(0, 4)}
          variant="outgoing"
          senderName="John Doe"
        />
      }
    />
  </ChatContainer>
);
_MultipleFiles.storyName = '[Internal] Multiple Files (4)';
_MultipleFiles.tags = ['!dev', '!autodocs'];

/** [Internal] Multiple files with caption. */
export const _MultipleFilesWithCaption = () => (
  <ChatContainer>
    <CometChatMessageBubble
      message={mockFileMsg({
        attachmentCount: 3,
        caption: "All the documents from today's meeting",
        readAt: Math.floor(Date.now() / 1000),
      })}
      alignment="right"
      contentView={
        <CometChatFileBubble
          attachments={SAMPLE_FILES.slice(0, 3)}
          variant="outgoing"
          caption="All the documents from today's meeting"
          senderName="John Doe"
        />
      }
    />
  </ChatContainer>
);
_MultipleFilesWithCaption.storyName = '[Internal] Multiple Files with Caption';
_MultipleFilesWithCaption.tags = ['!dev', '!autodocs'];

/** [Internal] Many files (6) with expand/collapse. */
export const _ManyFiles = () => (
  <ChatContainer>
    <CometChatMessageBubble
      message={mockFileMsg({ attachmentCount: 6, senderName: 'Jane', senderUid: 'user-jane' })}
      alignment="left"
      group={mockGroup()}
      contentView={
        <CometChatFileBubble attachments={SAMPLE_FILES} variant="incoming" senderName="Jane" />
      }
    />
  </ChatContainer>
);
_ManyFiles.storyName = '[Internal] Many Files (6)';
_ManyFiles.tags = ['!dev', '!autodocs'];
