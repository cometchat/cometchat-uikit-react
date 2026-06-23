import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CometChatGroupsContext } from '../CometChatGroups.context';
import { CometChatGroupsItem } from '../CometChatGroupsItem';
import type { CometChatGroupsContextValue } from '../CometChatGroups.types';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

// --- Mock SDK ---
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {},
}));

// --- Mock base components with onChange handlers that actually fire ---
vi.mock('../../base/CometChatAvatar/CometChatAvatar', () => ({
  CometChatAvatar: Object.assign(() => <div />, {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Image: () => <span />,
    Initials: () => <span />,
    StatusIndicator: () => <span />,
  }),
}));

vi.mock('../../base/CometChatCheckbox/CometChatCheckbox', () => ({
  CometChatCheckbox: ({
    onChange,
  }: {
    checked: boolean;
    onChange: (event: { checked: boolean; shiftKey?: boolean }) => void;
    'aria-label': string;
  }) => (
    <button
      data-testid="mock-checkbox"
      onClick={() => onChange({ checked: true, shiftKey: false })}
    />
  ),
}));

vi.mock('../../base/CometChatRadioButton/CometChatRadioButton', () => ({
  CometChatRadioButton: ({
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
    ariaLabel: string;
    name: string;
  }) => <button data-testid="mock-radio" onClick={onChange} />,
}));

vi.mock('../../base/CometChatContextMenu/CometChatContextMenu', () => ({
  CometChatContextMenu: Object.assign(() => <div data-testid="context-menu" />, {
    Root: () => <div data-testid="context-menu" />,
  }),
}));

function createMockGroup(
  guid: string,
  name = 'Group',
  type = 'public',
  membersCount = 5
): CometChat.Group {
  return {
    getGuid: () => guid,
    getName: () => name,
    getType: () => type,
    getIcon: () => '',
    getMembersCount: () => membersCount,
    getScope: () => 'admin',
    getOwner: () => 'owner-1',
    getHasJoined: () => true,
  } as unknown as CometChat.Group;
}

function createCtx(
  overrides: Partial<CometChatGroupsContextValue> = {}
): CometChatGroupsContextValue {
  return {
    groups: [],
    fetchState: 'loaded',
    hasMore: false,
    error: null,
    selectedGroupIds: [],
    selectedGroupsMap: new Map(),
    activeGroupId: null,
    searchText: '',
    selectionMode: 'none',
    hideGroupType: false,
    hideSearch: false,
    options: undefined,
    fetchNext: vi.fn(),
    setSearchText: vi.fn(),
    selectGroup: vi.fn(),
    deselectGroup: vi.fn(),
    selectRange: vi.fn(),
    deselectRange: vi.fn(),
    clearSelection: vi.fn(),
    setActiveGroup: vi.fn(),
    handleItemClick: vi.fn(),
    createGroup: vi.fn(),
    joinGroup: vi.fn(),
    leaveGroup: vi.fn(),
    deleteGroup: vi.fn(),
    ...overrides,
  };
}

describe('CometChatGroupsItem — callback coverage', () => {
  it('handleCheckboxChange fires handleItemClick via checkbox onChange', () => {
    const handleItemClick = vi.fn();
    const group = createMockGroup('g1', 'Test', 'public', 5);
    const ctx = createCtx({ selectionMode: 'multiple', handleItemClick });

    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    fireEvent.click(screen.getByTestId('mock-checkbox'));
    expect(handleItemClick).toHaveBeenCalledWith(group, { shiftKey: false });
  });

  it('handleRadioChange fires handleItemClick via radio onChange', () => {
    const handleItemClick = vi.fn();
    const group = createMockGroup('g1', 'Test', 'public', 5);
    const ctx = createCtx({ selectionMode: 'single', handleItemClick });

    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    fireEvent.click(screen.getByTestId('mock-radio'));
    expect(handleItemClick).toHaveBeenCalledWith(group);
  });

  it('getTypeAriaLabel returns correct label for each type', () => {
    const privateGroup = createMockGroup('g1', 'Private', 'private');
    const passwordGroup = createMockGroup('g2', 'Password', 'password');
    const ctx = createCtx();

    const { rerender } = render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={privateGroup} />
      </CometChatGroupsContext.Provider>
    );
    expect(screen.getByLabelText('Private group')).toBeInTheDocument();

    rerender(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={passwordGroup} />
      </CometChatGroupsContext.Provider>
    );
    expect(screen.getByLabelText('Password protected group')).toBeInTheDocument();
  });

  it('renders singular "Member" for count of 1', () => {
    const group = createMockGroup('g1', 'Solo', 'public', 1);
    const ctx = createCtx();

    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByText('1 Member')).toBeInTheDocument();
  });

  it('renders context menu when options are provided', () => {
    const group = createMockGroup('g1', 'Test');
    const ctx = createCtx({
      options: () => [{ id: 'opt1', title: 'Option 1', onClick: vi.fn() }],
    });

    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByTestId('context-menu')).toBeInTheDocument();
  });

  it('renders custom trailingView when provided', () => {
    const group = createMockGroup('g1', 'Test');
    const ctx = createCtx({ selectionMode: 'multiple' });

    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem
          group={group}
          trailingView={<span data-testid="custom-trail">X</span>}
        />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByTestId('custom-trail')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-checkbox')).not.toBeInTheDocument();
  });

  it('renders custom leadingView when provided', () => {
    const group = createMockGroup('g1', 'Test');
    const ctx = createCtx();

    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} leadingView={<span data-testid="custom-lead">L</span>} />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByTestId('custom-lead')).toBeInTheDocument();
  });

  it('renders custom titleView when provided', () => {
    const group = createMockGroup('g1', 'Test');
    const ctx = createCtx();

    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} titleView={<span data-testid="custom-title">T</span>} />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
  });

  it('renders custom subtitleView when provided', () => {
    const group = createMockGroup('g1', 'Test');
    const ctx = createCtx();

    render(
      <CometChatGroupsContext.Provider value={ctx}>
        <CometChatGroupsItem group={group} subtitleView={<span data-testid="custom-sub">S</span>} />
      </CometChatGroupsContext.Provider>
    );

    expect(screen.getByTestId('custom-sub')).toBeInTheDocument();
  });
});
