import { useRef, useState, useEffect, useCallback } from "react";
import WaveSurfer from "./src/wavesurfer";
import { closeCurrentMediaPlayer, currentAudioPlayer } from "../../../utils/util";
import { useCometChatFrameContext } from "../../../context/CometChatFrameContext";
interface AudioBubbleProps {
    /* URL of the audio to be played. */
    src: string;
    /* flag for toggle styling for audio bubble */
    isSentByMe?: boolean;
}
/*
    CometChatAudioBubble is a generic component used to play audio. It is generally used for audio messages in chat.
    It accepts the URL of the audio to be played, along with other props like autoPlay, loop, and muted for customization purposes.
*/
const CometChatAudioBubble = (props: AudioBubbleProps) => {
    const { src = "", isSentByMe = true } = props;
    const waveformRef = useRef<HTMLDivElement | null>(null);
    const isPlayingRef = useRef<boolean>(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const IframeContext = useCometChatFrameContext();
    const getCurrentDocument = () => {
        return IframeContext?.iframeDocument || document;
    }
    const getCurrentWindow = () => {
        return IframeContext?.iframeWindow || window;
    }
    // Moved useEffect logic to a separate function
    const initializeWaveSurfer = useCallback(() => {
        setIsLoading(true);
        if (waveformRef.current) {
            const root =  getCurrentDocument().documentElement;

            // Fetch styles for the progress bar and wave radius
            const progressbarColor = isSentByMe
                ? getComputedStyle(root).getPropertyValue('--cometchat-static-white').trim()
                : getComputedStyle(root).getPropertyValue('--cometchat-primary-color').trim();
            const waveColor = isSentByMe
                ? getComputedStyle(root).getPropertyValue('--cometchat-neutral-color-500').trim()
                : getComputedStyle(root).getPropertyValue('--cometchat-extended-primary-color-300').trim();
            const barRadius = getComputedStyle(root).getPropertyValue('--cometchat-radius-max').trim().replace("px", "");

            // Initialize WaveSurfer instance
            const wave = WaveSurfer.create({
                container: waveformRef.current,
                height: 16,
                normalize: false,
                waveColor: waveColor,
                progressColor: progressbarColor,
                cursorWidth: 0,
                barWidth: 2,
                barGap: 3,
                barRadius: Number(barRadius),
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
                width: 140,
                iframeDocument: getCurrentDocument(),
                iframeWindow: getCurrentWindow(),
            });
            wave.load(src);
            setWaveSurfer(wave);
            // Set duration when audio is ready
            wave.on('ready', () => {
                setDuration(wave.getDuration());
                setIsLoading(false);
            });

            // Update current time during playback
            wave.on('audioprocess', () => {
                setCurrentTime(wave.getCurrentTime());
            });

            wave.on('dragend', () => {
                setCurrentTime(wave.getCurrentTime());
            });
            wave.on('finish', () => {
                wave.stop();
                wave.seekTo(0);
                setIsPlaying(false);
                isPlayingRef.current = false;
            });

            // Clean up WaveSurfer instance on unmount
            return () => {
                waveformRef.current = null;
                currentAudioPlayer.instance = null;
                if(isPlayingRef.current){
                closeCurrentMediaPlayer(false);

                }

            }
        }
    }, [src, isSentByMe]);

    useEffect(() => {
        const cleanup = initializeWaveSurfer();
        return cleanup;
      }, [initializeWaveSurfer]);

    // Format time to mm:ss
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Handle play/pause functionality
    const handlePlayPause = () => {
        if (waveSurfer) {
            closeCurrentMediaPlayer(false);
          // Pause the currently playing instance
          if (
            currentAudioPlayer.instance &&
            currentAudioPlayer.instance !== waveSurfer
          ) {
            currentAudioPlayer.instance.pause();
            if (currentAudioPlayer.setIsPlaying) {
              currentAudioPlayer.setIsPlaying(false);
              isPlayingRef.current = false;
            }
          }
          // Play or pause the current instance
          waveSurfer.playPause();
          const currentlyPlaying = waveSurfer.isPlaying();
          setIsPlaying(currentlyPlaying);
          isPlayingRef.current = currentlyPlaying;
          // Update the global reference
          currentAudioPlayer.instance =  currentlyPlaying ? waveSurfer : null;
          currentAudioPlayer.setIsPlaying  = currentlyPlaying ? setIsPlaying : null;

        }
      };

    // Function to download the audio and show download progress
    const downloadAudio = async () => {
        setIsDownloading(true);
        try {
            abortControllerRef.current = new AbortController();
            const { signal } = abortControllerRef.current;
            const response:any = await fetch(src, { signal });
    
            if (!response.body) {
                throw new Error('ReadableStream not supported.');
            }
    
            const reader = response.body.getReader();
            const contentLength = +response.headers.get('Content-Length');
            let receivedLength = 0;
            const chunks = [];
    
            // Reading stream data in chunks
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                receivedLength += value.length;
                setProgress(Math.floor((receivedLength / contentLength) * 100));
            }
    
            // Creating and downloading audio file
            setIsDownloading(false);
            const blob = new Blob(chunks, { type: 'audio/mpeg' }); // Specify the MIME type for MP3
            const link = getCurrentDocument().createElement('a');
    
            // Use the original URL to extract the filename
            const urlParts = src.split('/');
            const fileName = urlParts[urlParts.length - 1];
    
            // Set the download attribute with the correct filename
            link.href = URL.createObjectURL(blob);
            link.download = fileName; // Use the filename with the correct extension
            link.click();
    
            // Clean up the object URL after the download
            URL.revokeObjectURL(link.href);
        } catch (error:any) {
            if (error.name === 'AbortError') {
                console.log('Download was aborted');
            } else {
                console.error('Download failed:', error);
            }
            setIsDownloading(false);
            setProgress(0);
        }
    };
    
    

    // Function to cancel ongoing download
    const cancelDownload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsDownloading(false);
            setProgress(0);
        }
    };

    // Function to generate the progress bar view
    const getProgressBar = useCallback(() => {
        return (
            <div className="cometchat-audio-bubble__tail-view-download-progress">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        className="cometchat-audio-bubble__tail-view-download-progress-background"
                    />
                    <circle
                        className="cometchat-audio-bubble__tail-view-download-progress-foreground"
                        cx="12"
                        cy="12"
                        r="10"
                        style={{ strokeDasharray: `${progress * 1.13} 113` }}
                    />
                </svg>

                <div className="cometchat-audio-bubble__tail-view-download-stop" onClick={cancelDownload}></div>
            </div>
        );
    }, [isDownloading, progress]);

    return (
        <div className="cometchat" style={{
            height: "fit-content",
            width: "fit-content"
        }}>
            <div className={`cometchat-audio-bubble ${isSentByMe ? "cometchat-audio-bubble-outgoing" : "cometchat-audio-bubble-incoming"}`} style={isLoading ? {cursor:"not-allowed"} : {}}>
               <div>
               <div className="cometchat-audio-bubble__leading-view" style={isLoading ? {pointerEvents:"none"} : {}}  >
                    {isPlaying ? (
                        <div className="cometchat-audio-bubble__leading-view-pause" onClick={handlePlayPause}></div>
                    ) : (
                        <div className="cometchat-audio-bubble__leading-view-play" onClick={handlePlayPause}></div>
                    )}
                </div>
                <div className="cometchat-audio-bubble__body">
                    <div className="cometchat-audio-bubble__body-wave" ref={waveformRef}></div>
                    <div className="cometchat-audio-bubble__body-time">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>
               </div>
                <div className="cometchat-audio-bubble__tail-view" style={isLoading ? {pointerEvents:"none"} : {}} >
                    {isDownloading ? getProgressBar() : (
                        <div className="cometchat-audio-bubble__tail-view-download" onClick={downloadAudio}></div>
                    )}
                </div>
            </div>
        </div>
    );
}

export { CometChatAudioBubble };
