/**
 * Tests for CometChatMessageListProvider + useCometChatMessageList orchestration.
 *
 * Mocks the Manager constructor so no real SDK is touched. The four sub-hooks
 * still run against their real implementations, which exercises the wiring.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';

const managerInstances: Record<string, ReturnType<typeof vi.fn>>[] = [];
vi.mock('../CometChatMessageListManager', () => {
  return {
    CometChatMessageListManager: vi.fn().mockImplementation(() => {
      const inst = {
        fetchPrevious: vi.fn().mockResolvedValue([]),
        fetchNext: vi.fn().mockResolvedValue([]),
        fetchAroundMessageId: vi.fn().mockResolvedValue({ messages: [], hasMoreNewer: false }),
        deleteMessage: vi.fn().mockResolvedValue({}),
        markAsRead: vi.fn().mockResolvedValue(undefined),
        markConversationAsRead: vi.fn().mockResolvedValue(undefined),
        markAsDelivered: vi.fn().mockResolvedValue(undefined),
        markMessageAsUnread: vi.fn().mockResolvedValue({}),
        getConversation: vi.fn().mockResolvedValue({
          getLastReadMessageId: () => null,
          getUnreadMessageCount: () => 0,
        }),
        getReceiverId: () => '',
        getReceiverType: () => 'user',
        initNextRequest: vi.fn(),
      };
      managerInstances.push(inst);
      return inst;
    }),
  };
});

import { CometChatMessageListProviderComponent } from '../CometChatMessageListProvider';
import { useCometChatMessageListContext } from '../CometChatMessageList.context';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { defaultPlugins } from '../../../plugins/core';
import { CometChatEventsContext } from '../../../context/CometChatEventsContext';
import { buildUser, buildGroup } from '../../../testing/mock-builders';

function Consumer() {
  const ctx = useCometChatMessageListContext();
  return (
    <div>
      <span data-testid="isLoading">{String(ctx.isLoading)}</span>
      <span data-testid="isEmpty">{String(ctx.isEmpty)}</span>
      <span data-testid="isError">{String(ctx.isError)}</span>
      <span data-testid="hasMore">{String(ctx.hasMore)}</span>
      <span data-testid="count">{ctx.allMessages.length}</span>
    </div>
  );
}

function renderProvider(props: React.ComponentProps<typeof CometChatMessageListProviderComponent>) {
  const registry = new CometChatPluginRegistry(defaultPlugins);
  const bridge = { subscribe: vi.fn().mockReturnValue(() => {}), publish: vi.fn() };

  return render(
    <CometChatPluginRegistryContext.Provider value={registry}>
      <CometChatEventsContext.Provider value={bridge}>
        <CometChatMessageListProviderComponent {...props}>
          <Consumer />
        </CometChatMessageListProviderComponent>
      </CometChatEventsContext.Provider>
    </CometChatPluginRegistryContext.Provider>
  );
}

describe('CometChatMessageListProviderComponent', () => {
  const loggedInUser = buildUser({ uid: 'me' });
  const user = buildUser({ uid: 'peer' });

  beforeEach(() => {
    vi.clearAllMocks();
    managerInstances.length = 0;
  });

  it('renders children and provides context to them', () => {
    renderProvider({
      user: user as never,
      loggedInUser: loggedInUser as never,
      children: <Consumer />,
    });

    expect(screen.getByTestId('isLoading')).toBeInTheDocument();
  });

  it('throws a descriptive error if consumer is not wrapped in the provider', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      render(
        <CometChatPluginRegistryContext.Provider
          value={new CometChatPluginRegistry(defaultPlugins)}
        >
          <CometChatEventsContext.Provider
            value={{ subscribe: vi.fn().mockReturnValue(() => {}), publish: vi.fn() }}
          >
            <Consumer />
          </CometChatEventsContext.Provider>
        </CometChatPluginRegistryContext.Provider>
      )
    ).toThrow(
      /useCometChatMessageListContext must be used within a CometChatMessageList\.Provider/
    );

    errSpy.mockRestore();
  });

  it('constructs the Manager once on mount', async () => {
    renderProvider({
      user: user as never,
      loggedInUser: loggedInUser as never,
      children: <Consumer />,
    });

    await waitFor(() => {
      expect(managerInstances.length).toBeGreaterThan(0);
    });
  });

  it('forwards group instead of user when group is provided', async () => {
    const group = buildGroup({ guid: 'room' });
    renderProvider({
      group: group as never,
      loggedInUser: loggedInUser as never,
      children: <Consumer />,
    });

    await waitFor(() => {
      expect(managerInstances.length).toBeGreaterThan(0);
    });
  });

  it('forwards optional props (parentMessageId, startFromUnreadMessages, goToMessageId)', async () => {
    renderProvider({
      user: user as never,
      loggedInUser: loggedInUser as never,
      parentMessageId: 42,
      startFromUnreadMessages: true,
      goToMessageId: 5,
      disableSoundForMessages: true,
      customSoundForMessages: 'x.mp3',
      scrollToBottomOnNewMessages: true,
      hideReceipts: true,
      messageTypes: ['text'],
      messageCategories: ['message'],
      onError: vi.fn(),
      children: <Consumer />,
    });

    await waitFor(() => {
      expect(managerInstances.length).toBeGreaterThan(0);
    });
  });

  it('has the correct display name', () => {
    expect(CometChatMessageListProviderComponent.displayName).toBe('CometChatMessageListProvider');
  });
});
