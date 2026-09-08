import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSavedMessages } from '../CometChatSavedMessages';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatThemeContext } from '../../../context/ThemeContext';
import { buildUser } from '../../../testing/mock-builders';
import type { CometChatMessagePlugin } from '../../../plugins/plugin.types';

expect.extend(toHaveNoViolations);

const loggedInUser = buildUser({ uid: 'me' }) as unknown as CometChat.User;

const textPlugin: CometChatMessagePlugin = {
  id: 'text',
  messageTypes: ['text'],
  messageCategories: ['message'],
  renderBubble: () => React.createElement('span', null, 'Body'),
};
const registry = new CometChatPluginRegistry([textPlugin]);

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
    getDeliveredAt: () => 0,
    getReadAt: () => 0,
    getEditedAt: () => 0,
    getDeletedAt: () => 0,
    getReplyCount: () => 0,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMuid: () => `m-${String(id)}`,
    getParentMessageId: () => 0,
    getSavedAt: () => 1,
    getPinnedAt: () => undefined,
    isSaved: () => true,
    isPinned: () => false,
  } as unknown as CometChat.BaseMessage;
}

function mockRequest(messages: CometChat.BaseMessage[]) {
  let call = 0;
  vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
    const builder = {
      setLimit: () => builder,
      setSaved: () => builder,
      build: () => ({
        fetchPrevious: () => Promise.resolve(call++ === 0 ? messages : []),
        hasMore: () => false,
      }),
    };
    return builder as unknown as CometChat.MessagesRequestBuilder;
  });
}

function renderPanel(props: Record<string, unknown> = {}, dir: 'ltr' | 'rtl' = 'ltr') {
  return render(
    <div dir={dir}>
      <CometChatPluginRegistryContext.Provider value={registry}>
        <CometChatThemeContext.Provider value={{ theme: 'light', setTheme: vi.fn() }}>
          <CometChatSavedMessages {...props} />
        </CometChatThemeContext.Provider>
      </CometChatPluginRegistryContext.Provider>
    </div>
  );
}

beforeEach(() => {
  vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInUser);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CometChatSavedMessages — accessibility', () => {
  it('has no axe violations with rows', async () => {
    mockRequest([savedMessage(1), savedMessage(2)]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations in the empty state', async () => {
    mockRequest([]);
    const { container } = renderPanel();
    await waitFor(() => {
      expect(screen.getByText('No saved messages yet')).toBeInTheDocument();
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('exposes the panel as a named dialog', async () => {
    mockRequest([savedMessage(1)]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(screen.getByRole('dialog', { name: 'Saved Messages' })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    mockRequest([savedMessage(1)]);
    const { container } = renderPanel({ onClose });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    fireEvent.keyDown(container.querySelector('.cometchat-saved-messages')!, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders under dir="rtl" without axe violations', async () => {
    mockRequest([savedMessage(1)]);
    const { container } = renderPanel({}, 'rtl');
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
