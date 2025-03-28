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
    const streamRef = useRef<MediaStream>();
    const blobRef = useRef<Blob>();
    const timerIntervalRef = useRef<number>();
    const audioChunks = useRef<Blob[]>([]);
    const counterRunning = useRef<boolean>(true);
    const createMedia = useRef<boolean>(false);
    const hasInitializedRef = useRef(false);
    const [hasError, setHasError] = useState(false);


    function pauseActiveMedia() {
        if (currentAudioPlayer.instance && currentAudioPlayer.setIsPlaying) {
            currentAudioPlayer.instance.pause();
            currentAudioPlayer.setIsPlaying(false);
        }

        if (currentMediaPlayer.video && !currentMediaPlayer.video.paused) {
            currentMediaPlayer.video.pause();
        }
    }
    useEffect(() => {
        if (autoRecording) {
            handleStartRecording();
        }
        return () => {
            handleStopRecording();
            clearInterval(timerIntervalRef.current);
            clearStream();
            hasInitializedRef.current = false;
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
                if (createMedia.current) {
                    const recordedBlob = new Blob(audioChunks.current, {
                        type: audioChunks.current[0].type,
                    });
                    blobRef.current = recordedBlob;
                    const url = URL.createObjectURL(recordedBlob);
                    setMediaPreviewUrl(url);
                    audioChunks.current = [];
                }
            };
            audioRecorder.start();
            setMediaRecorder(audioRecorder);
            setHasError(false);
            return audioRecorder;
        } catch (error: any) {
            if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                setHasError(true);
            }
            hasInitializedRef.current = false;
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
        counterRunning.current = true;
        createMedia.current = true;
        if (isPaused) {
            currentMediaPlayer.mediaRecorder = mediaRecorder as MediaRecorder;
            (mediaRecorder as MediaRecorder)?.resume();
            setIsPaused(false);
            startTimer();
            setIsRecording(true);
        } else {
            reset();
            const recorder = await initMediaRecorder();
            if (recorder) {
                currentMediaPlayer.mediaRecorder = recorder;
                setCounter(0);
                startTimer();
                setIsRecording(true);
                setHasError(false);
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
        createMedia.current = false
        onCloseRecording?.();
        reset();
        hasInitializedRef.current = false;

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
    };

    const clearStream = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = undefined;
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
        if (mediaRecorder)
            (mediaRecorder as MediaRecorder).pause();
        counterRunning.current = false;
        hasInitializedRef.current = false;
    }
    useEffect(() => {
        let permissionStatus: PermissionStatus;
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((status) => {
            permissionStatus = status;
            status.onchange = () => {
                if (status.state === "granted") {
                    console.log(mediaPreviewUrl)
                    setHasError(false);
                    if (!mediaPreviewUrl) {
                        handleStartRecording();
                    }
                } else if (status.state === "denied") {
                    if (!mediaPreviewUrl) {
                        handleCloseRecording();
                    }
                    setHasError(true);
                }
            };
        });
        return () => {
            if (permissionStatus) {
                permissionStatus.onchange = null;
            }
        };
    }, [mediaPreviewUrl]);
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
