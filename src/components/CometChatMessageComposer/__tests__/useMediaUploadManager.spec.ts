/**
 * Unit tests for useMediaUploadManager (request-object upload model).
 *
 * Drives the mock UploadFileListener through every status transition and verifies
 * remove / retry / clear behaviour, the count-exceeded toast (the only toast case),
 * and the getStatus()-based send gate.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducer } from 'react';
import { mockCometChat, getLastUploadRequest } from '../../../testing/mock-sdk';

vi.mock('@cometchat/chat-sdk-javascript', () => ({ CometChat: mockCometChat }));

import { useMediaUploadManager } from '../useMediaUploadManager';
import { composerReducer, initialComposerState } from '../CometChatMessageComposer.reducer';

/** Callback bundle captured from the UploadFileListener the hook registers. */
interface CapturedListener {
  onFileProgress: (fileId: string, loaded: number, total: number, percent: number) => void;
  onFileUploaded: (fileId: string, attachment: unknown) => void;
  onFileFailure: (fileId: string, error: unknown) => void;
  onFileError: (fileId: string, error: unknown) => void;
  onComplete: (result: unknown) => void;
}

/**
 * Harness that wires the real composer reducer to the upload manager so tests can
 * observe resulting tray state after each listener callback / action.
 */
function useHarness(parentMessageId?: number) {
  const [state, dispatch] = useReducer(composerReducer, initialComposerState);
  const manager = useMediaUploadManager({
    dispatch,
    tray: state.tray,
    receiverId: 'receiver-1',
    receiverType: 'user',
    parentMessageId,
  });
  return { state, manager };
}

function makeFile(name: string, type: string): File {
  return new File(['data'], name, { type });
}

/** The per-call listener the hook passed to the most recent uploadAttachments call. */
function getListener(): CapturedListener {
  const listeners = getLastUploadRequest().__state.perCallListeners;
  return listeners[listeners.length - 1] as unknown as CapturedListener;
}

