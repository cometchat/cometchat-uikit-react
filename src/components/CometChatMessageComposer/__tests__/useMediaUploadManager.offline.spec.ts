/**
 * Composer tray restore on the offline path (BEH-UPLOAD-14, UIK-UPLOAD-01,
 * UIT-UP-01..03) and the offline-off chat switch kept as today (UIT-OFF-08).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useReducer } from 'react';
import { mockCometChat, getLastUploadRequest } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));
vi.mock('../../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: { play: vi.fn() },
}));

import { restoredTileStatus, useMediaUploadManager } from '../useMediaUploadManager';
import { composerReducer, initialComposerState } from '../CometChatMessageComposer.reducer';
import { useCometChatMessageComposer } from '../useCometChatMessageComposer';

type Sdk = Record<string, unknown>;
const sdk = mockCometChat as unknown as Sdk;

function restoredRequest(files: Record<string, unknown>[]) {
  return {
    getItems: vi.fn(() => files),
    getFileBytes: vi.fn((fileId: string) =>
      Promise.resolve(new Blob([`bytes-${fileId}`], { type: 'image/png' }))
    ),
    getBatchId: vi.fn(() => 'restored-batch'),
    addUploadListener: vi.fn(),
    removeUploadListener: vi.fn(),
    retryAttachment: vi.fn(),
    uploadAttachments: vi.fn(),
    uploadAttachment: vi.fn(),
    removeAttachment: vi.fn(),
    clearAll: vi.fn(),
  };
}

function useHarness(receiverId = 'peer', parentMessageId?: number) {
  const [state, dispatch] = useReducer(composerReducer, initialComposerState);
  const manager = useMediaUploadManager({
    dispatch,
    tray: state.tray,
    receiverId,
    receiverType: 'user',
    parentMessageId,
  });
  return { state, manager };
}

let saved: Record<string, unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  saved = { isInitialized: sdk.isInitialized };
  sdk.isInitialized = vi.fn().mockReturnValue(true);
  global.URL.createObjectURL = vi.fn().mockReturnValue('blob:restored');
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  Object.assign(sdk, saved);
  Reflect.deleteProperty(sdk, 'getExistingUploadFileRequest');
  Reflect.deleteProperty(sdk, 'isOfflineEnabled');
});

describe('restoredTileStatus', () => {
  it('UPLOADED -> done, REJECTED or bytes gone -> rejected, else failed with retry', () => {
    expect(
      restoredTileStatus({ fileId: 'a', name: 'a', status: 'uploaded', attachment: {} as never })
    ).toBe('success');
    expect(restoredTileStatus({ fileId: 'b', name: 'b', status: 'rejected' })).toBe('rejected');
    expect(
      restoredTileStatus({ fileId: 'c', name: 'c', status: 'failed', localCopyMissing: true })
    ).toBe('rejected');
    expect(restoredTileStatus({ fileId: 'd', name: 'd', status: 'failed' })).toBe('failed');
    // Mid-flight when the process died comes back retryable-failed, never "uploading".
    expect(restoredTileStatus({ fileId: 'e', name: 'e', status: 'uploading' })).toBe('failed');
  });
});

describe('tray restore (offline on)', () => {
  it('UIT-UP-01: done tiles stay done, interrupted ones show failed with retry; nothing uploads by itself', async () => {
    sdk.isOfflineEnabled = () => true;
    const restored = restoredRequest([
      {
        fileId: 'f1',
        name: 'done.png',
        mimeType: 'image/png',
        status: 'uploaded',
        attachment: { url: 'https://x/done.png' },
      },
      {
        fileId: 'f2',
        name: 'cut.png',
        mimeType: 'image/png',
        status: 'failed',
        failure: { code: 'NETWORK' },
      },
    ]);
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(restored);
    const { result } = renderHook(() => useHarness());
    await waitFor(() => {
      expect(result.current.state.tray.items.map(i => [i.fileId, i.status])).toEqual([
        ['f1', 'success'],
        ['f2', 'failed'],
      ]);
    });
    expect(result.current.state.tray.batchId).toBe('restored-batch');
    expect(result.current.state.tray.items[0]?.previewUrl).toBe('blob:restored');
    expect(sdk.getExistingUploadFileRequest).toHaveBeenCalledWith('peer', 'user', undefined);
    expect(restored.addUploadListener).toHaveBeenCalledTimes(1);
    expect(restored.retryAttachment).not.toHaveBeenCalled();
    expect(restored.uploadAttachments).not.toHaveBeenCalled();
    // Retry is the user's tap, and the retry carries our listener.
    act(() => {
      result.current.manager.retryItem('f2');
    });
    expect(restored.retryAttachment).toHaveBeenCalledWith('f2', expect.anything());
    expect(result.current.state.tray.items[1]?.status).toBe('uploading');
  });

  it('a failed file whose bytes cannot be read back is remove-only, never retried or queued as an empty file', async () => {
    sdk.isOfflineEnabled = () => true;
    const restored = restoredRequest([
      { fileId: 'g1', name: 'gone.png', mimeType: 'image/png', status: 'failed' },
      { fileId: 'g2', name: 'done.png', mimeType: 'image/png', status: 'uploaded', attachment: {} },
    ]);
    // The SDK has no copy of g1's bytes (and does not flag it), g2 never needs them.
    (restored.getFileBytes as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (fileId: string) =>
        Promise.resolve(fileId === 'g1' ? null : new Blob(['x'], { type: 'image/png' }))
    );
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(restored);
    const { result } = renderHook(() => useHarness());
    await waitFor(() => {
      expect(result.current.state.tray.items).toHaveLength(2);
    });
    expect(result.current.state.tray.items.map(i => [i.fileId, i.status])).toEqual([
      ['g1', 'rejected'],
      ['g2', 'success'],
    ]);
  });

  it("UIT-UP-02: a thread composer asks for its own batch, never the main chat's", async () => {
    sdk.isOfflineEnabled = () => true;
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(null);
    renderHook(() => useHarness('peer', 42));
    await waitFor(() => {
      expect(sdk.getExistingUploadFileRequest).toHaveBeenCalledWith('peer', 'user', 42);
    });
  });

  it('never replaces a tray the user started filling before the restore answered', async () => {
    sdk.isOfflineEnabled = () => true;
    let answer: (r: unknown) => void = () => undefined;
    sdk.getExistingUploadFileRequest = vi.fn(
      () =>
        new Promise(resolve => {
          answer = resolve;
        })
    );
    const { result } = renderHook(() => useHarness());
    await waitFor(() => {
      expect(sdk.getExistingUploadFileRequest).toHaveBeenCalled();
    });
    act(() => {
      result.current.manager.startUpload([new File(['x'], 'new.png', { type: 'image/png' })]);
    });
    const restored = restoredRequest([{ fileId: 'old', name: 'old.png', status: 'failed' }]);
    await act(async () => {
      answer(restored);
      await Promise.resolve();
    });
    expect(result.current.state.tray.items.map(i => i.file.name)).toEqual(['new.png']);
    expect(restored.addUploadListener).not.toHaveBeenCalled();
  });

  it('on a chat switch the batch is detached (left with the SDK for a later restore)', async () => {
    sdk.isOfflineEnabled = () => true;
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(null);
    const { result, rerender } = renderHook(({ id }) => useHarness(id), {
      initialProps: { id: 'peer' },
    });
    act(() => {
      result.current.manager.startUpload([new File(['x'], 'a.png', { type: 'image/png' })]);
    });
    const live = getLastUploadRequest();
    rerender({ id: 'other' });
    expect(live.removeUploadListener).toHaveBeenCalledTimes(1);
    expect(live.clearAll).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(sdk.getExistingUploadFileRequest).toHaveBeenCalledWith('other', 'user', undefined);
    });
  });
});

describe('UIT-OFF-08: offline off, the tray on chat switch behaves as today', () => {
  it('the tray empties on a chat switch, the batch is not detached, and the next add starts a new request', async () => {
    // With offline off the SDK's restore is a local call that answers null.
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(null);
    const user = (uid: string) =>
      ({
        getUid: () => uid,
        getName: () => uid,
      }) as unknown as import('@cometchat/chat-sdk-javascript').User;
    const { result, rerender } = renderHook(({ u }) => useCometChatMessageComposer({ user: u }), {
      initialProps: { u: user('peer') },
    });
    act(() => {
      result.current.mediaUploadManager.startUpload([
        new File(['x'], 'a.png', { type: 'image/png' }),
      ]);
    });
    expect(result.current.state.tray.items).toHaveLength(1);
    const first = getLastUploadRequest();
    rerender({ u: user('other') });
    expect(result.current.state.tray.items).toHaveLength(0);
    expect(first.removeUploadListener).not.toHaveBeenCalled();
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
    });
    // Nothing restored with offline off.
    expect(result.current.state.tray.items).toHaveLength(0);
    act(() => {
      result.current.mediaUploadManager.startUpload([
        new File(['y'], 'b.png', { type: 'image/png' }),
      ]);
    });
    expect(mockCometChat.createUploadFileRequest).toHaveBeenCalledTimes(2);
    expect(mockCometChat.createUploadFileRequest).toHaveBeenLastCalledWith('other', 'user');
  });
});

describe('tray and the session (UIK-LIFE-01)', () => {
  it('a logout or user switch clears a batch restored with offline on', async () => {
    const { OfflineHub } = await import('../../../utils/offline/hub');
    OfflineHub.resetForTests();
    sdk.isOfflineEnabled = () => true;
    const restored = restoredRequest([
      { fileId: 'f1', name: 'a.png', mimeType: 'image/png', status: 'failed' },
    ]);
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(restored);
    const { result } = renderHook(() => useHarness());
    await waitFor(() => {
      expect(result.current.state.tray.items).toHaveLength(1);
    });
    act(() => {
      OfflineHub.getInstance().endSession();
    });
    expect(result.current.state.tray.items).toHaveLength(0);
    expect(restored.removeUploadListener).toHaveBeenCalled();
    OfflineHub.resetForTests();
  });

  it('with offline off a session event leaves the tray as today', async () => {
    const { OfflineHub } = await import('../../../utils/offline/hub');
    OfflineHub.resetForTests();
    const { result } = renderHook(() => useHarness());
    const file = new File(['x'], 'x.pdf', { type: 'application/pdf' });
    act(() => {
      result.current.manager.startUpload([file]);
    });
    const before = result.current.state.tray.items.length;
    act(() => {
      OfflineHub.getInstance().endSession();
    });
    expect(result.current.state.tray.items).toHaveLength(before);
    OfflineHub.resetForTests();
  });
});
