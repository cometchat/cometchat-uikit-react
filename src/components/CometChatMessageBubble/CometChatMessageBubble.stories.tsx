/* eslint-disable @typescript-eslint/no-misused-spread */
import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageBubble } from './CometChatMessageBubble';
import { CometChatTextBubble } from '../CometChatTextBubble/CometChatTextBubble';
import { CometChatMentionsFormatter } from '../../formatters/CometChatMentionsFormatter';
import { CometChatUrlFormatter } from '../../formatters/CometChatUrlFormatter';
import type { CometChatTextFormatter } from '../../formatters/CometChatTextFormatter';
import { GlobalConfigProvider } from '../../context/GlobalConfigContext';
import { CometChatModerationView } from '../base/CometChatModerationView';
import { CometChatStickerBubble } from '../CometChatStickerBubble/CometChatStickerBubble';
import { CometChatCollaborativeDocumentBubble } from '../CometChatCollaborativeDocumentBubble';
import { CometChatCollaborativeWhiteboardBubble } from '../CometChatCollaborativeWhiteboardBubble';
import { CometChatImageBubble } from '../CometChatImageBubble/CometChatImageBubble';
import { CometChatPollBubble } from '../CometChatPollBubble/CometChatPollBubble';

const meta: Meta = {
  title: 'Components/Bubbles/Message Bubble',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Renders a single message bubble with alignment, sender info, reactions, receipts, and context menu.',
      },
    },
  },
};
export default meta;

// --- Mock helpers ---

function createFormatters(alignment: 'left' | 'right'): CometChatTextFormatter[] {
  const mentions = new CometChatMentionsFormatter();
  mentions.setMessageBubbleAlignment(alignment);
  return [mentions, new CometChatUrlFormatter()];
}