describe('useMediaUploadManager', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCometChat.isInitialized = vi.fn().mockReturnValue(true);
    // jsdom does not implement object URLs — stub them.
    createObjectURLSpy = vi.fn().mockReturnValue('blob:mock');
    revokeObjectURLSpy = vi.fn();
    global.URL.createObjectURL = createObjectURLSpy;
    global.URL.revokeObjectURL = revokeObjectURLSpy;
  });

  describe('startUpload', () => {
    it('creates one upload request and stages items as uploading with the request batchId', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([
          makeFile('a.png', 'image/png'),
          makeFile('b.pdf', 'application/pdf'),
        ]);
      });
      expect(mockCometChat.createUploadFileRequest).toHaveBeenCalledTimes(1);
      expect(mockCometChat.createUploadFileRequest).toHaveBeenCalledWith('receiver-1', 'user');
      const request = getLastUploadRequest();
      expect(request.uploadAttachments).toHaveBeenCalledTimes(1);
      // The app owns identity: uploadAttachments gets { fileId, file } pairs with
      // non-empty caller-supplied ids.
      const uploadArg = request.uploadAttachments.mock.calls[0][0] as { fileId: string }[];
      expect(uploadArg).toHaveLength(2);
      expect(uploadArg.every(i => typeof i.fileId === 'string' && i.fileId.length > 0)).toBe(true);

      const tray = result.current.state.tray;
      expect(tray.batchId).toBe('batch-mock');
      // Tray items keyed by our generated ids (unique, non-empty).
      expect(tray.items.map(i => i.fileId)).toEqual(uploadArg.map(i => i.fileId));
      expect(tray.items.every(i => i.status === 'uploading')).toBe(true);
      expect(tray.items.every(i => i.percent === 0)).toBe(true);
    });

    it('passes the listener to uploadAttachments (per-call, so per-file events fire)', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([makeFile('a.png', 'image/png')]);
      });
      const listener = getLastUploadRequest().uploadAttachments.mock.calls[0][1] as
        | Record<string, unknown>
        | undefined;
      expect(listener).toBeDefined();
      expect(typeof listener?.onFileUploaded).toBe('function');
      expect(typeof listener?.onFileProgress).toBe('function');
    });

    it('sets the thread parentMessageId on the request when provided', () => {
      const { result } = renderHook(() => useHarness(42));
      act(() => {
        result.current.manager.startUpload([makeFile('a.png', 'image/png')]);
      });
      expect(getLastUploadRequest().setParentMessageId).toHaveBeenCalledWith(42);
    });

    it('does not set parentMessageId for a top-level composer', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([makeFile('a.png', 'image/png')]);
      });
      expect(getLastUploadRequest().setParentMessageId).not.toHaveBeenCalled();
    });

    it('derives kind from the file MIME type', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([
          makeFile('a.png', 'image/png'),
          makeFile('b.mp4', 'video/mp4'),
          makeFile('c.mp3', 'audio/mpeg'),
          makeFile('d.pdf', 'application/pdf'),
        ]);
      });
      expect(result.current.state.tray.items.map(i => i.kind)).toEqual([
        'image',
        'video',
        'audio',
        'file',
      ]);
    });

    it('creates a stable object-URL preview for image/video/audio but not plain files', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([
          makeFile('a.png', 'image/png'),
          makeFile('c.mp3', 'audio/mpeg'),
          makeFile('d.pdf', 'application/pdf'),
        ]);
      });
      // Image + audio get a tracked preview URL; the plain file does not. (Audio
      // needs a stable URL so its <audio> element isn't reset to 0:00 on re-render.)
      expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
      const [img, audio, file] = result.current.state.tray.items;
      expect(img.previewUrl).toBe('blob:mock');
      expect(audio.previewUrl).toBe('blob:mock');
      expect(file.previewUrl).toBeUndefined();
    });

    it('reuses the same request (same batch) on a subsequent upload', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([makeFile('a.png', 'image/png')]);
      });
      const request = getLastUploadRequest();
      act(() => {
        result.current.manager.startUpload([makeFile('b.png', 'image/png')]);
      });
      // One request across both adds; uploadAttachments called twice on it (each
      // with the listener).
      expect(mockCometChat.createUploadFileRequest).toHaveBeenCalledTimes(1);
      expect(request.uploadAttachments).toHaveBeenCalledTimes(2);
      expect(request.uploadAttachments.mock.calls[1][1]).toBeDefined();
      expect(result.current.state.tray.items).toHaveLength(2);
    });

    it('does nothing when the SDK is not initialized', () => {
      mockCometChat.isInitialized = vi.fn().mockReturnValue(false);
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([makeFile('a.png', 'image/png')]);
      });
      expect(mockCometChat.createUploadFileRequest).not.toHaveBeenCalled();
      expect(result.current.state.tray.items).toHaveLength(0);
    });
  });

  describe('listener status transitions', () => {
    function stageOne(result: {
      current: { manager: { startUpload: (f: File[]) => void } };
    }): string {
      act(() => {
        result.current.manager.startUpload([makeFile('a.png', 'image/png')]);
      });
      return (
        result as unknown as { current: { state: { tray: { items: { fileId: string }[] } } } }
      ).current.state.tray.items[0].fileId;
    }

    it('onFileProgress updates the tile percent', () => {
      const { result } = renderHook(() => useHarness());
      const fileId = stageOne(result);
      act(() => {
        getListener().onFileProgress(fileId, 50, 100, 50);
      });
      expect(result.current.state.tray.items[0].percent).toBe(50);
    });

    it('onFileUploaded sets the attachment and marks success', () => {
      const { result } = renderHook(() => useHarness());
      const fileId = stageOne(result);
      const attachment = { getUrl: () => 'https://x' };
      act(() => {
        getListener().onFileUploaded(fileId, attachment);
      });
      const item = result.current.state.tray.items[0];
      expect(item.status).toBe('success');
      expect(item.attachment).toBe(attachment);
    });

    it('onFileFailure marks the tile failed (retryable)', () => {
      const { result } = renderHook(() => useHarness());
      const fileId = stageOne(result);
      act(() => {
        getListener().onFileFailure(fileId, { code: 'ERR_S3_UPLOAD_FAILED' });
      });
      expect(result.current.state.tray.items[0].status).toBe('failed');
      expect(result.current.state.showValidationError).toBe(false);
    });

    it('onFileError marks the tile rejected without a toast for non-count errors', () => {
      const { result } = renderHook(() => useHarness());
      const fileId = stageOne(result);
      act(() => {
        getListener().onFileError(fileId, { code: 'ERR_FILE_SIZE_EXCEEDED' });
      });
      expect(result.current.state.tray.items[0].status).toBe('rejected');
      expect(result.current.state.showValidationError).toBe(false);
    });

    it('onFileError shows the count-exceeded toast for ERR_FILE_COUNT_EXCEEDED', () => {
      const { result } = renderHook(() => useHarness());
      const fileId = stageOne(result);
      act(() => {
        getListener().onFileError(fileId, { code: 'ERR_FILE_COUNT_EXCEEDED' });
      });
      expect(result.current.state.tray.items[0].status).toBe('rejected');
      expect(result.current.state.showValidationError).toBe(true);
      expect(result.current.state.validationErrorText).toBe('attachment_count_exceeded');
    });
  });

  describe('send gate (all-or-nothing: every item success)', () => {
    it('is sendable once every staged file has uploaded', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([makeFile('a.png', 'image/png')]);
      });
      // Still uploading → not sendable.
      expect(result.current.manager.sendable).toBe(false);
      const fileId = result.current.state.tray.items[0].fileId;
      act(() => {
        getListener().onFileUploaded(fileId, { getUrl: () => 'https://x' });
      });
      expect(result.current.manager.sendable).toBe(true);
    });

    it('is not sendable while any file is still uploading', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([
          makeFile('a.png', 'image/png'),
          makeFile('b.png', 'image/png'),
        ]);
      });
      const [first] = result.current.state.tray.items.map(i => i.fileId);
      act(() => {
        getListener().onFileUploaded(first, { getUrl: () => 'https://x' });
      });
      // Second file still uploading → not sendable.
      expect(result.current.manager.sendable).toBe(false);
    });

    it('is not sendable when a file failed', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([makeFile('a.png', 'image/png')]);
      });
      const fileId = result.current.state.tray.items[0].fileId;
      act(() => {
        getListener().onFileFailure(fileId, { code: 'ERR_S3_UPLOAD_FAILED' });
      });
      expect(result.current.manager.sendable).toBe(false);
    });
  });

  describe('retryItem', () => {
    it('calls retryAttachment and sets the tile back to uploading', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([makeFile('a.png', 'image/png')]);
      });
      const fileId = result.current.state.tray.items[0].fileId;
      act(() => {
        getListener().onFileFailure(fileId, { code: 'ERR_S3_UPLOAD_FAILED' });
      });
      act(() => {
        result.current.manager.retryItem(fileId);
      });
      expect(getLastUploadRequest().retryAttachment).toHaveBeenCalledWith(fileId);
      expect(result.current.state.tray.items[0].status).toBe('uploading');
    });
  });

  describe('removeItem', () => {
    it('removes the attachment, revokes the preview, and removes the tile', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([
          makeFile('a.png', 'image/png'),
          makeFile('b.png', 'image/png'),
        ]);
      });
      const [first, second] = result.current.state.tray.items.map(i => i.fileId);
      act(() => {
        result.current.manager.removeItem(first);
      });
      expect(getLastUploadRequest().removeAttachment).toHaveBeenCalledWith(first);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock');
      expect(result.current.state.tray.items.map(i => i.fileId)).toEqual([second]);
    });

    it('tears the whole batch down (clearAll) when the last item is removed', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([makeFile('a.png', 'image/png')]);
      });
      const request = getLastUploadRequest();
      const [only] = result.current.state.tray.items.map(i => i.fileId);
      act(() => {
        result.current.manager.removeItem(only);
      });
      // Batch destroyed, not just the single file dropped.
      expect(request.clearAll).toHaveBeenCalledTimes(1);
      expect(request.removeAttachment).not.toHaveBeenCalled();
      expect(result.current.state.tray).toEqual({ batchId: null, items: [] });
      // The next add starts a fresh request (the ref was nulled).
      act(() => {
        result.current.manager.startUpload([makeFile('b.png', 'image/png')]);
      });
      expect(mockCometChat.createUploadFileRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('clear', () => {
    it('clears the request, revokes previews, and clears the tray', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([
          makeFile('a.png', 'image/png'),
          makeFile('b.mp4', 'video/mp4'),
        ]);
      });
      const request = getLastUploadRequest();
      act(() => {
        result.current.manager.clear();
      });
      expect(request.clearAll).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLSpy).toHaveBeenCalledTimes(2);
      expect(result.current.state.tray).toEqual({ batchId: null, items: [] });
      expect(result.current.manager.sendable).toBe(false);
    });

    it('starts a fresh request on the next upload after clear', () => {
      const { result } = renderHook(() => useHarness());
      act(() => {
        result.current.manager.startUpload([makeFile('a.png', 'image/png')]);
      });
      act(() => {
        result.current.manager.clear();
      });
      act(() => {
        result.current.manager.startUpload([makeFile('b.png', 'image/png')]);
      });
      expect(mockCometChat.createUploadFileRequest).toHaveBeenCalledTimes(2);
    });
  });
});
