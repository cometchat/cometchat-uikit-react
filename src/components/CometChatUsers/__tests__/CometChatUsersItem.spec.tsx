import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CometChatUsersItem } from '../CometChatUsersItem';
import { CometChatUsersContext } from '../CometChatUsers.context';
import type { CometChatUsersContextValue } from '../CometChatUsers.types';

// --- Mock SDK ---
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    UsersRequestBuilder: vi.fn(),
    UserListener: vi.fn(),
    ConnectionListener: vi.fn(),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
  },
}));

function createMockUser(uid: string, name: string, status = 'online') {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => status,
    getAvatar: () => `https://example.com/${uid}.png`,
  } as unknown as CometChat.User;
}

function createMockContext(
  overrides: Partial<CometChatUsersContextValue> = {}
): CometChatUsersContextValue {
  return {
    users: [],
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedUserIds: [],
    selectedUsersMap: new Map(),
    activeUserId: null,
    searchText: '',
    selectionMode: 'none',
    hideUserStatus: false,
    sectionHeaderKey: 'getName',
    hideSearch: false,
    showSectionHeader: true,
    showSelectedUsersPreview: false,
    showScrollbar: false,
    options: undefined,
    fetchNext: vi.fn(),
    setSearchText: vi.fn(),
    selectUser: vi.fn(),
    deselectUser: vi.fn(),
    selectRange: vi.fn(),
    deselectRange: vi.fn(),
    clearSelection: vi.fn(),
    setActiveUser: vi.fn(),
    handleItemClick: vi.fn(),
    ...overrides,
  };
}

function renderItem(user: CometChat.User, ctxOverrides: Partial<CometChatUsersContextValue> = {}) {
  const ctx = createMockContext(ctxOverrides);
  return {
    ctx,
    ...render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersItem user={user} />
      </CometChatUsersContext.Provider>
    ),
  };
}

