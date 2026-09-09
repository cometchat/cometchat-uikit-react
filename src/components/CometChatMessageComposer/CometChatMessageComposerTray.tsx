import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TrayItem } from './CometChatMessageComposer.types';
import { useCometChatMessageComposerContext } from './CometChatMessageComposer.context';
import type { CometChatMediaAttachment } from '../base/CometChatFullScreenViewer/CometChatFullScreenViewer.types';
import { CometChatTooltip } from '../base/CometChatTooltip';
import { useLocale } from '../../context/locale/LocaleContext';
import { CometChatUIKitConstants } from '../../constants/CometChatUIKitConstants';
import {
  startExclusivePlayback,
  stopExclusivePlayback,
  type AudioPlaybackHandle,
} from '../../utils/audioPlaybackController';
import playArrowIcon from '../../assets/play_arrow.svg';
import pauseIcon from '../../assets/pause.svg';
import closeIcon from '../../assets/close.svg';
import retryIcon from '../../assets/retry-icon.svg';
import errorIcon from '../../assets/error-icon.svg';
import fileTypePdf from '../../assets/file_type_pdf.svg';
import fileTypeWord from '../../assets/file_type_word.svg';
import fileTypeXlsx from '../../assets/file_type_xlsx.svg';
import fileTypePpt from '../../assets/file_type_ppt.svg';
import fileTypeTxt from '../../assets/file_type_txt.svg';
import fileTypeZip from '../../assets/file_type_zip.svg';
import fileTypeMp3 from '../../assets/file_type_mp3.svg';
import fileTypeMov from '../../assets/file_type_mov.svg';
import fileTypeJpg from '../../assets/file_type_jpg.svg';
import fileTypeUnsupported from '../../assets/file_type_unsupported.svg';
import './CometChatMessageComposerTray.css';

// Lazy-load the FullScreenViewer — heavy and only needed when a media tile is opened.
const LazyCometChatFullScreenViewer = lazy(
  () => import('../base/CometChatFullScreenViewer/CometChatFullScreenViewer.lazy')
);

// --- Helpers ---

/**
 * Resolve the display URL for a tray item.
 *
 * The tray always renders from the LOCAL File object (via its object-URL preview),
 * never the uploaded attachment URL — the remote URL requires auth and isn't needed
 * while the file is staged locally. Falls back to creating an object URL from the
 * File if no preview was set.
 */
function resolveItemUrl(item: TrayItem): string {
  if (item.previewUrl) return item.previewUrl;
  if (item.file instanceof File) {
    try {
      return URL.createObjectURL(item.file);
    } catch {
      return '';
    }
  }
  return '';
}

/** Resolve a tray item's display filename from the local File. */
function resolveItemName(item: TrayItem): string {
  return item.file instanceof File ? item.file.name : 'File';
}

/** Read the error code off a tray item's captured error (if any). */
function errorCodeOf(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null
    ? (error as { code?: string }).code
    : undefined;
}

/** Read the human-readable message off a tray item's captured error (if any). */
function errorMessageOf(error: unknown): string {
  const message =
    typeof error === 'object' && error !== null
      ? (error as { message?: unknown }).message
      : undefined;
  return typeof message === 'string' ? message : '';
}

/**
 * Parse the byte size limit embedded in the SDK's ERR_FILE_SIZE_EXCEEDED error
 * message ("The file <name> exceeds the maximum allowed size of <bytes> bytes.").
 * The limit is only present in the message text — `details` is empty — so this is
 * the only runtime source for it. Returns null if it can't be extracted.
 */
function extractSizeLimitBytes(error: unknown): number | null {
  const message =
    typeof error === 'object' && error !== null
      ? (error as { message?: unknown }).message
      : undefined;
  if (typeof message !== 'string') return null;
  const match = /of\s+(\d+)\s+bytes/i.exec(message);
  if (!match) return null;
  const bytes = Number(match[1]);
  return Number.isFinite(bytes) && bytes > 0 ? bytes : null;
}

