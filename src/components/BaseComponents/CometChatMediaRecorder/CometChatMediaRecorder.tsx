import React, { useState, useEffect, useRef } from "react";
import Recorder from "./Helper/index.js";
import { CometChatAudioBubble } from "../CometChatAudioBubble/CometChatAudioBubble";
import { currentAudioPlayer, currentMediaPlayer, getThemeVariable } from "../../../utils/util";
import { localize } from "../../../resources/CometChatLocalize/cometchat-localize";

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
    const [hasError, setHasError] = useState(false);
    const userCancelledRecording = useRef<boolean>(false);
    const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
    const permissionStatusRef = useRef<PermissionStatus | null>(null);

    function pauseActiveMedia() {
        if (currentAudioPlayer.instance && currentAudioPlayer.setIsPlaying) {
            currentAudioPlayer.instance.pause();
            currentAudioPlayer.setIsPlaying(false);
        }

        if (currentMediaPlayer.video && !currentMediaPlayer.video.paused) {
            currentMediaPlayer.video.pause();
        }
    }

    // Enhanced permission check function
    const checkMicrophonePermission = async (): Promise<PermissionState> => {
        try {
            const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            return permission.state;
        } catch (error) {
            // Fallback for browsers that don't support permissions API
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop());
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
            console.error('initMediaRecorder error:', error);
            if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                setHasError(true);
                setPermissionState('denied');
            }
            hasInitializedRef.current = false;
            setIsRecording(false);
            return null;
        }
    };

    const handleStartRecording = async () => {
        pauseActiveMedia();
        const hasAudioInput = await navigator.mediaDevices.enumerateDevices()
            .then(devices => devices.some(device => device.kind === 'audioinput'));
        if (!hasAudioInput) {
            return;
        }
        
        // Check permission state before starting
        const currentPermissionState = await checkMicrophonePermission();
        if (currentPermissionState === 'denied') {
            setHasError(true);
            setPermissionState('denied');
            return;
        }
        counterRunning.current = true;
        createMedia.current = true;
        
        if (isPaused && mediaRecorder) {
            currentMediaPlayer.mediaRecorder = mediaRecorder as MediaRecorder;
            try {
                (mediaRecorder as MediaRecorder)?.resume();
                setIsPaused(false);
                startTimer();
                setIsRecording(true);
            } catch (error) {
                console.error('Resume recording error:', error);
                // Fallback: start new recording
                const recorder = await initMediaRecorder();
                if (recorder) {
                    currentMediaPlayer.mediaRecorder = recorder;
                    setCounter(0);
                    startTimer();
                    setIsRecording(true);
                    setHasError(false);
                }
            }
        } else {
            reset();
            const recorder = await initMediaRecorder();
            if (recorder) {
                currentMediaPlayer.mediaRecorder = recorder;
                setCounter(0);
                startTimer();
                setIsRecording(true);
                setHasError(false);
                setPermissionState('granted');
            } else {
                // Recording failed to start
                setIsRecording(false);
                createMedia.current = false;
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
        setMediaRecorder(undefined);
        hasInitializedRef.current = false;
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
        if (!mediaRecorder || (mediaRecorder as MediaRecorder).state !== 'recording') return;
        
        setIsPaused(true);
        pauseTimer();
        
        try {
            (mediaRecorder as MediaRecorder).pause();
            counterRunning.current = false;
        } catch (error) {
            console.error('Pause recording error:', error);
        }
    }

    // Enhanced permission monitoring
    useEffect(() => {
        const setupPermissionMonitoring = async () => {
            try {
                const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                permissionStatusRef.current = permission;
                
                permission.onchange = async () => {
                    const newState = permission.state;
                    setPermissionState(newState);
                    
                    if (newState === "granted") {
                        setHasError(false);
                    } else if (newState === "denied") {
                        setHasError(true);
                        // Force stop recording and clear states
                        setIsRecording(false);
                        setIsPaused(false);
                        clearStream();
                        stopTimer();
                        
                        // Clear MediaRecorder
                        if (mediaRecorder) {
                            try {
                                if ((mediaRecorder as MediaRecorder).state !== 'inactive') {
                                    (mediaRecorder as MediaRecorder).stop();
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
    }, []);

    // Separate effect to handle auto-recording when permission is granted
    useEffect(() => {
        if (permissionState === 'granted' && !hasError && !mediaPreviewUrl && !isRecording && autoRecording && !userCancelledRecording.current) {
            // Small delay to ensure state is updated
            const timer = setTimeout(() => {
                handleStartRecording();
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [permissionState, hasError, mediaPreviewUrl, isRecording, autoRecording]);

    return (
        <div className="cometchat" style={{
            height: "inherit",
            width: "fit-content"
        }}>
            {hasError ? <div className="cometchat-media-recorder__error">
                <div className="cometchat-media-recorder__error-icon-wrapper">
                    <div className="cometchat-media-recorder__error-icon">
                    </div>
                </div>
                <div className="cometchat-media-recorder__error-content">
                    <div className="cometchat-media-recorder__error-content-title">{localize("MEDIA_RECORDER_ERROR_TITLE")}</div>
                    <div className="cometchat-media-recorder__error-content-subtitle">{localize("MEDIA_RECORDER_ERROR_SUBTITLE")}
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
                    <div className="cometchat-media-recorder__recording-control">
                        {isRecording ? (
                            <>
                                <div
                                    className="cometchat-media-recorder__recording-control-delete"
                                    onClick={handleCloseRecording}
                                >
                                    <div className="cometchat-media-recorder__recording-control-delete-icon" />
                                </div>
                                {isPaused ?
                                    <div
                                        className="cometchat-media-recorder__recording-control-record"
                                        onClick={handleStartRecording}
                                    >
                                        <div className="cometchat-media-recorder__recording-control-record-icon" />
                                    </div>
                                    :
                                    <div
                                        className="cometchat-media-recorder__recording-control-pause"
                                        onClick={handlePauseRecording}
                                    >
                                        <div className="cometchat-media-recorder__recording-control-pause-icon" />
                                    </div>
                                }
                                <div
                                    className="cometchat-media-recorder__recording-control-stop"
                                    onClick={handleStopRecording}
                                >
                                    <div className="cometchat-media-recorder__recording-control-stop-icon" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    className="cometchat-media-recorder__recording-control-delete"
                                    onClick={handleCloseRecording}
                                >
                                    <div className="cometchat-media-recorder__recording-control-delete-icon" />
                                </div>
                                <div
                                    className={`cometchat-media-recorder__recording-control-record ${hasError ? "cometchat-media-recorder__recording-control-error" : ""}`}
                                    onClick={handleStartRecording}
                                >
                                    <div className={`cometchat-media-recorder__recording-control-record-icon`} />
                                </div>
                                <div
                                    className="cometchat-media-recorder__recording-control-stop"
                                    onClick={handleStopRecording}
                                >
                                    <div className="cometchat-media-recorder__recording-control-stop-icon" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
                ) : (
                    <div className="cometchat-media-recorder__recorded">
                        <CometChatAudioBubble src={mediaPreviewUrl} isSentByMe={true} />
                        <div className="cometchat-media-recorder__recorded-control">
                            <div
                                className="cometchat-media-recorder__recorded-control-delete"
                                onClick={handleCloseRecording}
                            >
                                <div className="cometchat-media-recorder__recorded-control-delete-icon" />
                            </div>
                            <div
                                className="cometchat-media-recorder__recorded-control-send"
                                onClick={handleSubmitRecording}
                            >
                                <div className="cometchat-media-recorder__recorded-control-send-icon" />
                            </div>
                            <div
                                className="cometchat-media-recorder__recorded-control-record"
                                onClick={handleStartRecording}
                            >
                                <div className="cometchat-media-recorder__recorded-control-record-icon" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export { CometChatMediaRecorder };