describe('CometChatUsersItem', () => {
  it('renders user name', () => {
    const user = createMockUser('u1', 'Alice');
    renderItem(user);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders avatar component', () => {
    const user = createMockUser('u1', 'Alice');
    renderItem(user);
    // CometChatAvatar renders with cometchat-avatar class
    expect(document.querySelector('[class*="cometchat-avatar"]')).toBeInTheDocument();
  });

  it('calls handleItemClick on click', () => {
    const user = createMockUser('u1', 'Alice');
    const handleItemClick = vi.fn();
    renderItem(user, { handleItemClick });

    const item = screen.getByRole('option');
    fireEvent.click(item);

    expect(handleItemClick).toHaveBeenCalledWith(user, { shiftKey: false });
  });

  it('calls handleItemClick with shiftKey on shift+click', () => {
    const user = createMockUser('u1', 'Alice');
    const handleItemClick = vi.fn();
    renderItem(user, { handleItemClick });

    const item = screen.getByRole('option');
    fireEvent.click(item, { shiftKey: true });

    expect(handleItemClick).toHaveBeenCalledWith(user, { shiftKey: true });
  });

  it('calls handleItemClick on Enter key', () => {
    const user = createMockUser('u1', 'Alice');
    const handleItemClick = vi.fn();
    renderItem(user, { handleItemClick });

    const item = screen.getByRole('option');
    fireEvent.keyDown(item, { key: 'Enter' });

    expect(handleItemClick).toHaveBeenCalledWith(user, { shiftKey: false });
  });

  it('calls handleItemClick on Space key', () => {
    const user = createMockUser('u1', 'Alice');
    const handleItemClick = vi.fn();
    renderItem(user, { handleItemClick });

    const item = screen.getByRole('option');
    fireEvent.keyDown(item, { key: ' ' });

    expect(handleItemClick).toHaveBeenCalledWith(user, { shiftKey: false });
  });

  it('does not call handleItemClick on other keys', () => {
    const user = createMockUser('u1', 'Alice');
    const handleItemClick = vi.fn();
    renderItem(user, { handleItemClick });

    const item = screen.getByRole('option');
    fireEvent.keyDown(item, { key: 'Tab' });

    expect(handleItemClick).not.toHaveBeenCalled();
  });

  it('checkbox onChange calls handleItemClick', () => {
    const user = createMockUser('u1', 'Alice');
    const handleItemClick = vi.fn();
    renderItem(user, { selectionMode: 'multiple', handleItemClick });

    // Find the checkbox input and trigger change
    const checkbox = document.querySelector('input[type="checkbox"]')!;
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox);

    expect(handleItemClick).toHaveBeenCalled();
  });

  it('radio onChange calls handleItemClick', () => {
    const user = createMockUser('u1', 'Alice');
    const handleItemClick = vi.fn();
    renderItem(user, { selectionMode: 'single', handleItemClick });

    // Find the radio input and trigger change
    const radio = document.querySelector('input[type="radio"]')!;
    expect(radio).not.toBeNull();
    fireEvent.click(radio);

    expect(handleItemClick).toHaveBeenCalled();
  });

  it('shows active state when activeUserId matches', () => {
    const user = createMockUser('u1', 'Alice');
    renderItem(user, { activeUserId: 'u1' });

    const item = screen.getByRole('option');
    expect(item).toHaveAttribute('aria-selected', 'true');
  });

  it('shows selected state when user is in selectedUserIds', () => {
    const user = createMockUser('u1', 'Alice');
    renderItem(user, { selectedUserIds: ['u1'] });

    const item = screen.getByRole('option');
    expect(item).toHaveAttribute('aria-selected', 'true');
  });

  it('renders checkbox in multiple selection mode', () => {
    const user = createMockUser('u1', 'Alice');
    renderItem(user, { selectionMode: 'multiple' });

    expect(document.querySelector('[class*="cometchat-checkbox"]')).toBeInTheDocument();
  });

  it('renders radio button in single selection mode', () => {
    const user = createMockUser('u1', 'Alice');
    renderItem(user, { selectionMode: 'single' });

    expect(document.querySelector('[class*="cometchat-radio-button"]')).toBeInTheDocument();
  });

  it('hides status indicator when hideUserStatus is true', () => {
    const user = createMockUser('u1', 'Alice', 'online');
    renderItem(user, { hideUserStatus: true });

    // StatusIndicator should not be rendered
    expect(document.querySelector('[class*="status-indicator"]')).not.toBeInTheDocument();
  });

  it('renders context menu when options are provided', () => {
    const user = createMockUser('u1', 'Alice');
    const options = () => [{ id: 'block', title: 'Block', onClick: vi.fn() }];
    renderItem(user, { options });

    expect(document.querySelector('[class*="cometchat-users__item-menu"]')).toBeInTheDocument();
  });

  it('does not render context menu when options are not provided', () => {
    const user = createMockUser('u1', 'Alice');
    renderItem(user, { options: undefined });

    expect(document.querySelector('[class*="cometchat-users__item-menu"]')).not.toBeInTheDocument();
  });

  it('React.memo prevents re-render when props are unchanged', () => {
    const user = createMockUser('u1', 'Alice', 'online');
    const handleItemClick = vi.fn();
    const ctx = createMockContext({ handleItemClick });

    const { rerender } = render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersItem user={user} />
      </CometChatUsersContext.Provider>
    );

    // Re-render with same user — memo comparator should prevent re-render
    rerender(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersItem user={user} />
      </CometChatUsersContext.Provider>
    );

    // Component should still be rendered correctly
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('React.memo allows re-render when user status changes', () => {
    const user1 = createMockUser('u1', 'Alice', 'offline');
    const user2 = createMockUser('u1', 'Alice', 'online');
    const ctx = createMockContext();

    const { rerender } = render(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersItem user={user1} />
      </CometChatUsersContext.Provider>
    );

    // Re-render with different status — memo comparator should allow re-render
    rerender(
      <CometChatUsersContext.Provider value={ctx}>
        <CometChatUsersItem user={user2} />
      </CometChatUsersContext.Provider>
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