/** Format a byte count as a MB number for display (integer when whole, else 1 decimal). */
function formatSizeLimitMB(bytes: number): string {
  const rounded = Math.round((bytes / (1024 * 1024)) * 10) / 10;
  return String(rounded);
}

/**
 * Build the "file too large" tooltip text from the localized template, filling the
 * `{count}` placeholder with the MB limit parsed from the SDK error. Falls back to
 * the raw template (placeholder stripped) if the limit can't be resolved.
 */
function buildSizeExceededTooltip(template: string, error: unknown): string {
  const bytes = extractSizeLimitBytes(error);
  if (bytes == null)
    return template
      .replace('{count}', '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  return template.replace('{count}', formatSizeLimitMB(bytes));
}

/** Extract the uppercased file extension (e.g. "PDF") for the file-card meta label. */
function fileExtensionLabel(name: string): string {
  const parts = name.split('.');
  if (parts.length < 2) return 'FILE';
  return (parts.pop() ?? '').toUpperCase();
}

/** Map a filename's extension to a file-type icon asset. */
function fileTypeIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'pdf':
      return fileTypePdf;
    case 'doc':
    case 'docx':
      return fileTypeWord;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return fileTypeXlsx;
    case 'ppt':
    case 'pptx':
      return fileTypePpt;
    case 'txt':
    case 'rtf':
      return fileTypeTxt;
    case 'zip':
    case 'rar':
    case '7z':
    case 'gz':
      return fileTypeZip;
    case 'mp3':
    case 'wav':
    case 'm4a':
    case 'aac':
    case 'ogg':
      return fileTypeMp3;
    case 'mov':
    case 'mp4':
    case 'avi':
    case 'mkv':
      return fileTypeMov;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'bmp':
    case 'svg':
    case 'heic':
    case 'heif':
      return fileTypeJpg;
    default:
      return fileTypeUnsupported;
  }
}

/** Format seconds to mm:ss (zero-padded minutes), e.g. "00:07". */
function formatClock(seconds: number): string {
  const safe = !seconds || seconds < 0 || !Number.isFinite(seconds) ? 0 : seconds;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Generates a crisp, DPR-sized square thumbnail from an image File (via <canvas>),
 * the way sites normally do. Cramming a multi-megapixel photo into a ~64px box and
 * letting the browser downscale in one big step looks soft; pre-scaling to roughly
 * the displayed pixel size keeps it sharp. Returns `undefined` until ready.
 */
function useImageThumbnail(url: string, displayPx: number, mimeType?: string): string | undefined {
  const [thumb, setThumb] = useState<string | undefined>(undefined);
  useEffect(() => {
    setThumb(undefined);
    if (!url) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      try {
        const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3);
        const size = Math.round(displayPx * dpr);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx || !img.naturalWidth || !img.naturalHeight) return;
        // Center cover-crop to a square.
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - side) / 2;
        const sy = (img.naturalHeight - side) / 2;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        // JPEG has no alpha channel, so a transparent source (SVG, PNG, …) would be
        // flattened onto black. Only re-encode as JPEG when the source is itself
        // opaque (a JPEG); otherwise keep PNG so transparency is preserved and the
        // tile's own themed background shows through, matching the image bubble.
        const type = (mimeType ?? '').toLowerCase();
        const isJpeg = type === 'image/jpeg' || type === 'image/jpg';
        const dataUrl = isJpeg
          ? canvas.toDataURL('image/jpeg', 0.92)
          : canvas.toDataURL('image/png');
        if (!cancelled) setThumb(dataUrl);
      } catch {
        /* keep undefined → falls back to the original url */
      }
    };
    img.src = url;
    return () => {
      cancelled = true;
      img.onload = null;
    };
  }, [url, displayPx, mimeType]);
  return thumb;
}

/**
 * Generates a poster thumbnail from a video's first frame locally (via a hidden
 * <video> + <canvas>), the way websites normally do. Returns `undefined` until a
 * frame is captured (or if capture fails) — callers show a plain grey tile then,
 * never a broken-image icon.
 */
