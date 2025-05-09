import { useCallback, useRef } from "react";
import endCallIcon from '../../../assets/call_end.svg'
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { useCometChatOutgoingCall } from "./useCometChatOutgoingCall";
import { CometChatUIKitConstants } from "../../../constants/CometChatUIKitConstants";
import { localize } from "../../../resources/CometChatLocalize/cometchat-localize";
import { CometChatButton } from "../../BaseComponents/CometChatButton/CometChatButton";
import { CometChatAvatar } from "../../BaseComponents/CometChatAvatar/CometChatAvatar";
import { CometChatSoundManager } from "../../../resources/CometChatSoundManager/CometChatSoundManager";
import { useCometChatErrorHandler } from "../../../CometChatCustomHooks";
import { JSX } from "react";

/**
 * Props interface for the outgoing call component
 */
interface OutgoingCallProps {
    /**
     * The CometChat call object used to set up and launch the outgoing call.
     */
    call?: CometChat.Call;

    /**
     * Disables the sound of outgoing calls.
     * @defaultValue false
     */
    disableSoundForCalls?: boolean;

    /**
     * Specifies a custom sound to play for outgoing calls.
     */
    customSoundForCalls?: string;

    /**
     * Callback function triggered when an error occurs in the outgoing call component.
     * @param error - An instance of `CometChat.CometChatException` representing the error.
     * @return void
     */
    onError?: ((error: CometChat.CometChatException) => void) | null;

    /**
     * Callback function triggered when the cancel button is clicked in the outgoing call component.
     * @return void
     */
    onCallCanceled?: Function;

    /**
     * This prop renders the custom title view for the outgoing call.
     * Use this to override the existing title of user name from the outgoing call.
     */
    titleView?: JSX.Element;

    /**
     * This prop renders the custom sub title view for the outgoing call.
     * Use this to override the existing sub title text from the outgoing call.
     */
    subtitleView?: JSX.Element;

    /**
     * This prop renders the custom avatar view for the outgoing call.
     * Use this to override the existing avatar image from the outgoing call.
     */
    avatarView?: JSX.Element;

    /**
     * This prop renders the custom cancel-call button view for the outgoing call.
     * Use this to override the existing cancel call button view from the outgoing call.
     */
    cancelButtonView?: JSX.Element;
}


const CometChatOutgoingCall = (props: OutgoingCallProps) => {
    /**
     * Destructure props and set default values
     */
    const {
        call,
        disableSoundForCalls = false,
        customSoundForCalls = "",
        onError,
        onCallCanceled = () => { },
        titleView,
        subtitleView,
        avatarView,
        cancelButtonView,
    } = props;

    const errorHandler = useCometChatErrorHandler(onError);
    const callRef = useRef<CometChat.Call | null>(null);
    callRef.current = call!;
    let subtitleText: string = localize("CALLING");
    /**
       * Handles the logic to close the outgoing call and stops the sound.
       */
    const onClose = useCallback(() => {
        try {
            CometChatSoundManager.pause();
            if (onCallCanceled) {
                onCallCanceled();
            }
        } catch (e) {
            errorHandler(e, "onClose");
        }
    }, [onCallCanceled])
    /**
       * Get the avatar URL based on the receiver type (user or group).
       */
    const getAvatarURL = () => {
        return callRef.current?.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user ? (callRef.current?.getReceiver() as CometChat.User)?.getAvatar() : (callRef.current?.getReceiver() as CometChat.Group)?.getIcon();
    }
    /**
     * Function to play the custom or default call sound.
     */
    const playAudio = useCallback(() => {
        try {
            if (!disableSoundForCalls) {
                if (customSoundForCalls) {
                    CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingCall!, customSoundForCalls)
                } else {
                    CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingCall!)
                }
            }
        } catch (e) {
            errorHandler(e, "playAudio");
        }
    }, [disableSoundForCalls, customSoundForCalls])

    useCometChatOutgoingCall(
        errorHandler,
        playAudio,
        call,
    );

    return (
        <>
            <div className="cometchat">
                {callRef.current ? <>
                    {<div className="cometchat-outgoing-call">
                        <div className="cometchat-outgoing-call__title-container">
                            {titleView ? titleView :
                                <div className="cometchat-outgoing-call__title">
                                    {callRef.current?.getReceiver()?.getName()}
                                </div>
                            }
                            {subtitleView ? subtitleView :
                                <div className="cometchat-outgoing-call__subtitle">
                                    {subtitleText}
                                </div>
                            }
                        </div>
                        {avatarView ? avatarView :
                            <div className="cometchat-outgoing-call__avatar">
                                <CometChatAvatar name={callRef.current?.getReceiver()?.getName()} image={getAvatarURL()} />
                            </div>
                        }
                        {cancelButtonView ? cancelButtonView :
                            <div className="cometchat-outgoing-call__button">
                                <CometChatButton onClick={onClose} iconURL={endCallIcon} />
                            </div>
                        }
                    </div>}
                </> : null}
            </div>
        </>
    );
};

export { CometChatOutgoingCall };
