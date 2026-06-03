import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CometChatAudioBubbleProps,
  CometChatAudioBubbleAttachment,
} from './CometChatAudioBubble.types';
import { CometChatTextBubble } from '../text/CometChatTextBubble';
import { WaveSurfer } from './wavesurfer';
import { downloadWithProgress } from '../../../utils/downloadWithProgress';
import './CometChatAudioBubble.css';
import { useLocale } from '../../../context/locale/LocaleContext';

// --- Single player policy ---

const currentAudioPlayer: {
  instance: WaveSurfer | null;
  setIsPlaying: ((playing: boolean) => void) | null;
} = { instance: null, setIsPlaying: null };

function pauseCurrentPlayer(): void {
  if (currentAudioPlayer.instance) {
    currentAudioPlayer.instance.pause();
    currentAudioPlayer.setIsPlaying?.(false);
    currentAudioPlayer.instance = null;
    currentAudioPlayer.setIsPlaying = null;
  }
}

// --- Helpers ---

const COLLAPSED_MAX = 3;

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0 || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m)}:${String(s).padStart(2, '0')}`;
}

// --- Audio Item sub-component ---

interface AudioItemProps {
  attachment: CometChatAudioBubbleAttachment;
  variant: 'incoming' | 'outgoing';
}

const AudioItem: React.FC<AudioItemProps> = ({ attachment, variant }) => {
  const { getLocalizedString } = useLocale();
  const waveformRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const isPlayingRef = useRef(false);

  const isOutgoing = variant === 'outgoing';

  // Initialize WaveSurfer
  useEffect(() => {
    if (typeof window === 'undefined' || !waveformRef.current || !attachment.url) return;

    setIsLoading(true);
    setHasError(false);

    const root = document.documentElement;
    const progressColor = isOutgoing
      ? getComputedStyle(root).getPropertyValue('--cometchat-static-white').trim() || '#fff'
      : getComputedStyle(root).getPropertyValue('--cometchat-primary-color').trim() || '#6852d6';
    const waveColor = isOutgoing
      ? getComputedStyle(root).getPropertyValue('--cometchat-neutral-color-500').trim() || '#999'
      : getComputedStyle(root).getPropertyValue('--cometchat-extended-primary-color-300').trim() ||
        '#b8aee8';
    const barRadiusStr = getComputedStyle(root).getPropertyValue('--cometchat-radius-max').trim();
    const barRadius = parseInt(barRadiusStr.replace('px', ''), 10) || 1000;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      height: 16,
      normalize: false,
      waveColor,
      progressColor,
      cursorWidth: 0,
      barWidth: 2,
      barGap: 3,
      barRadius,
      barHeight: 1.2,
      minPxPerSec: 26,
      fillParent: true,
      mediaControls: false,
      interact: true,
      dragToSeek: true,
      hideScrollbar: true,
      audioRate: 1,
      autoScroll: true,
      autoCenter: true,
      sampleRate: 17000,
      // width: 140,
    });

    wsRef.current = ws;

    ws.on('ready', (dur: number) => {
      setIsLoading(false);
      setDuration(dur);
    });

    ws.on('audioprocess', (time: number) => {
      setCurrentTime(time);
    });

    ws.on('timeupdate', (time: number) => {
      setCurrentTime(time);
    });

    ws.on('finish', () => {
      ws.stop();
      ws.seekTo(0);
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (currentAudioPlayer.instance === ws) {
        currentAudioPlayer.instance = null;
        currentAudioPlayer.setIsPlaying = null;
      }
    });

    ws.on('error', () => {
      setIsLoading(false);
      setHasError(true);
    });

    ws.load(attachment.url).catch(() => {
      setIsLoading(false);
      setHasError(true);
    });

    return () => {
      if (currentAudioPlayer.instance === ws) {
        currentAudioPlayer.instance = null;
        currentAudioPlayer.setIsPlaying = null;
      }
      ws.unAll();
      try {
        ws.destroy();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    };
  }, [attachment.url, isOutgoing]);

  // Play/pause
  const handlePlayPause = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || isLoading || hasError) return;

    if (isPlaying) {
      ws.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (currentAudioPlayer.instance === ws) {
        currentAudioPlayer.instance = null;
        currentAudioPlayer.setIsPlaying = null;
      }
    } else {
      // Pause any other playing audio
      if (currentAudioPlayer.instance && currentAudioPlayer.instance !== ws) {
        pauseCurrentPlayer();
      }
      ws.play()
        .then(() => {
          setIsPlaying(true);
          isPlayingRef.current = true;
          currentAudioPlayer.instance = ws;
          currentAudioPlayer.setIsPlaying = setIsPlaying;
        })
        .catch(() => {
          /* ignore */
        });
    }
  }, [isPlaying, isLoading, hasError]);

  // Download
  const handleDownload = useCallback(async () => {
    if (!attachment.url || isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    abortRef.current = new AbortController();

    try {
      await downloadWithProgress(
        attachment.url,
        attachment.name,
        p => {
          setDownloadProgress(p);
        },
        abortRef.current.signal
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('[CometChatAudioBubble] Download failed:', err);
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      abortRef.current = null;
    }
  }, [attachment.url, attachment.name, isDownloading]);

  const handleCancelDownload = useCallback(() => {
    abortRef.current?.abort();
    setIsDownloading(false);
    setDownloadProgress(0);
  }, []);

  return (
    <div
      className={[
        'cometchat-audio-bubble__audio-item',
        isLoading ? 'cometchat-audio-bubble__audio-item--loading' : '',
        hasError ? 'cometchat-audio-bubble__audio-item--error' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Play/Pause */}
      <div className={'cometchat-audio-bubble__leading-view'}>
        <button
          type="button"
          className={
            isPlaying
              ? 'cometchat-audio-bubble__pause-button'
              : 'cometchat-audio-bubble__play-button'
          }
          onClick={handlePlayPause}
          disabled={isLoading || hasError}
          aria-label={
            isPlaying
              ? getLocalizedString('accessibility_pause_audio')
              : getLocalizedString('accessibility_play_audio')
          }
        />
      </div>

      {/* Waveform + Time */}
      <div className={'cometchat-audio-bubble__body'}>
        {hasError ? (
          <div className={'cometchat-audio-bubble__error-message'} role="alert">
            Failed to load audio
          </div>
        ) : (
          <>
            <div
              ref={waveformRef}
              className={[
                'cometchat-audio-bubble__waveform',
                isLoading ? 'cometchat-audio-bubble__waveform--loading' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
            <div className={'cometchat-audio-bubble__time'} aria-hidden="true">
              {isLoading ? 'Loading...' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
            </div>
          </>
        )}
      </div>

      {/* Download */}
      <div className={'cometchat-audio-bubble__tail-view'}>
        {isDownloading ? (
          <div className={'cometchat-audio-bubble__download-progress'}>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <circle className={'cometchat-audio-bubble__progress-bg'} cx="12" cy="12" r="10" />
              <circle
                className={'cometchat-audio-bubble__progress-fg'}
                cx="12"
                cy="12"
                r="10"
                style={{ strokeDasharray: `${String(downloadProgress * 0.628)} 62.8` }}
              />
            </svg>
            <button
              type="button"
              className={'cometchat-audio-bubble__cancel-button'}
              onClick={handleCancelDownload}
              aria-label={getLocalizedString('audio_bubble_cancel_download')}
            />
          </div>
        ) : (
          <button
            type="button"
            className={'cometchat-audio-bubble__download-button'}
            onClick={() => {
              void handleDownload();
            }}
            disabled={isLoading || hasError}
            aria-label={getLocalizedString('audio_bubble_download')}
          />
        )}
      </div>
    </div>
  );
};

// --- Main component ---

/**
 * CometChatAudioBubble — renders audio messages with WaveSurfer waveform,
 * play/pause, time display, download with progress, multi-audio expand/collapse,
 * and caption support.
 */
export const CometChatAudioBubble: React.FC<CometChatAudioBubbleProps> = ({
  attachments,
  variant,
  caption,
  message,
  textFormatters = [],
  className,
}) => {
  const { getLocalizedString } = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);
  const isSentByMe = variant === 'outgoing';

  const collapsedItems = useMemo(() => attachments.slice(0, COLLAPSED_MAX), [attachments]);
  const remainingCount = Math.max(0, attachments.length - COLLAPSED_MAX);
  const hasOverflow = remainingCount > 0;

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const visibleItems = isExpanded ? attachments : collapsedItems;

  const rootClasses = [
    'cometchat-audio-bubble',
    variant === 'incoming' ? 'cometchat-audio-bubble--receiver' : 'cometchat-audio-bubble--sender',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      <div className={'cometchat-audio-bubble__container'}>
        {visibleItems.map((att, i) => (
          <AudioItem key={att.url || i} attachment={att} variant={variant} />
        ))}

        {/* Show more / Show less */}
        {hasOverflow && !isExpanded && (
          <button
            type="button"
            className={'cometchat-audio-bubble__toggle-control'}
            onClick={toggleExpanded}
            aria-label={getLocalizedString('accessibility_show_more_files').replace(
              '{count}',
              String(remainingCount)
            )}
            aria-expanded={false}
          >
            Show more{' '}
            <span className={'cometchat-audio-bubble__toggle-count'}>+{remainingCount}</span>
          </button>
        )}

        {hasOverflow && isExpanded && (
          <button
            type="button"
            className={'cometchat-audio-bubble__toggle-control'}
            onClick={toggleExpanded}
            aria-label={getLocalizedString('text_message_show_less')}
            aria-expanded={true}
          >
            Show less
          </button>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <div className={'cometchat-audio-bubble__caption'}>
          <CometChatTextBubble
            text={caption}
            isSentByMe={isSentByMe}
            textFormatters={textFormatters}
            message={message as never}
          />
        </div>
      )}
    </div>
  );
};

CometChatAudioBubble.displayName = 'CometChatAudioBubble';
