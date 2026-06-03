import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatTextBubble } from './CometChatTextBubble';
import { CometChatMessageBubble } from '../../../components/CometChatMessageBubble';
import { CometChatMentionsFormatter } from '../../../formatters/CometChatMentionsFormatter';
import { CometChatUrlFormatter } from '../../../formatters/CometChatUrlFormatter';
import type { CometChatTextFormatter } from '../../../formatters/CometChatTextFormatter';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble/Text',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Renders a text message bubble with markdown formatting, mentions, and URL detection.',
      },
    },
  },
};
export default meta;

// --- Helpers ---

function createFormatters(alignment: 'left' | 'right'): CometChatTextFormatter[] {
  const mentions = new CometChatMentionsFormatter();
  mentions.setMessageBubbleAlignment(alignment);
  return [mentions, new CometChatUrlFormatter()];
}

function mockMsg(
  overrides: Partial<{
    text: string;
    senderName: string;
    senderUid: string;
    sentAt: number;
    readAt: number;
    deliveredAt: number;
    editedAt: number;
    replyCount: number;
    metadata: Record<string, unknown>;
  }> = {}
): CometChat.BaseMessage {
  const now = Math.floor(Date.now() / 1000);
  return {
    getId: () => Math.floor(Math.random() * 10000),
    getType: () => 'text',
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
    getEditedAt: () => overrides.editedAt ?? 0,
    getDeletedAt: () => 0,
    getReplyCount: () => overrides.replyCount ?? 0,
    getMuid: () => `muid-${String(Math.random())}`,
    getText: () => overrides.text ?? 'Hello!',
    getMentionedUsers: () => [],
    getMetadata: () => overrides.metadata ?? {},
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
        width: 560,
        padding: 16,
        background: 'var(--cometchat-background-color-01, #fff)',
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

/** Default — outgoing + incoming text messages. */
export const Default = () => {
  const group = mockGroup();
  const outMsg = mockMsg({
    text: 'Hey there! How is the project going? 🎨',
    readAt: Math.floor(Date.now() / 1000),
  });
  const inMsg = mockMsg({
    text: "Looks great! I'll review the PR this afternoon. 👍",
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
  });

  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outMsg}
        alignment="right"
        group={group}
        contentView={
          <CometChatTextBubble
            text="Hey there! How is the project going? 🎨"
            isSentByMe={true}
            textFormatters={createFormatters('right')}
          />
        }
      />
      <CometChatMessageBubble
        message={inMsg}
        alignment="left"
        group={group}
        contentView={
          <CometChatTextBubble
            text="Looks great! I'll review the PR this afternoon. 👍"
            isSentByMe={false}
            textFormatters={createFormatters('left')}
          />
        }
      />
    </ChatContainer>
  );
};

/** Long text with truncation + read more — incoming + outgoing. */
export const LongText = () => {
  const longText =
    'This is a very long message that should demonstrate the truncation behavior of the text bubble component. When the text content exceeds approximately four lines of text (about 80 pixels in height), the component should truncate the content and show a "Read more" button. Clicking the button expands the text to show the full content, and a "Show less" button appears to collapse it back.';
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMsg({ text: longText, readAt: Math.floor(Date.now() / 1000) })}
        alignment="right"
        group={group}
        contentView={
          <CometChatTextBubble
            text={longText}
            isSentByMe={true}
            textFormatters={createFormatters('right')}
          />
        }
      />
      <CometChatMessageBubble
        message={mockMsg({ text: longText, senderName: 'Jane', senderUid: 'user-jane' })}
        alignment="left"
        group={group}
        contentView={
          <CometChatTextBubble
            text={longText}
            isSentByMe={false}
            textFormatters={createFormatters('left')}
          />
        }
      />
    </ChatContainer>
  );
};

/** Single emoji — large display, incoming + outgoing. */
export const SingleEmoji = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMsg({ text: '👍', readAt: Math.floor(Date.now() / 1000) })}
        alignment="right"
        group={group}
        contentView={<CometChatTextBubble text="👍" isSentByMe={true} />}
      />
      <CometChatMessageBubble
        message={mockMsg({ text: '❤️', senderName: 'Jane', senderUid: 'user-jane' })}
        alignment="left"
        group={group}
        contentView={<CometChatTextBubble text="❤️" isSentByMe={false} />}
      />
    </ChatContainer>
  );
};

