import { useEffect, useRef } from "react";
import { useCometChatVideoBubble } from "./useCometChatVideoBubble";
import { closeCurrentMediaPlayer, currentMediaPlayer } from "../../../utils/util";
interface VideoBubbleProps {
    /* URL of the video to be played. */
    src: string;
    /* flag to specify whether the video will play automatically or not. */
    autoPlay?: boolean;
    /* flag to specify whether the video will play in loop or not. */
    loop?: boolean;
    /* flag for muting the video. */
    muted?: boolean;
    /* flag to toggle bubble styling. */
    isSentByMe?: boolean;
}

/*
    CometChatVideoBubble is a generic component used to play video. It is generally used for video messages in chat.
    It accepts the URL of the video to be played, along with other props like autoPlay, loop, and muted for customization purposes.
*/
const CometChatVideoBubble = (props: VideoBubbleProps) => {
    const {
        src = "",
        autoPlay = false,
        loop = false,
        muted = false,
        isSentByMe = true,

    } = props;

    const { posterImage, updateImage } = useCometChatVideoBubble({ src });
    const videoRef = useRef<HTMLVideoElement | null>(null);

    /**
     * Function to request fullscreen when video starts to play.
     */
    const startVideoInFullscreen = () => {
        if (!currentMediaPlayer.video || currentMediaPlayer.video !== videoRef.current) {
        closeCurrentMediaPlayer();
        }
        const videoElement: any = videoRef.current;
        currentMediaPlayer.video = videoElement;
        if (videoElement) {
            if (videoElement && !document.fullscreenElement) {
                if (videoElement.requestFullscreen) {
                    videoElement.requestFullscreen();
                } else if (videoElement.mozRequestFullScreen) { // Firefox
                    videoElement.mozRequestFullScreen();
                } else if (videoElement.webkitRequestFullscreen) { // Chrome, Safari, and Opera
                    videoElement.webkitRequestFullscreen();
                } else if (videoElement.msRequestFullscreen) { // IE/Edge
                    videoElement.msRequestFullscreen();
                }
            }
    
        }
             

    };
    useEffect(() => {
        if( videoRef.current){
            videoRef.current.addEventListener("fullscreenchange", handleFullscreenChange)
        }
        updateImage();

      return ()=>{
        if( videoRef.current){
        videoRef.current.removeEventListener("fullscreenchange", handleFullscreenChange)
        }
}
    }, []);
    /**
     * Function to handle fullscreen change.
    */
    const handleFullscreenChange = () => {
        const videoElement = videoRef.current;
        if (!videoElement) return;
        if (!document.fullscreenElement) {
            videoElement.style.display = "none";
            requestAnimationFrame(() => {
                videoElement.style.display = "block";
            });
            videoElement.style.objectFit = "cover";
        } else {
            videoElement.style.objectFit = "contain";
        }
    };

    return (
        <div className="cometchat">
            <div className={`cometchat-video-bubble ${isSentByMe ? "cometchat-video-bubble-outgoing" : "cometchat-video-bubble-incoming"}`}>
                <video controls onPlay={startVideoInFullscreen}
                    ref={videoRef} loop={loop} muted={muted} autoPlay={autoPlay} className="cometchat-video-bubble__body" poster={posterImage}>
                    <source src={src} />
                </video>
            </div >
        </div>
    )
}

export { CometChatVideoBubble };
