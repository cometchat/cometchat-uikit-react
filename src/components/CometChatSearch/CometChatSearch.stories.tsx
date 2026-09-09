/**
 * CometChatSearch Storybook Stories
 *
 * These stories render the **real** `CometChatSearch` component — header, filter
 * bar, result sections, message/conversation rows, and empty/loading/error states
 * are all produced by the actual component, not re-implemented here.
 *
 * How the data is mocked
 * ----------------------
 * `CometChatSearch` fetches results through two managers that ultimately call
 * `builder.build().fetchPrevious()` (messages) and `builder.build().fetchNext()`
 * (conversations). The component exposes public `messagesRequestBuilder` /
 * `conversationsRequestBuilder` props that are threaded straight into those
 * managers. We pass **fake builders** whose `.build()` returns a request that
 * filters a small **static corpus** by the exact query the component built
 * (keyword, attachment types, links, unread, group) — mirroring a real backend
 * instead of fabricating keyword-specific text on the fly.
 *
 * So there is a fixed set of conversations and messages. Type any of the
 * advertised keywords (names like "Nancy", "Design", or words like "project")
 * to see the real search narrow the results.
 *
 * The only other setup is stubbing the SDK login/listener calls the search hooks
 * make on mount — Storybook has no live SDK — so the real component can run.
 *
 * @module components/CometChatSearch
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatSearch } from './CometChatSearch';
import { CometChatUIKit } from '../../CometChatUIKit/CometChatUIKit';
import './CometChatSearch.css';

// ============================================================
// SDK harness — let the real component run without a live SDK
// ============================================================

const LOGGED_IN_USER = mockUser('me', 'You');

// The real search hooks call CometChat.getLoggedinUser() and attach
// message/user/group listeners on mount. None of that works without CometChat.init(),
// so stub them to harmless no-ops. Conversation/message items also resolve the
// logged-in user via CometChatUIKit — seed the cached value.
(() => {
  const CC = CometChat as unknown as Record<string, unknown>;
  CC.getLoggedinUser = () => Promise.resolve(LOGGED_IN_USER);
  const noopListener = () => undefined;
  CC.addMessageListener = noopListener;
  CC.removeMessageListener = noopListener;
  CC.addUserListener = noopListener;
  CC.removeUserListener = noopListener;
  CC.addGroupListener = noopListener;
  CC.removeGroupListener = noopListener;

  (CometChatUIKit as unknown as { _loggedInUser: CometChat.User | null })._loggedInUser =
    LOGGED_IN_USER;
})();

// ============================================================
// SDK-shaped mock builders
// ============================================================

function mockUser(uid: string, name: string, avatar?: string): CometChat.User {
  return {
    getUid: () => uid,
    getName: () => name,
    getAvatar: () => avatar ?? `https://i.pravatar.cc/150?u=${uid}`,
    getStatus: () => 'online',
    getRole: () => 'default',
  } as unknown as CometChat.User;
}

function mockGroup(guid: string, name: string): CometChat.Group {
  return {
    getGuid: () => guid,
    getName: () => name,
    getIcon: () => `https://i.pravatar.cc/150?u=${guid}`,
    getType: () => 'public',
    getMembersCount: () => 8,
  } as unknown as CometChat.Group;
}

/** Discriminate the mock union — only groups carry a getGuid() method. */
function isGroup(entity: CometChat.User | CometChat.Group): entity is CometChat.Group {
  return typeof (entity as { getGuid?: unknown }).getGuid === 'function';
}

function idOf(entity: CometChat.User | CometChat.Group): string {
  return isGroup(entity) ? entity.getGuid() : entity.getUid();
}

/** SDK-shaped Attachment: real bubbles/items read via getUrl()/getName() methods. */
function mockAttachment(url: string, name: string, mimeType: string): CometChat.Attachment {
  return {
    getUrl: () => url,
    getName: () => name,
    getMimeType: () => mimeType,
    getExtension: () => (name.includes('.') ? name.split('.').pop()! : ''),
    getSize: () => 0,
  } as unknown as CometChat.Attachment;
}

type MockMessageType = 'text' | 'image' | 'video' | 'audio' | 'file';

interface MockMessageOptions {
  id: number;
  type: MockMessageType;
  sender: CometChat.User;
  receiver: CometChat.User | CometChat.Group;
  sentAt: number;
  text?: string;
  caption?: string;
  attachment?: CometChat.Attachment;
  /** Extra metadata (e.g. link-preview / thumbnail-generation @injected data). */
  metadata?: Record<string, unknown>;
}

