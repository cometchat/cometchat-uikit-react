import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPinnedMessages } from '../CometChatPinnedMessages';
import { CometChatUIKit } from '../../../CometChatUIKit/CometChatUIKit';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import { CometChatPluginRegistry } from '../../../plugins/CometChatPluginRegistry';
import { CometChatThemeContext } from '../../../context/ThemeContext';
import { resolvePinSaveFeatures, resetPinSaveFeatures } from '../../../utils/pinSaveFeatures';
import { buildUser, buildGroup } from '../../../testing/mock-builders';
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

function mockRequest(messages: CometChat.BaseMessage[]) {
  let call = 0;
  vi.spyOn(CometChat, 'MessagesRequestBuilder').mockImplementation(() => {
    const builder = {
      setLimit: () => builder,
      setPinned: () => builder,
      setGUID: () => builder,
      setUID: () => builder,
      build: () => ({
        fetchPrevious: () => Promise.resolve(call++ === 0 ? messages : []),
        hasMore: () => false,
      }),
    };
    return builder as unknown as CometChat.MessagesRequestBuilder;
  });
}

function adminGroup() {
  const g = buildGroup() as unknown as CometChat.Group;
  Object.assign(g, {
    getGuid: () => 'g1',
    getScope: () => CometChat.GROUP_MEMBER_SCOPE.ADMIN,
    getOwner: () => 'someone-else',
  });
  return g;
}

function renderPanel(props: Record<string, unknown> = {}, dir: 'ltr' | 'rtl' = 'ltr') {
  return render(
    <div dir={dir}>
      <CometChatPluginRegistryContext.Provider value={registry}>
        <CometChatThemeContext.Provider value={{ theme: 'light', setTheme: vi.fn() }}>
          <CometChatPinnedMessages group={adminGroup()} {...props} />
        </CometChatThemeContext.Provider>
      </CometChatPluginRegistryContext.Provider>
    </div>
  );
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

describe('CometChatPinnedMessages — accessibility', () => {
  it('has no axe violations with rows', async () => {
    mockRequest([pinnedMessage(1), pinnedMessage(2)]);
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
      expect(screen.getByText('No pinned messages yet')).toBeInTheDocument();
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('exposes the panel as a named dialog', async () => {
    mockRequest([pinnedMessage(1)]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(screen.getByRole('dialog', { name: 'Pinned Messages' })).toBeInTheDocument();
  });

  it('names each row by its sender before saying what activating it does', async () => {
    mockRequest([pinnedMessage(1)]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    // The name has to lead with something ABOUT the row. A bare "Go to message"
    // made every row announce identically, so the list could not be navigated by
    // voice or scanned by a screen reader.
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-label', 'Other. Go to message');
  });

  it('still names the row when the message exposes no readable body', async () => {
    // The preview builder reaches for per-type accessors; a message-like object
    // missing one must cost the preview, never the panel.
    mockRequest([pinnedMessage(1)]);
    renderPanel();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(screen.getByRole('listitem').getAttribute('aria-label')).toContain('Go to message');
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    mockRequest([pinnedMessage(1)]);
    const { container } = renderPanel({ onClose });
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    fireEvent.keyDown(container.querySelector('.cometchat-pinned-messages')!, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders under dir="rtl" without axe violations', async () => {
    mockRequest([pinnedMessage(1)]);
    const { container } = renderPanel({}, 'rtl');
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
