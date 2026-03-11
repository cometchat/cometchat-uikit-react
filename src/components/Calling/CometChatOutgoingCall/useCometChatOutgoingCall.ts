import { useEffect } from "react";
import { CometChatSoundManager } from "../../../resources/CometChatSoundManager/CometChatSoundManager";
/**
 * Custom hook to handle outgoing call actions like playing audio and pausing it when necessary.
 * @param playAudio - Function to play audio during the outgoing call.
 * @param call - Optional CometChat.Call object representing the outgoing call.
 */
function useCometChatOutgoingCall(
    errorHandler:(error: unknown, source?: string) => void,
    playAudio: Function,
    call?: CometChat.Call,
) {
    useEffect(
        () => {
        try {
                let timeoutId: ReturnType<typeof setTimeout> | null = null;
                
                // If there's an active call, play audio after a delay
                if (call) {
                    timeoutId = setTimeout(() => {
                        playAudio();
                    });
                }
                // Cleanup function to pause the audio when the component unmounts or dependencies change
                return () => {
                    if (timeoutId !== null) {
                        clearTimeout(timeoutId);
                    }
                    CometChatSoundManager.pause();
                }
        } catch (error) {
            errorHandler(error,"useEffect")
        }
        }, [call, playAudio]
    );



}

export { useCometChatOutgoingCall };