function mockMessage(opts: MockMessageOptions): CometChat.BaseMessage {
  const {
    id,
    type,
    sender,
    receiver,
    sentAt,
    text = '',
    caption = '',
    attachment,
    metadata = {},
  } = opts;

  return {
    getId: () => id,
    getMuid: () => `muid-${String(id)}`,
    getType: () => type,
    getCategory: () => 'message',
    getSender: () => sender,
    getReceiver: () => receiver,
    getReceiverType: () => (isGroup(receiver) ? 'group' : 'user'),
    getReceiverId: () => idOf(receiver),
    getConversationId: () => `${sender.getUid()}_${idOf(receiver)}`,
    getSentAt: () => sentAt,
    getDeliveredAt: () => sentAt,
    getReadAt: () => sentAt,
    getEditedAt: () => 0,
    getDeletedAt: () => null,
    getParentMessageId: () => 0,
    getReplyCount: () => 0,
    // text
    getText: () => text,
    getMentionedUsers: () => [],
    // media
    getAttachments: () => (attachment ? [attachment] : []),
    getUrl: () => (attachment ? attachment.getUrl() : undefined),
    getCaption: () => caption,
    getData: () => ({ text: caption || text, entities: {} }),
    // generic
    getMetadata: () => metadata,
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;
}

interface MockConversationOptions {
  with: CometChat.User | CometChat.Group;
  lastMessage: CometChat.BaseMessage;
  unreadCount?: number;
}

function mockConversation(opts: MockConversationOptions): CometChat.Conversation {
  const { with: convWith, lastMessage, unreadCount = 0 } = opts;
  return {
    getConversationId: () => `conv_${idOf(convWith)}`,
    getConversationType: () => (isGroup(convWith) ? 'group' : 'user'),
    getConversationWith: () => convWith,
    getLastMessage: () => lastMessage,
    getUnreadMessageCount: () => unreadCount,
    setUnreadMessageCount: () => undefined,
    getUpdatedAt: () => lastMessage.getSentAt(),
  } as unknown as CometChat.Conversation;
}

// ============================================================
// Static corpus — one fixed dataset, filtered by keyword/filter
// ============================================================

// Advertised search terms live in these names / message texts.
const ANDREW = mockUser('user-andrew', 'Andrew Joseph');
const NANCY = mockUser('user-nancy', 'Nancy Grace');
const GEORGE = mockUser('user-george', 'George Alan');
const CAROL = mockUser('user-carol', 'Carol White');
const DAVID = mockUser('user-david', 'David Lee');
const DESIGN_TEAM = mockGroup('group-design', 'Design Team');
const ENGINEERING = mockGroup('group-eng', 'Engineering');

const HOUR = 3600;
const now = Math.floor(Date.now() / 1000);

const IMG = (i: number) => `https://picsum.photos/seed/search-img-${String(i)}/240/180`;
const VIDEO_THUMB = (i: number) => `https://picsum.photos/seed/search-vid-${String(i)}/240/180`;
const videoMetadata = (i: number): Record<string, unknown> => ({
  '@injected': { extensions: { 'thumbnail-generation': { url_medium: VIDEO_THUMB(i) } } },
});
const linkMetadata: Record<string, unknown> = { hasLinks: true };

/** The fixed message corpus. Real search filters this by keyword + type. */
const MESSAGES: CometChat.BaseMessage[] = [
  mockMessage({
    id: 201,
    type: 'text',
    sender: NANCY,
    receiver: LOGGED_IN_USER,
    sentAt: now - 2 * HOUR,
    text: 'Hey, are you free for a quick call about the project?',
  }),
  mockMessage({
    id: 202,
    type: 'text',
    sender: LOGGED_IN_USER,
    receiver: NANCY,
    sentAt: now - 2 * HOUR + 300,
    text: 'Sure — I just pushed the project changes to the repo.',
  }),
  mockMessage({
    id: 203,
    type: 'image',
    sender: GEORGE,
    receiver: DESIGN_TEAM,
    sentAt: now - 5 * HOUR,
    caption: 'New homepage design mockup',
    attachment: mockAttachment(IMG(1), 'homepage-design.png', 'image/png'),
  }),
  mockMessage({
    id: 204,
    type: 'image',
    sender: CAROL,
    receiver: DESIGN_TEAM,
    sentAt: now - 5 * HOUR + 120,
    caption: 'Design system color tokens',
    attachment: mockAttachment(IMG(2), 'color-tokens.png', 'image/png'),
  }),
  mockMessage({
    id: 205,
    type: 'video',
    sender: ANDREW,
    receiver: ENGINEERING,
    sentAt: now - 8 * HOUR,
    caption: 'Screen recording of the project demo',
    attachment: mockAttachment(
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'project-demo.mp4',
      'video/mp4'
    ),
    metadata: videoMetadata(1),
  }),
  mockMessage({
    id: 206,
    type: 'video',
    sender: DAVID,
    receiver: LOGGED_IN_USER,
    sentAt: now - 9 * HOUR,
    caption: 'Design walkthrough recording',
    attachment: mockAttachment(
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'design-walkthrough.mp4',
      'video/mp4'
    ),
    metadata: videoMetadata(2),
  }),
  mockMessage({
    id: 207,
    type: 'audio',
    sender: NANCY,
    receiver: LOGGED_IN_USER,
    sentAt: now - 11 * HOUR,
    caption: 'voice note about the project timeline',
    attachment: mockAttachment(
      'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
      'voice-note.mp3',
      'audio/mpeg'
    ),
  }),
  mockMessage({
    id: 208,
    type: 'file',
    sender: GEORGE,
    receiver: LOGGED_IN_USER,
    sentAt: now - 26 * HOUR,
    caption: 'project-report.pdf',
    attachment: mockAttachment(
      'https://example.com/project-report.pdf',
      'project-report.pdf',
      'application/pdf'
    ),
  }),
  mockMessage({
    id: 209,
    type: 'file',
    sender: CAROL,
    receiver: DESIGN_TEAM,
    sentAt: now - 30 * HOUR,
    caption: 'design-spec.pdf',
    attachment: mockAttachment(
      'https://example.com/design-spec.pdf',
      'design-spec.pdf',
      'application/pdf'
    ),
  }),
  mockMessage({
    id: 210,
    type: 'text',
    sender: ANDREW,
    receiver: LOGGED_IN_USER,
    sentAt: now - 40 * HOUR,
    text: 'Check out the project docs: https://docs.example.com/project',
    metadata: linkMetadata,
  }),
  mockMessage({
    id: 211,
    type: 'text',
    sender: GEORGE,
    receiver: ENGINEERING,
    sentAt: now - 50 * HOUR,
    text: 'Design reference here: https://example.com/design-guide',
    metadata: linkMetadata,
  }),
  mockMessage({
    id: 212,
    type: 'text',
    sender: NANCY,
    receiver: LOGGED_IN_USER,
    sentAt: now - 60 * HOUR,
    text: 'Let me know when you review the design PR.',
  }),
];

/** The fixed conversation corpus. Real search filters this by keyword / unread / group. */
const CONVERSATIONS: CometChat.Conversation[] = [
  mockConversation({
    with: NANCY,
    unreadCount: 3,
    lastMessage: mockMessage({
      id: 301,
      type: 'text',
      sender: NANCY,
      receiver: LOGGED_IN_USER,
      sentAt: now - 1 * HOUR,
      text: 'Are you free to sync on the project this afternoon?',
    }),
  }),
  mockConversation({
    with: DESIGN_TEAM,
    unreadCount: 5,
    lastMessage: mockMessage({
      id: 302,
      type: 'text',
      sender: GEORGE,
      receiver: DESIGN_TEAM,
      sentAt: now - 3 * HOUR,
      text: 'Uploaded the latest design files 🔥',
    }),
  }),
  mockConversation({
    with: ANDREW,
    unreadCount: 0,
    lastMessage: mockMessage({
      id: 303,
      type: 'text',
      sender: LOGGED_IN_USER,
      receiver: ANDREW,
      sentAt: now - 6 * HOUR,
      text: "I'll push the project PR this afternoon.",
    }),
  }),
  mockConversation({
    with: ENGINEERING,
    unreadCount: 2,
    lastMessage: mockMessage({
      id: 304,
      type: 'text',
      sender: DAVID,
      receiver: ENGINEERING,
      sentAt: now - 12 * HOUR,
      text: 'Project build is green again.',
    }),
  }),
  mockConversation({
    with: GEORGE,
    unreadCount: 0,
    lastMessage: mockMessage({
      id: 305,
      type: 'text',
      sender: GEORGE,
      receiver: LOGGED_IN_USER,
      sentAt: now - 20 * HOUR,
      text: 'Sounds good — design review tomorrow then.',
    }),
  }),
  mockConversation({
    with: CAROL,
    unreadCount: 1,
    lastMessage: mockMessage({
      id: 306,
      type: 'text',
      sender: CAROL,
      receiver: LOGGED_IN_USER,
      sentAt: now - 28 * HOUR,
      text: 'Shared the design spec with you.',
    }),
  }),
];

// ============================================================
// Fake request builders — filter the corpus by the built query
// ============================================================

function nameOf(entity: CometChat.User | CometChat.Group): string {
  return entity.getName();
}

/** getMetadata lives on subtypes, not BaseMessage — read it through a narrow shape. */
function metadataOf(m: CometChat.BaseMessage): Record<string, unknown> | null {
  return (m as unknown as { getMetadata: () => Record<string, unknown> | null }).getMetadata();
}

function messageSearchText(m: CometChat.BaseMessage): string {
  const parts = [
    m.getSender().getName(),
    nameOf(m.getReceiver() as CometChat.User | CometChat.Group),
    (m as CometChat.TextMessage).getText(),
    (m as CometChat.MediaMessage).getCaption(),
  ];
  return parts.join(' ').toLowerCase();
}

function attachmentTypeToMsgType(t: unknown): MockMessageType | null {
  const s = String(t).toLowerCase();
  if (s.includes('image')) return 'image';
  if (s.includes('video')) return 'video';
  if (s.includes('audio')) return 'audio';
  if (s.includes('file')) return 'file';
  return null;
}

/**
 * Fake `MessagesRequestBuilder`. The manager reuses one builder across every
 * search, calling the chainable setters and then `.build()` each time. So the
 * accumulated query is reset at the start of each search (`hideDeletedMessages`
 * is always called first) and the "already served" flag lives inside each
 * `.build()` — one per search — not on the shared builder.
 */
function fakeMessagesRequestBuilder(): CometChat.MessagesRequestBuilder {
  let keyword = '';
  let types: MockMessageType[] = [];
  let hasLinksFlag = false;

  const builder = {
    // Called first on every search — use it to reset the accumulated query.
    hideDeletedMessages: () => {
      keyword = '';
      types = [];
      hasLinksFlag = false;
      return builder;
    },
    setLimit: () => builder,
    setSearchKeyword: (k: string) => {
      keyword = k;
      return builder;
    },
    setUID: () => builder,
    setGUID: () => builder,
    hasLinks: (v: boolean) => {
      hasLinksFlag = v;
      return builder;
    },
    setAttachmentTypes: (t: unknown[]) => {
      types = t.map(x => attachmentTypeToMsgType(x)).filter(Boolean) as MockMessageType[];
      return builder;
    },
    build: () => {
      // Snapshot this search's query; pagination state is per-request.
      const q = { keyword, types, hasLinks: hasLinksFlag };
      let served = false;
      return {
        fetchPrevious: () => {
          if (served) return Promise.resolve([]);
          served = true;
          const kw = q.keyword.trim().toLowerCase();
          const results = MESSAGES.filter(m => {
            if (q.hasLinks) {
              const md = metadataOf(m);
              if (!md?.hasLinks) return false;
            } else if (q.types.length > 0) {
              if (!q.types.includes(m.getType() as MockMessageType)) return false;
            }
            if (kw && !messageSearchText(m).includes(kw)) return false;
            return true;
          });
          // Ascending by sentAt; the manager reverses to newest-first.
          return Promise.resolve([...results].sort((a, b) => a.getSentAt() - b.getSentAt()));
        },
      };
    },
  };

  return builder as unknown as CometChat.MessagesRequestBuilder;
}

/**
 * Fake `ConversationsRequestBuilder`. `.build().fetchNext()` returns the corpus
 * filtered by keyword / unread / group, paginated by the requested limit so the
 * real "See More" pagination is exercised.
 */
function fakeConversationsRequestBuilder(): CometChat.ConversationsRequestBuilder {
  let keyword = '';
  let unread = false;
  let groupOnly = false;
  let limit = 30;

  const builder = {
    // Called first on every search — use it to reset the accumulated query.
    setLimit: (n: number) => {
      limit = n;
      keyword = '';
      unread = false;
      groupOnly = false;
      return builder;
    },
    setSearchKeyword: (k: string) => {
      keyword = k;
      return builder;
    },
    setUnread: (v: boolean) => {
      unread = v;
      return builder;
    },
    setConversationType: (t: string) => {
      groupOnly = t === 'group';
      return builder;
    },
    build: () => {
      // Snapshot this search's query; the pagination cursor is per-request.
      const q = { keyword, unread, groupOnly };
      const pageLimit = limit;
      let cursor = 0;
      return {
        fetchNext: () => {
          const kw = q.keyword.trim().toLowerCase();
          const all = CONVERSATIONS.filter(c => {
            if (q.groupOnly && c.getConversationType() !== 'group') return false;
            if (q.unread && c.getUnreadMessageCount() <= 0) return false;
            if (kw) {
              const name = nameOf(
                c.getConversationWith() as CometChat.User | CometChat.Group
              ).toLowerCase();
              const last = (c.getLastMessage() as CometChat.TextMessage).getText();
              if (!name.includes(kw) && !last.toLowerCase().includes(kw)) return false;
            }
            return true;
          });
          const page = all.slice(cursor, cursor + pageLimit);
          cursor += page.length;
          return Promise.resolve(page);
        },
      };
    },
  };

  return builder as unknown as CometChat.ConversationsRequestBuilder;
}

// ============================================================
// Meta
// ============================================================

const SEARCHABLE_HINT =
  'Type a name (Nancy, George, Design Team, Engineering) or a word (project, design) to filter the fixed result set.';

const meta: Meta<typeof CometChatSearch> = {
  title: 'Components/CometChatSearch',
  component: CometChatSearch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Global search for finding conversations and messages across all chats. ' +
          'These stories drive the real component against a fixed mock corpus. ' +
          SEARCHABLE_HINT,
      },
    },
    layout: 'centered',
  },
  args: {
    hideBackButton: false,
    hideUserStatus: false,
    hideGroupType: false,
    hideReceipts: false,
  },
  argTypes: {
    hideBackButton: { control: 'boolean', description: 'Hide the back button in the header' },
    hideUserStatus: { control: 'boolean', description: 'Hide user online/offline status' },
    hideGroupType: { control: 'boolean', description: 'Hide the group type badge' },
    hideReceipts: { control: 'boolean', description: 'Hide message read receipts' },
  },
  // Every story renders the real component with the fake corpus builders wired in.
  render: args => (
    <CometChatSearch
      {...args}
      messagesRequestBuilder={fakeMessagesRequestBuilder()}
      conversationsRequestBuilder={fakeConversationsRequestBuilder()}
    />
  ),
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 360 }}>
        <div
          style={{
            width: 360,
            height: 640,
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <Story />
        </div>
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: '#6b7280',
            padding: '8px 12px',
            background: '#f8f8fb',
            border: '1px solid #ececf1',
            borderRadius: 8,
          }}
        >
          <strong style={{ color: '#4b5563' }}>Try searching</strong> a name — <code>Nancy</code>,{' '}
          <code>George</code>, <code>Andrew</code>, <code>Carol</code>, <code>David</code>,{' '}
          <code>Design Team</code>, <code>Engineering</code> — or a word: <code>project</code>,{' '}
          <code>design</code>. Results come from a fixed mock corpus.
        </div>
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof CometChatSearch>;

