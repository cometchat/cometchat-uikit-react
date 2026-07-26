import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { UploadFileRequest } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import { selectCanSend } from './CometChatMessageComposer.reducer';
import type { CometChatMessageComposerAction } from './CometChatMessageComposer.reducer';
import type { TrayItem, TrayItemKind, TrayState } from './CometChatMessageComposer.types';

/**
 * Localization key for the count-exceeded toast. Reuses the composer's existing
 * validation-error banner mechanism (`SET_VALIDATION_ERROR`).
 */
const COUNT_EXCEEDED_TOAST_KEY = 'attachment_count_exceeded';

/**
 * Fallback maximum attachment count used when `getMaxAttachmentCount()` is
 * unavailable, throws/rejects, or returns a non-positive / NaN value (R9.1).
 */
export const DEFAULT_MAX_ATTACHMENTS = 10;

/**
 * Sanitize a candidate maximum-attachment value: only a finite, positive number
 * is accepted; anything else falls back to `fallback` (default {@link DEFAULT_MAX_ATTACHMENTS}).
 */
function sanitizeMax(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return fallback;
}

/**
 * Pure helper implementing Correctness Property 1 (per-batch count limit).
 *
 * Enforces the per-batch attachment limit across all types BEFORE upload as an
 * ALL-OR-NOTHING gate: if the newly picked files would push the staged count past
 * `max`, NONE of them are accepted and the tray is left unchanged; otherwise every
 * picked file is accepted.
 *
 * `accepted` is therefore either all of `pickedFiles` (when `currentCount +
 * pickedFiles.length <= max`) or empty; `rejected === pickedFiles.length -
 * accepted.length`. Since the tray maintains `currentCount <= max`, the staged
 * count after an add never exceeds `max`.
 *
 * @param currentCount number of items already staged in the tray.
 * @param pickedFiles the files just picked (any path: picker, drag-n-drop).
 * @param max the resolved maximum attachment count.
 */
export function enforceCountLimit(
  currentCount: number,
  pickedFiles: readonly File[],
  max: number
): { accepted: File[]; rejected: number } {
  const wouldExceed = currentCount + pickedFiles.length > max;
  const accepted = wouldExceed ? [] : [...pickedFiles];
  return { accepted, rejected: pickedFiles.length - accepted.length };
}

/**
 * Derive a tray item's media kind from the browser file's MIME type. Mirrors the
 * `actualFileType = file.type.split('/')[0]` check used elsewhere in the composer.
 */
export function deriveTrayItemKind(file: File): TrayItemKind {
  const primary = (file.type || '').split('/')[0];
  if (primary === 'image') return 'image';
  if (primary === 'video') return 'video';
  if (primary === 'audio') return 'audio';
  return 'file';
}

/**
 * Generate a caller-supplied `fileId` for the upload.
 *
 * Uses `crypto.randomUUID()` when available (secure contexts), falling back to
 * the composer's muid-style generator for insecure/legacy environments.
 */
function makeFileId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to the non-crypto fallback */
  }
  return `_${Math.random().toString(36).slice(2, 11)}`;
}

/** Options for {@link useMediaUploadManager}. */
export interface UseMediaUploadManagerOptions {
  /** The composer reducer dispatch (drives tray state). */
  dispatch: React.Dispatch<CometChatMessageComposerAction>;
  /** Current tray slice — read for batchId, previews, and eligibility. */
  tray: TrayState;
  /** Recipient id (uid or guid) — required by the SDK's presign endpoint. */
  receiverId: string;
  /** Recipient type (`user` or `group`) — required by the SDK's presign endpoint. */
  receiverType: string;
  /**
   * Thread parent message id, when the composer lives in a thread. Set on the
   * upload request (`setParentMessageId`) so the presign call carries it for
   * thread-scoped role-based access control. Omit/0 for top-level composers.
   */
  parentMessageId?: number;
}

