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

  it('keeps the timestamp but hides the receipt for deleted messages', () => {
    // Outgoing (sender === logged-in user) so a receipt would otherwise render.
    const msg = buildDeletedMessage({
      sender: buildUser({ uid: 'me' }),
    }) as unknown as CometChat.BaseMessage;
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} index={0} total={1} />
    );
    expect(screen.getByTestId('delete-bubble')).toBeInTheDocument();
    // Timestamp still shown...
    expect(container.querySelector('time')).toBeTruthy();
    // ...but no receipt icon.
    expect(container.querySelector('[class*="cometchat-receipts"]')).toBeNull();
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

  it('suppresses the status info view for a non-errored first-batch message', () => {
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'me' }), // outgoing → a receipt would otherwise show
    }) as unknown as CometChat.BaseMessage;
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} index={0} total={2} batchPosition="first" />
    );
    expect(container.querySelector('[class*="cometchat-receipts"]')).toBeNull();
    expect(container.querySelector('time')).toBeNull();
  });

  it('surfaces the whole status info view for an errored message even mid-batch', () => {
    // An RBAC/send failure sets _ccError; getReceiptStatus() → 'error'.
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'me' }),
    }) as unknown as CometChat.BaseMessage;
    (msg as unknown as { _ccError: unknown })._ccError = { code: 'ERR_X', message: 'failed' };
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} index={0} total={2} batchPosition="first" />
    );
    // Not suppressed: the error receipt (and timestamp) render despite first position.
    expect(container.querySelector('[class*="cometchat-receipts-error"]')).toBeTruthy();
    expect(container.querySelector('time')).toBeTruthy();
  });

  it('surfaces the status info view for a PINNED message even mid-batch', () => {
    // Batching normally hides the meta row on first/middle attachments, but that
    // is the only place the pin indicator lives — suppressing it would make the
    // state invisible on exactly the messages a user pinned.
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'me' }),
    }) as unknown as CometChat.BaseMessage;
    Object.assign(msg, {
      getPinnedAt: () => 1735689600,
      isPinned: () => true,
      getSavedAt: () => undefined,
      isSaved: () => false,
    });
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} index={0} total={2} batchPosition="middle" />
    );
    expect(container.querySelector('[class*="status-info-view-indicator--pinned"]')).toBeTruthy();
  });

  it('surfaces the status info view for a SAVED message even mid-batch', () => {
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'me' }),
    }) as unknown as CometChat.BaseMessage;
    Object.assign(msg, {
      getPinnedAt: () => undefined,
      isPinned: () => false,
      getSavedAt: () => 1735689600,
      isSaved: () => true,
    });
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} index={0} total={2} batchPosition="first" />
    );
    expect(container.querySelector('[class*="status-info-view-indicator--saved"]')).toBeTruthy();
  });

  it('still suppresses mid-batch when the message is neither pinned nor saved', () => {
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'me' }),
    }) as unknown as CometChat.BaseMessage;
    Object.assign(msg, {
      getPinnedAt: () => undefined,
      isPinned: () => false,
      getSavedAt: () => undefined,
      isSaved: () => false,
    });
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} index={0} total={2} batchPosition="middle" />
    );
    expect(container.querySelector('time')).toBeNull();
    expect(container.querySelector('[class*="status-info-view-indicator"]')).toBeNull();
  });

  it('shows the thread footer for a message with replies', () => {
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'other' }),
      replyCount: 3,
    }) as unknown as CometChat.BaseMessage;
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} index={0} total={1} />
    );
    expect(container.querySelector('[class*="cometchat-thread-view"]')).toBeTruthy();
  });

  it('hides the thread footer on a deleted message even with a non-zero reply count', () => {
    // A message deleted in realtime keeps its replyCount; the tombstone must not
    // still render the "N replies" footer.
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'other' }),
      replyCount: 3,
    }) as unknown as CometChat.BaseMessage;
    Object.assign(msg, { getDeletedAt: () => Math.floor(Date.now() / 1000) });
    const { container } = renderWithProviders(
      <CometChatMessageBubbleRenderer message={msg} index={0} total={1} />
    );
    expect(container.querySelector('[class*="cometchat-thread-view"]')).toBeNull();
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

/**
 * Every core plugin derives its own palette from `context.alignment === 'right'`
 * — that is how a text bubble picks white-on-purple and an audio bubble picks
 * its play-button colours. So when `bubbleVariant` forces a palette apart from
 * layout, the plugins have to follow the variant, or the container turns purple
 * while its contents stay styled for an incoming bubble.
 */
describe('CometChatMessageBubbleRenderer — palette vs layout', () => {
  /** Records the alignment the plugin was handed. */
  function alignmentProbe() {
    const seen: string[] = [];
    const probePlugin: CometChatMessagePlugin = {
      id: 'text',
      messageTypes: ['text'],
      messageCategories: ['message'],
      renderBubble: (_m, context) => {
        seen.push(context.alignment);
        return React.createElement('span', { 'data-testid': 'text-bubble' }, 'Text');
      },
    };
    return { seen, registry: new CometChatPluginRegistry([probePlugin]) };
  }

  function renderWith(registryOverride: CometChatPluginRegistry, ui: React.ReactElement) {
    return render(
      <CometChatPluginRegistryContext.Provider value={registryOverride}>
        <CometChatThemeContext.Provider value={{ theme: 'light' as const, setTheme: vi.fn() }}>
          {ui}
        </CometChatThemeContext.Provider>
      </CometChatPluginRegistryContext.Provider>
    );
  }

  it('hands plugins the outgoing palette even when the row is laid out left', () => {
    const { seen, registry: probeRegistry } = alignmentProbe();
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'other' }),
    }) as unknown as CometChat.BaseMessage;
    renderWith(
      probeRegistry,
      <CometChatMessageBubbleRenderer
        message={msg}
        index={0}
        total={1}
        messageAlignment={0}
        bubbleVariant="outgoing"
      />
    );
    expect(seen).toContain('right');
  });

  it('still lays the bubble out on the left', () => {
    const { registry: probeRegistry } = alignmentProbe();
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'other' }),
    }) as unknown as CometChat.BaseMessage;
    const { container } = renderWith(
      probeRegistry,
      <CometChatMessageBubbleRenderer
        message={msg}
        index={0}
        total={1}
        messageAlignment={0}
        bubbleVariant="outgoing"
      />
    );
    // Layout follows alignment…
    expect(container.querySelector('.cometchat-message-bubble__wrapper--outgoing')).toBeNull();
    // …while the palette follows the variant.
    expect(container.querySelector('.cometchat-message-bubble-outgoing')).toBeTruthy();
  });

  it('falls back to alignment when no variant is given', () => {
    const { seen, registry: probeRegistry } = alignmentProbe();
    const msg = buildTextMessage({
      sender: buildUser({ uid: 'me' }),
    }) as unknown as CometChat.BaseMessage;
    renderWith(
      probeRegistry,
      <CometChatMessageBubbleRenderer message={msg} index={0} total={1} messageAlignment={0} />
    );
    expect(seen).toContain('left');
  });
});
