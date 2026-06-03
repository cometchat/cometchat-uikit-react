import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { CometChatMessageBubble } from '../CometChatMessageBubble';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

expect.extend(toHaveNoViolations);

function mockMessage(): CometChat.BaseMessage {
  return {
    getId: () => 1,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({
      getUid: () => 'user1',
      getName: () => 'John',
      getAvatar: () => '',
      getStatus: () => 'online',
    }),
    getSentAt: () => 1000,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMuid: () => 'muid-1',
  } as unknown as CometChat.BaseMessage;
}

describe('CometChatMessageBubble a11y', () => {
  it('passes axe-core audit', async () => {
    const { container } = render(
      <CometChatMessageBubble
        message={mockMessage()}
        alignment="right"
        contentView={<span>Hello</span>}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('wrapper has role="article" and aria-label', () => {
    render(
      <CometChatMessageBubble
        message={mockMessage()}
        alignment="right"
        contentView={<span>Hello</span>}
      />
    );
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label');
  });

  it('receipts have role="img" and aria-label', () => {
    render(
      <CometChatMessageBubble
        message={mockMessage()}
        alignment="right"
        contentView={<span>Hello</span>}
      />
    );
    const receipt = screen.getByRole('img', { name: 'Sent' });
    expect(receipt).toBeInTheDocument();
  });

  it('avatar is keyboard accessible in group context', () => {
    const group = {
      getGuid: () => 'g1',
      getName: () => 'Team',
    } as unknown as CometChat.Group;

    render(
      <CometChatMessageBubble
        message={mockMessage()}
        alignment="left"
        group={group}
        contentView={<span>Hello</span>}
      />
    );
    const avatarButton = screen.getByLabelText(/Avatar for/);
    expect(avatarButton).toHaveAttribute('role', 'button');
    expect(avatarButton).toHaveAttribute('tabindex', '0');
  });
});
