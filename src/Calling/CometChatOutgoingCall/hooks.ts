import { useEffect } from "react";
import { CometChatSoundManager } from "uikit-utils-lerna";

function Hooks(
    playAudio: Function,
	call: any,
	onClose: Function,
    cancelCallButtonRef: any
) {
    useEffect(
        () => {
            return () => {
                CometChatSoundManager.pause();
            }
        }, []
    );

    useEffect(
        () => {
            setTimeout(() => {
                playAudio();
            });
            return () => {
                CometChatSoundManager.pause();
            }
        }, [call, playAudio]
    );

    useEffect(
        () => {
            const cancleCallButton = cancelCallButtonRef.current;
            if(!cancleCallButton) return;
            cancleCallButton.addEventListener("cc-button-clicked", onClose);
            return () => {
                cancleCallButton.removeEventListener("cc-button-clicked", onClose);
            }
        }, [onClose]
    );

}

export { Hooks };