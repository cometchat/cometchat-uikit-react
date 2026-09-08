import { render, screen, waitFor, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSavedMessages } from '../CometChatSavedMessages';
import { useCometChatSavedMessagesContext } from '../CometChatSavedMessages.context';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatThemeContext } from '../../../context/ThemeContext';
import { buildUser } from '../../../testing/mock-builders';

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {
      /* no-op */
    }
    disconnect() {
      /* no-op */
    }
    unobserve() {
      /* no-op */
    }
  }
);

const loggedInUser = buildUser({ uid: 'me' }) as unknown as CometChat.User;
const registry = new CometChatPluginRegistry([]);

function savedMessage(id: number): CometChat.BaseMessage {
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
    getReceiverType: () => 'user',
    getReceiverId: () => 'me',
    getReceiver: () => ({ getName: () => 'Other', getAvatar: () => '' }),
    getText: () => 'Hello there',
    getSentAt: () => 1735689600,
    getMetadata: () => ({}),
    getParentMessageId: () => 0,
    getSavedAt: () => 1735689600,
    isSaved: () => true,
    isPinned: () => false,
  } as unknown as CometChat.BaseMessage;
}

function mockSavedRequest(pages: CometChat.BaseMessage[][]) {
  let call = 0;
  vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
    const builder = {
      setLimit: () => builder,
      setSaved: () => builder,
      build: () => ({
        fetchPrevious: () => Promise.resolve(pages[call++] ?? []),
        hasMore: () => false,
      }),
    };
    return builder as unknown as CometChat.MessagesRequestBuilder;
  });
}

beforeEach(() => {
  vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInUser);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('CometChatSavedMessages — compound', () => {
  it('exposes the compound statics', () => {
    expect(typeof CometChatSavedMessages.Root).toBe('function');
    expect(typeof CometChatSavedMessages.List).toBe('function');
    expect(typeof CometChatSavedMessages.Item).toBe('function');
    expect(typeof CometChatSavedMessages.Header).toBe('function');
    expect(typeof CometChatSavedMessages.EmptyState).toBe('function');
    expect(typeof CometChatSavedMessages.ErrorState).toBe('function');
    expect(typeof CometChatSavedMessages.LoadingState).toBe('function');
  });

  it('renders a Root + Header + List composition', async () => {
    mockSavedRequest([[savedMessage(1)]]);
    render(
      <CometChatPluginRegistryContext.Provider value={registry}>
        <CometChatThemeContext.Provider value={{ theme: 'light', setTheme: vi.fn() }}>
          <CometChatSavedMessages.Root>
            <CometChatSavedMessages.Header />
            <CometChatSavedMessages.List />
          </CometChatSavedMessages.Root>
        </CometChatThemeContext.Provider>
      </CometChatPluginRegistryContext.Provider>
    );
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(screen.getByText('Saved Messages')).toBeInTheDocument();
  });

  it('throws when the context hook is used outside Root', () => {
    // Silence the expected React error boundary noise.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCometChatSavedMessagesContext())).toThrow(
      /must be used within a <CometChatSavedMessages.Root>/
    );
    spy.mockRestore();
  });
});
