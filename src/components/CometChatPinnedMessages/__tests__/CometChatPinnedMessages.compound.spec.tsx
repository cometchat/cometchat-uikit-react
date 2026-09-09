import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPinnedMessages } from '../CometChatPinnedMessages';
import { useCometChatPinnedMessagesContext } from '../CometChatPinnedMessages.context';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatThemeContext } from '../../../context/ThemeContext';
import { resolvePinSaveFeatures, resetPinSaveFeatures } from '../../../utils/pinSaveFeatures';
import { buildUser, buildGroup } from '../../../testing/mock-builders';
import type { CometChatMessagePlugin } from '../../../plugins/plugin.types';

const loggedInUser = buildUser({ uid: 'me' }) as unknown as CometChat.User;

const textPlugin: CometChatMessagePlugin = {
  id: 'text',
  messageTypes: ['text'],
  messageCategories: ['message'],
  renderBubble: () => React.createElement('span', { 'data-testid': 'bubble' }, 'Body'),
};
const registry = new CometChatPluginRegistry([textPlugin]);

function pinnedMessage(id: number): CometChat.BaseMessage {
  return {
    getId: () => id,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({
      getUid: () => 'other',
      getName: () => 'Other',
      getAvatar: () => '',
      getStatus: () => 'online',
    }),
    getReceiverType: () => 'group',
    getReceiverId: () => 'g1',
    getSentAt: () => 1735689600,
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMuid: () => `m-${String(id)}`,
    getParentMessageId: () => 0,
    getPinnedAt: () => 1735689600,
    getPinnedBy: () => 'admin',
    getSavedAt: () => undefined,
    isPinned: () => true,
    isSaved: () => false,
  } as unknown as CometChat.BaseMessage;
}

function mockPinnedRequest(pages: CometChat.BaseMessage[][]) {
  let call = 0;
  vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
    const builder = {
      setLimit: () => builder,
      setPinned: () => builder,
      setGUID: () => builder,
      setUID: () => builder,
      build: () => ({
        fetchPrevious: () => Promise.resolve(pages[call++] ?? []),
        hasMore: () => call < pages.length,
      }),
    };
    return builder as unknown as CometChat.MessagesRequestBuilder;
  });
}

function scopedGroup() {
  const g = buildGroup() as unknown as CometChat.Group;
  Object.assign(g, {
    getGuid: () => 'g1',
    getScope: () => CometChat.GROUP_MEMBER_SCOPE.ADMIN,
    getOwner: () => 'someone-else',
  });
  return g;
}

beforeEach(async () => {
  vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInUser);
  resetPinSaveFeatures();
  vi.spyOn(CometChat, 'isPinMessageEnabled').mockResolvedValue(true);
  vi.spyOn(CometChat, 'isSaveMessageEnabled').mockResolvedValue(true);
  vi.spyOn(CometChat, 'isPinConversationEnabled').mockResolvedValue(true);
  await resolvePinSaveFeatures();
});
afterEach(() => {
  vi.restoreAllMocks();
  resetPinSaveFeatures();
});

describe('CometChatPinnedMessages — compound', () => {
  it('exposes the compound statics', () => {
    expect(typeof CometChatPinnedMessages.Root).toBe('function');
    expect(typeof CometChatPinnedMessages.List).toBe('function');
    expect(typeof CometChatPinnedMessages.Item).toBe('function');
    expect(typeof CometChatPinnedMessages.Header).toBe('function');
    expect(typeof CometChatPinnedMessages.EmptyState).toBe('function');
    expect(typeof CometChatPinnedMessages.ErrorState).toBe('function');
    expect(typeof CometChatPinnedMessages.LoadingState).toBe('function');
  });

  it('renders a Root + Header + List composition', async () => {
    mockPinnedRequest([[pinnedMessage(1)]]);
    render(
      <CometChatPluginRegistryContext.Provider value={registry}>
        <CometChatThemeContext.Provider value={{ theme: 'light', setTheme: vi.fn() }}>
          <CometChatPinnedMessages.Root group={scopedGroup()}>
            <CometChatPinnedMessages.Header />
            <CometChatPinnedMessages.List />
          </CometChatPinnedMessages.Root>
        </CometChatThemeContext.Provider>
      </CometChatPluginRegistryContext.Provider>
    );
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(screen.getByText('Pinned Messages')).toBeInTheDocument();
    expect(screen.getByTestId('bubble')).toBeInTheDocument();
  });

  it('throws when the context hook is used outside Root', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCometChatPinnedMessagesContext())).toThrow(
      /must be used within a <CometChatPinnedMessages.Root>/
    );
    spy.mockRestore();
  });
});