function useVideoThumbnail(url: string): { poster: string | undefined; duration: number | null } {
  const [poster, setPoster] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState<number | null>(null);
  useEffect(() => {
    setPoster(undefined);
    setDuration(null);
    if (!url) return;

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    let cancelled = false;

    const cleanup = () => {
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('seeked', onSeeked);
      video.removeAttribute('src');
      try {
        video.load();
      } catch {
        /* non-fatal */
      }
    };

    const capture = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const data = canvas.toDataURL('image/jpeg', 0.7);
          if (!cancelled) setPoster(data);
        }
      } catch {
        /* capture failed → leave grey tile */
      }
      cleanup();
    };

    const onSeeked = () => {
      capture();
    };
    const onLoadedData = () => {
      // Read duration
      if (!cancelled && video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
      }
      // Seek slightly in to avoid a black first frame.
      try {
        video.currentTime = Math.min(0.1, video.duration || 0.1);
      } catch {
        capture();
      }
    };

    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('seeked', onSeeked);
    video.src = url;

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [url]);
  return { poster, duration };
}

// --- Circular progress overlay ---

const PROGRESS_RADIUS = 14;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

/**
 * CircularProgress — SVG ring driven by `percent` (0-100). Shown centered over the
 * media thumbnail or over a card's icon while its upload is in flight.
 *
 * A not-yet-started upload (percent 0 — e.g. queued behind other uploads) renders
 * an indeterminate, continuously spinning arc instead of an empty ring. Once real
 * progress arrives (percent > 0) it becomes a determinate ring.
 */
