import React, { useState, useEffect, useRef } from "react";
import Recorder from "./Helper/index.js";
import { CometChatAudioBubble } from "../CometChatAudioBubble/CometChatAudioBubble";
import { closeCurrentMediaPlayer, currentMediaPlayer } from "../../../utils/util";

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

    const initMediaRecorder = async () => {
        try {
        if (hasInitializedRef.current) {
            return;
        }
        hasInitializedRef.current = true;
        clearStream();
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            streamRef.current = stream;
            const audioRecorder = new MediaRecorder(stream);
            audioRecorder.ondataavailable = (e: any) => {
                if (e.data.size > 0) {
                    audioChunks.current?.push(e.data);
                }
            };
            audioRecorder.onstop = () => {
                if (createMedia.current) {
                    const recordedBlob = new Blob(
                        audioChunks.current, { type: audioChunks.current[0].type }
                    );
                    blobRef.current = recordedBlob;
                    const url = URL.createObjectURL(recordedBlob);
                    setMediaPreviewUrl(url);
                    audioChunks.current = [];
                }
            };
            audioRecorder.start();
            setMediaRecorder(audioRecorder);
        } catch (error) {
            console.error("Error initializing media recorder:", error);
        }
    };

    const handleStartRecording = async () => {
        closeCurrentMediaPlayer();
        const hasAudioInput = await navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                let hasMic = false;
                devices.forEach(device => {
                    if (device.kind === 'audioinput') {
                        hasMic = true;
                    }
                });
                return hasMic;
            });

        if (hasAudioInput) {
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
                initMediaRecorder().then(() => {
                    (mediaRecorder as MediaRecorder)?.start();
                    currentMediaPlayer.mediaRecorder = mediaRecorder as MediaRecorder;
                    setCounter(0);
                    startTimer();
                    setIsRecording(true);
                }).catch((error) => {
                    console.error("Error starting recording:", error);
                });
            }
        } else {
            console.warn("No audio input device present.");
        }
    };

    const handleStopRecording = () => {
        setIsPaused(false);
        closeCurrentMediaPlayer();
        (mediaRecorder as MediaRecorder)?.stop();
        setIsRecording(false);
        stopTimer();
        clearStream();
        setMediaRecorder(undefined);
        hasInitializedRef.current = false;
    };

    const handleCloseRecording = () => {
        closeCurrentMediaPlayer();
        currentMediaPlayer.mediaRecorder = null;
        createMedia.current = false
        onCloseRecording?.();
        reset();
        hasInitializedRef.current = false;

    };

    const handleSubmitRecording = () => {
        closeCurrentMediaPlayer();
        if (blobRef.current) {
            onSubmitRecording?.(blobRef.current);
            reset();
        }
    };

    const reset = () => {
        closeCurrentMediaPlayer();
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
        if(mediaRecorder)
        (mediaRecorder as MediaRecorder).pause();
        counterRunning.current = false;
        hasInitializedRef.current = false;        
    }
    return (
        <div className="cometchat" style={{
            height: "inherit",
            width: "fit-content"
        }}>
            <div className="cometchat-media-recorder">
                {!mediaPreviewUrl ? (<div className="cometchat-media-recorder__recording">
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
                                    className="cometchat-media-recorder__recording-control-record"
                                    onClick={handleStartRecording}
                                >
                                    <div className="cometchat-media-recorder__recording-control-record-icon" />
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