/** Public surface of {@link useMediaUploadManager}. */
export interface MediaUploadManager {
  /**
   * Stage and upload files, creating or extending the upload group.
   * `forcedKind` overrides MIME-derived categorization (e.g. the "File" picker
   * option stages everything as `file`), matching legacy single-attachment behavior.
   */
  startUpload: (files: File[], forcedKind?: TrayItemKind) => void;
  /** Cancel a file's upload and remove it from the tray (revokes its preview). */
  removeItem: (fileId: string) => void;
  /** Retry a failed file's upload and mark it uploading again. */
  retryItem: (fileId: string) => void;
  /** Release the upload group and clear the tray (revokes all previews). */
  clear: () => void;
  /**
   * Send-eligibility (all-or-nothing): `true` when the tray has at least one item
   * and every item has succeeded. A pure function of tray state, so it tracks
   * every add / status change / remove / clear. Drives the multi-attachment Send.
   */
  sendable: boolean;
  /** The resolved per-batch maximum attachment count (from the SDK, or fallback). */
  maxAttachmentCount: number;
  /**
   * The live upload request for the active batch, or null when none is staged.
   * The composer's send pipeline captures this before its optimistic
   * `TRAY_CLEAR` so it can release the exact batch (`clearAll()`) after send —
   * even if a new batch is started while the previous send is still in flight.
   */
  getActiveRequest: () => UploadFileRequest | null;
}

/**
 * useMediaUploadManager — drives the SDK's request-object upload model
 * ({@link CometChat.createUploadFileRequest} → {@link UploadFileRequest}) and
 * maps its {@link CometChat.UploadFileListener} callbacks onto composer tray
 * dispatches.
 *
 * Responsibilities:
 * - `startUpload`: the first add of a batch creates one `UploadFileRequest`
 *   (bound to the receiver + optional `parentMessageId`), registers the global
 *   listener, and stores it in a ref; the batch id comes from
 *   `request.getBatchId()`. Every add mints a caller-supplied `fileId` per file
 *   (the SDK no longer generates ids) and calls `request.uploadAttachments`.
 * - Listener wiring: `onFileProgress` -> progress; `onFileUploaded` -> success;
 *   `onFileFailure` -> `failed` (retryable); `onFileError` -> `rejected`
 *   (the only toast case is `ERR_FILE_COUNT_EXCEEDED`).
 * - `removeItem`/`retryItem`/`clear` call `removeAttachment`/`retryAttachment`/
 *   `clearAll` on the request.
 * - Send gate: `sendable` is a pure function of tray state (every item `success`),
 *   so it tracks tray dispatches without extra bookkeeping.
 * - Object-URL previews are revoked on remove/clear and on unmount to avoid leaks.
 */