const CircularProgress: React.FC<{ percent: number; label: string }> = ({ percent, label }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const indeterminate = clamped <= 0;
  const offset = PROGRESS_CIRCUMFERENCE * (1 - clamped / 100);
  return (
    <span
      className={[
        'cometchat-message-composer__tray-progress',
        indeterminate ? 'cometchat-message-composer__tray-progress--indeterminate' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      // Indeterminate progressbars omit aria-valuenow.
      {...(indeterminate ? {} : { 'aria-valuenow': Math.round(clamped) })}
      aria-label={label}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <circle
          className={'cometchat-message-composer__tray-progress-track'}
          cx="16"
          cy="16"
          r={PROGRESS_RADIUS}
        />
        <circle
          className={'cometchat-message-composer__tray-progress-indicator'}
          cx="16"
          cy="16"
          r={PROGRESS_RADIUS}
          style={
            indeterminate
              ? {
                  // A short arc (quarter circle) that the CSS animation spins.
                  strokeDasharray: `${String(PROGRESS_CIRCUMFERENCE * 0.25)} ${String(PROGRESS_CIRCUMFERENCE)}`,
                  strokeDashoffset: 0,
                }
              : { strokeDasharray: PROGRESS_CIRCUMFERENCE, strokeDashoffset: offset }
          }
        />
      </svg>
    </span>
  );
};

// --- Playable audio card ---

interface TrayAudioCardProps {
  url: string;
  name: string;
  /** Whether playback is enabled (only for successfully-staged items). */
  interactive: boolean;
  /** Status overlay (progress/retry/error) shown over the button when present. */
  overlay: React.ReactNode;
  /**
   * Error/failure status line. In Audio cards, when set, it
   * replaces the seek slider + duration
   */
  statusText?: string;
  playLabel: string;
  pauseLabel: string;
  seekLabel: string;
}

/**
 * TrayAudioCard — a self-contained, playable audio tile.
 *
 * Layout (matches the design): a round play/pause button on the left, and a body
 * with the trimmed filename above a seek slider, and `current/total` time below it.
 */
const TrayAudioCard: React.FC<TrayAudioCardProps> = ({
  url,
  name,
  interactive,
  overlay,
  statusText,
  playLabel,
  pauseLabel,
  seekLabel,
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Stable handle for the global single-audio policy.
  const playbackHandleRef = React.useRef<AudioPlaybackHandle>({
    pause: () => audioRef.current?.pause(),
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handle = playbackHandleRef.current;
    const onLoaded = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const onTime = () => {
      setCurrentTime(audio.currentTime);
    };
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      stopExclusivePlayback(handle);
    };
    const onPlay = () => {
      setIsPlaying(true);
      startExclusivePlayback(handle);
    };
    const onPause = () => {
      setIsPlaying(false);
      stopExclusivePlayback(handle);
    };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      stopExclusivePlayback(handle);
    };
  }, [url]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value);
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  // Played (left) portion is white; the remaining track stays grey.
  const playedPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const sliderBackground = `linear-gradient(to right, var(--cometchat-static-white, #fff) 0 ${String(playedPct)}%, var(--cometchat-neutral-color-300, #dcdcdc) ${String(playedPct)}% 100%)`;

  return (
    <div
      className={
        'cometchat-message-composer__tray-card cometchat-message-composer__tray-card--audio'
      }
    >
      <audio ref={audioRef} src={url} preload="metadata" />
      {/* The overlay (which holds the retry button when failed) must NOT be nested
          inside the play button: that button is `disabled` whenever the item isn't
          a success, and a disabled <button> swallows clicks on its whole subtree —
          so a nested retry button would never fire. Keep them siblings under a
          positioned wrapper (also avoids invalid button-in-button markup). */}
      <span className={'cometchat-message-composer__tray-audio-btn-wrap'}>
        <button
          type="button"
          className={'cometchat-message-composer__tray-audio-btn'}
          onClick={interactive ? togglePlay : undefined}
          disabled={!interactive}
          aria-label={isPlaying ? pauseLabel : playLabel}
        >
          <img
            className="cometchat-message-composer__tray-audio-btn--play-icon"
            src={isPlaying ? pauseIcon : playArrowIcon}
            alt=""
            width={28}
            height={28}
            draggable={false}
          />
        </button>
        {overlay != null && (
          <span className={'cometchat-message-composer__tray-overlay'}>{overlay}</span>
        )}
      </span>

      <span className={'cometchat-message-composer__tray-audio-body'}>
        <span className={'cometchat-message-composer__tray-audio-name'} title={name}>
          {name}
        </span>
        {statusText ? (
          <span
            className={
              'cometchat-message-composer__tray-status-text cometchat-message-composer__tray-status-text--audio'
            }
          >
            {statusText}
          </span>
        ) : (
          <>
            <input
              type="range"
              className={'cometchat-message-composer__tray-audio-slider'}
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!interactive}
              aria-label={seekLabel}
              style={{ background: sliderBackground }}
            />
            <span className={'cometchat-message-composer__tray-audio-time'}>
              {formatClock(currentTime)}/{formatClock(duration)}
            </span>
          </>
        )}
      </span>
    </div>
  );
};

// --- Tray tile ---

interface TrayTileProps {
  item: TrayItem;
  onRemove: (fileId: string) => void;
  onRetry: (fileId: string) => void;
  /** Open the media fullscreen pager scoped to the tray, at this item (image/video only). */
  onOpenMedia: (fileId: string) => void;
}

