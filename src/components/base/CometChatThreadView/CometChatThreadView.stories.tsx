import React from 'react';
import type { Meta } from '@storybook/react';
import { CometChatThreadView } from './CometChatThreadView';

const meta: Meta = {
  title: 'Components/Messages/Thread View',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A container for threaded message replies with parent message context.',
      },
    },
  },
};
export default meta;

/** Default — 5 replies, right alignment. */
export const Default = () => (
  <CometChatThreadView.Root replyCount={5} onClick={() => console.log('Open thread')}>
    <CometChatThreadView.Icon />
    <CometChatThreadView.ReplyCount />
  </CometChatThreadView.Root>
);

/** Single reply (singular form). */
export const SingleReply = () => (
  <CometChatThreadView.Root replyCount={1} onClick={() => console.log('Open thread')}>
    <CometChatThreadView.Icon />
    <CometChatThreadView.ReplyCount />
  </CometChatThreadView.Root>
);

/** Many replies (999+ cap). */
export const ManyReplies = () => (
  <CometChatThreadView.Root replyCount={1500} onClick={() => console.log('Open thread')}>
    <CometChatThreadView.Icon />
    <CometChatThreadView.ReplyCount />
  </CometChatThreadView.Root>
);

/** Unread replies — shows bold text and unread indicator dot. */
export const UnreadReplies = () => (
  <CometChatThreadView.Root
    replyCount={8}
    unreadReplyCount={3}
    onClick={() => console.log('Open thread')}
  >
    <CometChatThreadView.Icon />
    <CometChatThreadView.ReplyCount />
    <CometChatThreadView.UnreadIndicator />
  </CometChatThreadView.Root>
);

/** Left alignment (incoming messages). */
export const LeftAlignment = () => (
  <div style={{ width: 300 }}>
    <CometChatThreadView.Root
      replyCount={5}
      alignment="left"
      onClick={() => console.log('Open thread')}
    >
      <CometChatThreadView.Icon />
      <CometChatThreadView.ReplyCount />
    </CometChatThreadView.Root>
  </div>
);

/** Custom icon. */
export const CustomIcon = () => (
  <CometChatThreadView.Root replyCount={7} onClick={() => console.log('Open thread')}>
    <CometChatThreadView.Icon iconURL="https://cdn-icons-png.flaticon.com/512/1380/1380338.png" />
    <CometChatThreadView.ReplyCount />
  </CometChatThreadView.Root>
);

/** Custom text override. */
export const CustomText = () => (
  <CometChatThreadView.Root replyCount={12} onClick={() => console.log('Open thread')}>
    <CometChatThreadView.Icon />
    <CometChatThreadView.ReplyCount text="View thread" />
  </CometChatThreadView.Root>
);

/** Default layout (no children — renders Icon + ReplyCount automatically). */
export const DefaultLayout = () => (
  <CometChatThreadView.Root replyCount={4} onClick={() => console.log('Open thread')} />
);

/** Default layout with unread (no children). */
export const DefaultLayoutUnread = () => (
  <CometChatThreadView.Root
    replyCount={10}
    unreadReplyCount={4}
    onClick={() => console.log('Open thread')}
  />
);
