import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAddMessageListener = vi.fn();
const mockRemoveMessageListener = vi.fn();
const mockAddUserListener = vi.fn();
const mockRemoveUserListener = vi.fn();
const mockAddGroupListener = vi.fn();
const mockRemoveGroupListener = vi.fn();
const mockAddCallListener = vi.fn();
const mockRemoveCallListener = vi.fn();
const mockAddConnectionListener = vi.fn();
const mockRemoveConnectionListener = vi.fn();

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    addMessageListener: (...args: unknown[]) => mockAddMessageListener(...args),
    removeMessageListener: (...args: unknown[]) => mockRemoveMessageListener(...args),
    addUserListener: (...args: unknown[]) => mockAddUserListener(...args),
    removeUserListener: (...args: unknown[]) => mockRemoveUserListener(...args),
    addGroupListener: (...args: unknown[]) => mockAddGroupListener(...args),
    removeGroupListener: (...args: unknown[]) => mockRemoveGroupListener(...args),
    addCallListener: (...args: unknown[]) => mockAddCallListener(...args),
    removeCallListener: (...args: unknown[]) => mockRemoveCallListener(...args),
    addConnectionListener: (...args: unknown[]) => mockAddConnectionListener(...args),
    removeConnectionListener: (...args: unknown[]) => mockRemoveConnectionListener(...args),
    MessageListener: class {
      constructor(public handlers: Record<string, unknown>) {}
    },
    UserListener: class {
      constructor(public handlers: Record<string, unknown>) {}
    },
    GroupListener: class {
      constructor(public handlers: Record<string, unknown>) {}
    },
    CallListener: class {
      constructor(public handlers: Record<string, unknown>) {}
    },
    ConnectionListener: class {
      constructor(public handlers: Record<string, unknown>) {}
    },
  },
}));

