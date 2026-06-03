import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatReactions } from './CometChatReactions';

const meta: Meta = {
  title: 'Components/Misc/Reactions',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Displays emoji reactions on a message with counts and interactive add/remove functionality.',
      },
    },
    layout: 'centered',
  },
};
export default meta;

/**
 * Mock ReactionCount to simulate SDK objects in stories.
 */
function createMockReactionCount(emoji: string, count: number, reactedByMe: boolean) {
  return {
    getReaction: () => emoji,
    getCount: () => count,
    getReactedByMe: () => reactedByMe,
    setCount: () => {},
    setReactedByMe: () => {},
  };
}

function createMockMessage(reactions: ReturnType<typeof createMockReactionCount>[]) {
  return {
    getId: () => 123,
    getReactions: () => reactions,
    getSender: () => ({
      getUid: () => 'user-1',
      getName: () => 'John Doe',
      getAvatar: () => '',
    }),
    getReceiverType: () => 'user',
    getDeletedAt: () => null,
    getType: () => 'text',
    getCategory: () => 'message',
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage;
}

const defaultReactions = [
  createMockReactionCount('👍', 3, true),
  createMockReactionCount('❤️', 2, false),
  createMockReactionCount('😂', 1, false),
];

const manyReactions = [
  createMockReactionCount('👍', 5, true),
  createMockReactionCount('❤️', 3, false),
  createMockReactionCount('😂', 2, false),
  createMockReactionCount('🎉', 4, true),
  createMockReactionCount('🔥', 1, false),
  createMockReactionCount('👏', 2, false),
  createMockReactionCount('😍', 1, false),
  createMockReactionCount('🤔', 1, false),
];

/**
 * Default — a few reactions with one reacted by the current user.
 */
export const Default = () => (
  <CometChatReactions.Root
    message={createMockMessage(defaultReactions)}
    alignment="left"
    onReactionClick={(emoji, msg) => console.log('Reaction clicked:', emoji, msg.getId())}
  />
);

/**
 * WithOverflow — many reactions that trigger the overflow "+N more" button.
 */
export const WithOverflow = () => (
  <div style={{ width: 200 }}>
    <CometChatReactions.Root
      message={createMockMessage(manyReactions)}
      alignment="left"
      onReactionClick={emoji => console.log('Reaction clicked:', emoji)}
    />
  </div>
);

/**
 * ActiveReaction — all reactions are reacted by the current user.
 */
export const ActiveReaction = () => {
  const reactions = [
    createMockReactionCount('👍', 3, true),
    createMockReactionCount('❤️', 2, true),
    createMockReactionCount('😂', 1, true),
  ];
  return (
    <CometChatReactions.Root
      message={createMockMessage(reactions)}
      alignment="right"
      onReactionClick={emoji => console.log('Toggled:', emoji)}
    />
  );
};

/**
 * SingleReaction — only one reaction on the message.
 */
export const SingleReaction = () => {
  const reactions = [createMockReactionCount('👍', 1, false)];
  return <CometChatReactions.Root message={createMockMessage(reactions)} alignment="left" />;
};

/**
 * CustomBar — using the Bar sub-component with explicit maxVisible.
 */
export const CustomBar = () => (
  <CometChatReactions.Root message={createMockMessage(manyReactions)} alignment="left">
    <CometChatReactions.Bar maxVisible={4} />
  </CometChatReactions.Root>
);

/**
 * RightAligned — reactions aligned to the right (outgoing message).
 */
export const RightAligned = () => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', width: 400 }}>
    <CometChatReactions.Root message={createMockMessage(defaultReactions)} alignment="right" />
  </div>
);
