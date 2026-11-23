/**
 * The tray on the offline path, the edges: an upload that fails while the
 * device is offline can be queued, a restore that meets a misbehaving SDK
 * still shows what it can, a restore overtaken by the user is discarded, and
 * a logout survives a listener that cannot be removed.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useReducer } from 'react';
import { mockCometChat, getLastUploadRequest } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));
vi.mock('../../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: { play: vi.fn() },
}));

import { useMediaUploadManager } from '../useMediaUploadManager';
import { composerReducer, initialComposerState } from '../CometChatMessageComposer.reducer';
import { OfflineHub } from '../../../utils/offline/hub';

type Sdk = Record<string, unknown>;
type UploadListener = Record<string, (...args: unknown[]) => void>;
const sdk = mockCometChat as unknown as Sdk;

function restoredRequest(files: Record<string, unknown>[], overrides: Record<string, unknown> = {}) {
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
    ...overrides,
  };
}

function useHarness(receiverId = 'peer') {
  const [state, dispatch] = useReducer(composerReducer, initialComposerState);
  const manager = useMediaUploadManager({
    dispatch,
    tray: state.tray,
    receiverId,
    receiverType: 'user',
  });
  return { state, manager };
}

/** The listener the manager gave the upload request for its files. */
function uploadListener(): UploadListener {
  const req = getLastUploadRequest() as unknown as {
    __state: { globalListener?: UploadListener; perCallListeners: UploadListener[] };
  };
  const listener = req.__state.globalListener ?? req.__state.perCallListeners[0];
  if (!listener) throw new Error('no upload listener registered');
  return listener;
}

let saved: Record<string, unknown>;
const revokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  revokeObjectURL.mockReset();
  OfflineHub.resetForTests();
  saved = {
    isInitialized: sdk.isInitialized,
    getConnectionStatus: sdk.getConnectionStatus,
  };
  sdk.isInitialized = vi.fn().mockReturnValue(true);
  global.URL.createObjectURL = vi.fn().mockReturnValue('blob:restored');
  global.URL.revokeObjectURL = revokeObjectURL;
});

afterEach(() => {
  Object.assign(sdk, saved);
  Reflect.deleteProperty(sdk, 'getExistingUploadFileRequest');
  Reflect.deleteProperty(sdk, 'isOfflineEnabled');
  OfflineHub.resetForTests();
});

describe('an upload failure while offline (AC-12.4)', () => {
  function startOne() {
    const hook = renderHook(() => useHarness());
    act(() => {
      hook.result.current.manager.startUpload([new File(['x'], 'a.png', { type: 'image/png' })]);
    });
    const fileId = hook.result.current.state.tray.items[0]?.fileId ?? '';
    return { ...hook, fileId };
  }

  it('the device is offline: the failed file is marked to go as a queued message', () => {
    sdk.isOfflineEnabled = () => true;
    sdk.getConnectionStatus = vi.fn().mockReturnValue('disconnected');
    const { result, fileId } = startOne();
    act(() => {
      uploadListener().onFileFailure?.(fileId, { code: 'ERR_UPLOAD' });
    });
    expect(result.current.state.tray.items[0]).toMatchObject({
      status: 'failed',
      queueOffline: true,
    });
  });

  it('a not-connected error marks it even while the socket still reads connected', () => {
    sdk.isOfflineEnabled = () => true;
    const { result, fileId } = startOne();
    act(() => {
      uploadListener().onFileFailure?.(fileId, { code: 'FAILED_TO_FETCH' });
    });
    expect(result.current.state.tray.items[0]?.queueOffline).toBe(true);
  });

  it("online, the file's own failure is not queued; offline off, never", () => {
    sdk.isOfflineEnabled = () => true;
    const online = startOne();
    act(() => {
      uploadListener().onFileFailure?.(online.fileId, { code: 'ERR_FILE_CORRUPT' });
    });
    expect(online.result.current.state.tray.items[0]?.status).toBe('failed');
    expect(online.result.current.state.tray.items[0]?.queueOffline).toBeUndefined();

    sdk.isOfflineEnabled = () => false;
    sdk.getConnectionStatus = vi.fn().mockReturnValue('disconnected');
    const off = startOne();
    act(() => {
      uploadListener().onFileFailure?.(off.fileId, { code: 'FAILED_TO_FETCH' });
    });
    expect(off.result.current.state.tray.items[0]?.queueOffline).toBeUndefined();
  });
});

