/**
 * Tests for the CometChatUsers.Root `autoFocus` prop.
 *
 * When set, the list should receive focus once users first load, so keyboard
 * shortcuts (e.g. Ctrl/Cmd+A select-all) work without a prior click.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { CometChatUsers } from '../CometChatUsers';

const mockFetchNext = vi.fn();

// jsdom has no IntersectionObserver (used by the list's infinite scroll).
vi.stubGlobal(
  'IntersectionObserver',
  vi.fn(() => ({ observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() }))
);

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    UsersRequestBuilder: vi.fn(() => ({
      setLimit: vi.fn().mockReturnThis(),
      setSearchKeyword: vi.fn().mockReturnThis(),
      build: vi.fn(() => ({ fetchNext: mockFetchNext })),
    })),
    UserListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    ConnectionListener: vi.fn((callbacks: Record<string, unknown>) => callbacks),
    addUserListener: vi.fn(),
    removeUserListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
  },
}));

function createMockUser(uid: string, name: string) {
  return {
    getUid: () => uid,
    getName: () => name,
    getStatus: () => 'online',
    getAvatar: () => `https://example.com/${uid}.png`,
    getBlockedByMe: () => false,
    getHasBlockedMe: () => false,
  } as unknown as CometChat.User;
}

describe('CometChatUsers.Root autoFocus', () => {
  beforeEach(() => {
    mockFetchNext.mockReset();
    mockFetchNext.mockResolvedValue([createMockUser('u1', 'Alice'), createMockUser('u2', 'Bob')]);
  });

  it('focuses the list once users load when autoFocus is set', async () => {
    render(
      <CometChatUsers.Root autoFocus selectionMode="multiple">
        <CometChatUsers.List />
      </CometChatUsers.Root>
    );

    const listbox = await screen.findByRole('listbox');
    await waitFor(() => {
      expect(listbox).toHaveFocus();
    });
  });

  // Review follow-up: autoFocus is a one-shot convenience, not a focus trap.
  it('does not take focus the user already moved inside the component', async () => {
    // Slow first page: the user clicks the search bar and starts typing before
    // it arrives.
    let resolveFetch: ((users: unknown[]) => void) | undefined;
    mockFetchNext.mockReturnValue(
      new Promise(resolve => {
        resolveFetch = resolve as (users: unknown[]) => void;
      })
    );

    render(
      <CometChatUsers.Root autoFocus selectionMode="multiple">
        <CometChatUsers.SearchBar />
        <CometChatUsers.List />
      </CometChatUsers.Root>
    );

    const search = await screen.findByRole('searchbox');
    search.focus();
    expect(search).toHaveFocus();

    await act(async () => {
      resolveFetch?.([createMockUser('u1', 'Alice'), createMockUser('u2', 'Bob')]);
      await Promise.resolve();
    });

    const listbox = await screen.findByRole('listbox');
    expect(listbox).not.toHaveFocus();
    expect(search).toHaveFocus();
  });

  it('is consumed by an empty first load, so later results do not grab focus', async () => {
    // First page comes back empty — no listbox is rendered at all.
    mockFetchNext.mockResolvedValueOnce([]);

    render(
      <CometChatUsers.Root autoFocus selectionMode="multiple">
        <CometChatUsers.SearchBar />
        <CometChatUsers.List />
      </CometChatUsers.Root>
    );

    const search = await screen.findByRole('searchbox');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    // The user searches; results arrive while they are still typing.
    mockFetchNext.mockResolvedValue([createMockUser('u1', 'Alice')]);
    search.focus();
    fireEvent.change(search, { target: { value: 'al' } });

    const listbox = await screen.findByRole('listbox', {}, { timeout: 3000 });
    expect(listbox).not.toHaveFocus();
    expect(search).toHaveFocus();
  });

  it('does not steal focus when autoFocus is not set', async () => {
    render(
      <CometChatUsers.Root selectionMode="multiple">
        <CometChatUsers.List />
      </CometChatUsers.Root>
    );

    const listbox = await screen.findByRole('listbox');
    expect(listbox).not.toHaveFocus();
  });
});