vi.mock('../../utils/CometChatLogger', () => ({
  CometChatLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { CometChatEventsProvider } from '../CometChatEventsProvider';
import { useCometChatEventsContext } from '../CometChatEventsContext';

// Test component to access context
function TestConsumer({
  onContext,
}: {
  onContext: (ctx: ReturnType<typeof useCometChatEventsContext>) => void;
}) {
  const ctx = useCometChatEventsContext();
  React.useEffect(() => {
    onContext(ctx);
  }, [ctx, onContext]);
  return null;
}

describe('CometChatEventsProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    const { getByText } = render(
      <CometChatEventsProvider>
        <div>Hello</div>
      </CometChatEventsProvider>
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('should register message, user, group, call, and connection listeners', () => {
    render(
      <CometChatEventsProvider>
        <div />
      </CometChatEventsProvider>
    );
    expect(mockAddMessageListener).toHaveBeenCalled();
    expect(mockAddUserListener).toHaveBeenCalled();
    expect(mockAddGroupListener).toHaveBeenCalled();
    expect(mockAddCallListener).toHaveBeenCalled();
    expect(mockAddConnectionListener).toHaveBeenCalled();
  });

  it('should remove all listeners on unmount', () => {
    const { unmount } = render(
      <CometChatEventsProvider>
        <div />
      </CometChatEventsProvider>
    );
    unmount();
    expect(mockRemoveMessageListener).toHaveBeenCalled();
    expect(mockRemoveUserListener).toHaveBeenCalled();
    expect(mockRemoveGroupListener).toHaveBeenCalled();
    expect(mockRemoveCallListener).toHaveBeenCalled();
    expect(mockRemoveConnectionListener).toHaveBeenCalled();
  });

  it('should provide subscribe and publish functions via context', () => {
    let contextValue: ReturnType<typeof useCometChatEventsContext> | null = null;

    render(
      <CometChatEventsProvider>
        <TestConsumer
          onContext={ctx => {
            contextValue = ctx;
          }}
        />
      </CometChatEventsProvider>
    );

    expect(contextValue).not.toBeNull();
    expect(typeof contextValue!.subscribe).toBe('function');
    expect(typeof contextValue!.publish).toBe('function');
  });

  it('should deliver published events to subscribers', () => {
    let contextValue: ReturnType<typeof useCometChatEventsContext> | null = null;

    render(
      <CometChatEventsProvider>
        <TestConsumer
          onContext={ctx => {
            contextValue = ctx;
          }}
        />
      </CometChatEventsProvider>
    );

    const handler = vi.fn();
    act(() => {
      contextValue!.subscribe(handler);
    });

    act(() => {
      contextValue!.publish({ type: 'ui:message/sent', message: {} as any, status: 'success' });
    });

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'ui:message/sent' }));
  });

  it('should unsubscribe handler when returned function is called', () => {
    let contextValue: ReturnType<typeof useCometChatEventsContext> | null = null;

    render(
      <CometChatEventsProvider>
        <TestConsumer
          onContext={ctx => {
            contextValue = ctx;
          }}
        />
      </CometChatEventsProvider>
    );

    const handler = vi.fn();
    let unsubscribe: () => void;

    act(() => {
      unsubscribe = contextValue!.subscribe(handler);
    });

    act(() => {
      unsubscribe();
    });

    act(() => {
      contextValue!.publish({ type: 'ui:message/sent', message: {} as any, status: 'success' });
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle subscriber errors gracefully', () => {
    let contextValue: ReturnType<typeof useCometChatEventsContext> | null = null;

    render(
      <CometChatEventsProvider>
        <TestConsumer
          onContext={ctx => {
            contextValue = ctx;
          }}
        />
      </CometChatEventsProvider>
    );

    const errorHandler = vi.fn(() => {
      throw new Error('handler error');
    });
    const goodHandler = vi.fn();

    act(() => {
      contextValue!.subscribe(errorHandler);
      contextValue!.subscribe(goodHandler);
    });

    act(() => {
      contextValue!.publish({ type: 'ui:message/sent', message: {} as any, status: 'success' });
    });

    // Error handler threw but good handler should still be called
    expect(errorHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalled();
  });

  describe('SDK listener callbacks', () => {
    function getListenerHandlers(
      mockFn: ReturnType<typeof vi.fn>
    ): Record<string, (...args: unknown[]) => void> {
      const call = mockFn.mock.calls[0] as unknown[] | undefined;
      const listener = call?.[1] as
        | { handlers?: Record<string, (...args: unknown[]) => void> }
        | undefined;
      return listener?.handlers ?? {};
    }

    it('should emit message events from SDK message listener', () => {
      let contextValue: ReturnType<typeof useCometChatEventsContext> | null = null;
      render(
        <CometChatEventsProvider>
          <TestConsumer
            onContext={ctx => {
              contextValue = ctx;
            }}
          />
        </CometChatEventsProvider>
      );

      const handler = vi.fn();
      act(() => {
        contextValue!.subscribe(handler);
      });

      const msgHandlers = getListenerHandlers(mockAddMessageListener);

      act(() => {
        msgHandlers.onTextMessageReceived?.({ id: 1 });
      });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'message/text-received' })
      );

      handler.mockClear();
      act(() => {
        msgHandlers.onMediaMessageReceived?.({ id: 2 });
      });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'message/media-received' })
      );

      handler.mockClear();
      act(() => {
        msgHandlers.onCustomMessageReceived?.({ id: 3 });
      });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'message/custom-received' })
      );

      handler.mockClear();
      act(() => {
        msgHandlers.onInteractiveMessageReceived?.({ id: 4 });
      });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'message/interactive-received' })
      );

      handler.mockClear();
      act(() => {
        msgHandlers.onMessageEdited?.({ id: 5 });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'message/edited' }));

      handler.mockClear();
      act(() => {
        msgHandlers.onMessageDeleted?.({ id: 6 });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'message/deleted' }));

      handler.mockClear();
      act(() => {
        msgHandlers.onMessageModerated?.({ id: 7 });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'message/moderated' }));

      handler.mockClear();
      act(() => {
        msgHandlers.onMessagesDelivered?.({ id: 8 });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'receipt/delivered' }));

      handler.mockClear();
      act(() => {
        msgHandlers.onMessagesRead?.({ id: 9 });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'receipt/read' }));

      handler.mockClear();
      act(() => {
        msgHandlers.onMessagesDeliveredToAll?.({ id: 10 });
      });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'receipt/delivered-to-all' })
      );

      handler.mockClear();
      act(() => {
        msgHandlers.onMessagesReadByAll?.({ id: 11 });
      });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'receipt/read-by-all' })
      );

      handler.mockClear();
      act(() => {
        msgHandlers.onMessageReactionAdded?.({ id: 12 });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'reaction/added' }));

      handler.mockClear();
      act(() => {
        msgHandlers.onMessageReactionRemoved?.({ id: 13 });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'reaction/removed' }));

      handler.mockClear();
      act(() => {
        msgHandlers.onTypingStarted?.({ id: 14 });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'typing/started' }));

      handler.mockClear();
      act(() => {
        msgHandlers.onTypingEnded?.({ id: 15 });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'typing/ended' }));
    });

    it('should emit user events from SDK user listener', () => {
      let contextValue: ReturnType<typeof useCometChatEventsContext> | null = null;
      render(
        <CometChatEventsProvider>
          <TestConsumer
            onContext={ctx => {
              contextValue = ctx;
            }}
          />
        </CometChatEventsProvider>
      );

      const handler = vi.fn();
      act(() => {
        contextValue!.subscribe(handler);
      });

      const userHandlers = getListenerHandlers(mockAddUserListener);

      act(() => {
        userHandlers.onUserOnline?.({ uid: 'u1' });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'user/online' }));

      handler.mockClear();
      act(() => {
        userHandlers.onUserOffline?.({ uid: 'u2' });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'user/offline' }));
    });

    it('should emit call events from SDK call listener', () => {
      let contextValue: ReturnType<typeof useCometChatEventsContext> | null = null;
      render(
        <CometChatEventsProvider>
          <TestConsumer
            onContext={ctx => {
              contextValue = ctx;
            }}
          />
        </CometChatEventsProvider>
      );

      const handler = vi.fn();
      act(() => {
        contextValue!.subscribe(handler);
      });

      const callHandlers = getListenerHandlers(mockAddCallListener);

      act(() => {
        callHandlers.onIncomingCallReceived?.({ id: 'c1' });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'call/incoming' }));

      handler.mockClear();
      act(() => {
        callHandlers.onOutgoingCallAccepted?.({ id: 'c2' });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'call/accepted' }));

      handler.mockClear();
      act(() => {
        callHandlers.onOutgoingCallRejected?.({ id: 'c3' });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'call/rejected' }));

      handler.mockClear();
      act(() => {
        callHandlers.onIncomingCallCancelled?.({ id: 'c4' });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'call/cancelled' }));

      handler.mockClear();
      act(() => {
        callHandlers.onCallEndedMessageReceived?.({ id: 'c5' });
      });
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'call/ended' }));
    });

    it('should emit connection events from SDK connection listener', () => {
      let contextValue: ReturnType<typeof useCometChatEventsContext> | null = null;
      render(
        <CometChatEventsProvider>
          <TestConsumer
            onContext={ctx => {
              contextValue = ctx;
            }}
          />
        </CometChatEventsProvider>
      );

      const handler = vi.fn();
      act(() => {
        contextValue!.subscribe(handler);
      });

      const connHandlers = getListenerHandlers(mockAddConnectionListener);

      act(() => {
        connHandlers.onConnected?.();
      });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'connection/connected' })
      );

      handler.mockClear();
      act(() => {
        connHandlers.onDisconnected?.();
      });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'connection/disconnected' })
      );
    });
  });
});