function mockMessage(overrides: {
  text?: string;
  type?: string;
  category?: string;
  senderName?: string;
  senderAvatar?: string;
  senderUid?: string;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
  editedAt?: number;
  deletedAt?: number;
  replyCount?: number;
}): CometChat.BaseMessage {
  const {
    text = 'Hello!',
    type = 'text',
    category = 'message',
    senderName = 'John Doe',
    senderAvatar = '',
    senderUid = 'user-john',
    sentAt = Math.floor(Date.now() / 1000),
    deliveredAt = 0,
    readAt = 0,
    editedAt = 0,
    deletedAt = 0,
    replyCount = 0,
  } = overrides;

  return {
    getId: () => Math.floor(Math.random() * 10000),
    getType: () => type,
    getCategory: () => category,
    getSender: () => ({
      getUid: () => senderUid,
      getName: () => senderName,
      getAvatar: () => senderAvatar,
      getStatus: () => 'online',
    }),
    getSentAt: () => sentAt,
    getDeliveredAt: () => deliveredAt,
    getReadAt: () => readAt,
    getEditedAt: () => editedAt,
    getDeletedAt: () => deletedAt,
    getReplyCount: () => replyCount,
    getMuid: () => `muid-${String(Math.random())}`,
    getText: () => text,
    getMentionedUsers: () => [],
    getMetadata: () => ({}),
    getReceiverType: () => 'user',
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;
}

function mockGroup(): CometChat.Group {
  return {
    getGuid: () => 'group-design',
    getName: () => 'Design Team',
    getMembersCount: () => 8,
    getType: () => 'public',
  } as unknown as CometChat.Group;
}

/** Container for stories. */
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

// --- Stories ---

/** Default — outgoing + incoming text bubbles in a group conversation. */
export const Default = () => {
  const group = mockGroup();
  const outMsg = mockMessage({
    text: 'Hey there! How is the project going? 🎨',
    sentAt: Math.floor(Date.now() / 1000),
    readAt: Math.floor(Date.now() / 1000),
  });
  const inMsg = mockMessage({
    text: "Looks great! I'll review the PR this afternoon. 👍",
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
    sentAt: Math.floor(Date.now() / 1000) - 60,
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

/** Receipt states — sent, delivered, read, error. */
export const ReceiptStates = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMessage({ text: 'Sent message', sentAt: Math.floor(Date.now() / 1000) })}
        alignment="right"
        group={group}
        contentView={<CometChatTextBubble text="Sent message" isSentByMe={true} />}
      />
      <CometChatMessageBubble
        message={mockMessage({
          text: 'Delivered message',
          sentAt: Math.floor(Date.now() / 1000),
          deliveredAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        contentView={<CometChatTextBubble text="Delivered message" isSentByMe={true} />}
      />
      <CometChatMessageBubble
        message={mockMessage({
          text: 'Read message',
          sentAt: Math.floor(Date.now() / 1000),
          readAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        contentView={<CometChatTextBubble text="Read message" isSentByMe={true} />}
      />
      <CometChatMessageBubble
        message={mockMessage({ text: 'Failed message', sentAt: Math.floor(Date.now() / 1000) })}
        alignment="right"
        group={group}
        showError={true}
        contentView={<CometChatTextBubble text="Failed message" isSentByMe={true} />}
      />
    </ChatContainer>
  );
};

/**
 * Moderation — disapproved messages.
 *
 * When a message is blocked by moderation policies, the bubble wrapper
 * renders a red outline around the body and a `CometChatModerationView`
 * footer explaining why. In the real flow,
 * `CometChatMessageBubbleRenderer` detects the moderation state from the
 * message itself and wires the footer into `bottomView`. These stories
 * drive that presentation directly so you can see all the states.
 */
export const ModerationDisapproved = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMessage({
          text: 'This message was blocked by moderation.',
          sentAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        showError={true}
        quickOptionsCount={2}
        contentView={
          <CometChatTextBubble text="This message was blocked by moderation." isSentByMe={true} />
        }
        bottomView={() => <CometChatModerationView />}
      />
    </ChatContainer>
  );
};

/**
 * Moderation — permission-denied error (e.g. file-type blocked in the group).
 * Same visual treatment as disapproval, but the footer uses a specific
 * localized copy instead of the generic block message.
 */
export const ModerationPermissionDenied = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMessage({
          text: 'report.pdf',
          sentAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        showError={true}
        quickOptionsCount={2}
        contentView={<CometChatTextBubble text="report.pdf" isSentByMe={true} />}
        bottomView={() => <CometChatModerationView message="This file type is not allowed." />}
      />
    </ChatContainer>
  );
};

/**
 * Moderation — `hideModerationView` variant.
 * The bubble still gets the red outline and the reduced options set, but
 * the footer beneath is suppressed. Useful for contexts where the footer
 * would be noisy (e.g. inside an AI agent chat).
 */
export const ModerationHideFooter = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMessage({
          text: 'Outline stays, footer hidden.',
          sentAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        showError={true}
        quickOptionsCount={2}
        contentView={<CometChatTextBubble text="Outline stays, footer hidden." isSentByMe={true} />}
      />
    </ChatContainer>
  );
};

/** Edited message. */
export const EditedMessage = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMessage({
          text: 'This message was edited',
          sentAt: Math.floor(Date.now() / 1000),
          editedAt: Math.floor(Date.now() / 1000),
          readAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        contentView={<CometChatTextBubble text="This message was edited" isSentByMe={true} />}
      />
      <CometChatMessageBubble
        message={mockMessage({
          text: 'This incoming message was also edited',
          senderName: 'Jane Smith',
          senderUid: 'user-jane',
          sentAt: Math.floor(Date.now() / 1000),
          editedAt: Math.floor(Date.now() / 1000),
        })}
        alignment="left"
        group={group}
        contentView={
          <CometChatTextBubble text="This incoming message was also edited" isSentByMe={false} />
        }
      />
    </ChatContainer>
  );
};

/** With thread replies. */
export const WithThreadReplies = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMessage({
          text: 'This message has 3 replies',
          sentAt: Math.floor(Date.now() / 1000),
          readAt: Math.floor(Date.now() / 1000),
          replyCount: 3,
        })}
        alignment="right"
        group={group}
        contentView={<CometChatTextBubble text="This message has 3 replies" isSentByMe={true} />}
      />
      <CometChatMessageBubble
        message={mockMessage({
          text: 'And this one has 1 reply',
          senderName: 'Jane Smith',
          senderUid: 'user-jane',
          sentAt: Math.floor(Date.now() / 1000),
          replyCount: 1,
        })}
        alignment="left"
        group={group}
        contentView={<CometChatTextBubble text="And this one has 1 reply" isSentByMe={false} />}
      />
    </ChatContainer>
  );
};

/** Single emoji — incoming + outgoing. */
export const SingleEmoji = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMessage({
          text: '👍',
          sentAt: Math.floor(Date.now() / 1000),
          readAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        contentView={<CometChatTextBubble text="👍" isSentByMe={true} />}
      />
      <CometChatMessageBubble
        message={mockMessage({
          text: '❤️',
          senderName: 'Jane Smith',
          senderUid: 'user-jane',
          sentAt: Math.floor(Date.now() / 1000),
        })}
        alignment="left"
        group={group}
        contentView={<CometChatTextBubble text="❤️" isSentByMe={false} />}
      />
    </ChatContainer>
  );
};

/** Long text with truncation — incoming + outgoing. */
export const LongText = () => {
  const longText =
    'This is a very long message that should demonstrate the truncation behavior of the text bubble component. When the text content exceeds approximately four lines of text, the component should truncate the content and show a "Read more" button. Clicking the button expands the text to show the full content.';
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMessage({
          text: longText,
          sentAt: Math.floor(Date.now() / 1000),
          readAt: Math.floor(Date.now() / 1000),
        })}
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
        message={mockMessage({
          text: longText,
          senderName: 'Jane Smith',
          senderUid: 'user-jane',
          sentAt: Math.floor(Date.now() / 1000),
        })}
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

/** Disable interaction mode — incoming + outgoing. */
export const DisableInteraction = () => {
  const group = mockGroup();
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMessage({
          text: 'This bubble has interactions disabled',
          sentAt: Math.floor(Date.now() / 1000),
          readAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        group={group}
        disableInteraction={true}
        contentView={
          <CometChatTextBubble text="This bubble has interactions disabled" isSentByMe={true} />
        }
      />
      <CometChatMessageBubble
        message={mockMessage({
          text: 'And so does this one',
          senderName: 'Jane Smith',
          senderUid: 'user-jane',
          sentAt: Math.floor(Date.now() / 1000),
        })}
        alignment="left"
        group={group}
        disableInteraction={true}
        contentView={<CometChatTextBubble text="And so does this one" isSentByMe={false} />}
      />
    </ChatContainer>
  );
};

/** GlobalConfig hideReceipts demo. */
export const GlobalConfigHideReceipts = () => {
  const group = mockGroup();
  return (
    <GlobalConfigProvider config={{ hideReceipts: true }}>
      <ChatContainer>
        <CometChatMessageBubble
          message={mockMessage({
            text: 'Receipts hidden via GlobalConfig',
            sentAt: Math.floor(Date.now() / 1000),
            readAt: Math.floor(Date.now() / 1000),
          })}
          alignment="right"
          group={group}
          contentView={
            <CometChatTextBubble text="Receipts hidden via GlobalConfig" isSentByMe={true} />
          }
        />
        <CometChatMessageBubble
          message={mockMessage({
            text: 'This one overrides GlobalConfig',
            sentAt: Math.floor(Date.now() / 1000),
            readAt: Math.floor(Date.now() / 1000),
          })}
          alignment="right"
          group={group}
          hideReceipts={false}
          contentView={
            <CometChatTextBubble
              text="This one overrides GlobalConfig (receipts visible)"
              isSentByMe={true}
            />
          }
        />
      </ChatContainer>
    </GlobalConfigProvider>
  );
};

// --- Extension Plugin Bubble Stories ---

/** Build a sticker CustomMessage carrying the sticker URL/name; the bubble extracts these itself. */
function createMockStickerMessage(overrides: {
  url?: string;
  name?: string;
  senderName?: string;
  senderUid?: string;
  sentAt?: number;
  readAt?: number;
}) {
  const {
    url = 'https://data-us.cometchat.io/assets/images/avatars/ironman.png',
    name = 'Iron Man',
    senderName = 'John Doe',
    senderUid = 'user-john',
    sentAt = Math.floor(Date.now() / 1000),
    readAt = 0,
  } = overrides;

  return {
    getId: () => Math.floor(Math.random() * 10000),
    getType: () => 'extension_sticker',
    getCategory: () => 'custom',
    getSender: () => ({
      getUid: () => senderUid,
      getName: () => senderName,
      getAvatar: () => '',
      getStatus: () => 'online',
    }),
    getSentAt: () => sentAt,
    getDeliveredAt: () => 0,
    getReadAt: () => readAt,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getMuid: () => `muid-sticker-${String(Math.random())}`,
    getMentionedUsers: () => [],
    getMetadata: () => ({ sticker_url: url }),
    getCustomData: () => ({ sticker_url: url, sticker_name: name }),
    getReceiverType: () => 'user',
    getReactions: () => [],
  } as unknown as CometChat.CustomMessage;
}

/** Sticker message in a chat bubble. */
export const StickerMessage = () => {
  const incomingMessage = createMockStickerMessage({
    senderName: 'Jane Smith',
    senderUid: 'user-jane',
    sentAt: Math.floor(Date.now() / 1000) - 120,
  });
  const outgoingMessage = createMockStickerMessage({
    url: 'https://data-us.cometchat.io/assets/images/avatars/captainamerica.png',
    name: 'Captain America',
    sentAt: Math.floor(Date.now() / 1000),
    readAt: Math.floor(Date.now() / 1000),
  });

  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={incomingMessage as unknown as CometChat.BaseMessage}
        alignment="left"
        hideAvatar
        hideSenderName
        contentView={<CometChatStickerBubble message={incomingMessage} alignment="left" />}
      />
      <CometChatMessageBubble
        message={outgoingMessage as unknown as CometChat.BaseMessage}
        alignment="right"
        hideAvatar
        hideSenderName
        contentView={<CometChatStickerBubble message={outgoingMessage} alignment="right" />}
      />
    </ChatContainer>
  );
};

/** Build a custom message whose metadata holds a collaborative session URL. */
function collabMsg(extensionKey: string, urlKey: string, url: string) {
  return {
    getSender: () => ({ getUid: () => 'user-jane', getName: () => 'Jane Smith' }),
    getMetadata: () => ({ '@injected': { extensions: { [extensionKey]: { [urlKey]: url } } } }),
  } as unknown as Parameters<typeof CometChatCollaborativeDocumentBubble>[0]['message'];
}

const DOC_URL = 'https://document-embed-us.cc-cluster-2.io/p/example';
const WB_URL = 'https://whiteboard-embed-us.cc-cluster-2.io/?whiteboardid=example';

/** Collaborative Document message in a chat bubble. */
export const CollaborativeDocumentMessage = () => {
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMessage({
          type: 'extension_document',
          category: 'custom',
          sentAt: Math.floor(Date.now() / 1000),
          readAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        hideAvatar
        hideSenderName
        contentView={
          <CometChatCollaborativeDocumentBubble
            message={collabMsg('document', 'document_url', DOC_URL)}
            alignment="right"
          />
        }
      />
      <CometChatMessageBubble
        message={mockMessage({
          type: 'extension_document',
          category: 'custom',
          senderName: 'Jane Smith',
          senderUid: 'user-jane',
          sentAt: Math.floor(Date.now() / 1000) - 60,
        })}
        alignment="left"
        hideAvatar
        hideSenderName
        contentView={
          <CometChatCollaborativeDocumentBubble
            message={collabMsg('document', 'document_url', DOC_URL)}
            alignment="left"
          />
        }
      />
    </ChatContainer>
  );
};

/** Collaborative Whiteboard message in a chat bubble. */
export const CollaborativeWhiteboardMessage = () => {
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={mockMessage({
          type: 'extension_whiteboard',
          category: 'custom',
          sentAt: Math.floor(Date.now() / 1000),
          readAt: Math.floor(Date.now() / 1000),
        })}
        alignment="right"
        hideAvatar
        hideSenderName
        contentView={
          <CometChatCollaborativeWhiteboardBubble
            message={collabMsg('whiteboard', 'board_url', WB_URL)}
            alignment="right"
          />
        }
      />
      <CometChatMessageBubble
        message={mockMessage({
          type: 'extension_whiteboard',
          category: 'custom',
          senderName: 'Jane Smith',
          senderUid: 'user-jane',
          sentAt: Math.floor(Date.now() / 1000) - 60,
        })}
        alignment="left"
        hideAvatar
        hideSenderName
        contentView={
          <CometChatCollaborativeWhiteboardBubble
            message={collabMsg('whiteboard', 'board_url', WB_URL)}
            alignment="left"
          />
        }
      />
    </ChatContainer>
  );
};

// --- Link Preview, Message Translation, Thumbnail Generation Stories ---

/** Text message with Link Preview — preview card rendered below the text. */
export const LinkPreviewMessage = () => {
  const msgWithLinkPreview = {
    ...mockMessage({
      text: 'Check out this article: https://www.cometchat.com/blog',
      sentAt: Math.floor(Date.now() / 1000),
      readAt: Math.floor(Date.now() / 1000),
    }),
    getMetadata: () => ({
      '@injected': {
        extensions: {
          'link-preview': {
            links: [
              {
                url: 'https://www.cometchat.com/blog',
                title: 'CometChat Blog — Build Better Chat Experiences',
                description:
                  'Learn how to build real-time chat, voice, and video features into your app with CometChat.',
                image: 'https://www.cometchat.com/blog/og-image.png',
                favicon: 'https://www.cometchat.com/favicon.ico',
              },
            ],
          },
        },
      },
    }),
    getMentionedUsers: () => [],
    getText: () => 'Check out this article: https://www.cometchat.com/blog',
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;

  const msgIncoming = {
    ...mockMessage({
      text: 'Have you seen this? https://github.com/cometchat',
      senderName: 'Jane Smith',
      senderUid: 'user-jane',
      sentAt: Math.floor(Date.now() / 1000) - 60,
    }),
    getMetadata: () => ({
      '@injected': {
        extensions: {
          'link-preview': {
            links: [
              {
                url: 'https://github.com/cometchat',
                title: 'CometChat · GitHub',
                description: 'CometChat has 50+ repositories. Follow their code on GitHub.',
                favicon: 'https://github.githubassets.com/favicons/favicon.svg',
              },
            ],
          },
        },
      },
    }),
    getMentionedUsers: () => [],
    getText: () => 'Have you seen this? https://github.com/cometchat',
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;

  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msgWithLinkPreview}
        alignment="right"
        contentView={
          <CometChatTextBubble
            text="Check out this article: https://www.cometchat.com/blog"
            isSentByMe={true}
            textFormatters={createFormatters('right')}
            message={msgWithLinkPreview as unknown as CometChat.TextMessage}
          />
        }
      />
      <CometChatMessageBubble
        message={msgIncoming}
        alignment="left"
        contentView={
          <CometChatTextBubble
            text="Have you seen this? https://github.com/cometchat"
            isSentByMe={false}
            textFormatters={createFormatters('left')}
            message={msgIncoming as unknown as CometChat.TextMessage}
          />
        }
      />
    </ChatContainer>
  );
};

/** Text message with Translation — original text + translated text below separator. */
export const TranslatedMessage = () => {
  const msgTranslated = {
    ...mockMessage({
      text: 'Bonjour, comment allez-vous?',
      senderName: 'Pierre',
      senderUid: 'user-pierre',
      sentAt: Math.floor(Date.now() / 1000) - 120,
    }),
    getMetadata: () => ({
      translated_message: 'Hello, how are you?',
    }),
    getMentionedUsers: () => [],
    getText: () => 'Bonjour, comment allez-vous?',
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;

  const msgTranslatedOutgoing = {
    ...mockMessage({
      text: 'Hola, ¿cómo estás?',
      sentAt: Math.floor(Date.now() / 1000),
      readAt: Math.floor(Date.now() / 1000),
    }),
    getMetadata: () => ({
      translated_message: 'Hello, how are you?',
    }),
    getMentionedUsers: () => [],
    getText: () => 'Hola, ¿cómo estás?',
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;

  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={msgTranslated}
        alignment="left"
        contentView={
          <CometChatTextBubble
            text="Bonjour, comment allez-vous?"
            isSentByMe={false}
            textFormatters={createFormatters('left')}
            message={msgTranslated as unknown as CometChat.TextMessage}
          />
        }
      />
      <CometChatMessageBubble
        message={msgTranslatedOutgoing}
        alignment="right"
        contentView={
          <CometChatTextBubble
            text="Hola, ¿cómo estás?"
            isSentByMe={true}
            textFormatters={createFormatters('right')}
            message={msgTranslatedOutgoing as unknown as CometChat.TextMessage}
          />
        }
      />
    </ChatContainer>
  );
};

/** Build a mock image message with a single attachment (the bubble self-extracts it). */
function mockImageMessage(
  url: string,
  overrides: Parameters<typeof mockMessage>[0] = {}
): CometChat.MediaMessage {
  const base = mockMessage({ type: 'image', ...overrides });
  const attachment = { getUrl: () => url, getSize: () => 0 };
  return {
    ...(base as unknown as Record<string, unknown>),
    getCaption: () => '',
    getData: () => ({}),
    getAttachments: () => [attachment],
  } as unknown as CometChat.MediaMessage;
}

/** Image message with Thumbnail Generation — shows thumbnail as initial src. */
export const ThumbnailGenerationMessage = () => {
  const outgoing = mockImageMessage(
    'https://data-us.cometchat.io/assets/images/avatars/ironman.png',
    { sentAt: Math.floor(Date.now() / 1000), readAt: Math.floor(Date.now() / 1000) }
  );
  const incoming = mockImageMessage(
    'https://data-us.cometchat.io/assets/images/avatars/captainamerica.png',
    {
      senderName: 'Jane Smith',
      senderUid: 'user-jane',
      sentAt: Math.floor(Date.now() / 1000) - 60,
    }
  );
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={outgoing}
        alignment="right"
        hideAvatar
        hideSenderName
        contentView={<CometChatImageBubble message={outgoing} alignment="right" />}
      />
      <CometChatMessageBubble
        message={incoming}
        alignment="left"
        hideAvatar
        hideSenderName
        contentView={<CometChatImageBubble message={incoming} alignment="left" />}
      />
    </ChatContainer>
  );
};

// --- Poll Bubble Story ---

function createMockPollMessage(
  overrides: {
    question?: string;
    options?: Record<string, string>;
    results?: Record<string, unknown>;
    total?: number;
    senderName?: string;
    senderUid?: string;
    sentAt?: number;
    readAt?: number;
  } = {}
) {
  const question = overrides.question ?? 'What should we build next?';
  const options = overrides.options ?? { '1': 'Dark mode', '2': 'Notifications', '3': 'Search' };
  const total = overrides.total ?? 8;
  const results = overrides.results ?? {
    '1': {
      count: 5,
      voters: {
        'user-1': { name: 'Alice' },
        'user-2': { name: 'Bob' },
        'user-3': { name: 'Charlie' },
      },
    },
    '2': { count: 2, voters: { 'user-4': { name: 'Diana' }, 'user-5': { name: 'Eve' } } },
    '3': { count: 1, voters: { 'user-6': { name: 'Frank' } } },
  };

  return {
    getId: () => 201,
    getType: () => 'extension_poll',
    getCategory: () => 'custom',
    getSender: () => ({
      getUid: () => overrides.senderUid ?? 'user-2',
      getName: () => overrides.senderName ?? 'Bob',
      getAvatar: () => '',
      getStatus: () => 'online',
    }),
    getSentAt: () => overrides.sentAt ?? Math.floor(Date.now() / 1000),
    getDeliveredAt: () => 0,
    getReadAt: () => overrides.readAt ?? 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getMuid: () => `muid-poll-${String(Math.random())}`,
    getText: () => question,
    getMentionedUsers: () => [],
    getMetadata: () => ({
      '@injected': {
        extensions: {
          polls: { id: 'poll-123', question, options, results: { total, options: results } },
        },
      },
    }),
    getCustomData: () => ({ question }),
    getReceiverType: () => 'user',
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;
}

/** Poll message in a chat bubble. */
export const PollMessage = () => {
  return (
    <ChatContainer>
      <CometChatMessageBubble
        message={
          createMockPollMessage({
            sentAt: Math.floor(Date.now() / 1000),
            readAt: Math.floor(Date.now() / 1000),
          }) as unknown as CometChat.BaseMessage
        }
        alignment="right"
        hideAvatar
        hideSenderName
        contentView={
          <CometChatPollBubble
            message={
              createMockPollMessage({
                sentAt: Math.floor(Date.now() / 1000),
                readAt: Math.floor(Date.now() / 1000),
              }) as unknown as CometChat.CustomMessage
            }
            alignment="right"
          />
        }
      />
      <CometChatMessageBubble
        message={
          createMockPollMessage({
            senderName: 'Jane Smith',
            senderUid: 'user-jane',
            sentAt: Math.floor(Date.now() / 1000) - 60,
          }) as unknown as CometChat.BaseMessage
        }
        alignment="left"
        hideAvatar
        hideSenderName
        contentView={
          <CometChatPollBubble
            message={
              createMockPollMessage({
                senderName: 'Jane Smith',
                senderUid: 'user-jane',
                sentAt: Math.floor(Date.now() / 1000) - 60,
              }) as unknown as CometChat.CustomMessage
            }
            alignment="left"
          />
        }
      />
    </ChatContainer>
  );
};
