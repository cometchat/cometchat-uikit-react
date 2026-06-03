import { useCallback, useEffect, useRef, useState } from 'react';
import type { CometChatMediaRecorderState } from './CometChatMediaRecorder.types';

/** Number of waveform bars to display. */
const WAVEFORM_BAR_COUNT = 30;

interface UseCometChatMediaRecorderOptions {
  autoRecording?: boolean;
  onClose?: () => void;
  onSubmit?: (file: Blob) => void;
  onError?: (error: Error) => void;
}

interface UseCometChatMediaRecorderReturn {
  state: CometChatMediaRecorderState;
  elapsedSeconds: number;
  waveformHeights: number[];
  error: string | null;
  isPreviewPlaying: boolean;
  previewUrl: string | null;
  previewProgress: number;
  startRecording: () => void;
  pauseRecording: () => void;
  deleteRecording: () => void;
  inlineSend: () => void;
  togglePreviewPlayback: () => void;
}

/**
 * State machine hook for inline audio recording.
 *
 * States: idle → recording ↔ paused → (inline send submits blob)
 *
 * Uses the browser MediaRecorder API + AudioContext AnalyserNode for
 * real-time waveform visualization. SSR-safe — all browser API access
 * is inside effects/callbacks.
 */
export function useCometChatMediaRecorder(
  options: UseCometChatMediaRecorderOptions
): UseCometChatMediaRecorderReturn {
  const { autoRecording = false, onClose, onSubmit, onError } = options;

  const [state, setState] = useState<CometChatMediaRecorderState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>(
    () => new Array(WAVEFORM_BAR_COUNT).fill(4) as number[]
  );
  const [error, setError] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const pendingInlineSendRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Web Audio API refs for waveform
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Preview playback ref
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stable callback refs
  const onSubmitRef = useRef(onSubmit);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  onSubmitRef.current = onSubmit;
  onCloseRef.current = onClose;
  onErrorRef.current = onError;

  // ── Waveform analysis ────────────────────────────────────────────

  const stopWaveformAnalysis = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {
        /* ignore close errors */
      });
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setWaveformHeights(new Array(WAVEFORM_BAR_COUNT).fill(4) as number[]);
  }, []);

  const runWaveformLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!analyserRef.current || !mountedRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const step = Math.max(1, Math.floor(bufferLength / WAVEFORM_BAR_COUNT));
      const heights: number[] = [];
      for (let i = 0; i < WAVEFORM_BAR_COUNT; i++) {
        const index = Math.min(i * step, bufferLength - 1);
        const value = dataArray[index] ?? 0;
        heights.push(Math.max(4, Math.round((value / 255) * 24)));
      }
      setWaveformHeights(heights);
      animationFrameRef.current = requestAnimationFrame(update);
    };
    animationFrameRef.current = requestAnimationFrame(update);
  }, []);

  const startWaveformAnalysis = useCallback(
    (stream: MediaStream) => {
      try {
        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceNodeRef.current = source;
        runWaveformLoop();
      } catch {
        // Audio analysis not critical — fail silently
      }
    },
    [runWaveformLoop]
  );

  // ── Cleanup helpers ──────────────────────────────────────────────

  const clearStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.onended = null;
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    clearStream();
    stopWaveformAnalysis();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // already stopped
      }
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    hasInitializedRef.current = false;
    pendingInlineSendRef.current = false;

    if (mountedRef.current) {
      setElapsedSeconds(0);
      setError(null);
      setState('idle');
    }
  }, [clearTimer, clearStream, stopWaveformAnalysis]);

  // ── Timer ────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setInterval(() => {
      if (mountedRef.current) {
        setElapsedSeconds(prev => prev + 1);
      }
    }, 1000);
  }, [clearTimer]);

  // ── Permission check ─────────────────────────────────────────────

  const checkMicrophonePermission = useCallback(async (): Promise<PermissionState> => {
    if (typeof navigator === 'undefined') return 'denied';
    try {
      const permission = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      return permission.state;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => {
          track.stop();
        });
        return 'granted';
      } catch (err: unknown) {
        const name = (err as { name?: string }).name;
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          return 'denied';
        }
        return 'prompt';
      }
    }
  }, []);

  // ── Init MediaRecorder ───────────────────────────────────────────

  const initMediaRecorder = useCallback(async (): Promise<boolean> => {
    try {
      if (hasInitializedRef.current) return false;
      clearStream();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      hasInitializedRef.current = true;
      streamRef.current = stream;

      // Start waveform analysis
      startWaveformAnalysis(stream);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) {
          audioChunksRef.current = [...audioChunksRef.current, e.data];
        }
      };

      recorder.onstop = () => {
        if (audioChunksRef.current.length > 0 && mountedRef.current) {
          const recordedBlob = new Blob(audioChunksRef.current, {
            type: audioChunksRef.current[0]?.type ?? 'audio/webm',
          });
          audioChunksRef.current = [];

          if (pendingInlineSendRef.current) {
            pendingInlineSendRef.current = false;
            onSubmitRef.current?.(recordedBlob);
            reset();
            return;
          }
        }
        audioChunksRef.current = [];
      };

      recorder.onerror = (event: Event) => {
        const errorEvent = event as { error?: Error };
        if (mountedRef.current) {
          setError('recording_error');
          setState('error');
        }
        clearStream();
        stopWaveformAnalysis();
        hasInitializedRef.current = false;
        if (errorEvent.error) {
          onErrorRef.current?.(errorEvent.error);
        }
      };

      stream.getTracks().forEach(track => {
        track.onended = () => {
          if (mountedRef.current) {
            setError('permission_revoked');
            setState('error');
            clearTimer();
            stopWaveformAnalysis();
          }
        };
      });

      recorder.start(250); // Collect data every 250ms
      return true;
    } catch (err: unknown) {
      const name = (err as { name?: string }).name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        if (mountedRef.current) {
          setError('permission_denied');
          setState('error');
        }
      }
      hasInitializedRef.current = false;
      onErrorRef.current?.(err as Error);
      return false;
    }
  }, [clearStream, clearTimer, startWaveformAnalysis, stopWaveformAnalysis, reset]);

  // ── Actions ──────────────────────────────────────────────────────

  const startRecordingAsync = useCallback(async () => {
    if (typeof navigator === 'undefined') return;

    // If already recording (not paused), ignore
    if (state === 'recording') return;

    // Resume from paused
    if (state === 'paused' && mediaRecorderRef.current?.state === 'paused') {
      try {
        // Stop preview playback if active
        if (previewAudioRef.current) {
          previewAudioRef.current.pause();
          previewAudioRef.current = null;
          setIsPreviewPlaying(false);
          setPreviewProgress(0);
        }
        mediaRecorderRef.current.resume();
        setState('recording');
        startTimer();
        // Resume waveform
        if (audioContextRef.current && analyserRef.current) {
          runWaveformLoop();
        }
      } catch {
        setState('error');
        setError('recording_error');
      }
      return;
    }

    // Fresh start
    const permState = await checkMicrophonePermission();
    if (permState === 'denied') {
      setState('error');
      setError('permission_denied');
      return;
    }

    const success = await initMediaRecorder();
    if (success && mountedRef.current) {
      setState('recording');
      setElapsedSeconds(0);
      startTimer();
    }
  }, [state, checkMicrophonePermission, initMediaRecorder, startTimer, runWaveformLoop]);

  const startRecording = useCallback(() => {
    void startRecordingAsync();
  }, [startRecordingAsync]);

  const pauseRecording = useCallback(() => {
    if (state !== 'recording' || !mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state !== 'recording') return;
    try {
      mediaRecorderRef.current.pause();
      clearTimer();
      // Stop waveform animation loop
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Create preview URL from collected chunks
      if (audioChunksRef.current.length > 0) {
        const previewBlob = new Blob(audioChunksRef.current, {
          type: audioChunksRef.current[0]?.type ?? 'audio/webm',
        });
        const url = URL.createObjectURL(previewBlob);
        // Revoke previous URL if any
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(url);
      }
      setState('paused');
    } catch {
      setState('error');
      setError('recording_error');
    }
  }, [state, clearTimer, previewUrl]);

  const deleteRecording = useCallback(() => {
    // Stop preview playback
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setIsPreviewPlaying(false);
      setPreviewProgress(0);
    }
    // Revoke preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    reset();
    onCloseRef.current?.();
  }, [reset, previewUrl]);

  const inlineSend = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === 'recording' ||
        mediaRecorderRef.current.state === 'paused')
    ) {
      // Stop preview playback if active
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
        setIsPreviewPlaying(false);
        setPreviewProgress(0);
      }
      pendingInlineSendRef.current = true;
      mediaRecorderRef.current.stop();
      setState('idle');
      clearTimer();
      clearStream();
      stopWaveformAnalysis();
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [clearTimer, clearStream, stopWaveformAnalysis, previewUrl]);

  const togglePreviewPlayback = useCallback(() => {
    if (state !== 'paused' || !previewUrl) return;

    if (isPreviewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
      return;
    }

    // Create or reuse audio element
    if (previewAudioRef.current?.src !== previewUrl) {
      // Clean up old one
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.onended = null;
      }
      const audio = new Audio(previewUrl);
      audio.onended = () => {
        if (mountedRef.current) {
          setIsPreviewPlaying(false);
          setPreviewProgress(1); // Fully colored when done
        }
      };
      previewAudioRef.current = audio;
    }

    const audio = previewAudioRef.current;

    // For blob URLs, duration may be Infinity until fully loaded.
    // Use the elapsed recording time as the known duration fallback.
    const knownDuration = elapsedSeconds;

    // Start progress tracking via requestAnimationFrame for smooth updates
    const trackProgress = () => {
      if (audio.paused || audio.ended || !mountedRef.current) return;
      const duration =
        audio.duration > 0 && isFinite(audio.duration) ? audio.duration : knownDuration;
      if (duration > 0) {
        const progress = Math.min(audio.currentTime / duration, 1);
        setPreviewProgress(progress);
      }
      requestAnimationFrame(trackProgress);
    };

    audio.currentTime = 0;
    setPreviewProgress(0);
    audio
      .play()
      .then(() => {
        if (mountedRef.current) {
          setIsPreviewPlaying(true);
          requestAnimationFrame(trackProgress);
        }
      })
      .catch(() => {
        // Autoplay blocked — silently fail
      });
  }, [state, previewUrl, isPreviewPlaying, elapsedSeconds]);

  // ── Permission monitoring ────────────────────────────────────────

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    let permissionStatus: PermissionStatus | null = null;

    const setup = async () => {
      try {
        const permission = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        permissionStatus = permission;
        permission.onchange = () => {
          if (permission.state === 'denied' && mountedRef.current) {
            setError('permission_denied');
            setState('error');
            clearTimer();
            clearStream();
            stopWaveformAnalysis();
            hasInitializedRef.current = false;
          } else if (permission.state === 'granted' && mountedRef.current) {
            setError(null);
          }
        };
      } catch {
        // permissions API not supported
      }
    };
    void setup();

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [clearTimer, clearStream, stopWaveformAnalysis]);

  // ── Auto-recording on mount ──────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    if (autoRecording) {
      const timer = setTimeout(() => {
        startRecording();
      }, 100);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearTimer();
      clearStream();
      stopWaveformAnalysis();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // already stopped
        }
      }
    };
  }, [clearTimer, clearStream, stopWaveformAnalysis]);

  return {
    state,
    elapsedSeconds,
    waveformHeights,
    error,
    isPreviewPlaying,
    previewUrl,
    previewProgress,
    startRecording,
    pauseRecording,
    deleteRecording,
    inlineSend,
    togglePreviewPlayback,
  };
}