export function useMediaUploadManager(options: UseMediaUploadManagerOptions): MediaUploadManager {
  const { dispatch, tray, receiverId, receiverType, parentMessageId } = options;

  // Send gate: derived straight from tray state (all-or-nothing — every item must
  // be `success`). No stored flag; it re-derives on every dispatch that changes
  // the tray, which is exactly when the Send button should re-evaluate.
  const sendable = selectCanSend(tray);

  // Keep the latest tray in a ref so listener callbacks (created once) always see
  // current state without being re-created on every render.
  const trayRef = useRef<TrayState>(tray);
  trayRef.current = tray;

  // Mirror the receiver in refs so startUpload (memoized) always reads the current
  // conversation without being re-created when the receiver changes.
  const receiverIdRef = useRef(receiverId);
  receiverIdRef.current = receiverId;
  const receiverTypeRef = useRef(receiverType);
  receiverTypeRef.current = receiverType;
  // Mirror the thread parent id so the (memoized) startUpload sets it on a
  // freshly created request without being re-created when it changes.
  const parentMessageIdRef = useRef(parentMessageId);
  parentMessageIdRef.current = parentMessageId;

  // The live upload request for the active batch. One request == one batch;
  // created lazily on the first add of a batch and reused for incremental adds.
  const requestRef = useRef<UploadFileRequest | null>(null);

  // Resolved per-batch attachment maximum. Read once from the SDK on mount and
  // cached in a ref; defaults to DEFAULT_MAX_ATTACHMENTS (10) until (and if)
  // the SDK value resolves. The SDK value is the source of truth.
  const maxRef = useRef<number>(DEFAULT_MAX_ATTACHMENTS);
  // Exposed resolved max (state so consumers re-render when the SDK value lands).
  const [maxAttachmentCount, setMaxAttachmentCount] = useState<number>(DEFAULT_MAX_ATTACHMENTS);

  // Track object URLs by fileId so we can revoke them on remove/clear/unmount.
  const objectUrlsRef = useRef<Map<string, string>>(new Map());

  const isSdkInitialized = useCallback((): boolean => {
    try {
      return CometChat.isInitialized();
    } catch {
      return false;
    }
  }, []);

  const revokeObjectUrl = useCallback((fileId: string) => {
    const url = objectUrlsRef.current.get(fileId);
    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* non-fatal */
      }
      objectUrlsRef.current.delete(fileId);
    }
  }, []);

  const revokeAllObjectUrls = useCallback(() => {
    for (const url of objectUrlsRef.current.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* non-fatal */
      }
    }
    objectUrlsRef.current.clear();
  }, []);

  // A single listener instance drives every upload call on the request. It is
  // passed per call to `uploadAttachments` (the SDK stores it on each file and
  // dispatches per-file events to it) — not registered globally, since
  // `addUploadListener` before the first upload silently no-op's.
  const listener = useMemo(() => {
    return new CometChat.UploadFileListener({
      onFileProgress: (fileId: string, _loaded: number, _total: number, percent: number) => {
        dispatch({ type: 'TRAY_UPDATE_PROGRESS', fileId, percent: Math.round(percent) });
      },
      onFileUploaded: (fileId: string, attachment: CometChat.Attachment) => {
        dispatch({ type: 'TRAY_SET_ATTACHMENT', fileId, attachment });
      },
      onFileFailure: (fileId: string, error: CometChat.CometChatException) => {
        dispatch({ type: 'TRAY_UPDATE_STATUS', fileId, status: 'failed', error });
      },
      onFileError: (fileId: string, error: CometChat.CometChatException) => {
        dispatch({ type: 'TRAY_UPDATE_STATUS', fileId, status: 'rejected', error });
        // The ONLY toast case: file-count-exceeded. All other errors update the
        // tile state only, with no toast.
        if (error.code === CometChatUIKitConstants.MediaUploadErrorCodes.FILE_COUNT_EXCEEDED) {
          dispatch({
            type: 'SET_VALIDATION_ERROR',
            show: true,
            text: COUNT_EXCEEDED_TOAST_KEY,
          });
        }
      },
    });
  }, [dispatch]);

  // Read the per-batch maximum from the SDK once on mount. Falls back to the
  // provided/default value on throw, rejection, or a non-positive/NaN result.
  useEffect(() => {
    let cancelled = false;
    const resolveMax = async (): Promise<void> => {
      try {
        if (!isSdkInitialized()) return;
        const value = await CometChat.getMaxAttachmentCount();
        if (cancelled) return;
        const resolved = sanitizeMax(value, DEFAULT_MAX_ATTACHMENTS);
        maxRef.current = resolved;
        setMaxAttachmentCount(resolved);
      } catch {
        // Keep the fallback max already in maxRef.
      }
    };
    void resolveMax();
    return () => {
      cancelled = true;
    };
    // Fetch once on mount; the fallback ref update above handles later prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startUpload = useCallback(
    (files: File[], forcedKind?: TrayItemKind) => {
      if (files.length === 0) return;
      if (!isSdkInitialized()) return;

      // Enforce the per-batch count limit (total across all types) BEFORE upload.
      // All-or-nothing: if the pick would exceed max, reject the whole batch (add
      // nothing) and raise the count-exceeded toast; otherwise stage all of it. This
      // keeps the total staged count <= max after the add (Property 1).
      const { accepted, rejected } = enforceCountLimit(
        trayRef.current.items.length,
        files,
        maxRef.current
      );
      if (rejected > 0) {
        dispatch({ type: 'SET_VALIDATION_ERROR', show: true, text: COUNT_EXCEEDED_TOAST_KEY });
      }
      if (accepted.length === 0) return;

      // One request == one batch. Create a fresh request when the tray has no
      // active batch (first add, or after a send/clear reset the tray); reuse the
      // live request for incremental adds.
      if (!trayRef.current.batchId || !requestRef.current) {
        const request = CometChat.createUploadFileRequest(
          receiverIdRef.current,
          receiverTypeRef.current
        );
        if (parentMessageIdRef.current) {
          request.setParentMessageId(parentMessageIdRef.current);
        }
        requestRef.current = request;
      }
      const request = requestRef.current;

      // The app owns per-file identity: mint a fileId per file, key the tray
      // on it, and hand `{ fileId, file }` to the SDK (echoed back on every event).
      // The listener MUST be passed per call: the SDK stores it on each file and
      // dispatches per-file events (progress/uploaded/failure/error) to it.
      const staged = accepted.map(file => ({ fileId: makeFileId(), file }));
      request.uploadAttachments(
        staged.map(({ fileId, file }) => ({ fileId, file })),
        listener
      );

      const items: TrayItem[] = staged.map(({ fileId, file }) => {
        const kind = forcedKind ?? deriveTrayItemKind(file);
        let previewUrl: string | undefined;
        // Image/video need it for thumbnails; audio needs a *stable* URL so the
        // <audio> element isn't re-`src`'d (and reset to 0:00) on every re-render.
        if (kind === 'image' || kind === 'video' || kind === 'audio') {
          try {
            previewUrl = URL.createObjectURL(file);
            objectUrlsRef.current.set(fileId, previewUrl);
          } catch {
            /* non-fatal — preview simply unavailable */
          }
        }
        return { fileId, file, kind, status: 'uploading' as const, percent: 0, previewUrl };
      });

      // Newly staged files are in flight (status `uploading`), so the tray-derived
      // `sendable` is already false — no extra bookkeeping needed here.
      dispatch({ type: 'TRAY_ADD', items, batchId: request.getBatchId() });
    },
    [dispatch, isSdkInitialized, listener]
  );

  const removeItem = useCallback(
    (fileId: string) => {
      const request = requestRef.current;
      // If this is the last staged item, tear the whole batch down instead of just
      // dropping the file: `removeAttachment` empties the SDK group but leaves the
      // group object in memory, and the reducer nulls `tray.batchId` on the last
      // remove — so without this the emptied group would be orphaned (leaking until
      // logout) and `requestRef` would point at a dead batch. `clearAll()` is
      // batch-scoped (clearGroup(batchId)); we also null the ref so the next add
      // starts a fresh request.
      const isLastItem =
        trayRef.current.items.length > 0 &&
        trayRef.current.items.every(item => item.fileId === fileId);
      if (request) {
        try {
          if (isLastItem) {
            request.clearAll();
          } else {
            // Aborts an in-flight upload silently, or drops an already-uploaded file.
            request.removeAttachment(fileId);
          }
        } catch {
          /* non-fatal — file may already be settled */
        }
      }
      if (isLastItem) {
        requestRef.current = null;
      }
      revokeObjectUrl(fileId);
      dispatch({ type: 'TRAY_REMOVE', fileId });
    },
    [dispatch, revokeObjectUrl]
  );

  const retryItem = useCallback(
    (fileId: string) => {
      const request = requestRef.current;
      if (request) {
        try {
          request.retryAttachment(fileId);
        } catch {
          /* non-fatal */
        }
      }
      dispatch({ type: 'TRAY_UPDATE_STATUS', fileId, status: 'uploading' });
    },
    [dispatch]
  );

  const clear = useCallback(() => {
    const request = requestRef.current;
    if (request) {
      try {
        request.clearAll();
      } catch {
        /* non-fatal */
      }
    }
    requestRef.current = null;
    revokeAllObjectUrls();
    dispatch({ type: 'TRAY_CLEAR' });
  }, [dispatch, revokeAllObjectUrls]);

  const getActiveRequest = useCallback(() => requestRef.current, []);

  // Revoke any outstanding object URLs on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      revokeAllObjectUrls();
    };
  }, [revokeAllObjectUrls]);

  return {
    startUpload,
    removeItem,
    retryItem,
    clear,
    sendable,
    maxAttachmentCount,
    getActiveRequest,
  };
}
