/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  fetchReceipts,
  attachReceiptListener,
  attachConnectionListener,
} from '../CometChatMessageInformationManager';

vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    getMessageReceipts: vi.fn(),
    addMessageListener: vi.fn(),
    removeMessageListener: vi.fn(),
    addConnectionListener: vi.fn(),
    removeConnectionListener: vi.fn(),
    MessageListener: vi.fn().mockImplementation((callbacks: unknown) => callbacks),
    ConnectionListener: vi.fn().mockImplementation((callbacks: unknown) => callbacks),
  },
}));

describe('CometChatMessageInformationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── fetchReceipts ──────────────────────────────────────────────────

  describe('fetchReceipts', () => {
    it('calls CometChat.getMessageReceipts with the message ID', async () => {
      vi.mocked(CometChat.getMessageReceipts).mockResolvedValue([]);
      await fetchReceipts(42);
      expect(vi.mocked(CometChat.getMessageReceipts)).toHaveBeenCalledWith(42);
    });

    it('returns the receipts from the SDK', async () => {
      const mockReceipts = [{ getSender: () => ({ getUid: () => 'u1' }) }];
      vi.mocked(CometChat.getMessageReceipts).mockResolvedValue(mockReceipts as never);
      const result = await fetchReceipts(1);
      expect(result).toBe(mockReceipts);
    });

    it('propagates SDK errors', async () => {
      vi.mocked(CometChat.getMessageReceipts).mockRejectedValue(new Error('SDK error'));
      await expect(fetchReceipts(1)).rejects.toThrow('SDK error');
    });
  });

  // ─── attachReceiptListener ──────────────────────────────────────────

  describe('attachReceiptListener', () => {
    it('attaches a message listener with the given ID', () => {
      const callbacks = { onMessagesDelivered: vi.fn(), onMessagesRead: vi.fn() };
      attachReceiptListener('receipt-listener-1', callbacks);

      expect(vi.mocked(CometChat.addMessageListener)).toHaveBeenCalledWith(
        'receipt-listener-1',
        expect.any(Object)
      );
    });

    it('returns a cleanup function that removes the listener', () => {
      const callbacks = { onMessagesDelivered: vi.fn(), onMessagesRead: vi.fn() };
      const cleanup = attachReceiptListener('receipt-listener-1', callbacks);

      cleanup();
      expect(vi.mocked(CometChat.removeMessageListener)).toHaveBeenCalledWith('receipt-listener-1');
    });

    it('passes onMessagesDelivered callback to the MessageListener', () => {
      const onMessagesDelivered = vi.fn();
      const onMessagesRead = vi.fn();
      attachReceiptListener('test', { onMessagesDelivered, onMessagesRead });

      const listenerCallbacks = vi.mocked(CometChat.addMessageListener).mock.calls[0]?.[1] as {
        onMessagesDelivered: (r: unknown) => void;
        onMessagesRead: (r: unknown) => void;
      };

      const mockReceipt = { getSender: () => ({ getUid: () => 'u1' }) };
      listenerCallbacks.onMessagesDelivered(mockReceipt);
      expect(onMessagesDelivered).toHaveBeenCalledWith(mockReceipt);
    });

    it('passes onMessagesRead callback to the MessageListener', () => {
      const onMessagesDelivered = vi.fn();
      const onMessagesRead = vi.fn();
      attachReceiptListener('test', { onMessagesDelivered, onMessagesRead });

      const listenerCallbacks = vi.mocked(CometChat.addMessageListener).mock.calls[0]?.[1] as {
        onMessagesDelivered: (r: unknown) => void;
        onMessagesRead: (r: unknown) => void;
      };

      const mockReceipt = { getSender: () => ({ getUid: () => 'u2' }) };
      listenerCallbacks.onMessagesRead(mockReceipt);
      expect(onMessagesRead).toHaveBeenCalledWith(mockReceipt);
    });
  });

  // ─── attachConnectionListener ───────────────────────────────────────

  describe('attachConnectionListener', () => {
    it('attaches a connection listener with the given ID', () => {
      const onConnected = vi.fn();
      attachConnectionListener('conn-listener-1', onConnected);

      expect(vi.mocked(CometChat.addConnectionListener)).toHaveBeenCalledWith(
        'conn-listener-1',
        expect.any(Object)
      );
    });

    it('returns a cleanup function that removes the listener', () => {
      const onConnected = vi.fn();
      const cleanup = attachConnectionListener('conn-listener-1', onConnected);

      cleanup();
      expect(vi.mocked(CometChat.removeConnectionListener)).toHaveBeenCalledWith('conn-listener-1');
    });

    it('fires onConnected callback when connection is established', () => {
      const onConnected = vi.fn();
      attachConnectionListener('test', onConnected);

      const listenerCallbacks = vi.mocked(CometChat.addConnectionListener).mock.calls[0]?.[1] as {
        onConnected: () => void;
        onDisconnected: () => void;
      };

      listenerCallbacks.onConnected();
      expect(onConnected).toHaveBeenCalledOnce();
    });

    it('does not throw when onDisconnected fires (no-op)', () => {
      const onConnected = vi.fn();
      attachConnectionListener('test', onConnected);

      const listenerCallbacks = vi.mocked(CometChat.addConnectionListener).mock.calls[0]?.[1] as {
        onConnected: () => void;
        onDisconnected: () => void;
      };

      expect(() => listenerCallbacks.onDisconnected()).not.toThrow();
    });
  });
});