describe('tray restore against a misbehaving SDK', () => {
  it('bytes that cannot be read restore an empty file; a preview that cannot be made is skipped', async () => {
    sdk.isOfflineEnabled = () => true;
    global.URL.createObjectURL = vi.fn(() => {
      throw new Error('no object URLs here');
    });
    const restored = restoredRequest(
      [
        { fileId: 'gone', name: 'gone.png', mimeType: 'image/png', status: 'failed' },
        { fileId: 'img', name: 'img.png', mimeType: 'image/png', status: 'failed' },
        { fileId: 'nameless', name: '', status: 'failed' },
      ],
      {
        getFileBytes: vi.fn((fileId: string) =>
          fileId === 'gone'
            ? Promise.reject(new Error('evicted'))
            : Promise.resolve(new Blob(['png'], { type: 'image/png' }))
        ),
        // The listener cannot be attached: the tray still shows the batch.
        addUploadListener: vi.fn(() => {
          throw new Error('request closed');
        }),
      }
    );
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(restored);
    const { result } = renderHook(() => useHarness());
    await waitFor(() => {
      expect(result.current.state.tray.items).toHaveLength(3);
    });
    const [gone, img, nameless] = result.current.state.tray.items;
    expect(gone?.file.size).toBe(0);
    expect(gone?.previewUrl).toBeUndefined();
    expect(img?.file.size).toBeGreaterThan(0);
    expect(img?.previewUrl).toBeUndefined();
    expect(nameless?.file.name).toBe('file');
    expect(restored.addUploadListener.mock.calls).toHaveLength(1);
  });

  it('a request with getFiles (no getItems) is read too; one with no files restores nothing', async () => {
    sdk.isOfflineEnabled = () => true;
    const files = [{ fileId: 'f', name: 'f.png', mimeType: 'image/png', status: 'uploaded' }];
    const viaGetFiles = restoredRequest([]);
    Reflect.deleteProperty(viaGetFiles, 'getItems');
    Object.assign(viaGetFiles, { getFiles: vi.fn(() => files) });
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(viaGetFiles);
    const { result } = renderHook(() => useHarness());
    await waitFor(() => {
      expect(result.current.state.tray.items.map(i => i.fileId)).toEqual(['f']);
    });

    const empty = restoredRequest([]);
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(empty);
    const second = renderHook(() => useHarness('another'));
    await waitFor(() => {
      expect(sdk.getExistingUploadFileRequest).toHaveBeenCalledWith('another', 'user', undefined);
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
    });
    expect(second.result.current.state.tray.items).toHaveLength(0);
    expect(empty.addUploadListener.mock.calls).toHaveLength(0);
  });

  it('a restore lookup that rejects leaves the tray empty', async () => {
    sdk.isOfflineEnabled = () => true;
    sdk.getExistingUploadFileRequest = vi.fn().mockRejectedValue(new Error('storage locked'));
    const { result } = renderHook(() => useHarness());
    await waitFor(() => {
      expect(sdk.getExistingUploadFileRequest).toHaveBeenCalled();
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
    });
    expect(result.current.state.tray.items).toHaveLength(0);
  });

  it('the user adds a file while the bytes are read: the restore is discarded and its previews revoked', async () => {
    sdk.isOfflineEnabled = () => true;
    let giveBytes: (b: Blob) => void = () => undefined;
    const restored = restoredRequest(
      [{ fileId: 'old', name: 'old.png', mimeType: 'image/png', status: 'failed' }],
      {
        getFileBytes: vi.fn(
          () =>
            new Promise<Blob>(resolve => {
              giveBytes = resolve;
            })
        ),
      }
    );
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(restored);
    const { result } = renderHook(() => useHarness());
    await waitFor(() => {
      expect(restored.getFileBytes.mock.calls.length).toBeGreaterThan(0);
    });
    act(() => {
      result.current.manager.startUpload([new File(['n'], 'new.png', { type: 'image/png' })]);
    });
    await act(async () => {
      giveBytes(new Blob(['old'], { type: 'image/png' }));
      await new Promise(resolve => setTimeout(resolve, 5));
    });
    expect(result.current.state.tray.items.map(i => i.file.name)).toEqual(['new.png']);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:restored');
    expect(restored.addUploadListener.mock.calls).toHaveLength(0);
  });
});

describe('detaching a batch whose listener cannot be removed', () => {
  async function restoreOne(removeUploadListener: () => void) {
    sdk.isOfflineEnabled = () => true;
    const restored = restoredRequest(
      [{ fileId: 'f1', name: 'a.png', mimeType: 'image/png', status: 'failed' }],
      { removeUploadListener: vi.fn(removeUploadListener) }
    );
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(restored);
    const hook = renderHook(({ id }) => useHarness(id), { initialProps: { id: 'peer' } });
    await waitFor(() => {
      expect(hook.result.current.state.tray.items).toHaveLength(1);
    });
    return { ...hook, restored };
  }

  const throwing = () => {
    throw new Error('already closed');
  };

  it('a chat switch still lets the batch go', async () => {
    const { rerender, restored } = await restoreOne(throwing);
    sdk.getExistingUploadFileRequest = vi.fn().mockResolvedValue(null);
    expect(() => {
      rerender({ id: 'other' });
    }).not.toThrow();
    expect(restored.removeUploadListener.mock.calls).toHaveLength(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:restored');
  });

  it('a logout still clears the tray', async () => {
    const { result, restored } = await restoreOne(throwing);
    act(() => {
      OfflineHub.getInstance().endSession();
    });
    expect(restored.removeUploadListener.mock.calls).toHaveLength(1);
    expect(result.current.state.tray.items).toHaveLength(0);
    // A second session event finds no offline batch left: nothing more to do.
    act(() => {
      OfflineHub.getInstance().endSession();
    });
    expect(restored.removeUploadListener.mock.calls).toHaveLength(1);
  });
});