const TrayTile: React.FC<TrayTileProps> = ({ item, onRemove, onRetry, onOpenMedia }) => {
  const { getLocalizedString } = useLocale();

  const isUploading = item.status === 'uploading';
  const isFailed = item.status === 'failed';
  const isRejected = item.status === 'rejected';
  const isSuccess = item.status === 'success';
  const isMedia = item.kind === 'image' || item.kind === 'video';

  // Some rejections carry an explanatory tooltip shown on hover over the tile:
  // the file-size limit (with the parsed MB limit) and an unsupported/disallowed
  // file type (surfaced by the SDK as a permission-denied error).
  const rejectionTooltip = useMemo(() => {
    if (!isRejected) return '';
    const { FILE_SIZE_EXCEEDED, PERMISSION_DENIED, BAD_REQUEST } =
      CometChatUIKitConstants.MediaUploadErrorCodes;
    const code = errorCodeOf(item.error);
    if (code === FILE_SIZE_EXCEEDED) {
      return buildSizeExceededTooltip(getLocalizedString('attachment_size_exceeded'), item.error);
    }
    if (code === PERMISSION_DENIED) {
      return getLocalizedString('attachment_type_not_supported');
    }
    if (code === BAD_REQUEST) {
      return getLocalizedString('attachment_invalid_file');
    }
    // For any other error code, fall back to the error's own message rather than
    // showing nothing.
    return errorMessageOf(item.error);
  }, [isRejected, item.error, getLocalizedString]);
  const hasRejectionTooltip = rejectionTooltip.length > 0;

  // The tooltip is a portaled base component (CometChatTooltip): the tray list is a
  // horizontal scroll container (overflow clips both axes), so a tooltip rendered
  // inside it would be clipped away. It anchors to the tile and is bounded to the
  // composer's edges.
  const tileRef = useRef<HTMLLIElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const openTooltip = useCallback(() => {
    setShowTooltip(true);
  }, []);
  const closeTooltip = useCallback(() => {
    setShowTooltip(false);
  }, []);

  const url = resolveItemUrl(item);
  const name = resolveItemName(item);
  // Videos: poster from first frame. Images: a crisp DPR-sized thumbnail (avoids the
  // browser's soft one-step downscale of a large photo into a tiny tile).
  const { poster: videoPoster, duration: videoDuration } = useVideoThumbnail(
    item.kind === 'video' ? url : ''
  );
  const imageThumb = useImageThumbnail(item.kind === 'image' ? url : '', 64, item.file.type);
  const thumbnailSrc =
    item.kind === 'video' ? videoPoster : item.kind === 'image' ? (imageThumb ?? url) : url;

  // A corrupted image can't decode, so its <img> fails to load. Rather than let
  // the browser show its broken-image glyph, hide the image and fall back to a
  // blank tile (white in light theme, black in dark). Reset when the source changes.
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  useEffect(() => {
    setThumbnailFailed(false);
  }, [thumbnailSrc]);

  const removeLabel = getLocalizedString('message_composer_tray_remove_attachment');
  const retryLabel = getLocalizedString('message_composer_tray_retry_upload');
  const openLabel = getLocalizedString('message_composer_tray_open_fullscreen');
  const uploadingLabel = getLocalizedString('message_composer_tray_uploading');
  const rejectedLabel = getLocalizedString('message_composer_tray_upload_rejected');
  const playLabel = getLocalizedString('message_composer_tray_play_audio');
  const pauseLabel = getLocalizedString('message_composer_tray_pause_audio');
  const seekLabel = getLocalizedString('message_composer_tray_seek_audio');

  // Inline error/failure status line for the file & audio cards. A retryable
  // failure invites a retry; a hard rejection just reports the failure. Media
  // tiles convey the same state through the overlay icon + border instead.
  const statusText = isFailed
    ? getLocalizedString('message_composer_tray_tap_to_retry')
    : isRejected
      ? getLocalizedString('message_composer_tray_upload_failed')
      : '';

  const handleRemove = useCallback(() => {
    onRemove(item.fileId);
  }, [onRemove, item.fileId]);

  const handleRetry = useCallback(() => {
    onRetry(item.fileId);
  }, [onRetry, item.fileId]);

  const canOpen = isSuccess && isMedia;

  const handleOpen = useCallback(() => {
    if (canOpen) onOpenMedia(item.fileId);
  }, [canOpen, onOpenMedia, item.fileId]);

  const handleOpenKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!canOpen) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpenMedia(item.fileId);
      }
    },
    [canOpen, onOpenMedia, item.fileId]
  );

  // Status overlay (progress ring / retry / rejected). Rendered centered over the
  // media thumbnail, or over the icon for file/audio cards.
  const renderStatusOverlay = (): React.ReactNode => {
    if (isUploading) {
      return <CircularProgress percent={item.percent} label={uploadingLabel} />;
    }
    if (isFailed) {
      return (
        <button
          type="button"
          className={'cometchat-message-composer__tray-retry-button'}
          onClick={handleRetry}
          aria-label={retryLabel}
        >
          <img src={retryIcon} alt="" aria-hidden="true" width={24} height={24} draggable={false} />
        </button>
      );
    }
    if (isRejected) {
      return (
        <span
          className={'cometchat-message-composer__tray-rejected-icon'}
          role="img"
          aria-label={rejectedLabel}
        >
          <img src={errorIcon} alt="" aria-hidden="true" width={24} height={24} draggable={false} />
        </span>
      );
    }
    return null;
  };

  const statusOverlay = renderStatusOverlay();
  const hasOverlay = statusOverlay != null;

  // --- Content by kind ---

  const renderMediaContent = (): React.ReactNode => (
    <div
      className={[
        'cometchat-message-composer__tray-thumbnail',
        canOpen ? 'cometchat-message-composer__tray-thumbnail--interactive' : '',
        thumbnailFailed ? 'cometchat-message-composer__tray-thumbnail--blank' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...(canOpen
        ? {
            role: 'button' as const,
            tabIndex: 0,
            'aria-label': openLabel,
            onClick: handleOpen,
            onKeyDown: handleOpenKeyDown,
          }
        : {})}
    >
      {/* image → blob URL; video → locally-generated poster. No src → plain grey tile
          (never a broken-image icon for a video blob). A corrupted image that fails
          to decode is hidden too, leaving the blank tile background. */}
      {thumbnailSrc && !thumbnailFailed && (
        <img
          className={'cometchat-message-composer__tray-thumbnail-img'}
          src={thumbnailSrc}
          alt=""
          draggable={false}
          onError={() => {
            setThumbnailFailed(true);
          }}
        />
      )}
      {/* Video play affordance — hidden while an overlay (progress/error) is shown. */}
      {item.kind === 'video' && (
        <span className={'cometchat-message-composer__tray-play'} aria-hidden="true">
          <img src={playArrowIcon} alt="" width={24} height={24} draggable={false} />
        </span>
      )}
      {/* Video duration badge */}
      {item.kind === 'video' && videoDuration != null && videoDuration > 0 && (
        <span className={'cometchat-message-composer__tray-duration'} aria-hidden="true">
          {formatClock(videoDuration)}
        </span>
      )}
      {hasOverlay && (
        <span className={'cometchat-message-composer__tray-overlay'}>{statusOverlay}</span>
      )}
    </div>
  );

  const renderFileContent = (): React.ReactNode => (
    <div className={'cometchat-message-composer__tray-card'}>
      <span className={'cometchat-message-composer__tray-card-icon'}>
        <img
          className="cometchat-message-composer__tray-card-icon--file"
          src={fileTypeIcon(name)}
          alt=""
          draggable={false}
        />
        {hasOverlay && (
          <span className={'cometchat-message-composer__tray-overlay'}>{statusOverlay}</span>
        )}
      </span>
      <span className={'cometchat-message-composer__tray-card-text'}>
        <span className={'cometchat-message-composer__tray-filename'} title={name}>
          {name}
        </span>
        <span className={'cometchat-message-composer__tray-card-meta'}>
          {fileExtensionLabel(name)}
          {statusText && (
            <span className={'cometchat-message-composer__tray-status-text'}>{statusText}</span>
          )}
        </span>
      </span>
    </div>
  );

  const renderAudioContent = (): React.ReactNode => (
    <TrayAudioCard
      url={url}
      name={name}
      interactive={isSuccess}
      overlay={statusOverlay}
      {...(statusText ? { statusText } : {})}
      playLabel={playLabel}
      pauseLabel={pauseLabel}
      seekLabel={seekLabel}
    />
  );

  const renderContent = (): React.ReactNode => {
    if (isMedia) return renderMediaContent();
    if (item.kind === 'audio') return renderAudioContent();
    return renderFileContent();
  };

  const tileClasses = [
    'cometchat-message-composer__tray-tile',
    `cometchat-message-composer__tray-tile--${item.kind}`,
    `cometchat-message-composer__tray-tile--${item.status}`,
    hasRejectionTooltip ? 'cometchat-message-composer__tray-tile--rejected-tooltip' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li
      ref={tileRef}
      className={tileClasses}
      data-file-id={item.fileId}
      data-status={item.status}
      {...(hasRejectionTooltip
        ? {
            onMouseEnter: openTooltip,
            onMouseLeave: closeTooltip,
            onFocus: openTooltip,
            onBlur: closeTooltip,
          }
        : {})}
    >
      {renderContent()}

      {/* Rejection tooltip — a portaled base component so the tray's scroll
          container (overflow-x: auto → clips overflow-y) can't clip it away.
          Bounded to the composer's edges; only mounted while hovered/focused. */}
      {hasRejectionTooltip && showTooltip && (
        <CometChatTooltip
          anchorEl={tileRef.current}
          boundsEl={tileRef.current?.closest('.cometchat-message-composer') as HTMLElement | null}
        >
          {rejectionTooltip}
        </CometChatTooltip>
      )}

      {/* Remove control — 50% outside the top-right corner, white border. */}
      <button
        type="button"
        className={'cometchat-message-composer__tray-remove-button'}
        onClick={handleRemove}
        aria-label={removeLabel}
      >
        <img src={closeIcon} alt="" aria-hidden="true" width={14} height={14} draggable={false} />
      </button>
    </li>
  );
};

