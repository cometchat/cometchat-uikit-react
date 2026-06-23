import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CometChatThreadHeaderParentBubble } from '../CometChatThreadHeaderParentBubble';
import { CometChatThreadHeaderContext } from '../CometChatThreadHeader.context';
import { CometChatPluginRegistryContext } from '../../../context/PluginRegistryContext';
import type { CometChatThreadHeaderContextValue } from '../CometChatThreadHeader.types';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../../hooks/useLocale', () => ({
  useLocale: () => ({
    getLocalizedString: (key: string) => key,
    language: 'en-us',
  }),
}));

vi.mock('../../../hooks/useCometChatEvents', () => ({
  useCometChatEvents: vi.fn(),
}));

// Mock useLoggedInUser — returns a logged-in user by default
const mockLoggedInUser = {
  getUid: () => 'logged-in-user',
  getName: () => 'Me',
  getAvatar: () => '',
};

vi.mock('../../../hooks/useLoggedInUser', () => ({
  useLoggedInUser: () => mockLoggedInUser,
}));

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    MessageListener: vi.fn().mockImplementation((callbacks: unknown) => callbacks),
    getLoggedinUser: () => mockLoggedInUser,
  },
}));

// Mock CometChatMessageBubble to inspect props passed to it
vi.mock('../../CometChatMessageBubble', () => ({
  CometChatMessageBubble: (props: Record<string, unknown>) => (
    <div
      data-testid="mock-message-bubble"
      data-alignment={props.alignment}
      data-hide-thread-view={String(props.hideThreadView)}
      data-disable-interaction={String(props.disableInteraction)}
    >
      {props.contentView as React.ReactNode}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockMessage(overrides: Record<string, unknown> = {}) {
  return {
    getId: () => overrides.id ?? 1001,
    getType: () => overrides.type ?? 'text',
    getCategory: () => overrides.category ?? 'message',
    getSender: () => ({
      getUid: () => overrides.senderUid ?? 'user-123',
      getName: () => overrides.senderName ?? 'John Doe',
      getAvatar: () => '',
    }),
    getReplyCount: () => overrides.replyCount ?? 5,
    getSentAt: () => Math.floor(Date.now() / 1000),
    getDeletedAt: () => null,
    getEditedAt: () => null,
    getReadAt: () => null,
    getDeliveredAt: () => null,
    getParentMessageId: () => 0,
    getText: () => overrides.text ?? 'Hello world',
    getReceiverType: () => 'user',
    getReceiver: () => ({ getUid: () => 'receiver-456', getName: () => 'Jane' }),
    getMuid: () => 'muid-1001',
    getConversationId: () => 'conv-1',
    getRawMessage: () => ({}),
    getMetadata: () => null,
    getData: () => ({}),
    getAttachments: () => [],
    getAttachment: () => null,
    getMentionedUsers: () => [],
    getReactions: () => [],
  } as unknown as CometChat.BaseMessage;
}

function createMockContext(
  overrides: Partial<CometChatThreadHeaderContextValue> = {}
): CometChatThreadHeaderContextValue {
  return {
    parentMessage: createMockMessage(),
    replyCount: 5,
    senderName: 'John Doe',
    onClose: vi.fn(),
    ...overrides,
  };
}

function renderWithContext(
  ui: React.ReactElement,
  contextValue: CometChatThreadHeaderContextValue,
  registry: unknown = null
) {
  return render(
    <CometChatPluginRegistryContext.Provider value={registry as never}>
      <CometChatThreadHeaderContext.Provider value={contextValue}>
        {ui}
      </CometChatThreadHeaderContext.Provider>
    </CometChatPluginRegistryContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CometChatThreadHeaderParentBubble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fallback rendering (no plugin registry)', () => {
    it('renders a text message preview when no plugin registry is available', () => {
      const ctx = createMockContext({
        parentMessage: createMockMessage({ type: 'text', text: 'Hello world' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, null);

      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('truncates long text messages to 100 characters with ellipsis', () => {
      const longText = 'A'.repeat(150);
      const ctx = createMockContext({
        parentMessage: createMockMessage({ type: 'text', text: longText }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, null);

      const expected = 'A'.repeat(100) + '...';
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('renders "Text message" for empty text messages', () => {
      const ctx = createMockContext({
        parentMessage: createMockMessage({ type: 'text', text: '' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, null);

      expect(screen.getByText('Text message')).toBeInTheDocument();
    });

    it('renders 📷 Photo for image messages', () => {
      const ctx = createMockContext({
        parentMessage: createMockMessage({ type: 'image' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, null);

      expect(screen.getByText('📷 Photo')).toBeInTheDocument();
    });

    it('renders 🎥 Video for video messages', () => {
      const ctx = createMockContext({
        parentMessage: createMockMessage({ type: 'video' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, null);

      expect(screen.getByText('🎥 Video')).toBeInTheDocument();
    });

    it('renders 🎵 Audio for audio messages', () => {
      const ctx = createMockContext({
        parentMessage: createMockMessage({ type: 'audio' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, null);

      expect(screen.getByText('🎵 Audio')).toBeInTheDocument();
    });

    it('renders 📎 File for file messages', () => {
      const ctx = createMockContext({
        parentMessage: createMockMessage({ type: 'file' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, null);

      expect(screen.getByText('📎 File')).toBeInTheDocument();
    });

    it('renders "Message" for unknown message types', () => {
      const ctx = createMockContext({
        parentMessage: createMockMessage({ type: 'extension_poll' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, null);

      expect(screen.getByText('Message')).toBeInTheDocument();
    });
  });

  describe('plugin registry rendering', () => {
    it('renders CometChatMessageBubble when plugin provides content', () => {
      const mockPlugin = {
        id: 'text',
        messageTypes: ['text'],
        messageCategories: ['message'],
        renderBubble: () => <span data-testid="plugin-bubble-content">Plugin rendered</span>,
      };
      const mockRegistry = {
        findPlugin: () => mockPlugin,
      };

      const ctx = createMockContext({
        parentMessage: createMockMessage({ type: 'text', text: 'Hello' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, mockRegistry);

      expect(screen.getByTestId('mock-message-bubble')).toBeInTheDocument();
      expect(screen.getByTestId('plugin-bubble-content')).toBeInTheDocument();
    });

    it('falls back to simple preview when plugin.renderBubble throws', () => {
      const mockPlugin = {
        id: 'text',
        messageTypes: ['text'],
        messageCategories: ['message'],
        renderBubble: () => {
          throw new Error('Plugin error');
        },
      };
      const mockRegistry = {
        findPlugin: () => mockPlugin,
      };

      const ctx = createMockContext({
        parentMessage: createMockMessage({ type: 'text', text: 'Fallback text' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, mockRegistry);

      // Should fall back to simple preview
      expect(screen.getByText('Fallback text')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-message-bubble')).not.toBeInTheDocument();
    });

    it('falls back to simple preview when registry has no matching plugin', () => {
      const mockRegistry = {
        findPlugin: () => null,
      };

      const ctx = createMockContext({
        parentMessage: createMockMessage({ type: 'text', text: 'No plugin match' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, mockRegistry);

      expect(screen.getByText('No plugin match')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-message-bubble')).not.toBeInTheDocument();
    });
  });

  describe('alignment', () => {
    it('sets alignment to "right" when sender is the logged-in user', () => {
      const mockPlugin = {
        id: 'text',
        messageTypes: ['text'],
        messageCategories: ['message'],
        renderBubble: () => <span>Content</span>,
      };
      const mockRegistry = {
        findPlugin: () => mockPlugin,
      };

      const ctx = createMockContext({
        parentMessage: createMockMessage({ senderUid: 'logged-in-user' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, mockRegistry);

      const bubble = screen.getByTestId('mock-message-bubble');
      expect(bubble).toHaveAttribute('data-alignment', 'right');
    });

    it('sets alignment to "left" when sender is a different user', () => {
      const mockPlugin = {
        id: 'text',
        messageTypes: ['text'],
        messageCategories: ['message'],
        renderBubble: () => <span>Content</span>,
      };
      const mockRegistry = {
        findPlugin: () => mockPlugin,
      };

      const ctx = createMockContext({
        parentMessage: createMockMessage({ senderUid: 'other-user' }),
      });
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, mockRegistry);

      const bubble = screen.getByTestId('mock-message-bubble');
      expect(bubble).toHaveAttribute('data-alignment', 'left');
    });
  });

  describe('disableInteraction prop', () => {
    it('passes disableInteraction=true by default', () => {
      const mockPlugin = {
        id: 'text',
        messageTypes: ['text'],
        messageCategories: ['message'],
        renderBubble: () => <span>Content</span>,
      };
      const mockRegistry = {
        findPlugin: () => mockPlugin,
      };

      const ctx = createMockContext();
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, mockRegistry);

      const bubble = screen.getByTestId('mock-message-bubble');
      expect(bubble).toHaveAttribute('data-disable-interaction', 'true');
    });

    it('passes disableInteraction=false when explicitly set', () => {
      const mockPlugin = {
        id: 'text',
        messageTypes: ['text'],
        messageCategories: ['message'],
        renderBubble: () => <span>Content</span>,
      };
      const mockRegistry = {
        findPlugin: () => mockPlugin,
      };

      const ctx = createMockContext();
      renderWithContext(
        <CometChatThreadHeaderParentBubble disableInteraction={false} />,
        ctx,
        mockRegistry
      );

      const bubble = screen.getByTestId('mock-message-bubble');
      expect(bubble).toHaveAttribute('data-disable-interaction', 'false');
    });

    it('passes hideThreadView=true to CometChatMessageBubble', () => {
      const mockPlugin = {
        id: 'text',
        messageTypes: ['text'],
        messageCategories: ['message'],
        renderBubble: () => <span>Content</span>,
      };
      const mockRegistry = {
        findPlugin: () => mockPlugin,
      };

      const ctx = createMockContext();
      renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, mockRegistry);

      const bubble = screen.getByTestId('mock-message-bubble');
      expect(bubble).toHaveAttribute('data-hide-thread-view', 'true');
    });
  });

  describe('className prop', () => {
    it('applies custom className to the wrapper', () => {
      const ctx = createMockContext();
      const { container } = renderWithContext(
        <CometChatThreadHeaderParentBubble className="my-custom-class" />,
        ctx,
        null
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('my-custom-class');
    });

    it('renders without custom className', () => {
      const ctx = createMockContext();
      const { container } = renderWithContext(<CometChatThreadHeaderParentBubble />, ctx, null);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
    });
  });
});
