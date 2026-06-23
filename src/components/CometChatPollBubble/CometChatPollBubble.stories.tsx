import React from 'react';
import type { Meta } from '@storybook/react';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPollBubble } from './CometChatPollBubble';

/**
 * CometChatPollBubble is self-extracting: it takes the SDK CustomMessage and
 * derives the question, options, vote counts and total votes from the message
 * metadata itself. Only `message` is required; `alignment` is an optional
 * override (when omitted it is derived from the sender vs. the logged-in user).
 *
 * Note: the "voted by me" highlight depends on the logged-in user (read via
 * useLoggedInUser). In Storybook there is no logged-in session, so options
 * render unselected and alignment is provided explicitly via the prop.
 */
const meta: Meta<typeof CometChatPollBubble> = {
  title: 'Components/Bubbles/Message Bubble/Poll',
  component: CometChatPollBubble,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Renders poll messages with voting. Extracts question, options, vote counts and ' +
          'total votes from the SDK CustomMessage itself.',
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

interface PollOptionSeed {
  text: string;
  count: number;
  voters?: Record<string, { name: string; avatar?: string }>;
}

/**
 * Build a poll CustomMessage mock whose metadata matches the SDK
 * `@injected.extensions.polls` shape the bubble extracts from.
 */
function mockPollMsg(
  overrides: {
    id?: string;
    question?: string;
    options?: PollOptionSeed[];
    senderUid?: string;
  } = {}
): CometChat.CustomMessage {
  const id = overrides.id ?? 'poll-1';
  const question = overrides.question ?? 'Which framework should we standardise on?';
  const seeds = overrides.options ?? [
    { text: 'React', count: 5, voters: { u1: { name: 'Alice' }, u2: { name: 'Bob' } } },
    { text: 'Vue', count: 2, voters: { u3: { name: 'Cara' } } },
    { text: 'Svelte', count: 1, voters: {} },
  ];

  const options: Record<string, string> = {};
  const resultOptions: Record<
    string,
    { count: number; voters: Record<string, { name: string; avatar?: string }> }
  > = {};
  let total = 0;
  seeds.forEach((seed, index) => {
    const key = String(index + 1);
    options[key] = seed.text;
    resultOptions[key] = { count: seed.count, voters: seed.voters ?? {} };
    total += seed.count;
  });

  return {
    getId: () => 1,
    getType: () => 'extension_poll',
    getCategory: () => 'custom',
    getSender: () => ({
      getUid: () => overrides.senderUid ?? 'user-john',
      getName: () => 'John Doe',
      getAvatar: () => '',
    }),
    getCustomData: () => ({ question }),
    getMetadata: () => ({
      '@injected': {
        extensions: {
          polls: { id, question, options, results: { total, options: resultOptions } },
        },
      },
    }),
    getDeletedAt: () => 0,
    getReactions: () => [],
  } as unknown as CometChat.CustomMessage;
}

function ChatContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: 480,
        padding: 16,
        borderRadius: 'var(--cometchat-radius-4, 16px)',
        border: '1px solid var(--cometchat-border-color-light, #f5f5f5)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Mirrors the message list: outgoing bubbles sit on the right, incoming on the
 * left. In the real app the message bubble wrapper does this; the poll bubble
 * itself only picks the color variant.
 */
function BubbleRow({
  alignment,
  children,
}: {
  alignment: 'left' | 'right';
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: alignment === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {children}
    </div>
  );
}

// --- Stories ---

/** Default — outgoing + incoming poll with votes extracted from the message. */
export const Default = () => (
  <ChatContainer>
    <BubbleRow alignment="right">
      <CometChatPollBubble message={mockPollMsg()} alignment="right" />
    </BubbleRow>
    <BubbleRow alignment="left">
      <CometChatPollBubble
        message={mockPollMsg({
          question: 'Lunch on Friday?',
          options: [
            { text: 'Pizza', count: 3, voters: { u1: { name: 'Alice' } } },
            { text: 'Sushi', count: 4, voters: { u2: { name: 'Bob' }, u3: { name: 'Cara' } } },
          ],
        })}
        alignment="left"
      />
    </BubbleRow>
  </ChatContainer>
);

// ============================================
// Internal testing stories
// ============================================

/** [Internal] Fresh poll with no votes yet — 0% bars. */
export const _NoVotes = () => (
  <ChatContainer>
    <CometChatPollBubble
      message={mockPollMsg({
        question: 'Pick a meeting time',
        options: [
          { text: '10:00 AM', count: 0 },
          { text: '2:00 PM', count: 0 },
          { text: '4:30 PM', count: 0 },
        ],
      })}
      alignment="right"
    />
  </ChatContainer>
);
_NoVotes.storyName = '[Internal] No Votes';
_NoVotes.tags = ['!dev', '!autodocs'];

/** [Internal] Interaction disabled — used for thread header preview. */
export const _DisabledInteraction = () => (
  <ChatContainer>
    <CometChatPollBubble message={mockPollMsg()} alignment="left" disableInteraction />
  </ChatContainer>
);
_DisabledInteraction.storyName = '[Internal] Disabled Interaction';
_DisabledInteraction.tags = ['!dev', '!autodocs'];

/** [Internal] Missing poll data — bubble renders nothing. */
export const _NoPollData = () => {
  const msg = {
    getId: () => 1,
    getType: () => 'extension_poll',
    getCategory: () => 'custom',
    getSender: () => ({ getUid: () => 'user-john', getName: () => 'John', getAvatar: () => '' }),
    getMetadata: () => ({}),
    getCustomData: () => ({}),
    getDeletedAt: () => 0,
  } as unknown as CometChat.CustomMessage;
  return (
    <ChatContainer>
      <CometChatPollBubble message={msg} alignment="left" />
    </ChatContainer>
  );
};
_NoPollData.storyName = '[Internal] No Poll Data (renders null)';
_NoPollData.tags = ['!dev', '!autodocs'];