/**
 * CometChatMessageComposerTray — the multi-attachment staging tray.
 *
 * A single horizontally-scrollable row (no visible scrollbar) of uniform-height
 * tiles: square thumbnails for image/video, and equal-height cards for file/audio,
 * so the whole row reads as one cohesive strip.
 */
export const CometChatMessageComposerTray: React.FC<{ className?: string }> = ({ className }) => {
  const { tray, enableMultipleAttachments, removeAttachment, retryAttachment } =
    useCometChatMessageComposerContext();
  const { getLocalizedString } = useLocale();

  const [viewerFileId, setViewerFileId] = useState<string | null>(null);

  const mediaItems = useMemo(
    () =>
      tray.items.filter(
        item => item.status === 'success' && (item.kind === 'image' || item.kind === 'video')
      ),
    [tray.items]
  );

  const viewerAttachments = useMemo<CometChatMediaAttachment[]>(
    () =>
      mediaItems.map(item => ({
        url: resolveItemUrl(item),
        type: item.kind === 'video' ? 'video' : 'image',
        name: resolveItemName(item),
      })),
    [mediaItems]
  );

  const viewerStartIndex = useMemo(() => {
    if (viewerFileId == null) return 0;
    const idx = mediaItems.findIndex(item => item.fileId === viewerFileId);
    return idx < 0 ? 0 : idx;
  }, [viewerFileId, mediaItems]);

  const handleOpenMedia = useCallback((fileId: string) => {
    setViewerFileId(fileId);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewerFileId(null);
  }, []);

  if (!enableMultipleAttachments || tray.items.length === 0) {
    return null;
  }

  const rootClass = ['cometchat-message-composer__tray', className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <ul
        className={'cometchat-message-composer__tray-list'}
        aria-label={getLocalizedString('message_composer_tray_label')}
      >
        {tray.items.map(item => (
          <TrayTile
            key={item.fileId}
            item={item}
            onRemove={removeAttachment}
            onRetry={retryAttachment}
            onOpenMedia={handleOpenMedia}
          />
        ))}
      </ul>

      {viewerFileId != null && viewerAttachments.length > 0 && (
        <Suspense fallback={null}>
          <LazyCometChatFullScreenViewer
            onClose={handleCloseViewer}
            attachments={viewerAttachments}
            startIndex={viewerStartIndex}
            mediaType={viewerAttachments[viewerStartIndex]?.type ?? 'image'}
          />
        </Suspense>
      )}
    </div>
  );
};

CometChatMessageComposerTray.displayName = 'CometChatMessageComposerTray';
