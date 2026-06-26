import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CometChatMessageBubbleRenderer } from '../CometChatMessageBubbleRenderer';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatThemeContext } from '../../../context/ThemeContext';
import type { CometChatMessagePlugin } from '../../../plugins/plugin.types';
import {
  buildUser,
  buildTextMessage,
  buildDeletedMessage,
  buildActionMessage,
} from '../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

const loggedInUser = buildUser({ uid: 'me' }) as unknown as CometChat.User;

const textPlugin: CometChatMessagePlugin = {
  id: 'text',
  messageTypes: ['text'],
  messageCategories: ['message'],
  renderBubble: () => React.createElement('span', { 'data-testid': 'text-bubble' }, 'Text content'),
  getOptions: () => [{ id: 'copy', title: 'Copy', onClick: vi.fn() }],
};

const deletePlugin: CometChatMessagePlugin = {
  id: 'delete',
  messageTypes: [],
  messageCategories: [],
  renderBubble: () => React.createElement('span', { 'data-testid': 'delete-bubble' }, 'Deleted'),
};

const groupActionPlugin: CometChatMessagePlugin = {
  id: 'group-action',
  messageTypes: ['groupMember'],
  messageCategories: ['action'],
  renderBubble: () => React.createElement('span', { 'data-testid': 'action-bubble' }, 'Action'),
};

const registry = new CometChatPluginRegistry([textPlugin, groupActionPlugin, deletePlugin]);

// The renderer resolves the logged-in user from the SDK rather than a prop.
beforeEach(() => {
  vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInUser);
});

function renderWithProviders(ui: React.ReactElement) {
  const themeValue = { theme: 'light' as const, setTheme: vi.fn() };
  return render(
    <CometChatPluginRegistryContext.Provider value={registry}>
      <CometChatThemeContext.Provider value={themeValue}>{ui}</CometChatThemeContext.Provider>
    </CometChatPluginRegistryContext.Provider>
  );
}

describe('CometChatMessageBubbleRenderer', () => {
  it('renders text plugin for text message', () => {
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'other' }),
    }) as unknown as CometChat.BaseMessage;
    renderWithProviders(<CometChatMessageBubbleRenderer message={msg} index={0} total={1} />);
    expect(screen.getByTestId('text-bubble')).toBeInTheDocument();
  });

  it('renders delete plugin for deleted message', () => {
    const msg = buildDeletedMessage() as unknown as CometChat.BaseMessage;
    renderWithProviders(<CometChatMessageBubbleRenderer message={msg} index={0} total={1} />);
    expect(screen.getByTestId('delete-bubble')).toBeInTheDocument();
  });

  it('renders fallback for unknown message type', () => {
    const msg = {
      getId: () => 1,
      getType: () => 'unknown_type',
      getCategory: () => 'unknown_cat',
      getSender: () => buildUser(),
      getSentAt: () => Date.now(),
      getDeliveredAt: () => 0,
      getReadAt: () => 0,
      getDeletedAt: () => 0,
      getEditedAt: () => 0,
      getReplyCount: () => 0,
      getReactions: () => [],
      getMetadata: () => ({}),
      getMuid: () => 'muid-1',
      getParentMessageId: () => 0,
    } as unknown as CometChat.BaseMessage;
    renderWithProviders(<CometChatMessageBubbleRenderer message={msg} index={0} total={1} />);
    // Unknown message types render the bubble wrapper without specific content
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('outgoing message gets right alignment', () => {
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'me' }),
    }) as unknown as CometChat.BaseMessage;
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} index={0} total={1} />
    );
    // The wrapper div should have the outgoing class
    const wrapper = container.querySelector('[class*="outgoing"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('incoming message gets left alignment', () => {
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'other' }),
    }) as unknown as CometChat.BaseMessage;
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} index={0} total={1} />
    );
    const wrapper = container.querySelector('[class*="incoming"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('action message gets center alignment', () => {
    const msg = buildActionMessage() as unknown as CometChat.BaseMessage;
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} index={0} total={1} />
    );
    const wrapper = container.querySelector('[class*="action"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('all messages get left alignment in left-aligned mode', () => {
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'me' }),
    }) as unknown as CometChat.BaseMessage;
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} messageAlignment={0} index={0} total={1} />
    );
    // In left-aligned mode, even outgoing messages should be left
    const wrapper = container.querySelector('[class*="incoming"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('sets aria-posinset and aria-setsize', () => {
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'other' }),
    }) as unknown as CometChat.BaseMessage;
    renderWithProviders(<CometChatMessageBubbleRenderer message={msg} index={2} total={10} />);
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-posinset', '3');
    expect(article).toHaveAttribute('aria-setsize', '10');
  });
});
