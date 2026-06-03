import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CometChatConversationsList } from '../CometChatConversationsList';
import { CometChatConversationsContext } from '../CometChatConversations.context';
import type { CometChatConversationsContextValue } from '../CometChatConversations.types';

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(() => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: vi.fn(),
  }))
);

function createMockConversation(id: string) {
  return {
    getConversationId: () => id,
    getConversationType: () => 'user',
    getConversationWith: () => ({
      getUid: () => id,
      getName: () => `User ${id}`,
      getStatus: () => 'online',
      getAvatar: () => null,
    }),
    getLastMessage: () => ({
      getId: () => 1,
      getType: () => 'text',
      getText: () => 'Hello',
      getSentAt: () => Math.floor(Date.now() / 1000),
      getCategory: () => 'message',
      getSender: () => ({ getUid: () => 'sender', getName: () => 'Sender' }),
      getDeletedAt: () => null,
    }),
    getUnreadMessageCount: () => 0,
  } as unknown as CometChat.Conversation;
}

function createMockContext(
  overrides: Partial<CometChatConversationsContextValue> = {}
): CometChatConversationsContextValue {
  return {
    conversations: [createMockConversation('c1'), createMockConversation('c2')],
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedConversationIds: [],
    selectedConversationsMap: new Map(),
    activeConversationId: null,
    searchText: '',
    selectionMode: 'none',
    hideUserStatus: false,
    hideUnreadCount: false,
    hideReceipts: false,
    options: undefined,
    fetchNext: vi.fn(),
    setSearchText: vi.fn(),
    selectConversation: vi.fn(),
    deselectConversation: vi.fn(),
    selectRange: vi.fn(),
    deselectRange: vi.fn(),
    clearSelection: vi.fn(),
    setActiveConversation: vi.fn(),
    handleItemClick: vi.fn(),
    deleteConversation: vi.fn(),
    ...overrides,
  };
}

describe('CometChatConversationsList', () => {
  it('renders conversation items from context', () => {
    const ctx = createMockContext();
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsList />
      </CometChatConversationsContext.Provider>
    );

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
  });

  it('renders nothing when fetchState is not loaded and no conversations', () => {
    const ctx = createMockContext({ conversations: [], fetchState: 'loading' });
    const { container } = render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsList />
      </CometChatConversationsContext.Provider>
    );

    expect(container.querySelector('[role="listbox"]')).not.toBeInTheDocument();
  });

  it('renders sentinel element when hasMore is true', () => {
    const ctx = createMockContext({ hasMore: true });
    const { container } = render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsList />
      </CometChatConversationsContext.Provider>
    );

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('does not render sentinel when hasMore is false', () => {
    const ctx = createMockContext({ hasMore: false });
    const { container } = render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsList />
      </CometChatConversationsContext.Provider>
    );

    // The only aria-hidden elements should not be the sentinel
    const sentinel = container.querySelector('[class*="sentinel"]');
    expect(sentinel).not.toBeInTheDocument();
  });

  it('uses custom itemView when provided', () => {
    const ctx = createMockContext();
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsList
          itemView={conv => <div data-testid={`custom-${conv.getConversationId()}`}>Custom</div>}
        />
      </CometChatConversationsContext.Provider>
    );

    expect(screen.getByTestId('custom-c1')).toBeInTheDocument();
    expect(screen.getByTestId('custom-c2')).toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    const ctx = createMockContext();
    render(
      <CometChatConversationsContext.Provider value={ctx}>
        <CometChatConversationsList />
      </CometChatConversationsContext.Provider>
    );

    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-label', 'Conversations list');
  });
});
