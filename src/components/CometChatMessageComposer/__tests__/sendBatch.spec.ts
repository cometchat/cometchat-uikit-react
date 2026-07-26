/**
 * Unit tests for sendBatch (send fan-out pipeline).
 *
 * Covers:
 * - Single-type send (one message)
 * - Reply/thread (parentMessageId on each message, quotedMessage on the first only)
 * - Happy-path full batch flow (optimistic publish, success publish, request released, tray cleared)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockCometChat, mockUser, getLastUploadRequest } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));

vi.mock('../CometChatMessageComposerManager', () => ({
  startTypingIndicator: vi.fn(),
  endTypingIndicator: vi.fn(),
  attachMessageListener: vi.fn().mockReturnValue(() => {}),
  attachConnectionListener: vi.fn().mockReturnValue(() => {}),
}));

import { useCometChatMessageComposer } from '../useCometChatMessageComposer';
import { sendBatch, groupAndOrderTrayItems } from '../sendBatch';
import type { TrayItem } from '../CometChatMessageComposer.types';

function makeUser(uid = 'user-1') {
  return {
    getUid: () => uid,
    getName: () => 'Test User',
    getStatus: () => 'online',
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.User;
}

function makeBaseMessage(id: number) {
  return {
    getId: () => id,
    getType: () => 'text',
    getMetadata: () => ({}),
  } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.BaseMessage;
}

function makeTrayItem(
  fileId: string,
  kind: TrayItem['kind'],
  status: TrayItem['status'] = 'success'
): TrayItem {
  return {
    fileId,
    file: new File(
      ['content'],
      `${kind}-${fileId}.${kind === 'image' ? 'png' : kind === 'video' ? 'mp4' : kind === 'audio' ? 'mp3' : 'pdf'}`
    ),
    kind,
    status,
    percent: status === 'success' ? 100 : 0,
    attachment:
      status === 'success'
        ? ({
            getUrl: () => `https://cdn.example.com/${fileId}`,
          } as unknown as import('@cometchat/chat-sdk-javascript').CometChat.Attachment)
        : undefined,
  };
}

describe('sendBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCometChat.isInitialized.mockReturnValue(true);
    mockCometChat.getLoggedinUser.mockResolvedValue(mockUser);
    mockCometChat.sendMediaMessage.mockImplementation((msg: unknown) => Promise.resolve(msg));
    // jsdom does not implement object URLs — stub them for startUpload previews.
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('groupAndOrderTrayItems (pure helper)', () => {
    it('groups items by kind and orders image → video → audio → file', () => {
      const items = [
        makeTrayItem('f1', 'file'),
        makeTrayItem('f2', 'image'),
        makeTrayItem('f3', 'audio'),
        makeTrayItem('f4', 'video'),
        makeTrayItem('f5', 'image'),
      ];
      const groups = groupAndOrderTrayItems(items);
      expect(groups.map(g => g.kind)).toEqual(['image', 'video', 'audio', 'file']);
      expect(groups[0].items).toHaveLength(2); // 2 images
      expect(groups[1].items).toHaveLength(1); // 1 video
      expect(groups[2].items).toHaveLength(1); // 1 audio
      expect(groups[3].items).toHaveLength(1); // 1 file
    });

    it('single-type input produces one group', () => {
      const items = [
        makeTrayItem('f1', 'image'),
        makeTrayItem('f2', 'image'),
        makeTrayItem('f3', 'image'),
      ];
      const groups = groupAndOrderTrayItems(items);
      expect(groups).toHaveLength(1);
      expect(groups[0].kind).toBe('image');
      expect(groups[0].items).toHaveLength(3);
    });

    it('filters out non-success items', () => {
      const items = [
        makeTrayItem('f1', 'image', 'success'),
        makeTrayItem('f2', 'video', 'uploading'),
        makeTrayItem('f3', 'file', 'failed'),
      ];
      const groups = groupAndOrderTrayItems(items);
      expect(groups).toHaveLength(1);
      expect(groups[0].kind).toBe('image');
    });

    it('returns empty array for no success items', () => {
      const items = [
        makeTrayItem('f1', 'image', 'uploading'),
        makeTrayItem('f2', 'video', 'failed'),
      ];
      const groups = groupAndOrderTrayItems(items);
      expect(groups).toHaveLength(0);
    });
  });

  describe('single-type send (one message)', () => {
    it('sends exactly one MediaMessage when all items share the same kind', async () => {
      const publish = vi.fn();
      const items = [makeTrayItem('f1', 'image'), makeTrayItem('f2', 'image')];

      await sendBatch({
        items,
        batchId: 'batch-123',
        caption: '',
        receiverId: 'user-2',
        receiverType: 'user',
        publish,
      });

      // One sendMediaMessage call (one message for images)
      expect(mockCometChat.sendMediaMessage).toHaveBeenCalledTimes(1);

      // Two publish calls: inprogress + success
      expect(publish).toHaveBeenCalledTimes(2);
      expect(publish).toHaveBeenCalledWith(expect.objectContaining({ status: 'inprogress' }));
      expect(publish).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    });

    it('stamps batchId on the single message', async () => {
      const publish = vi.fn();
      const items = [makeTrayItem('f1', 'video')];

      await sendBatch({
        items,
        batchId: 'batch-456',
        caption: '',
        receiverId: 'user-2',
        receiverType: 'user',
        publish,
      });

      const sentMsg = mockCometChat.sendMediaMessage.mock.calls[0][0] as Record<string, unknown>;
      const metadata = (sentMsg as { metadata: Record<string, unknown> }).metadata;
      expect(metadata.batchId).toBe('batch-456');
    });
  });

  describe('reply/thread (parentMessageId + quotedMessage)', () => {
    it('sets parentMessageId on each message when provided', async () => {
      const publish = vi.fn();
      const items = [makeTrayItem('f1', 'image'), makeTrayItem('f2', 'file')];

      await sendBatch({
        items,
        batchId: 'batch-789',
        caption: '',
        receiverId: 'user-2',
        receiverType: 'user',
        parentMessageId: 42,
        publish,
      });

      // Two messages sent (image + file)
      expect(mockCometChat.sendMediaMessage).toHaveBeenCalledTimes(2);

      for (const call of mockCometChat.sendMediaMessage.mock.calls) {
        const msg = call[0] as Record<string, unknown>;
        expect(msg.parentMessageId).toBe(42);
      }
    });

    it('sets quotedMessage and quotedMessageId on the FIRST message only when messageToReply is provided', async () => {
      const publish = vi.fn();
      const replyMsg = makeBaseMessage(99);
      const items = [makeTrayItem('f1', 'image'), makeTrayItem('f2', 'video')];

      await sendBatch({
        items,
        batchId: 'batch-abc',
        caption: '',
        receiverId: 'group-1',
        receiverType: 'group',
        messageToReply: replyMsg,
        publish,
      });

      expect(mockCometChat.sendMediaMessage).toHaveBeenCalledTimes(2);

      const sentMsgs = mockCometChat.sendMediaMessage.mock.calls.map(
        ([msg]: [Record<string, unknown>]) => msg
      );

      // First message (image) carries the quoted message.
      expect((sentMsgs[0] as { quotedMessage?: unknown }).quotedMessage).toBe(replyMsg);
      expect((sentMsgs[0] as { quotedMessageId?: number }).quotedMessageId).toBe(99);

      // Remaining messages (video) do NOT carry the quote — the reply belongs to
      // the batch as a whole via its lead message.
      expect((sentMsgs[1] as { quotedMessage?: unknown }).quotedMessage).toBeUndefined();
      expect((sentMsgs[1] as { quotedMessageId?: number }).quotedMessageId).toBeUndefined();
    });

    it('publishes reply events when messageToReply is provided', async () => {
      const publish = vi.fn();
      const replyMsg = makeBaseMessage(99);
      const items = [makeTrayItem('f1', 'image')];

      await sendBatch({
        items,
        batchId: 'batch-reply',
        caption: '',
        receiverId: 'user-2',
        receiverType: 'user',
        messageToReply: replyMsg,
        publish,
      });

      // Should have: inprogress, success, reply-success
      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ui:compose/reply', status: 'success' })
      );
    });
  });

  describe('happy-path full batch flow', () => {
    it('sends one message per type, publishes optimistic + success for each', async () => {
      const publish = vi.fn();
      const onSendButtonClick = vi.fn();
      const items = [
        makeTrayItem('f1', 'image'),
        makeTrayItem('f2', 'video'),
        makeTrayItem('f3', 'audio'),
        makeTrayItem('f4', 'file'),
      ];

      await sendBatch({
        items,
        batchId: 'batch-full',
        caption: 'Hello world',
        receiverId: 'group-1',
        receiverType: 'group',
        publish,
        onSendButtonClick,
      });

      // 4 messages (one per type)
      expect(mockCometChat.sendMediaMessage).toHaveBeenCalledTimes(4);

      // 8 publish calls: 4 inprogress + 4 success
      const inprogress = publish.mock.calls.filter(
        ([e]: [{ status: string }]) => e.status === 'inprogress'
      );
      const success = publish.mock.calls.filter(
        ([e]: [{ status: string }]) => e.status === 'success'
      );
      expect(inprogress).toHaveLength(4);
      expect(success).toHaveLength(4);

      // onSendButtonClick called for each confirmed message
      expect(onSendButtonClick).toHaveBeenCalledTimes(4);
    });

    it('places caption on the last message only', async () => {
      const publish = vi.fn();
      const items = [makeTrayItem('f1', 'image'), makeTrayItem('f2', 'file')];

      await sendBatch({
        items,
        batchId: 'batch-cap',
        caption: 'My caption',
        receiverId: 'user-2',
        receiverType: 'user',
        publish,
      });

      // The mock message stores caption via setCaption
      const msgs = mockCometChat.sendMediaMessage.mock.calls.map(
        ([msg]: [Record<string, unknown>]) => msg
      );
      // First message (image) should NOT have caption
      expect(msgs[0].caption).toBe('');
      // Last message (file) should have caption
      expect(msgs[1].caption).toBe('My caption');
    });

    it('assigns unique muids to each message', async () => {
      const publish = vi.fn();
      const items = [
        makeTrayItem('f1', 'image'),
        makeTrayItem('f2', 'video'),
        makeTrayItem('f3', 'file'),
      ];

      await sendBatch({
        items,
        batchId: 'batch-muid',
        caption: '',
        receiverId: 'user-2',
        receiverType: 'user',
        publish,
      });

      const muids = mockCometChat.sendMediaMessage.mock.calls.map(
        ([msg]: [Record<string, unknown>]) => (msg as { muid: string }).muid
      );
      // All unique
      expect(new Set(muids).size).toBe(3);
      // All non-empty
      for (const muid of muids) {
        expect(muid.length).toBeGreaterThan(0);
      }
    });

    it('assigns monotonically increasing sentAt', async () => {
      const publish = vi.fn();
      const items = [
        makeTrayItem('f1', 'image'),
        makeTrayItem('f2', 'video'),
        makeTrayItem('f3', 'audio'),
      ];

      await sendBatch({
        items,
        batchId: 'batch-time',
        caption: '',
        receiverId: 'user-2',
        receiverType: 'user',
        publish,
      });

      const sentAts = mockCometChat.sendMediaMessage.mock.calls.map(
        ([msg]: [Record<string, unknown>]) => (msg as { sentAt: number }).sentAt
      );
      for (let i = 0; i < sentAts.length - 1; i++) {
        expect(sentAts[i]).toBeLessThan(sentAts[i + 1]);
      }
    });

    it('audio messages do NOT carry audioType in metadata', async () => {
      const publish = vi.fn();
      const items = [makeTrayItem('f1', 'audio')];

      await sendBatch({
        items,
        batchId: 'batch-audio-no-type',
        caption: '',
        receiverId: 'user-2',
        receiverType: 'user',
        publish,
      });

      const msg = mockCometChat.sendMediaMessage.mock.calls[0][0] as Record<string, unknown>;
      const metadata = (msg as { metadata: Record<string, unknown> }).metadata;
      expect(metadata.audioType).toBeUndefined();
      expect(metadata.batchId).toBe('batch-audio-no-type');
    });
  });

  describe('error handling (best-effort)', () => {
    it('continues sending remaining messages when one fails', async () => {
      const publish = vi.fn();
      let callCount = 0;
      mockCometChat.sendMediaMessage.mockImplementation((msg: unknown) => {
        callCount++;
        if (callCount === 1) return Promise.reject(new Error('Network error'));
        return Promise.resolve(msg);
      });

      const items = [makeTrayItem('f1', 'image'), makeTrayItem('f2', 'file')];

      await sendBatch({
        items,
        batchId: 'batch-error',
        caption: '',
        receiverId: 'user-2',
        receiverType: 'user',
        publish,
      });

      // Both messages attempted
      expect(mockCometChat.sendMediaMessage).toHaveBeenCalledTimes(2);

      // First message: inprogress + error
      // Second message: inprogress + success
      const errorEvents = publish.mock.calls.filter(
        ([e]: [{ status: string }]) => e.status === 'error'
      );
      const successEvents = publish.mock.calls.filter(
        ([e]: [{ status: string }]) => e.status === 'success'
      );
      expect(errorEvents).toHaveLength(1);
      expect(successEvents).toHaveLength(1);
    });
  });

  describe('integration with useCometChatMessageComposer hook', () => {
    it('sendBatch is exposed on the hook and clears tray + text and releases the request after send', async () => {
      mockCometChat.isInitialized.mockReturnValue(true);
      mockCometChat.getLoggedinUser.mockResolvedValue(mockUser);

      const user = makeUser('user-2');
      const { result } = renderHook(() => useCometChatMessageComposer({ user }));

      // Stage items through the upload manager (creates the request), then drive
      // them to success so the batch is sendable.
      act(() => {
        result.current.mediaUploadManager.startUpload([
          new File(['x'], 'a.png', { type: 'image/png' }),
          new File(['x'], 'b.pdf', { type: 'application/pdf' }),
        ]);
      });
      const request = getLastUploadRequest();
      const perCall = request.__state.perCallListeners;
      const listener = perCall[perCall.length - 1] as unknown as {
        onFileUploaded: (fileId: string, attachment: unknown) => void;
      };
      const fileIds = result.current.state.tray.items.map(i => i.fileId);
      act(() => {
        fileIds.forEach(id => {
          listener.onFileUploaded(id, { getUrl: () => `https://cdn.example.com/${id}` });
        });
      });

      // Set text (caption)
      act(() => {
        result.current.setText('Caption text');
      });

      expect(result.current.state.tray.items).toHaveLength(2);
      expect(result.current.state.text).toBe('Caption text');

      // Send batch
      await act(async () => {
        await result.current.sendBatch();
      });

      // Tray cleared
      expect(result.current.state.tray.items).toHaveLength(0);
      expect(result.current.state.tray.batchId).toBeNull();
      // Text cleared
      expect(result.current.state.text).toBe('');
      // The batch's upload request is released (clearAll), not a batchId-scoped call.
      expect(request.clearAll).toHaveBeenCalledTimes(1);
      // sendState back to idle
      expect(result.current.state.sendState).toBe('idle');
    });

    it('sendBatch does nothing when tray is empty', async () => {
      mockCometChat.isInitialized.mockReturnValue(true);

      const user = makeUser('user-2');
      const { result } = renderHook(() => useCometChatMessageComposer({ user }));

      await act(async () => {
        await result.current.sendBatch();
      });

      expect(mockCometChat.sendMediaMessage).not.toHaveBeenCalled();
    });
  });
});