/** With mentions — incoming + outgoing. */
export const WithMentions = () => {
  const group = mockGroup();
  const inFormatter = new CometChatMentionsFormatter();
  inFormatter.setMessageBubbleAlignment('left');
  const outFormatter = new CometChatMentionsFormatter();
  outFormatter.setMessageBubbleAlignment('right');

  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMsg({
          text: 'Thanks <@uid:user-jane> — will address this today.',
          readAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        contentView={
          <CometChatTextBubble
            text="Thanks <@uid:user-jane> — will address this today."
            isSentByMe={true}
            textFormatters={[outFormatter, new CometChatUrlFormatter()]}
          />
        }
      />
      <CometChatMessageBubble
        message={mockMsg({
          text: 'Hey <@uid:user-john>, check this out! cc <@all:everyone>',
          senderName: 'Jane',
          senderUid: 'user-jane',
        })}
        alignment="left"
        group={group}
        contentView={
          <CometChatTextBubble
            text="Hey <@uid:user-john>, check this out! cc <@all:everyone>"
            isSentByMe={false}
            textFormatters={[inFormatter, new CometChatUrlFormatter()]}
          />
        }
      />
    </ChatContainer>
  );
};

/** With URLs — incoming + outgoing. */
export const WithUrls = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMsg({
          text: 'Check out https://www.cometchat.com for more info!',
          readAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        contentView={
          <CometChatTextBubble
            text="Check out https://www.cometchat.com for more info!"
            isSentByMe={true}
            textFormatters={createFormatters('right')}
          />
        }
      />
      <CometChatMessageBubble
        message={mockMsg({
          text: 'Thanks! Also this one: https://www.cometchat.com/blog',
          senderName: 'Jane',
          senderUid: 'user-jane',
        })}
        alignment="left"
        group={group}
        contentView={
          <CometChatTextBubble
            text="Thanks! Also this one: https://www.cometchat.com/blog"
            isSentByMe={false}
            textFormatters={createFormatters('left')}
          />
        }
      />
    </ChatContainer>
  );
};

/** With link preview — incoming + outgoing. */
export const WithLinkPreview = () => {
  const group = mockGroup();
  const metadata = {
    '@injected': {
      extensions: {
        'link-preview': {
          links: [
            {
              url: 'https://www.cometchat.com/blog',
              title: 'CometChat Blog — Build Better Chat',
              description: 'Learn how to build real-time chat features.',
              image: 'https://picsum.photos/400/200',
            },
          ],
        },
      },
    },
  };
  const outMsg = mockMsg({
    text: 'Sharing this: https://www.cometchat.com/blog',
    readAt: Math.floor(Date.now() / 1000),
    metadata,
  });
  const inMsg = mockMsg({
    text: 'Check out this article: https://www.cometchat.com/blog',
    senderName: 'Jane',
    senderUid: 'user-jane',
    metadata,
  });

  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outMsg}
        alignment="right"
        group={group}
        contentView={
          <CometChatTextBubble
            text="Sharing this: https://www.cometchat.com/blog"
            isSentByMe={true}
            textFormatters={createFormatters('right')}
            message={outMsg as never}
          />
        }
      />
      <CometChatMessageBubble
        message={inMsg}
        alignment="left"
        group={group}
        contentView={
          <CometChatTextBubble
            text="Check out this article: https://www.cometchat.com/blog"
            isSentByMe={false}
            textFormatters={createFormatters('left')}
            message={inMsg as never}
          />
        }
      />
    </ChatContainer>
  );
};

/** With translation — incoming + outgoing. */
export const WithTranslation = () => {
  const group = mockGroup();
  const inMetadata = { translated_message: 'Hello, how are you?' };
  const outMetadata = { translated_message: 'I am doing well, thanks!' };

  const outMsg = mockMsg({
    text: 'Je vais bien, merci !',
    readAt: Math.floor(Date.now() / 1000),
    metadata: outMetadata,
  });
  const inMsg = mockMsg({
    text: 'Bonjour, comment allez-vous?',
    senderName: 'Pierre',
    senderUid: 'user-pierre',
    metadata: inMetadata,
  });

  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outMsg}
        alignment="right"
        group={group}
        contentView={
          <CometChatTextBubble
            text="Je vais bien, merci !"
            isSentByMe={true}
            textFormatters={createFormatters('right')}
            message={outMsg as never}
          />
        }
      />
      <CometChatMessageBubble
        message={inMsg}
        alignment="left"
        group={group}
        contentView={
          <CometChatTextBubble
            text="Bonjour, comment allez-vous?"
            isSentByMe={false}
            textFormatters={createFormatters('left')}
            message={inMsg as never}
          />
        }
      />
    </ChatContainer>
  );
};