// ============================================================
// Stories
// ============================================================

/** Initial state — type an advertised keyword to see the real search filter the corpus. */
export const Default: Story = {
  parameters: {
    docs: { description: { story: `Start empty. ${SEARCHABLE_HINT}` } },
  },
};

/** Unread filter pre-selected — shows unread conversations immediately, no text needed. */
export const WithActiveFilter: Story = {
  args: { initialSearchFilter: 'unread' },
};

/** Loaded conversation + message results for the keyword "project". */
export const BothResults: Story = {
  args: { defaultSearchText: 'project' },
};

/** Conversation results only (searchIn=["conversations"]). Try "Nancy" or "Design". */
export const ConversationsOnly: Story = {
  args: { searchIn: ['conversations'], defaultSearchText: 'design' },
};

/** Message results only (searchIn=["messages"]). Try "project" or "design". */
export const MessagesOnly: Story = {
  args: { searchIn: ['messages'], defaultSearchText: 'project' },
};

/** Photos filter — only image messages from the corpus. */
export const PhotosFilter: Story = {
  args: { searchIn: ['messages'], initialSearchFilter: 'photos' },
};

/** Videos filter — only video messages (with real thumbnails + play affordance). */
export const VideosFilter: Story = {
  args: { searchIn: ['messages'], initialSearchFilter: 'videos' },
};

/** Empty state — a keyword that matches nothing in the corpus. */
export const EmptyState: Story = {
  args: { defaultSearchText: 'zzz-no-such-thing' },
};

/** No back button. */
export const NoBackButton: Story = {
  args: { hideBackButton: true, defaultSearchText: 'project' },
};

/** Custom initialView slot — replaces the default "Start Your Search" prompt. */
export const CustomInitialView: Story = {
  args: {
    initialView: (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 48 }}>🔍</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Find anything</div>
        <div style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>
          Search across all your conversations and messages
        </div>
      </div>
    ),
  },
};
