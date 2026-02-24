import React, { useState, useEffect, useRef } from "react";
import Recorder from "./Helper/index.js";
import { CometChatAudioBubble } from "../CometChatAudioBubble/CometChatAudioBubble";
import {  currentAudioPlayer, currentMediaPlayer, getThemeVariable } from "../../../utils/util";
import { getLocalizedString } from "../../../resources/CometChatLocalize/cometchat-localize";

interface MediaRecorderProps {
    autoRecording?: boolean;
    onCloseRecording?: () => void;
    onSubmitRecording?: (file: Blob) => void;
}

const CometChatMediaRecorder: React.FC<MediaRecorderProps> = ({
    autoRecording = false,
    onCloseRecording,
    onSubmitRecording,
}) => {
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | Recorder>();
    const [isRecording, setIsRecording] = useState(false);
    const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>();
    const [counter, setCounter] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const streamRef = useRef<MediaStream | undefined>(undefined);
    const blobRef = useRef<Blob | undefined>(undefined);
    const timerIntervalRef = useRef<number | undefined>(undefined);
    const audioChunks = useRef<Blob[]>([]);
    const counterRunning = useRef<boolean>(true);
    const createMedia = useRef<boolean>(false);
    const hasInitializedRef = useRef(false);
    const userCancelledRecording = useRef<boolean>(false);
    const [hasError, setHasError] = useState(false);
    const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
    const permissionStatusRef = useRef<PermissionStatus | null>(null);
    const permissionProbeStreamRef = useRef<MediaStream | null>(null);
    const isReactNative = useRef<boolean>(false);
    const permissionRequestPending = useRef<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const stopStreamTracks = (stream?: MediaStream | null) => {
        if (!stream) return;
        stream.getTracks().forEach((track) => {
            track.stop();
            track.onended = null;
        });
    };
    

    function pauseActiveMedia(){
        if (currentAudioPlayer.instance && currentAudioPlayer.setIsPlaying) {
            currentAudioPlayer.instance.pause();
            currentAudioPlayer.setIsPlaying(false);
        }
        
        if (currentMediaPlayer.video && !currentMediaPlayer.video.paused) {
            currentMediaPlayer.video.pause();
        }
    }

    // Check if running in React Native WebView
    useEffect(() => {
        isReactNative.current = !!(window as any).ReactNativeWebView || (window as any).isRNReady;
    }, []);

    // Enhanced permission check function
    const checkMicrophonePermission = async (): Promise<PermissionState> => {
        // If in React Native, assume permission is handled natively
        if (isReactNative.current) {
            return 'granted';
        }

        try {
            const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            return permission.state;
        } catch (error) {
            // Fallback for browsers that don't support permissions API
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stopStreamTracks(stream);
                return 'granted';
            } catch (err: any) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    return 'denied';
                }
                return 'prompt';
            }
        }
    };
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        if (autoRecording) {
            timeoutId = setTimeout(() => {
                handleStartRecording();
            }, 100);
        }
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            handleStopRecording();
            clearInterval(timerIntervalRef.current);
            clearStream();
            stopStreamTracks(permissionProbeStreamRef.current);
            permissionProbeStreamRef.current = null;
            hasInitializedRef.current = false;
            if (permissionStatusRef.current) {
                permissionStatusRef.current.onchange = null;
            }
        };
    }, []);

    const startTimer = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = window.setInterval(() => {
            if (counterRunning.current) {
                setCounter((prevCounter) => prevCounter + 1);
            }
        }, 1000);
    };

    const pauseTimer = () => {
        clearInterval(timerIntervalRef.current);
        setCounter(counter);
    }

    const stopTimer = () => {
        clearInterval(timerIntervalRef.current);
        setCounter(0);
    };

    const initMediaRecorder = async (): Promise<MediaRecorder | null> => {
        try {
            if (hasInitializedRef.current) return null;
            clearStream();

            // For React Native, getUserMedia will trigger native permission flow
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            hasInitializedRef.current = true;
            streamRef.current = stream;
            const audioRecorder = new MediaRecorder(stream);
            audioRecorder.ondataavailable = (e: any) => {
                if (e.data.size > 0) {
                    audioChunks.current?.push(e.data);
                }
            };
            audioRecorder.onstop = () => {
                if (createMedia.current && audioChunks.current.length > 0) {
                    const recordedBlob = new Blob(audioChunks.current, {
                        type: audioChunks.current[0]?.type || 'audio/webm',
                    });
                    blobRef.current = recordedBlob;
                    const url = URL.createObjectURL(recordedBlob);
                    setMediaPreviewUrl(url);
                    audioChunks.current = [];
                }
            };
                        
            // Firefox-specific: Add error handler for stream loss
            audioRecorder.onerror = (event: any) => {
                console.error('MediaRecorder error:', event.error);
                setHasError(true);
                setIsRecording(false);
                setIsPaused(false);
                clearStream();
                hasInitializedRef.current = false;
            };

            // Add stream track ended handler for permission revocation
            stream.getTracks().forEach(track => {
                track.onended = () => {
                    setHasError(true);
                    setIsRecording(false);
                };
            });
            
            audioRecorder.start();
            setMediaRecorder(audioRecorder);
            setHasError(false);
            return audioRecorder;
        } catch (error: any) {
            if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                setHasError(true);
                setPermissionState('denied');

            } 
            hasInitializedRef.current = false;
            return null;
        }
    };

    const handleStartRecording = async () => {
        // Prevent multiple simultaneous permission requests
        if (permissionRequestPending.current) {
            return;
        }

        pauseActiveMedia();
        const hasAudioInput = await navigator.mediaDevices.enumerateDevices()
            .then(devices => devices.some(device => device.kind === 'audioinput'));
        if (!hasAudioInput) {
            return;
        }
        
    // For React Native, permissions are handled natively
    if (!isReactNative.current) {
        let currentPermissionState = await checkMicrophonePermission();
        if (currentPermissionState === 'denied') {
            setHasError(true);
            setPermissionState('denied');
            return;
        } else if (currentPermissionState === 'prompt'){
            try {
                permissionProbeStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                stopStreamTracks(permissionProbeStreamRef.current);
                permissionProbeStreamRef.current = null;
                currentPermissionState = 'granted';
                setPermissionState('granted');
            } catch (err: any) {
                stopStreamTracks(permissionProbeStreamRef.current);
                permissionProbeStreamRef.current = null;
                const denied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
                currentPermissionState = denied ? 'denied' : 'prompt';
                setPermissionState(currentPermissionState);
                setHasError(true);
                return;
            }
        }
    } else {
        setPermissionState('granted');
    }
    
        counterRunning.current = true;
        createMedia.current = true;
        const recorder = mediaRecorder as MediaRecorder;

        if (isPaused) {
            currentMediaPlayer.mediaRecorder = recorder;
            try {
                recorder?.resume();
                setIsPaused(false);
                startTimer();
                setIsRecording(true);
            } catch (error) {
                console.error("Failed to resume recording:", error);
                setHasError(true);
            }
        } else {
            reset();
        permissionRequestPending.current = true;
        
        try {
            const recorder = await initMediaRecorder();
            if (recorder) {
                currentMediaPlayer.mediaRecorder = recorder;
                setCounter(0);
                startTimer();
                setIsRecording(true);
                setHasError(false);
                setPermissionState('granted');
            } else {
                setIsRecording(false);
                createMedia.current = false;
            }
        } finally {
            permissionRequestPending.current = false;
            }
        }
    };
    const handleStopRecording = () => {
        setIsPaused(false);
        pauseActiveMedia();
        (mediaRecorder as MediaRecorder)?.stop();
        setIsRecording(false);
        stopTimer();
        clearStream();
        stopStreamTracks(permissionProbeStreamRef.current);
        permissionProbeStreamRef.current = null;
        setMediaRecorder(undefined);
        hasInitializedRef.current = false;
        permissionRequestPending.current = false;
    };

    const handleCloseRecording = () => {
        pauseActiveMedia();
        currentMediaPlayer.mediaRecorder = null;
        createMedia.current = false;
        userCancelledRecording.current = true;
        onCloseRecording?.();
        reset();
    };

    const handleSubmitRecording = () => {
        pauseActiveMedia();
        if (blobRef.current) {
            onSubmitRecording?.(blobRef.current);
            reset();
        }
    };

    const reset = () => {
        pauseActiveMedia();
        setMediaRecorder(undefined);
        setMediaPreviewUrl(undefined);
        setIsRecording(false);
        setIsPaused(false);
        clearStream();
        audioChunks.current = [];
        blobRef.current = undefined;
        permissionRequestPending.current = false;
    };

    const clearStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
                track.onended = null;
            });
            streamRef.current = undefined;
        }
    };


    const formatTime = (timeInSeconds: number): string => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
    };

    const handlePauseRecording = () => {
        setIsPaused(true);
        pauseTimer();
        if(mediaRecorder)
        (mediaRecorder as MediaRecorder).pause();
        counterRunning.current = false;
        hasInitializedRef.current = false;        
    }

    // Permission monitoring (only for non-React Native)
    useEffect(() => {
        if (isReactNative.current) {
            return;
        }

        const setupPermissionMonitoring = async () => {
            try {
                const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                permissionStatusRef.current = permission;
                const recorder = mediaRecorder as MediaRecorder;

                permission.onchange = async () => {
                    const newState = permission.state;
                    setPermissionState(newState);
                    if (newState === "granted") {
                        setHasError(false);
                    } else if (newState === "denied") {
                        setHasError(true);
                        setIsRecording(false);
                        setIsPaused(false);
                        clearStream();
                        stopTimer();
                        
                        if (mediaRecorder) {
                            try {
                                if (recorder.state !== 'inactive') {
                                    recorder.stop();
                                }
                            } catch (error) {
                                console.error('Error stopping recorder on permission denial:', error);
                            }
                            setMediaRecorder(undefined);
                        }
                    }
                };
            } catch (error) {
                console.error('Permission monitoring setup failed:', error);
            }
        };
        
        setupPermissionMonitoring();
        
        return () => {
            if (permissionStatusRef.current) {
                permissionStatusRef.current.onchange = null;
            }
        };
    }, [mediaRecorder]);

    // Auto-recording effect
    useEffect(() => {
        if (permissionState === 'granted' && !hasError && !mediaPreviewUrl && !isRecording && autoRecording && !userCancelledRecording.current && !permissionRequestPending.current) {
            const timer = setTimeout(() => {
                handleStartRecording();
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [permissionState, hasError, mediaPreviewUrl, isRecording, autoRecording]);

    // Store previous focus and auto-focus first interactive element on mount
    useEffect(() => {
        previousFocusRef.current = document.activeElement as HTMLElement;
        
        // Focus first interactive element
        const container = containerRef.current;
        if (container) {
            const firstFocusable = container.querySelector<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            firstFocusable?.focus();
        }

        return () => {
            // Restore focus when unmounting
            previousFocusRef.current?.focus();
        };
    }, []);

    // Focus trap: keep focus inside the recorder and handle Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCloseRecording();
                return;
            }

            if (e.key !== 'Tab') return;

            const container = containerRef.current;
            if (!container) return;

            const focusableElements = container.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="button"]:not([aria-disabled="true"])'
            );

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                // Shift+Tab: if on first element, wrap to last
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab: if on last element, wrap to first
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div
            className="cometchat"
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label={getLocalizedString("media_recorder_title") || "Audio recorder"}
            style={{
                height: "inherit",
                width: "fit-content"
            }}
        >
            {hasError ? <div className="cometchat-media-recorder__error">
                <div className="cometchat-media-recorder__error-icon-wrapper">
                    <div className="cometchat-media-recorder__error-icon">
                    </div>
                </div>
                <div className="cometchat-media-recorder__error-content">
                    <div className="cometchat-media-recorder__error-content-title">{getLocalizedString("media_recorder_error_title")}</div>
                    <div className="cometchat-media-recorder__error-content-subtitle">{getLocalizedString("media_recorder_error_subtitle")}
                    </div>
                </div>
            </div> : null}
            <div className="cometchat-media-recorder" style={{...(hasError && {borderRadius:`0px 0px ${getThemeVariable("--cometchat-radius-4")} ${getThemeVariable("--cometchat-radius-4")}`})}}>
                {!mediaPreviewUrl ? (<div className="cometchat-media-recorder__recording" style={{...(hasError && {borderRadius:`0px 0px ${getThemeVariable("--cometchat-radius-4")} ${getThemeVariable("--cometchat-radius-4")}`})}}>
                    {isRecording ? (
                        <div className="cometchat-media-recorder__recording-preview">
                            <div className="cometchat-media-recorder__recording-preview-recording">
                                <div className="cometchat-media-recorder__recording-preview-recording-icon" />
                            </div>
                            <div className="cometchat-media-recorder__recording-preview-duration">{formatTime(counter)}</div>
                        </div>
                    ) : isPaused ? (
                        <div className="cometchat-media-recorder__recording-preview">
                            <div className="cometchat-media-recorder__recording-preview-paused">
                                <div className="cometchat-media-recorder__recording-preview-paused-icon" />
                            </div>
                            <div className="cometchat-media-recorder__recording-preview-duration">{formatTime(counter)}</div>
                        </div>
                    ) : (
                        <div className="cometchat-media-recorder__recording-preview">
                            <div className="cometchat-media-recorder__recording-preview-disabled">
                                <div className="cometchat-media-recorder__recording-preview-disabled-icon" />
                            </div>
                        </div>
                    )}
                    <div className="cometchat-media-recorder__recording-control" role="group" aria-label="Recording controls">
                        {isRecording ? (
                            <>
                                <div
                                    className="cometchat-media-recorder__recording-control-delete"
                                    onClick={handleCloseRecording}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Delete recording"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleCloseRecording();
                                        }
                                    }}
                                >
                                    <div className="cometchat-media-recorder__recording-control-delete-icon" aria-hidden="true" />
                                </div>
                                {isPaused ?
                                    <div
                                        className="cometchat-media-recorder__recording-control-record"
                                        onClick={handleStartRecording}
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Resume recording"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleStartRecording();
                                            }
                                        }}
                                    >
                                        <div className="cometchat-media-recorder__recording-control-record-icon" aria-hidden="true" />
                                    </div>
                                    :
                                    <div
                                        className="cometchat-media-recorder__recording-control-pause"
                                        onClick={handlePauseRecording}
                                        role="button"
                                        tabIndex={0}
                                        aria-label="Pause recording"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handlePauseRecording();
                                            }
                                        }}
                                    >
                                        <div className="cometchat-media-recorder__recording-control-pause-icon" aria-hidden="true" />
                                    </div>
                                }
                                <div
                                    className="cometchat-media-recorder__recording-control-stop"
                                    onClick={handleStopRecording}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Stop recording"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleStopRecording();
                                        }
                                    }}
                                >
                                    <div className="cometchat-media-recorder__recording-control-stop-icon" aria-hidden="true" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    className="cometchat-media-recorder__recording-control-delete"
                                    onClick={handleCloseRecording}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Cancel recording"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleCloseRecording();
                                        }
                                    }}
                                >
                                    <div className="cometchat-media-recorder__recording-control-delete-icon" aria-hidden="true" />
                                </div>
                                <div
                                    className={`cometchat-media-recorder__recording-control-record ${hasError ? "cometchat-media-recorder__recording-control-error" : ""}`}
                                    onClick={handleStartRecording}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Start recording"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleStartRecording();
                                        }
                                    }}
                                >
                                    <div className={`cometchat-media-recorder__recording-control-record-icon`} aria-hidden="true" />
                                </div>
                                <div
                                    className="cometchat-media-recorder__recording-control-stop"
                                    onClick={handleStopRecording}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Stop recording"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleStopRecording();
                                        }
                                    }}
                                >
                                    <div className="cometchat-media-recorder__recording-control-stop-icon" aria-hidden="true" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
                ) : (
                    <div className="cometchat-media-recorder__recorded">
                        <CometChatAudioBubble src={mediaPreviewUrl} isSentByMe={true} />
                        <div className="cometchat-media-recorder__recorded-control" role="group" aria-label="Recording actions">
                            <div
                                className="cometchat-media-recorder__recorded-control-delete"
                                onClick={handleCloseRecording}
                                role="button"
                                tabIndex={0}
                                aria-label="Delete recording"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleCloseRecording();
                                    }
                                }}
                            >
                                <div className="cometchat-media-recorder__recorded-control-delete-icon" aria-hidden="true" />
                            </div>
                            <div
                                className="cometchat-media-recorder__recorded-control-send"
                                onClick={handleSubmitRecording}
                                role="button"
                                tabIndex={0}
                                aria-label="Send recording"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleSubmitRecording();
                                    }
                                }}
                            >
                                <div className="cometchat-media-recorder__recorded-control-send-icon" aria-hidden="true" />
                            </div>
                            <div
                                className="cometchat-media-recorder__recorded-control-record"
                                onClick={handleStartRecording}
                                role="button"
                                tabIndex={0}
                                aria-label="Record new"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleStartRecording();
                                    }
                                }}
                            >
                                <div className="cometchat-media-recorder__recorded-control-record-icon" aria-hidden="true" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export { CometChatMediaRecorder };