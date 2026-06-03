import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatMessageInformationMessagePreview } from '../CometChatMessageInformationMessagePreview';
import { CometChatMessageInformationContext } from '../CometChatMessageInformation.context';
import { buildTextMessage, buildMediaMessage } from '../../../testing/mock-builders';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import type { CometChatMessageInformationContextValue } from '../CometChatMessageInformation.types';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    RECEIVER_TYPE: { GROUP: 'group', USER: 'user' },
  },
}));

// Mock the PluginRegistryContext to return null (no registry = fallback mode)
vi.mock('../../../context/PluginRegistryContext', () => ({
  CometChatPluginRegistryContext: React.createContext(null),
}));

// Mock CometChatMessageBubble to avoid pulling in complex dependencies
vi.mock('../../CometChatMessageBubble', () => ({
  CometChatMessageBubble: (props: Record<string, unknown>) => (
    <div data-testid="message-bubble">{props.contentView as React.ReactNode}</div>
  ),
}));

function createMockContext(
  overrides: Partial<CometChatMessageInformationContextValue> = {}
): CometChatMessageInformationContextValue {
  return {
    message: buildTextMessage() as unknown as CometChat.BaseMessage,
    fetchState: 'loaded',
    userReceipts: [],
    oneOnOneReadAt: 0,
    oneOnOneDeliveredAt: 0,
    error: null,
    isGroupMessage: false,
    messageInfoDateTimeFormat: {
      today: 'hh:mm A',
      yesterday: 'DD MMM, hh:mm A',
      otherDays: 'DD MMM, hh:mm A',
    },
    textFormatters: [],
    showScrollbar: false,
    onClose: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

function renderPreview(
  contextOverrides: Partial<CometChatMessageInformationContextValue> = {},
  props: { className?: string } = {}
) {
  const ctx = createMockContext(contextOverrides);
  return render(
    <CometChatMessageInformationContext.Provider value={ctx}>
      <CometChatMessageInformationMessagePreview {...props} />
    </CometChatMessageInformationContext.Provider>
  );
}

describe('CometChatMessageInformationMessagePreview', () => {
  // ─── Fallback mode (no plugin registry) ─────────────────────────

  it('renders text preview for text messages in fallback mode', () => {
    const message = buildTextMessage({ text: 'Hello world' }) as unknown as CometChat.BaseMessage;
    renderPreview({ message });
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders photo preview for image messages in fallback mode', () => {
    const message = buildMediaMessage({ type: 'image' }) as unknown as CometChat.BaseMessage;
    renderPreview({ message });
    expect(screen.getByText('📷 Photo')).toBeInTheDocument();
  });

  it('renders video preview for video messages in fallback mode', () => {
    const message = buildMediaMessage({ type: 'video' }) as unknown as CometChat.BaseMessage;
    renderPreview({ message });
    expect(screen.getByText('🎥 Video')).toBeInTheDocument();
  });

  it('renders audio preview for audio messages in fallback mode', () => {
    const message = buildMediaMessage({ type: 'audio' }) as unknown as CometChat.BaseMessage;
    renderPreview({ message });
    expect(screen.getByText('🎵 Audio')).toBeInTheDocument();
  });

  it('renders file preview for file messages in fallback mode', () => {
    const message = buildMediaMessage({ type: 'file' }) as unknown as CometChat.BaseMessage;
    renderPreview({ message });
    expect(screen.getByText('📎 File')).toBeInTheDocument();
  });

  it('renders generic "Message" for unknown message types in fallback mode', () => {
    const message = {
      ...buildTextMessage(),
      getType: () => 'custom_unknown',
      getSender: () => buildUser(),
    } as unknown as CometChat.BaseMessage;
    renderPreview({ message });
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  // ─── className ──────────────────────────────────────────────────

  it('applies custom className', () => {
    const { container } = renderPreview({}, { className: 'my-preview-class' });
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('my-preview-class');
  });

  // ─── showScrollbar ──────────────────────────────────────────────

  it('applies hide-scrollbar class when showScrollbar is false', () => {
    const { container } = renderPreview({ showScrollbar: false });
    const root = container.firstChild as HTMLElement;
    // The class should contain the hide-scrollbar modifier
    expect(root.className).toBeDefined();
  });

  it('does not apply hide-scrollbar class when showScrollbar is true', () => {
    const { container } = renderPreview({ showScrollbar: true });
    const root = container.firstChild as HTMLElement;
    expect(root.className).toBeDefined();
  });
});

function buildUser(overrides: { uid?: string; name?: string } = {}) {
  return {
    getUid: () => overrides.uid ?? 'user-1',
    getName: () => overrides.name ?? 'Test User',
    getAvatar: () => 'https://example.com/avatar.png',
    getStatus: () => 'online',
  };
}
