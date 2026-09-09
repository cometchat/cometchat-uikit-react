import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CometChatAudiosBubbleProps,
  CometChatAudiosBubbleAttachment,
} from './CometChatAudiosBubble.types';
import { CometChatTextBubble } from '../CometChatTextBubble/CometChatTextBubble';
import { CometChatDownloadButton } from '../base/CometChatDownloadButton/CometChatDownloadButton';
import { getBubbleAlignment } from '../../utils/getBubbleAlignment';
import { useLoggedInUser } from '../../hooks/useLoggedInUser';
import { useLocale } from '../../context/locale/LocaleContext';
import { extractAudioAttachments, extractAudioCaption } from './CometChatAudiosBubble.utils';
import {
  startExclusivePlayback,
  stopExclusivePlayback,
  type AudioPlaybackHandle,
} from '../../utils/audioPlaybackController';
import playArrowIcon from '../../assets/play_arrow.svg';
import pauseIcon from '../../assets/pause.svg';
import unsupportedIcon from '../../assets/unsupported.svg';
import './CometChatAudiosBubble.css';

/**
 * Format seconds to m:ss.
 */
function formatTime(seconds: number): string {
  if (!seconds || seconds < 0 || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m)}:${String(s).padStart(2, '0')}`;
}

// --- AudioCard sub-component (matches tray audio card UI) ---

interface AudioCardProps {
  attachment: CometChatAudiosBubbleAttachment;
}

const AudioCard: React.FC<AudioCardProps> = ({ attachment }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(attachment.duration ?? 0);

  // A non-audio mime type means this file can't be played as audio — render it as
  // an unsupported card (icon + name + download) instead of a broken player.
  const isInvalid = !attachment.mimeType.toLowerCase().startsWith('audio/');

  // Stable handle for the global single-audio policy.
  const playbackHandleRef = useRef<AudioPlaybackHandle>({
    pause: () => audioRef.current?.pause(),
  });

  useEffect(() => {
    if (!attachment.url || isInvalid) return;
    const audio = document.createElement('audio');
    audioRef.current = audio;
    audio.preload = 'metadata';
    const handle = playbackHandleRef.current;

    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onTime = () => {
      setCurrentTime(audio.currentTime);
    };
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      stopExclusivePlayback(handle);
    };
    const onPlayEvt = () => {
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
    audio.addEventListener('play', onPlayEvt);
    audio.addEventListener('pause', onPause);
    audio.src = attachment.url;

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('play', onPlayEvt);
      audio.removeEventListener('pause', onPause);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      stopExclusivePlayback(handle);
    };
  }, [attachment.url, attachment.duration, isInvalid]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    },
    [togglePlay]
  );

  const playedPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const sliderBg = `linear-gradient(to right, var(--cometchat-static-white, #fff) 0 ${String(playedPct)}%, var(--cometchat-audios-bubble__slider-color) ${String(playedPct)}% 100%)`;

  // Type mismatch — show the file name and a download action, no player controls.
  if (isInvalid) {
    return (
      <div className="cometchat-audios-bubble__card cometchat-audios-bubble__card--unsupported">
        <div className="cometchat-audios-bubble__unsupported-icon-wrapper">
          <img
            src={unsupportedIcon}
            alt=""
            aria-hidden="true"
            className="cometchat-audios-bubble__unsupported-icon"
          />
        </div>
        <div className="cometchat-audios-bubble__body">
          <span className="cometchat-audios-bubble__name" title={attachment.name}>
            {attachment.name}
          </span>
        </div>
        {attachment.url && (
          <CometChatDownloadButton url={attachment.url} fileName={attachment.name} />
        )}
      </div>
    );
  }

  return (
    <div className="cometchat-audios-bubble__card" onKeyDown={handleKeyDown}>
      {/* Play/Pause button */}
      <button
        type="button"
        className="cometchat-audios-bubble__play-btn"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <img
          src={isPlaying ? pauseIcon : playArrowIcon}
          alt=""
          width={20}
          height={20}
          draggable={false}
          className="cometchat-audios-bubble__play-btn-icon"
        />
      </button>

      {/* Body: name + slider + time */}
      <div className="cometchat-audios-bubble__body">
        <span className="cometchat-audios-bubble__name" title={attachment.name}>
          {attachment.name}
        </span>
        <input
          type="range"
          className="cometchat-audios-bubble__slider"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          aria-label="Seek audio"
          style={{ background: sliderBg }}
        />
        <span className="cometchat-audios-bubble__time">
          {formatTime(currentTime)}/{formatTime(duration)}
        </span>
      </div>

      {/* Download button */}
      {attachment.url && (
        <CometChatDownloadButton url={attachment.url} fileName={attachment.name} />
      )}
    </div>
  );
};

/**
 * CometChatAudiosBubble — renders audio attachments matching the tray card UI.
 *
 * Each card: [round play/pause button | filename + seek slider + time | download button].
 * When >1 audio files: wraps in a background container.
 * Clicking play plays inline; fullscreen available via the play button long-press (future).
 */
export const CometChatAudiosBubble: React.FC<CometChatAudiosBubbleProps> = ({
  message,
  alignment,
  textFormatters = [],
  className,
}) => {
  const loggedInUser = useLoggedInUser();
  const { getLocalizedString } = useLocale();
  const [isExpanded, setIsExpanded] = useState(false);

  const variant =
    (alignment ?? getBubbleAlignment(message, loggedInUser)) === 'right' ? 'outgoing' : 'incoming';
  const isSentByMe = variant === 'outgoing';

  const attachments = useMemo(() => extractAudioAttachments(message), [message]);
  const caption = useMemo(() => extractAudioCaption(message), [message]);
  const hasMultiple = attachments.length > 1;

  const COLLAPSED_MAX = 3;
  const collapsedItems = useMemo(() => attachments.slice(0, COLLAPSED_MAX), [attachments]);
  const remainingCount = Math.max(0, attachments.length - COLLAPSED_MAX);
  const hasOverflow = remainingCount > 0;
  const visibleItems = isExpanded ? attachments : collapsedItems;

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const rootClasses = [
    'cometchat-audios-bubble',
    variant === 'incoming'
      ? 'cometchat-audios-bubble--incoming'
      : 'cometchat-audios-bubble--outgoing',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      <div
        className={`cometchat-audios-bubble__container${hasMultiple ? ' cometchat-audios-bubble__container--multi' : ''}`}
      >
        {visibleItems.map((att, i) => (
          <AudioCard key={att.url || `audio-${String(i)}`} attachment={att} />
        ))}

        {/* Expand/collapse toggle for >3 audios */}
        {hasOverflow && !isExpanded && (
          <button
            type="button"
            className="cometchat-audios-bubble__toggle"
            onClick={toggleExpanded}
            aria-expanded={false}
            aria-label={`Show ${String(remainingCount)} more`}
          >
            {(getLocalizedString('bubble_show_more') || 'Show {count} more').replace(
              '{count}',
              String(remainingCount)
            )}
            <svg
              className="cometchat-audios-bubble__toggle-icon"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {hasOverflow && isExpanded && (
          <button
            type="button"
            className="cometchat-audios-bubble__toggle"
            onClick={toggleExpanded}
            aria-expanded={true}
            aria-label="Show less"
          >
            {getLocalizedString('bubble_show_less') || 'Show less'}
            <svg
              className="cometchat-audios-bubble__toggle-icon cometchat-audios-bubble__toggle-icon--up"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Caption */}
      {caption && (
        <div className="cometchat-audios-bubble__caption">
          <CometChatTextBubble
            text={caption}
            message={message}
            textFormatters={textFormatters}
            isSentByMe={isSentByMe}
          />
        </div>
      )}
    </div>
  );
};

CometChatAudiosBubble.displayName = 'CometChatAudiosBubble';
